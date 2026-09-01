"use client";

import { toDateKey } from "@/lib/date";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type CalendarProps = {
  currentMonth: Date;
  selectedDate: string;
  datesWithEntries: Set<string>;
  onSelectDate: (dateKey: string) => void;
  onMonthChange: (month: Date) => void;
};

export default function Calendar({
  currentMonth,
  selectedDate,
  datesWithEntries,
  onSelectDate,
  onMonthChange,
}: CalendarProps) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = firstOfMonth.getDay();

  const todayKey = toDateKey(new Date());

  const cells: (number | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => onMonthChange(new Date(year, month - 1, 1))}
          className="rounded px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
          aria-label="Previous month"
        >
          &#8592;
        </button>
        <span className="text-sm font-semibold text-gray-900">
          {currentMonth.toLocaleDateString(undefined, {
            month: "long",
            year: "numeric",
          })}
        </span>
        <button
          onClick={() => onMonthChange(new Date(year, month + 1, 1))}
          className="rounded px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
          aria-label="Next month"
        >
          &#8594;
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`blank-${i}`} />;

          const dateKey = toDateKey(new Date(year, month, day));
          const isSelected = dateKey === selectedDate;
          const isToday = dateKey === todayKey;
          const hasEntry = datesWithEntries.has(dateKey);

          return (
            <button
              key={dateKey}
              onClick={() => onSelectDate(dateKey)}
              className={`relative flex h-9 flex-col items-center justify-center rounded text-sm ${
                isSelected
                  ? "bg-gray-900 text-white"
                  : isToday
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {day}
              {hasEntry && (
                <span
                  className={`absolute bottom-1 h-1 w-1 rounded-full ${
                    isSelected ? "bg-white" : "bg-gray-900"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
