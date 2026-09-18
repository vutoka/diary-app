import type { SaveStatus as Status } from "@/lib/useAutosave";

const LABELS: Record<Status, string> = {
  clean: "",
  dirty: "Unsaved changes",
  invalid: "Unsaved changes (fill in the required fields)",
  saving: "Saving...",
  saved: "Saved",
  error: "Save failed, retrying...",
};

export default function SaveStatus({ status }: { status: Status }) {
  if (status === "clean") return null;
  return (
    <span
      className={`text-xs ${
        status === "error" ? "text-red-500" : "text-gray-400"
      }`}
    >
      {LABELS[status]}
    </span>
  );
}
