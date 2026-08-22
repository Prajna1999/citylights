import Directory from "@/components/Directory";
import { shops } from "@/lib/shops";

export default function Home() {
  return <Directory shops={shops()} />;
}
