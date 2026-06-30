export default function GameCardSkeleton() {
  return (
    <div className="bg-vz-charcoal rounded-xl overflow-hidden border border-zinc-800">
      <div className="aspect-video skeleton" />
      <div className="p-3 space-y-2">
        <div className="h-4 skeleton rounded w-3/4" />
        <div className="h-3 skeleton rounded w-1/3" />
      </div>
    </div>
  );
}
