"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DictionaryTerm } from "@/lib/types";
import DictionaryTermEditor from "@/components/DictionaryTermEditor";

type DictionaryListProps = {
  terms: DictionaryTerm[];
  onChanged: () => void;
};

export default function DictionaryList({ terms, onChanged }: DictionaryListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from("dictionary_terms").delete().eq("id", id);
    onChanged();
  }

  if (terms.length === 0) {
    return <p className="text-sm text-gray-400">No terms yet.</p>;
  }

  return (
    <div className="space-y-3">
      {terms.map((t) => (
        <div
          key={t.id}
          className="rounded-lg border border-gray-200 bg-white p-4"
        >
          {editingId === t.id ? (
            <DictionaryTermEditor
              term={t}
              onSaved={onChanged}
              onDone={() => setEditingId(null)}
            />
          ) : (
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {t.term}
                    {t.category && (
                      <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-normal text-gray-500">
                        {t.category}
                      </span>
                    )}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">{t.definition}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => setEditingId(t.id)}
                    className="text-xs font-medium text-gray-500 hover:text-gray-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="text-xs font-medium text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
