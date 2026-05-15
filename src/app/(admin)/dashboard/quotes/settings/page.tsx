import * as quoteConfigService from "@/lib/services/quoteConfigService";
import * as quoteCatalogService from "@/lib/services/quoteCatalogService";
import { QuoteConfigForm } from "@/components/admin/quotes/QuoteConfigForm";
import { QuoteCatalogManager } from "@/components/admin/quotes/QuoteCatalogManager";

export const metadata = { title: "Configuración de cotizaciones — Administración" };

/** /dashboard/quotes/settings — Configuración e catálogo de cotizaciones. */
export default async function QuoteSettingsPage() {
  const [config, catalog] = await Promise.all([
    quoteConfigService.getConfig(),
    quoteCatalogService.getAllItems(),
  ]);

  return (
    <div className="max-w-2xl mx-auto space-y-12">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Configuración de cotizaciones</h1>
        <p className="text-sm text-text-muted">
          Datos de tu negocio que aparecerán en cada cotización y PDF.
        </p>
      </div>

      <QuoteConfigForm initialConfig={config} />

      <hr className="border-border" />

      <QuoteCatalogManager initialItems={catalog} />
    </div>
  );
}
