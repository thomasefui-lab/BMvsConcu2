interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

const SIZE_CLASS = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-[3px]",
} as const;

export function LoadingSpinner({ size = "md", label, className = "" }: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`} role="status">
      <div
        className={`animate-spin rounded-full border-brand-200 border-t-brand-700 ${SIZE_CLASS[size]}`}
        aria-hidden="true"
      />
      {label ? <p className="text-sm text-slate-500">{label}</p> : null}
      <span className="sr-only">{label ?? "Chargement"}</span>
    </div>
  );
}
