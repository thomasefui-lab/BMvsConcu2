import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <div className="border-b border-brand-800 bg-brand-900 px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="h-3 w-40 animate-pulse rounded bg-brand-700" />
          <div className="mt-3 h-8 w-80 animate-pulse rounded bg-brand-700" />
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center py-24">
        <LoadingSpinner size="lg" label="Chargement des données offre…" />
      </div>
    </div>
  );
}
