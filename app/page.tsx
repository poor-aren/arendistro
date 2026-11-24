import ClothingRack from "@/components/ClothingRack";
import { getData } from "@/db";

export default async function Home() {
  const { site, categories, products } = await getData();
  return <ClothingRack items={products.filter((p) => p.featured)} site={site} categories={categories} />;
}
