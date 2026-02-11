import { getCompanies } from "@/app/actions/company";
import { getCategories } from "@/app/actions/categories";
import { getStoreProducts } from "@/app/actions/products";
import RestaurantPage from "./[slug]/restaurant-page";
import { SiteFooter } from "@/components/client/site-footer";

export default async function HomePage() {
  const companies = await getCompanies();
  const company = companies[0];

  if (!company) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Nenhum restaurante encontrado.</p>
      </div>
    );
  }

  const [categories, products] = await Promise.all([
    getCategories(company.id),
    getStoreProducts(company.id),
  ]);

  return (
    <RestaurantPage
      company={company}
      categories={categories}
      products={products}
    />
  );
}
