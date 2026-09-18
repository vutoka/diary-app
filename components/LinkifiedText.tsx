import type { ReactNode } from "react";

const URL_PATTERN = /(?:https?:\/\/|www\.)[^\s<]+/gi;
const TRAILING_PUNCTUATION = ".,;:!?'\"";
const CLOSERS: Record<string, string> = { ")": "(", "]": "[" };

function count(text: string, char: string) {
  return text.split(char).length - 1;
}

/** Drops sentence punctuation and unbalanced closing brackets from a URL's end. */
function trimUrl(url: string): string {
  let end = url.length;
  while (end > 0) {
    const char = url[end - 1];
    const head = url.slice(0, end);
    if (TRAILING_PUNCTUATION.includes(char)) {
      end--;
    } else if (char in CLOSERS && count(head, char) > count(head, CLOSERS[char])) {
      end--;
    } else {
      break;
    }
  }
  return url.slice(0, end);
}

export default function LinkifiedText({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(URL_PATTERN)) {
    const url = trimUrl(match[0]);
    const start = match.index;
    if (!url) continue;

    if (start > cursor) nodes.push(text.slice(cursor, start));
    nodes.push(
      <a
        key={start}
        href={/^www\./i.test(url) ? `https://${url}` : url}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all text-blue-600 underline hover:text-blue-800"
      >
        {url}
      </a>
    );
    cursor = start + url.length;
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));
  return <>{nodes}</>;
}
