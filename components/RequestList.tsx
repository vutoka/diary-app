"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { FeatureRequest } from "@/lib/types";
import RequestEditor from "@/components/RequestEditor";

type RequestListProps = {
  requests: FeatureRequest[];
  onChanged: () => void;
};

export default function RequestList({ requests, onChanged }: RequestListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  async function toggleStatus(r: FeatureRequest) {
    const supabase = createClient();
    const { error } = await supabase
      .from("requests")
      .update({ status: r.status === "done" ? "open" : "done" })
      .eq("id", r.id);
    if (!error) onChanged();
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from("requests").delete().eq("id", id);
    onChanged();
  }

  if (requests.length === 0) {
    return <p className="text-sm text-gray-400">No requests yet.</p>;
  }

  return (
    <div className="space-y-3">
      {requests.map((r) => (
        <div
          key={r.id}
          className="rounded-lg border border-gray-200 bg-white p-4"
        >
          {editingId === r.id ? (
            <RequestEditor
              request={r}
              onSaved={onChanged}
              onDone={() => setEditingId(null)}
            />
          ) : (
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={r.status === "done"}
                  onChange={() => toggleStatus(r)}
                  aria-label={`Mark "${r.title}" as done`}
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer"
                />
                <div>
                  <h3
                    className={`text-sm font-semibold ${
                      r.status === "done"
                        ? "text-gray-400 line-through"
                        : "text-gray-900"
                    }`}
                  >
                    {r.title}
                  </h3>
                  {r.description && (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
                      {r.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => setEditingId(r.id)}
                  className="text-xs font-medium text-gray-500 hover:text-gray-900"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="text-xs font-medium text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
