"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDisplayDate } from "@/lib/date";

type SearchResult = {
  entry_date: string;
  content: string;
};

type DiarySearchProps = {
  onSelectDate: (dateKey: string) => void;
};

export default function DiarySearch({ onSelectDate }: DiarySearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);

  async function handleSearch() {
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    const supabase = createClient();
    const { data } = await supabase
      .from("entries")
      .select("entry_date, content")
      .ilike("content", `%${query.trim()}%`)
      .order("entry_date", { ascending: false })
      .limit(50);

    setResults(data ?? []);
    setSearched(true);
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search your entries..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
        />
        <button
          onClick={handleSearch}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Search
        </button>
      </div>

      {searched && (
        <div className="mt-3 space-y-2">
          {results.length === 0 && (
            <p className="text-sm text-gray-400">No entries found.</p>
          )}
          {results.map((r) => (
            <button
              key={r.entry_date}
              onClick={() => onSelectDate(r.entry_date)}
              className="block w-full rounded-md border border-gray-100 p-2 text-left hover:bg-gray-50"
            >
              <div className="text-xs font-medium text-gray-900">
                {formatDisplayDate(r.entry_date)}
              </div>
              <div className="truncate text-xs text-gray-500">
                {r.content}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
