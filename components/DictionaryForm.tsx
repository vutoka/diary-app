"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type DictionaryFormProps = {
  onAdded: () => void;
};

export default function DictionaryForm({ onAdded }: DictionaryFormProps) {
  const [term, setTerm] = useState("");
  const [definition, setDefinition] = useState("");
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!term.trim() || !definition.trim()) return;

    setSaving(true);
    const supabase = createClient();
    await supabase.from("dictionary_terms").insert({
      term: term.trim(),
      definition: definition.trim(),
      category: category.trim() || null,
    });
    setSaving(false);
    setTerm("");
    setDefinition("");
    setCategory("");
    onAdded();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-lg border border-gray-200 bg-white p-4"
    >
      <h2 className="text-sm font-semibold text-gray-900">Add a term</h2>
      <input
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Term"
        required
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
      />
      <textarea
        value={definition}
        onChange={(e) => setDefinition(e.target.value)}
        placeholder="Definition"
        required
        rows={3}
        className="w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
      />
      <input
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        placeholder="Category (optional, e.g. React, Git, AWS)"
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
      />
      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {saving ? "Adding..." : "Add term"}
      </button>
    </form>
  );
}
