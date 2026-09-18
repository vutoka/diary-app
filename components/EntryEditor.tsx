"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type MouseEvent,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDisplayDate } from "@/lib/date";
import { readBackup, useAutosave } from "@/lib/useAutosave";
import { useEntryImages, type EntryImage } from "@/lib/useEntryImages";
import {
  imageIdAt,
  imageIdFromName,
  imageIdsIn,
  insertImageTokens,
  newImageId,
  removeImageToken,
} from "@/lib/imageTokens";
import EntryContent from "@/components/EntryContent";
import EntryImageGallery from "@/components/EntryImageGallery";
import ImageLightbox from "@/components/ImageLightbox";
import SaveStatus from "@/components/SaveStatus";

type EntryEditorProps = {
  dateKey: string;
  onChanged: () => void;
};

export default function EntryEditor({ dateKey, onChanged }: EntryEditorProps) {
  const backupKey = `diary-draft:${dateKey}`;
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [focusOnEdit, setFocusOnEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<EntryImage | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const caretAfterPaste = useRef<number | null>(null);
  const images = useEntryImages(dateKey);
  const closeLightbox = useCallback(() => setLightboxImage(null), []);

  const { status, flush, reset } = useAutosave<string>({
    value: content,
    initial: "",
    backupKey,
    onSaved: onChanged,
    save: async (text) => {
      const supabase = createClient();
      // Clearing the text removes the entry, so the calendar dot goes away too.
      const { error } =
        text.trim() === ""
          ? await supabase.from("entries").delete().eq("entry_date", dateKey)
          : await supabase.from("entries").upsert(
              {
                entry_date: dateKey,
                content: text,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "user_id,entry_date" }
            );
      if (error) throw error;
    },
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("entries")
        .select("content")
        .eq("entry_date", dateKey)
        .maybeSingle();

      if (cancelled) return;

      // Never open an editor on a failed load: autosaving the empty text would
      // delete an entry that actually exists.
      if (error) {
        setLoadFailed(true);
        setLoading(false);
        return;
      }

      const saved = data?.content ?? "";
      const draft = readBackup<string>(backupKey) ?? saved;
      reset(saved);
      setContent(draft);
      setEditing(draft.trim() === "");
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [dateKey, backupKey, reset]);

  useEffect(() => {
    if (!editing || !focusOnEdit) return;
    const el = textareaRef.current;
    el?.focus();
    el?.setSelectionRange(el.value.length, el.value.length);
  }, [editing, focusOnEdit]);

  // After a pasted image inserts its marker, put the caret right behind it.
  useEffect(() => {
    const caret = caretAfterPaste.current;
    if (caret === null) return;
    caretAfterPaste.current = null;
    textareaRef.current?.setSelectionRange(caret, caret);
  }, [content]);

  function handlePaste(e: ClipboardEvent<HTMLTextAreaElement>) {
    const files = Array.from(e.clipboardData.files).filter((f) =>
      f.type.startsWith("image/")
    );
    if (files.length === 0) return;
    e.preventDefault();

    // The marker goes in right away, at the cursor; the upload finishes in the
    // background and the marker is dropped again if it fails.
    const ids = files.map(() => newImageId());
    const { selectionStart, selectionEnd, value } = e.currentTarget;
    const inserted = insertImageTokens(value, selectionStart, selectionEnd, ids);
    caretAfterPaste.current = inserted.caret;
    setContent(inserted.text);

    void images.addFiles(files, ids).then((failed) => {
      if (failed.length > 0) {
        setContent((text) => failed.reduce(removeImageToken, text));
      }
    });
  }

  // Clicking a marker in the text opens its image (a textarea can't hold real links).
  function handleTextareaClick(e: MouseEvent<HTMLTextAreaElement>) {
    const { selectionStart, selectionEnd, value } = e.currentTarget;
    if (selectionStart !== selectionEnd) return;
    const id = imageIdAt(value, selectionStart);
    const image = id && images.images.find((i) => imageIdFromName(i.name) === id);
    if (image) setLightboxImage(image);
  }

  async function handleRemoveImage(name: string) {
    if (await images.remove(name)) {
      setContent((text) => removeImageToken(text, imageIdFromName(name)));
    }
  }

  function handleDeleteFromLightbox(image: EntryImage) {
    if (!window.confirm("Delete this image?")) return;
    setLightboxImage(null);
    void handleRemoveImage(image.name);
  }

  function startEditing() {
    setFocusOnEdit(true);
    setEditing(true);
  }

  async function handleDone() {
    if (await flush()) setEditing(false);
  }

  async function handleDelete() {
    const imageCount = images.images.length;
    if (
      imageCount > 0 &&
      !window.confirm(
        `Delete this day's entry and its ${imageCount} image${imageCount > 1 ? "s" : ""}? This can't be undone.`
      )
    ) {
      return;
    }

    setDeleting(true);
    // Let any pending or in-flight autosave land first so it can't resurrect the entry.
    await flush();
    const supabase = createClient();
    const { error } = await supabase
      .from("entries")
      .delete()
      .eq("entry_date", dateKey);
    if (error) {
      setDeleting(false);
      return;
    }

    // If this fails the entry is already gone; the leftover images stay visible
    // under "Not placed in the text" together with an error message.
    await images.removeAll();
    setDeleting(false);

    reset("");
    setContent("");
    setEditing(true);
    onChanged();
  }

  const placedIds = imageIdsIn(content);
  const unplacedImages = images.images.filter(
    (i) => !placedIds.has(imageIdFromName(i.name))
  );

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <ImageLightbox
        image={lightboxImage}
        onClose={closeLightbox}
        onDelete={handleDeleteFromLightbox}
      />
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-gray-900">
          {formatDisplayDate(dateKey)}
        </h2>
        <SaveStatus status={status} />
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : loadFailed ? (
        <p className="text-sm text-red-500">
          Couldn&apos;t load this entry. Check your connection and reselect the
          day.
        </p>
      ) : (
        <>
          {editing ? (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onPaste={handlePaste}
              onClick={handleTextareaClick}
              placeholder="What did you do / learn today? (Paste screenshots with Ctrl+V)"
              rows={14}
              className="w-full resize-y rounded-md border border-gray-300 p-3 text-sm focus:border-gray-500 focus:outline-none"
            />
          ) : (
            <div
              onClick={(e) => {
                if ((e.target as HTMLElement).closest("a, img")) return;
                if (window.getSelection()?.toString()) return;
                startEditing();
              }}
              className="min-h-[14rem] cursor-text whitespace-pre-wrap break-words rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900"
            >
              {content.trim() ? (
                <EntryContent
                  text={content}
                  images={images.images}
                  uploading={images.uploading}
                  onOpenImage={setLightboxImage}
                />
              ) : (
                <span className="text-gray-400">
                  Nothing written for this day yet. Click to write.
                </span>
              )}
            </div>
          )}

          <EntryImageGallery
            images={editing ? images.images : unplacedImages}
            uploading={images.uploading}
            error={images.error}
            title={
              editing
                ? "Images in this entry (click a marker in the text or a thumbnail to open it)"
                : "Not placed in the text"
            }
            showIds={editing}
            onOpen={setLightboxImage}
            onRemove={handleRemoveImage}
          />

          <div className="mt-3 flex items-center gap-3">
            {editing ? (
              <>
                <button
                  onClick={() => void flush()}
                  disabled={status === "saving"}
                  className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {status === "saving" ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={handleDone}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Done
                </button>
              </>
            ) : (
              <button
                onClick={startEditing}
                className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                Edit
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={deleting || (content === "" && images.images.length === 0)}
              className="rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
