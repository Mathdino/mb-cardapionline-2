import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Toaster } from "sonner";
import { SiteFooter } from "@/components/client/site-footer";
import { getCompanies } from "@/app/actions/company";
import { RestaurantProvider } from "@/components/client/restaurant-context";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CO - Cardápio Online",
  description: "Created with Matheus Bernardino",
  generator: "v0.app",
  icons: {
    icon: "/images/favicon.svg",
    shortcut: "/images/favicon.svg",
    apple: "/images/favicon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const companies = await getCompanies();
  const defaultCompany = companies[0] || null;

  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <AuthProvider>
          <RestaurantProvider company={defaultCompany}>
            {children}
            <Toaster />
            <Analytics />
            <SiteFooter />
          </RestaurantProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
