export default function ModuleLoading() {
  return (
    <div className="w-full space-y-6" aria-busy="true">
      <div className="space-y-3" aria-hidden="true">
        <div className="h-3 w-24 animate-pulse rounded bg-muted motion-reduce:animate-none" />
        <div className="h-10 w-60 animate-pulse rounded bg-muted motion-reduce:animate-none" />
        <div className="h-3 w-full max-w-xl animate-pulse rounded bg-muted motion-reduce:animate-none" />
      </div>
      <div
        className="min-h-80 animate-pulse rounded-3xl border bg-card motion-reduce:animate-none"
        aria-hidden="true"
      />
    </div>
  );
}
