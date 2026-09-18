export type Entry = {
  id: string;
  entry_date: string; // "YYYY-MM-DD"
  content: string;
  updated_at: string;
};

export type FeatureRequest = {
  id: string;
  title: string;
  description: string | null;
  status: "open" | "done";
  created_at: string;
};

export type DictionaryTerm = {
  id: string;
  term: string;
  definition: string;
  category: string | null;
  created_at: string;
};
