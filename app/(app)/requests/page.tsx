"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { FeatureRequest } from "@/lib/types";
import RequestForm from "@/components/RequestForm";
import RequestList from "@/components/RequestList";

export default function RequestsPage() {
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (!cancelled) {
        setRequests(data ?? []);
        setLoadFailed(error !== null);
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

  const filteredRequests = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q)
    );
  }, [requests, query]);

  return (
    <div className="grid gap-6 md:grid-cols-[320px_1fr]">
      <RequestForm onAdded={refresh} />

      <div className="space-y-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search requests..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
        />
        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : loadFailed ? (
          <p className="text-sm text-red-500">
            Couldn&apos;t load requests. Check your connection and reload.
          </p>
        ) : (
          <RequestList requests={filteredRequests} onChanged={refresh} />
        )}
      </div>
    </div>
  );
}
