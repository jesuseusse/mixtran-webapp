import { QuoteWizard } from "@/components/admin/quotes/QuoteWizard";
import * as quoteConfigService from "@/lib/services/quoteConfigService";
import * as quoteCatalogService from "@/lib/services/quoteCatalogService";

export const metadata = { title: "Nueva cotización — Administración" };

/** /dashboard/quotes/new — Wizard de creación de cotizaciones. */
export default async function NewQuotePage() {
  const [config, catalog] = await Promise.all([
    quoteConfigService.getConfig(),
    quoteCatalogService.getAllItems(),
  ]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Nueva cotización</h1>
        <p className="text-sm text-text-muted">Completa los pasos para crear una cotización.</p>
      </div>
      <QuoteWizard config={config} catalog={catalog} />
    </div>
  );
}
