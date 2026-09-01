"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toDateKey } from "@/lib/date";
import Calendar from "@/components/Calendar";
import EntryEditor from "@/components/EntryEditor";
import DiarySearch from "@/components/DiarySearch";

export default function DiaryPage() {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(toDateKey(today));
  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [datesWithEntries, setDatesWithEntries] = useState<Set<string>>(
    new Set()
  );
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const start = toDateKey(
        new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
      );
      const end = toDateKey(
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
      );

      const { data } = await supabase
        .from("entries")
        .select("entry_date")
        .gte("entry_date", start)
        .lte("entry_date", end);

      if (!cancelled) {
        setDatesWithEntries(new Set((data ?? []).map((d) => d.entry_date)));
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [currentMonth, refreshKey]);

  function handleSelectDate(dateKey: string) {
    setSelectedDate(dateKey);
    const [y, m] = dateKey.split("-").map(Number);
    setCurrentMonth(new Date(y, m - 1, 1));
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-[320px_1fr]">
        <div className="space-y-6">
          <Calendar
            currentMonth={currentMonth}
            selectedDate={selectedDate}
            datesWithEntries={datesWithEntries}
            onSelectDate={handleSelectDate}
            onMonthChange={setCurrentMonth}
          />
          <DiarySearch onSelectDate={handleSelectDate} />
        </div>

        <EntryEditor
          key={selectedDate}
          dateKey={selectedDate}
          onChanged={() => setRefreshKey((k) => k + 1)}
        />
      </div>
    </div>
  );
}
