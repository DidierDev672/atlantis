export function HabitacionCardsSkeleton({
  count = 4,
  className = 'grid grid-cols-1 gap-3 sm:grid-cols-2 md:hidden',
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="border-line bg-panel animate-pulse space-y-3 rounded-2xl border p-4"
        >
          <div className="flex items-center justify-between">
            <div className="bg-line/60 h-5 w-24 rounded-md" />
            <div className="bg-line/50 h-5 w-16 rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="bg-line/50 h-4 w-36 rounded-md" />
            <div className="bg-line/40 h-4 w-40 rounded-md" />
          </div>
          <div className="border-line/60 flex items-center justify-between border-t pt-2.5">
            <div className="bg-line/50 h-4 w-20 rounded-md" />
            <div className="bg-line/40 h-3 w-16 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
