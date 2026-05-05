export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-32 rounded-3xl bg-ink-100" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-24 rounded-2xl bg-ink-100" />
        <div className="h-24 rounded-2xl bg-ink-100" />
        <div className="h-24 rounded-2xl bg-ink-100" />
      </div>
      <div className="h-72 rounded-2xl bg-ink-100" />
    </div>
  );
}
