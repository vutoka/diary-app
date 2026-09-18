"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { readBackup, useAutosave } from "@/lib/useAutosave";
import type { DictionaryTerm } from "@/lib/types";
import SaveStatus from "@/components/SaveStatus";

type DictionaryTermEditorProps = {
  term: DictionaryTerm;
  onSaved: () => void;
  onDone: () => void;
};

type Draft = { term: string; definition: string; category: string };

export default function DictionaryTermEditor({
  term,
  onSaved,
  onDone,
}: DictionaryTermEditorProps) {
  const backupKey = `dictionary-edit:${term.id}`;
  const original: Draft = {
    term: term.term,
    definition: term.definition,
    category: term.category ?? "",
  };
  const [draft, setDraft] = useState<Draft>(
    () => readBackup<Draft>(backupKey) ?? original
  );

  const { status, flush } = useAutosave<Draft>({
    value: draft,
    initial: original,
    backupKey,
    onSaved,
    isValid: (d) => d.term.trim() !== "" && d.definition.trim() !== "",
    save: async (d) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("dictionary_terms")
        .update({
          term: d.term.trim(),
          definition: d.definition.trim(),
          category: d.category.trim() || null,
        })
        .eq("id", term.id);
      if (error) throw error;
    },
  });

  async function handleDone() {
    if (await flush()) onDone();
  }

  return (
    <div className="space-y-2">
      <input
        value={draft.term}
        onChange={(e) => setDraft((d) => ({ ...d, term: e.target.value }))}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
      />
      <textarea
        value={draft.definition}
        onChange={(e) =>
          setDraft((d) => ({ ...d, definition: e.target.value }))
        }
        rows={3}
        className="w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
      />
      <input
        value={draft.category}
        onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
        placeholder="Category (optional)"
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
      />
      <div className="flex items-center gap-3">
        <button
          onClick={handleDone}
          disabled={status === "saving"}
          className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          Done
        </button>
        <SaveStatus status={status} />
      </div>
    </div>
  );
}
