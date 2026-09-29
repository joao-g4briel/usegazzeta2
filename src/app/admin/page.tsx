import { redirect } from "next/navigation";
import { requirePageUser } from "@/lib/session";
import { homeFor } from "@/lib/permissions";

export default async function AdminIndex() {
  const user = await requirePageUser();
  redirect(homeFor(user.role));
}
