import { notFound } from "next/navigation";
import {
  MapPin,
  Phone,
  Clock,
  CreditCard,
  Truck,
  Store,
  CircleDollarSign,
  ArrowLeft,
} from "lucide-react";
import { ScrollHeader } from "@/components/client/scroll-header";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { formatCurrency, formatPhone, paymentMethodLabels } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function InfoPage() {
  const company = await prisma.company.findFirst({
    orderBy: { name: "asc" },
  });

  if (!company) {
    notFound();
  }

  const address = company.address as any;
  const addressString = `${address.street}, ${address.number}, ${address.neighborhood}, ${address.city}, ${address.state}`;
  const encodedAddress = encodeURIComponent(addressString);
  const mapUrl = `https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto pb-8 pt-20">
      <ScrollHeader company={company as any} alwaysVisible />

      <div className="px-4 mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para a loja
        </Link>
      </div>

      <div className="p-4 space-y-4">
        {/* Description */}
        <section>
          <h2 className="text-xl font-bold mb-2">{company.name}</h2>
          <p className="text-muted-foreground">{company.description}</p>
        </section>

        {/* Logistics Methods */}
        <div className="mt-4 mb-2 pt-4 border-t border-secondary-foreground/10">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
            Disponível para
          </p>
          <div className="flex gap-6">
            {company.allowsDelivery && (
              <div className="flex flex-col items-center gap-1">
                <div className="p-2 bg-brand/50 rounded-lg">
                  <Truck className="h-10 w-10 text-primary" />
                </div>
                <span className="text-sm font-medium">Entrega</span>
              </div>
            )}
            {company.allowsPickup && (
              <div className="flex flex-col items-center gap-1 mb-4">
                <div className="p-2 bg-brand/50 rounded-lg">
                  <Store className="h-10 w-10 text-primary" />
                </div>
                <span className="text-sm font-medium">Retirada</span>
              </div>
            )}
          </div>
        </div>

        {/* Address */}
        <section className="space-y-4 mb-4 pt-4 border-t border-secondary-foreground/10">
          <div className="flex items-center gap-2 text-primary font-medium">
            <MapPin className="h-5 w-5" />
            <h3>Endereço</h3>
          </div>
          <div className="bg-secondary/20 px-4 rounded-xl">
            <p>
              {address.street}, {address.number} - {address.neighborhood},{" "}
              {address.city} - {address.state}
            </p>
            {address.complement && (
              <p className="text-sm text-muted-foreground mt-1">
                {address.complement}
              </p>
            )}

            <div className="w-full h-48 rounded-xl overflow-hidden border mt-3">
              <iframe
                width="100%"
                height="100%"
                src={mapUrl}
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="space-y-4 mb-4 pt-4 border-t border-secondary-foreground/10">
          <div className="flex items-center gap-2 text-primary font-medium">
            <Phone className="h-5 w-5" />
            <h3>Contatos</h3>
          </div>
          <div className="bg-secondary/20 px-4 rounded-xl space-y-3">
            {company.phone &&
              (company.phone as string[]).map((phone, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{formatPhone(phone)}</span>
                </div>
              ))}
          </div>
        </section>

        {/* Hours */}
        <section className="space-y-4 mb-4 pt-4 border-t border-secondary-foreground/10">
          <div className="flex items-center gap-2 text-primary font-medium">
            <Clock className="h-5 w-5" />
            <h3>Horários de Funcionamento</h3>
          </div>
          <div className="bg-secondary/20 px-4 rounded-xl space-y-2">
            {(company.businessHours as any[]).map((hour: any, idx: number) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="font-medium w-24">{hour.dayName}</span>
                {hour.isOpen ? (
                  <span>
                    {hour.openTime} às {hour.closeTime}
                  </span>
                ) : (
                  <span className="text-red-500">Fechado</span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Minimo Value */}
        <section className="space-y-4 mb-4 pt-4 border-t border-secondary-foreground/10">
          <div className="flex items-center gap-2 text-primary font-medium">
            <CircleDollarSign className="h-5 w-5" />
            <h3 className="mb-0">Mínimo</h3>
          </div>
          <div className="bg-secondary/20 px-4 rounded-xl">
            <p className="text-sm text-muted-foreground">
              O valor mínimo desta loja é {formatCurrency(company.minimumOrder)}
            </p>
          </div>
        </section>

        {/* Payment Methods */}
        <section className="space-y-4 pt-4 border-t border-secondary-foreground/10">
          <div className="flex items-center gap-2 text-primary font-medium">
            <CreditCard className="h-5 w-5" />
            <h3>Formas de Pagamento</h3>
          </div>
          <div className="bg-secondary/20 px-4 rounded-xl flex flex-wrap gap-2">
            {company.paymentMethods.map((method) => (
              <span
                key={method}
                className="px-3 py-1 bg-background rounded-full text-sm border"
              >
                {paymentMethodLabels[method] || method}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
