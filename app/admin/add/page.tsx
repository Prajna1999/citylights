import AddShopWizard from "@/components/AddShopWizard";
import { requireUser } from "@/lib/auth";

export default async function AddShopPage() {
  const user = await requireUser();
  return <AddShopWizard role={user.role} />;
}
