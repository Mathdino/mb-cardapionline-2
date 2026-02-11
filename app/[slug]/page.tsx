import { notFound } from "next/navigation";
import { getCompanyBySlug } from "@/app/actions/company";
import { getCategories } from "@/app/actions/categories";
import { getStoreProducts } from "@/app/actions/products";
import RestaurantPage from "./restaurant-page";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);

  if (!company) {
    return { title: "Restaurante não encontrado" };
  }

  return {
    title: `${company.name} | Cardápio Online`,
    description: company.description,
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);

  if (!company) {
    notFound();
  }

  const [allCategories, products] = await Promise.all([
    getCategories(company.id),
    getStoreProducts(company.id),
  ]);

  const categories = allCategories;

  return (
    <RestaurantPage
      company={company as any}
      categories={categories}
      products={products as any}
    />
  );
}
