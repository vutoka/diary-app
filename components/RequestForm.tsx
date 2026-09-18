"use client";

import { useRef, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAutosave } from "@/lib/useAutosave";
import SaveStatus from "@/components/SaveStatus";

type RequestFormProps = {
  onAdded: () => void;
};

type Draft = { title: string; description: string };

const EMPTY: Draft = { title: "", description: "" };

export default function RequestForm({ onAdded }: RequestFormProps) {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  // Once the title is filled the request is created and later edits update it.
  const [createdId, setCreatedId] = useState<string | null>(null);
  const createdIdRef = useRef<string | null>(null);

  const { status, flush, reset } = useAutosave<Draft>({
    value: draft,
    initial: EMPTY,
    isValid: (d) => d.title.trim() !== "",
    onSaved: onAdded,
    save: async (d) => {
      const supabase = createClient();
      const row = {
        title: d.title.trim(),
        description: d.description.trim() || null,
      };

      if (createdIdRef.current === null) {
        const { data, error } = await supabase
          .from("requests")
          .insert(row)
          .select("id")
          .single();
        if (error) throw error;
        createdIdRef.current = data.id;
        setCreatedId(data.id);
      } else {
        const { error } = await supabase
          .from("requests")
          .update(row)
          .eq("id", createdIdRef.current);
        if (error) throw error;
      }
    },
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!(await flush())) return;

    createdIdRef.current = null;
    setCreatedId(null);
    setDraft(EMPTY);
    reset(EMPTY);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-lg border border-gray-200 bg-white p-4"
    >
      <h2 className="text-sm font-semibold text-gray-900">Request a feature</h2>
      <input
        value={draft.title}
        onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
        placeholder="Title"
        required
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
      />
      <textarea
        value={draft.description}
        onChange={(e) =>
          setDraft((d) => ({ ...d, description: e.target.value }))
        }
        placeholder="Description (optional)"
        rows={4}
        className="w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={status === "saving"}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {status === "saving"
            ? "Saving..."
            : createdId
              ? "Done"
              : "Add request"}
        </button>
        <SaveStatus status={status} />
      </div>
    </form>
  );
}
