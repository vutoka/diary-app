"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { resizeImage } from "@/lib/images";
import { imageNameFromId } from "@/lib/imageTokens";

const BUCKET = "entry-images";
const SIGNED_URL_SECONDS = 6 * 60 * 60;

export type EntryImage = {
  /** File name inside the day's folder. */
  name: string;
  url: string;
};

async function currentUserId(supabase: ReturnType<typeof createClient>) {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new Error("Not signed in");
  return id;
}

/** Images attached to one diary day, stored as `<user_id>/<date>/<id>.jpg`
 *  in a private bucket. They are independent of the `entries` row. */
export function useEntryImages(dateKey: string) {
  const [images, setImages] = useState<EntryImage[]>([]);
  const [uploading, setUploading] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const supabase = createClient();
        const prefix = `${await currentUserId(supabase)}/${dateKey}`;

        const { data: files, error: listError } = await supabase.storage
          .from(BUCKET)
          .list(prefix, { sortBy: { column: "created_at", order: "asc" } });
        if (listError) throw listError;

        const paths = (files ?? [])
          .filter((f) => !f.name.startsWith("."))
          .map((f) => `${prefix}/${f.name}`);

        let loaded: EntryImage[] = [];
        if (paths.length > 0) {
          const { data: signed, error: signError } = await supabase.storage
            .from(BUCKET)
            .createSignedUrls(paths, SIGNED_URL_SECONDS);
          if (signError) throw signError;

          loaded = (signed ?? []).flatMap((s) =>
            s.signedUrl && s.path
              ? [{ name: s.path.slice(prefix.length + 1), url: s.signedUrl }]
              : []
          );
        }

        if (cancelled) return;
        setImages(loaded);
        setLoadError(null);
      } catch {
        if (!cancelled) setLoadError("Couldn't load images.");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [dateKey, reloadTick]);

  /** Uploads `files[i]` under `ids[i]`. Resolves with the ids that failed. */
  const addFiles = useCallback(
    async (files: File[], ids: string[]): Promise<string[]> => {
      setUploading((n) => n + files.length);
      setActionError(null);

      const failed: string[] = [];
      const supabase = createClient();
      let uid: string | null = null;
      try {
        uid = await currentUserId(supabase);
      } catch {
        // Every upload below is reported as failed.
      }

      for (let i = 0; i < files.length; i++) {
        try {
          if (uid === null) throw new Error("Not signed in");
          const blob = await resizeImage(files[i]);
          const { error: uploadError } = await supabase.storage
            .from(BUCKET)
            .upload(`${uid}/${dateKey}/${imageNameFromId(ids[i])}`, blob, {
              contentType: "image/jpeg",
            });
          if (uploadError) throw uploadError;
        } catch {
          failed.push(ids[i]);
        } finally {
          setUploading((n) => n - 1);
        }
      }

      if (failed.length > 0) {
        setActionError(
          `Couldn't upload ${failed.length} image${failed.length > 1 ? "s" : ""}.`
        );
      }
      setReloadTick((t) => t + 1);
      return failed;
    },
    [dateKey]
  );

  const remove = useCallback(
    async (name: string): Promise<boolean> => {
      try {
        const supabase = createClient();
        const uid = await currentUserId(supabase);
        const { error: removeError } = await supabase.storage
          .from(BUCKET)
          .remove([`${uid}/${dateKey}/${name}`]);
        if (removeError) throw removeError;
        setImages((prev) => prev.filter((i) => i.name !== name));
        return true;
      } catch {
        setActionError("Couldn't remove the image.");
        return false;
      }
    },
    [dateKey]
  );

  /** Deletes every image stored for this day. */
  const removeAll = useCallback(async (): Promise<boolean> => {
    try {
      const supabase = createClient();
      const prefix = `${await currentUserId(supabase)}/${dateKey}`;

      const { data: files, error: listError } = await supabase.storage
        .from(BUCKET)
        .list(prefix, { limit: 1000 });
      if (listError) throw listError;

      const paths = (files ?? [])
        .filter((f) => !f.name.startsWith("."))
        .map((f) => `${prefix}/${f.name}`);
      if (paths.length > 0) {
        const { error: removeError } = await supabase.storage
          .from(BUCKET)
          .remove(paths);
        if (removeError) throw removeError;
      }

      setImages([]);
      return true;
    } catch {
      setActionError("Couldn't remove the images.");
      setReloadTick((t) => t + 1);
      return false;
    }
  }, [dateKey]);

  return {
    images,
    uploading,
    error: actionError ?? loadError,
    addFiles,
    remove,
    removeAll,
  };
}
