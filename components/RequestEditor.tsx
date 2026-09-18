"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { readBackup, useAutosave } from "@/lib/useAutosave";
import type { FeatureRequest } from "@/lib/types";
import SaveStatus from "@/components/SaveStatus";

type RequestEditorProps = {
  request: FeatureRequest;
  onSaved: () => void;
  onDone: () => void;
};

type Draft = { title: string; description: string };

export default function RequestEditor({
  request,
  onSaved,
  onDone,
}: RequestEditorProps) {
  const backupKey = `request-edit:${request.id}`;
  const original: Draft = {
    title: request.title,
    description: request.description ?? "",
  };
  const [draft, setDraft] = useState<Draft>(
    () => readBackup<Draft>(backupKey) ?? original
  );

  const { status, flush } = useAutosave<Draft>({
    value: draft,
    initial: original,
    backupKey,
    onSaved,
    isValid: (d) => d.title.trim() !== "",
    save: async (d) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("requests")
        .update({
          title: d.title.trim(),
          description: d.description.trim() || null,
        })
        .eq("id", request.id);
      if (error) throw error;
    },
  });

  async function handleDone() {
    if (await flush()) onDone();
  }

  return (
    <div className="space-y-2">
      <input
        value={draft.title}
        onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
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
