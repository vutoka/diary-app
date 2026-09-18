"use client";

import { useEffect } from "react";
import type { EntryImage } from "@/lib/useEntryImages";

type ImageLightboxProps = {
  image: EntryImage | null;
  onClose: () => void;
  onDelete: (image: EntryImage) => void;
};

/** Shows an image full-screen over the app; closes on Esc, the button, or a click outside. */
export default function ImageLightbox({
  image,
  onClose,
  onDelete,
}: ImageLightboxProps) {
  useEffect(() => {
    if (!image) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [image, onClose]);

  if (!image) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
    >
      <div className="absolute right-4 top-4 flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(image);
          }}
          className="rounded-md bg-white/90 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-white"
        >
          Delete
        </button>
        <button
          onClick={onClose}
          className="rounded-md bg-white/90 px-3 py-1.5 text-sm font-medium text-gray-900 hover:bg-white"
        >
          Close
        </button>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.url}
        alt="Diary attachment"
        onClick={(e) => e.stopPropagation()}
        className="max-h-full max-w-full rounded-md object-contain"
      />
    </div>
  );
}
