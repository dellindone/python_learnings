export default function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-[28px] bg-white shadow-md">
      <div className="h-56 animate-pulse bg-slate-200" />
      <div className="space-y-4 p-6">
        <div className="h-6 w-2/3 animate-pulse rounded-full bg-slate-200" />
        <div className="h-4 w-full animate-pulse rounded-full bg-slate-100" />
        <div className="h-4 w-5/6 animate-pulse rounded-full bg-slate-100" />
        <div className="flex items-center justify-between pt-3">
          <div className="h-8 w-24 animate-pulse rounded-full bg-slate-200" />
          <div className="h-11 w-28 animate-pulse rounded-2xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
}
