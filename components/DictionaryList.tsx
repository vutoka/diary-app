"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DictionaryTerm } from "@/lib/types";

type DictionaryListProps = {
  terms: DictionaryTerm[];
  onChanged: () => void;
};

export default function DictionaryList({ terms, onChanged }: DictionaryListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTerm, setEditTerm] = useState("");
  const [editDefinition, setEditDefinition] = useState("");
  const [editCategory, setEditCategory] = useState("");

  function startEdit(t: DictionaryTerm) {
    setEditingId(t.id);
    setEditTerm(t.term);
    setEditDefinition(t.definition);
    setEditCategory(t.category ?? "");
  }

  async function saveEdit(id: string) {
    const supabase = createClient();
    await supabase
      .from("dictionary_terms")
      .update({
        term: editTerm.trim(),
        definition: editDefinition.trim(),
        category: editCategory.trim() || null,
      })
      .eq("id", id);
    setEditingId(null);
    onChanged();
  }

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
            <div className="space-y-2">
              <input
                value={editTerm}
                onChange={(e) => setEditTerm(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              />
              <textarea
                value={editDefinition}
                onChange={(e) => setEditDefinition(e.target.value)}
                rows={3}
                className="w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              />
              <input
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                placeholder="Category (optional)"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => saveEdit(t.id)}
                  className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </div>
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
                    onClick={() => startEdit(t)}
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
