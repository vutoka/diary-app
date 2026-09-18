"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SaveStatus =
  | "clean"
  | "dirty"
  | "invalid"
  | "saving"
  | "saved"
  | "error";

const DEFAULT_DELAY_MS = 10_000;

type UseAutosaveOptions<T> = {
  /** The draft as currently shown in the UI. */
  value: T;
  /** What is currently persisted (the value the draft is compared against). */
  initial: T;
  /** Drafts that fail this check are never saved (e.g. a required field is blank). */
  isValid?: (value: T) => boolean;
  /** Persist the draft. Must throw if the write fails. */
  save: (value: T) => Promise<void>;
  /** Called after every successful save. */
  onSaved?: () => void;
  /** While the draft is unsaved it is mirrored to localStorage under this key. */
  backupKey?: string;
  delay?: number;
};

/** Saves `value` 10s after the last change, and immediately on `flush()`,
 *  when the tab is hidden, and when the component unmounts (day/page switch). */
export function useAutosave<T>({
  value,
  initial,
  isValid,
  save,
  onSaved,
  backupKey,
  delay = DEFAULT_DELAY_MS,
}: UseAutosaveOptions<T>) {
  const [baseline, setBaselineState] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const [savedOnce, setSavedOnce] = useState(false);
  const [retryTick, setRetryTick] = useState(0);

  const latest = useRef(value);
  const baselineRef = useRef(initial);
  const inFlight = useRef<Promise<void> | null>(null);
  const saveRef = useRef(save);
  const isValidRef = useRef(isValid);
  const onSavedRef = useRef(onSaved);
  const backupKeyRef = useRef(backupKey);
  const flushRef = useRef<() => Promise<boolean>>(async () => true);

  useEffect(() => {
    latest.current = value;
    saveRef.current = save;
    isValidRef.current = isValid;
    onSavedRef.current = onSaved;
    backupKeyRef.current = backupKey;
  });

  const serialized = JSON.stringify(value);
  const dirty = serialized !== JSON.stringify(baseline);
  const invalid = dirty && isValid !== undefined && !isValid(value);

  const setBaseline = useCallback((next: T) => {
    baselineRef.current = next;
    setBaselineState(next);
  }, []);

  /** Saves any pending changes now. Resolves true if nothing is left unsaved. */
  const flush = useCallback(async (): Promise<boolean> => {
    while (inFlight.current) await inFlight.current;

    const draft = latest.current;
    const isSame = () =>
      JSON.stringify(latest.current) === JSON.stringify(baselineRef.current);

    if (isSame()) return true;
    if (isValidRef.current && !isValidRef.current(draft)) return false;

    setSaving(true);
    const attempt = (async () => {
      try {
        await saveRef.current(draft);
        return true;
      } catch {
        return false;
      }
    })();
    inFlight.current = attempt.then(() => {
      inFlight.current = null;
    });
    const ok = await attempt;
    setSaving(false);

    if (!ok) {
      setFailed(true);
      setRetryTick((tick) => tick + 1);
      return false;
    }

    setFailed(false);
    setSavedOnce(true);
    setBaseline(draft);
    onSavedRef.current?.();
    if (isSame()) {
      clearBackup(backupKeyRef.current);
      return true;
    }
    return false;
  }, [setBaseline]);

  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  // Debounce: (re)start the timer on every change while there is something to
  // save; a failed save bumps retryTick so it is retried after another `delay`.
  useEffect(() => {
    if (!dirty) return;
    const timer = setTimeout(() => {
      void flushRef.current();
    }, delay);
    return () => clearTimeout(timer);
  }, [serialized, dirty, retryTick, delay]);

  // Keep an unsaved draft in localStorage so a failed save can't lose it. The
  // backup is only dropped once a draft was dirty, so a backup that hasn't been
  // restored yet survives the first render.
  const wasDirty = useRef(false);
  useEffect(() => {
    if (dirty) {
      writeBackup(backupKey, serialized);
      wasDirty.current = true;
    } else if (wasDirty.current) {
      clearBackup(backupKey);
      wasDirty.current = false;
    }
  }, [serialized, dirty, backupKey]);

  // Save right away when the tab is hidden/closed and when leaving the screen.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") void flushRef.current();
    };
    const onPageHide = () => void flushRef.current();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      void flushRef.current();
    };
  }, []);

  /** Treat `next` as the persisted value and drop the pending draft state. */
  const reset = useCallback(
    (next: T) => {
      setBaseline(next);
      setFailed(false);
      setSavedOnce(false);
      clearBackup(backupKeyRef.current);
    },
    [setBaseline]
  );

  let status: SaveStatus = "clean";
  if (saving) status = "saving";
  else if (failed && dirty) status = "error";
  else if (invalid) status = "invalid";
  else if (dirty) status = "dirty";
  else if (savedOnce) status = "saved";

  return { status, flush, reset };
}

export function readBackup<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? null : (JSON.parse(raw) as T);
  } catch {
    return null;
  }
}

function writeBackup(key: string | undefined, serialized: string) {
  if (!key) return;
  try {
    window.localStorage.setItem(key, serialized);
  } catch {
    // Storage full or unavailable: autosave still works, just without the backup.
  }
}

function clearBackup(key: string | undefined) {
  if (!key) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
}
