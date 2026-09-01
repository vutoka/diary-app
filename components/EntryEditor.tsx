"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDisplayDate } from "@/lib/date";

type EntryEditorProps = {
  dateKey: string;
  onChanged: () => void;
};

export default function EntryEditor({ dateKey, onChanged }: EntryEditorProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("entries")
        .select("content")
        .eq("entry_date", dateKey)
        .maybeSingle();

      if (!cancelled) {
        setContent(data?.content ?? "");
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [dateKey]);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("entries")
      .upsert(
        { entry_date: dateKey, content, updated_at: new Date().toISOString() },
        { onConflict: "user_id,entry_date" }
      );
    setSaving(false);
    setSavedAt(Date.now());
    onChanged();
  }

  async function handleDelete() {
    setSaving(true);
    const supabase = createClient();
    await supabase.from("entries").delete().eq("entry_date", dateKey);
    setContent("");
    setSaving(false);
    setSavedAt(null);
    onChanged();
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-gray-900">
        {formatDisplayDate(dateKey)}
      </h2>

      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : (
        <>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What did you do / learn today?"
            rows={14}
            className="w-full resize-y rounded-md border border-gray-300 p-3 text-sm focus:border-gray-500 focus:outline-none"
          />

          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={handleDelete}
              disabled={saving || content === ""}
              className="rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              Delete
            </button>
            {savedAt && (
              <span className="text-xs text-gray-400">Saved</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
