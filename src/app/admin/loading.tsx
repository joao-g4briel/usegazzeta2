import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-[1400px]" aria-busy="true" aria-label="Carregando">
      <Skeleton className="h-10 w-64 rounded-xl" />
      <Skeleton className="mt-2 h-5 w-96 max-w-full" />
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="mt-6 h-80 rounded-2xl" />
    </div>
  );
}
