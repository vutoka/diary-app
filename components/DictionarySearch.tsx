"use client";

type DictionarySearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function DictionarySearch({
  value,
  onChange,
}: DictionarySearchProps) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search terms, definitions, categories..."
      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
    />
  );
}
