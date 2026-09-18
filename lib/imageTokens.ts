/** Images are placed in an entry's text with a marker like `[[img:a1b2c3d4e5f6]]`,
 *  where the id is the image's file name (without extension) in storage. */
export const IMAGE_TOKEN_PATTERN = /\[\[img:([\w-]+)\]\]/g;

export const imageToken = (id: string) => `[[img:${id}]]`;

export const imageIdFromName = (name: string) => name.replace(/\.[^.]+$/, "");

export const imageNameFromId = (id: string) => `${id}.jpg`;

export function newImageId(): string {
  return crypto.randomUUID().replaceAll("-", "").slice(0, 12);
}

export function imageIdsIn(text: string): Set<string> {
  return new Set(Array.from(text.matchAll(IMAGE_TOKEN_PATTERN), (m) => m[1]));
}

/** Puts one marker per id on its own line(s) at the selection and returns the
 *  new text plus where the caret should go (after the inserted block). */
export function insertImageTokens(
  text: string,
  start: number,
  end: number,
  ids: string[]
): { text: string; caret: number } {
  const before = text.slice(0, start);
  const after = text.slice(end);
  const prefix = before !== "" && !before.endsWith("\n") ? "\n" : "";
  const suffix = after.startsWith("\n") ? "" : "\n";
  const inserted = prefix + ids.map(imageToken).join("\n") + suffix;
  return {
    text: before + inserted + after,
    caret: before.length + inserted.length + (after.startsWith("\n") ? 1 : 0),
  };
}

/** The id of the marker the caret is strictly inside of, if any. A caret at
 *  either edge of a marker doesn't count, so clicking next to it still edits. */
export function imageIdAt(text: string, caret: number): string | null {
  for (const match of text.matchAll(IMAGE_TOKEN_PATTERN)) {
    if (caret > match.index && caret < match.index + match[0].length) {
      return match[1];
    }
  }
  return null;
}

export function removeImageToken(text: string, id: string): string {
  return text.replace(new RegExp(`\\n?\\[\\[img:${id}\\]\\]`), "");
}

/** Plain-text stand-in for markers, for places that show a text snippet. */
export function describeImageTokens(text: string): string {
  return text.replace(IMAGE_TOKEN_PATTERN, "[image]");
}
