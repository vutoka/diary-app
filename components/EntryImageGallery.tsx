"use client";

import { imageIdFromName } from "@/lib/imageTokens";
import type { EntryImage } from "@/lib/useEntryImages";

type EntryImageGalleryProps = {
  images: EntryImage[];
  uploading: number;
  error: string | null;
  /** Shown above the thumbnails, e.g. which images these are. */
  title?: string;
  /** Show each image's short id, matching the marker in the text. */
  showIds?: boolean;
  onOpen: (image: EntryImage) => void;
  onRemove: (name: string) => void;
};

export default function EntryImageGallery({
  images,
  uploading,
  error,
  title,
  showIds = false,
  onOpen,
  onRemove,
}: EntryImageGalleryProps) {
  if (images.length === 0 && uploading === 0 && !error) return null;

  return (
    <div className="mt-3 space-y-2">
      {uploading > 0 && (
        <p className="text-xs text-gray-400">
          Uploading {uploading} image{uploading > 1 ? "s" : ""}...
        </p>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}

      {images.length > 0 && (
        <>
          {title && <p className="text-xs font-medium text-gray-500">{title}</p>}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {images.map((image) => (
              <div key={image.name} className="relative">
                <button
                  onClick={() => onOpen(image)}
                  className="block w-full cursor-zoom-in"
                >
                  {/* Signed URLs change per load, so next/image optimization has no use here. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt="Diary attachment"
                    loading="lazy"
                    className="aspect-square w-full rounded-md border border-gray-200 object-cover"
                  />
                </button>
                {showIds && (
                  <span className="absolute bottom-1 left-1 rounded bg-white/90 px-1.5 py-0.5 font-mono text-xs text-gray-700">
                    {imageIdFromName(image.name).slice(0, 6)}
                  </span>
                )}
                <button
                  onClick={() => {
                    if (window.confirm("Remove this image?")) {
                      onRemove(image.name);
                    }
                  }}
                  className="absolute right-1 top-1 rounded bg-white/90 px-1.5 py-0.5 text-xs font-medium text-red-600 shadow hover:bg-white"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
