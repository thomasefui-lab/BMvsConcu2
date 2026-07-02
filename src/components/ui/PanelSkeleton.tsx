interface PanelSkeletonProps {
  title?: string;
  cards?: number;
  columns?: 1 | 2 | 3;
}

export function PanelSkeleton({ title, cards = 4, columns = 2 }: PanelSkeletonProps) {
  const colClass =
    columns === 3
      ? "sm:grid-cols-2 xl:grid-cols-3"
      : columns === 1
        ? "grid-cols-1"
        : "sm:grid-cols-2";

  return (
    <div className="animate-pulse space-y-4">
      {title ? (
        <div className="space-y-2">
          <div className="h-6 w-48 rounded bg-slate-200" />
          <div className="h-4 w-72 rounded bg-slate-100" />
        </div>
      ) : null}
      <div className={`grid grid-cols-1 gap-4 ${colClass}`}>
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="aspect-[4/3] rounded-lg bg-slate-100" />
            <div className="mt-3 h-4 w-3/4 rounded bg-slate-200" />
            <div className="mt-2 h-3 w-1/2 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function MoverSiteSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="h-5 w-28 rounded bg-slate-200" />
        <div className="mt-2 h-3 w-40 rounded bg-slate-100" />
      </div>
      <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-slate-100 p-2">
            <div className="aspect-[4/3] rounded bg-slate-100" />
            <div className="mt-2 h-3 w-full rounded bg-slate-200" />
            <div className="mt-1 h-3 w-2/3 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
