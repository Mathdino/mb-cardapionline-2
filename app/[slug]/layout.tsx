import { SiteFooter } from "@/components/client/site-footer";
import { getCompanyBySlug } from "@/app/actions/company";
import { RestaurantProvider } from "@/components/client/restaurant-context";

interface SlugLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function SlugLayout({
  children,
  params,
}: SlugLayoutProps) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);

  return (
    <RestaurantProvider company={company as any}>
      <div className="flex flex-col min-h-screen bg-background">
        <main className="flex-1 w-full">{children}</main>
      </div>
    </RestaurantProvider>
  );
}
