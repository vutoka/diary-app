"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DictionaryTerm } from "@/lib/types";
import DictionaryForm from "@/components/DictionaryForm";
import DictionaryList from "@/components/DictionaryList";
import DictionarySearch from "@/components/DictionarySearch";

export default function DictionaryPage() {
  const [terms, setTerms] = useState<DictionaryTerm[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("dictionary_terms")
        .select("*")
        .order("term", { ascending: true });

      if (!cancelled) {
        setTerms(data ?? []);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  function refresh() {
    setRefreshKey((k) => k + 1);
  }

  const filteredTerms = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return terms;
    return terms.filter(
      (t) =>
        t.term.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q) ||
        (t.category ?? "").toLowerCase().includes(q)
    );
  }, [terms, query]);

  return (
    <div className="grid gap-6 md:grid-cols-[320px_1fr]">
      <DictionaryForm onAdded={refresh} />

      <div className="space-y-4">
        <DictionarySearch value={query} onChange={setQuery} />
        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : (
          <DictionaryList terms={filteredTerms} onChanged={refresh} />
        )}
      </div>
    </div>
  );
}
