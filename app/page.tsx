import ClothingRack from "@/components/ClothingRack";
import { products } from "@/lib";

export default function Home() {
  return <ClothingRack items={products.filter((p) => p.featured)} />;
}
