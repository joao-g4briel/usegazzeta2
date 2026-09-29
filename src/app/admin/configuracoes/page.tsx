import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { StoreSettingsForm, UsersSection } from "@/components/admin/settings-forms";
import { requirePageUser } from "@/lib/session";
import { getStoreById, listUsers } from "@/services/store-service";

export const metadata: Metadata = { title: "Configurações" };

export default async function SettingsPage() {
  const user = await requirePageUser("settings");
  const [store, users] = await Promise.all([getStoreById(user.storeId), listUsers(user.storeId)]);
  return (
    <div className="mx-auto max-w-[960px] space-y-5">
      <PageHeader title="Configurações" description="Dados da loja, vitrine, frete, parcelamento e equipe." />
      <StoreSettingsForm store={store} />
      <UsersSection users={users} />
    </div>
  );
}
