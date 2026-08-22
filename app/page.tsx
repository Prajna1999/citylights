import Directory from "@/components/Directory";
import { shops } from "@/lib/shops";

export default async function Home() {
  return <Directory shops={await shops()} />;
}
