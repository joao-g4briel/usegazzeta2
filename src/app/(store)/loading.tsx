import { Skeleton } from "@/components/ui/skeleton";

export default function StoreLoading() {
  return (
    <div className="mx-auto max-w-[1320px] px-4 pt-12 pb-20 sm:px-6" aria-busy="true" aria-label="Carregando">
      <Skeleton className="h-12 w-72 rounded-xl" />
      <Skeleton className="mt-3 h-5 w-96 max-w-full" />
      <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-[4/5] rounded-2xl" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-5 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
