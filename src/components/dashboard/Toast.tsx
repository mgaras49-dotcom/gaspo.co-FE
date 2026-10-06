import { useEffect } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

type ToastProps = {
  message: string;
  onClose: () => void;
  /** Auto-dismiss after this many ms. Set 0 to disable. */
  duration?: number;
  /** An error keeps its own icon, and should be given time to be read. */
  tone?: "success" | "error";
};

/** Minimal toast pinned to the bottom-right of the viewport. */
export function Toast({ message, onClose, duration = 4000, tone = "success" }: ToastProps) {
  const Icon = tone === "error" ? AlertCircle : CheckCircle2;
  useEffect(() => {
    if (!duration) return;
    const id = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(id);
  }, [duration, onClose]);

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className="fixed bottom-6 right-6 z-50 flex max-w-md items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-lg"
    >
      <Icon
        className={`size-5 shrink-0 ${tone === "error" ? "text-destructive" : "text-highlight"}`}
        strokeWidth={2}
        aria-hidden
      />
      <p className="text-sm font-medium text-foreground">{message}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss"
        className="gaspo-focus-ring ml-2 shrink-0 cursor-pointer rounded-full p-0.5 text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="size-4" strokeWidth={1.5} />
      </button>
    </div>
  );
}
