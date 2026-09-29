import type { Metadata } from "next";
import { FavoritesView } from "@/components/store/favorites-view";

export const metadata: Metadata = { title: "Favoritos", robots: { index: false } };

export default function FavoritesPage() {
  return (
    <div className="mx-auto max-w-[1320px] px-4 pt-10 pb-20 sm:px-6 sm:pt-14">
      <h1 className="mb-8 font-serif text-[2.6rem] leading-none font-medium sm:text-[3.2rem]">Favoritos</h1>
      <FavoritesView />
    </div>
  );
}
