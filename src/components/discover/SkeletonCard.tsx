export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-[18px] border border-white/[0.06] bg-[#111114] p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="h-5 w-2/3 rounded bg-white/[0.06]" />
          <div className="h-3 w-1/3 rounded bg-white/[0.06]" />
        </div>
        <div className="h-6 w-10 shrink-0 rounded-full bg-white/[0.06]" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full rounded bg-white/[0.06]" />
        <div className="h-3 w-4/5 rounded bg-white/[0.06]" />
      </div>
      <div className="mt-6 flex gap-8 border-t border-white/[0.06] pt-4">
        <div className="h-8 w-16 rounded bg-white/[0.06]" />
        <div className="h-8 w-16 rounded bg-white/[0.06]" />
        <div className="h-8 w-16 rounded bg-white/[0.06]" />
      </div>
    </div>
  );
}