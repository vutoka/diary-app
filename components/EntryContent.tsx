import type { ReactNode } from "react";
import { IMAGE_TOKEN_PATTERN, imageIdFromName } from "@/lib/imageTokens";
import type { EntryImage } from "@/lib/useEntryImages";
import LinkifiedText from "@/components/LinkifiedText";

type EntryContentProps = {
  text: string;
  images: EntryImage[];
  uploading: number;
  onOpenImage: (image: EntryImage) => void;
};

/** Renders an entry's text with links made clickable and image markers
 *  replaced by the images themselves, at the spot they were pasted. */
export default function EntryContent({
  text,
  images,
  uploading,
  onOpenImage,
}: EntryContentProps) {
  const byId = new Map(images.map((i) => [imageIdFromName(i.name), i]));
  const nodes: ReactNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(IMAGE_TOKEN_PATTERN)) {
    const start = match.index;

    // A marker sits on its own line, so the line breaks around it are dropped.
    let before = text.slice(cursor, start);
    if (before.endsWith("\n")) before = before.slice(0, -1);
    if (before) nodes.push(<LinkifiedText key={`text-${start}`} text={before} />);

    const image = byId.get(match[1]);
    nodes.push(
      image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`image-${start}`}
          src={image.url}
          alt="Diary attachment"
          loading="lazy"
          onClick={() => onOpenImage(image)}
          className="my-2 block max-h-96 max-w-full cursor-zoom-in rounded-md border border-gray-200"
        />
      ) : (
        <span
          key={`image-${start}`}
          className="my-1 block text-xs italic text-gray-400"
        >
          {uploading > 0 ? "Uploading image..." : "Image not found"}
        </span>
      )
    );

    cursor = start + match[0].length;
    if (text[cursor] === "\n") cursor++;
  }

  const rest = text.slice(cursor);
  if (rest) nodes.push(<LinkifiedText key="text-end" text={rest} />);

  return <>{nodes}</>;
}
