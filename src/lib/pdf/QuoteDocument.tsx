import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import type { Quote } from "@/lib/types/Quote";
import type { QuoteConfig } from "@/lib/types/QuoteConfig";

// ---------------------------------------------------------------------------
// Styles — no Tailwind, no CSS variables
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#1a1a2e",
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
  },
  /* Header */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  logo: { width: 80, height: 80, objectFit: "contain" },
  businessBlock: { flex: 1, paddingLeft: 16 },
  businessName: { fontSize: 13, fontFamily: "Helvetica-Bold", marginBottom: 3 },
  businessSub: { fontSize: 8, color: "#555", marginBottom: 1 },
  quoteBlock: { alignItems: "flex-end", minWidth: 160 },
  quoteTitle: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#1d3557", marginBottom: 4 },
  quoteMeta: { fontSize: 8, color: "#555", marginBottom: 2 },
  /* Section title */
  sectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#1d3557",
    borderBottomWidth: 1,
    borderBottomColor: "#1d3557",
    paddingBottom: 2,
    marginBottom: 6,
    marginTop: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  /* Client info */
  clientRow: { flexDirection: "row", marginBottom: 3 },
  clientLabel: { width: 110, fontSize: 8, color: "#777" },
  clientValue: { flex: 1, fontSize: 8 },
  /* Items table */
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1d3557",
    color: "#fff",
    paddingVertical: 4,
    paddingHorizontal: 4,
    marginTop: 4,
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
    fontSize: 8,
  },
  tableRowAlt: { backgroundColor: "#f5f7fa" },
  colProduct: { flex: 3 },
  colQty: { width: 32, textAlign: "right" },
  colUnit: { width: 36, textAlign: "center" },
  colPrice: { width: 55, textAlign: "right" },
  colDiscount: { width: 36, textAlign: "right" },
  colTotal: { width: 60, textAlign: "right" },
  /* Totals */
  totalsContainer: { alignItems: "flex-end", marginTop: 8 },
  totalRow: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 2 },
  totalLabel: { width: 110, fontSize: 8, color: "#555", textAlign: "right" },
  totalValue: { width: 70, fontSize: 8, textAlign: "right" },
  grandTotalLabel: { width: 110, fontSize: 10, fontFamily: "Helvetica-Bold", textAlign: "right" },
  grandTotalValue: { width: 70, fontSize: 10, fontFamily: "Helvetica-Bold", textAlign: "right", color: "#1d3557" },
  /* Notes */
  noteText: { fontSize: 8, color: "#444", lineHeight: 1.4 },
  /* Footer */
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 7,
    color: "#aaa",
    borderTopWidth: 0.5,
    borderTopColor: "#ddd",
    paddingTop: 6,
  },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fmt(n: number, symbol: string): string {
  return `${symbol}${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });
}

// ---------------------------------------------------------------------------
// Document component
// ---------------------------------------------------------------------------

interface QuoteDocumentProps {
  quote: Quote;
  config: QuoteConfig;
}

/** Pure @react-pdf/renderer component. No Tailwind, no CSS variables. */
export function QuoteDocument({ quote, config }: QuoteDocumentProps) {
  const sym = quote.currency.symbol;

  return (
    <Document
      title={`Cotización ${quote.quoteNumber}`}
      author={config.businessName}
      language="es"
    >
      <Page size="A4" style={styles.page}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={{ flexDirection: "row", flex: 1 }}>
            {config.logoUrl ? (
              <Image src={config.logoUrl} style={styles.logo} />
            ) : null}
            <View style={styles.businessBlock}>
              <Text style={styles.businessName}>{config.businessName}</Text>
              {config.taxId ? (
                <Text style={styles.businessSub}>
                  {config.taxIdLabel}: {config.taxId}
                </Text>
              ) : null}
              {config.address ? (
                <Text style={styles.businessSub}>{config.address}</Text>
              ) : null}
              {config.phone ? (
                <Text style={styles.businessSub}>Tel: {config.phone}</Text>
              ) : null}
              {config.email ? (
                <Text style={styles.businessSub}>{config.email}</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.quoteBlock}>
            <Text style={styles.quoteTitle}>COTIZACIÓN</Text>
            <Text style={[styles.quoteMeta, { fontFamily: "Helvetica-Bold" }]}>
              {quote.quoteNumber}
            </Text>
            <Text style={styles.quoteMeta}>
              Fecha: {fmtDate(quote.createdAt)}
            </Text>
            <Text style={styles.quoteMeta}>
              Vigencia: {fmtDate(quote.validUntil)}
            </Text>
            <Text style={[styles.quoteMeta, { marginTop: 4 }]}>
              Moneda: {quote.currency.label} ({quote.currency.code})
            </Text>
          </View>
        </View>

        {/* ── Client data ── */}
        <Text style={styles.sectionTitle}>Datos del cliente</Text>
        <View style={styles.clientRow}>
          <Text style={styles.clientLabel}>Nombre:</Text>
          <Text style={styles.clientValue}>{quote.clientName}</Text>
        </View>
        {quote.clientCompany ? (
          <View style={styles.clientRow}>
            <Text style={styles.clientLabel}>Empresa:</Text>
            <Text style={styles.clientValue}>{quote.clientCompany}</Text>
          </View>
        ) : null}
        {quote.clientTaxId ? (
          <View style={styles.clientRow}>
            <Text style={styles.clientLabel}>Registro Fiscal:</Text>
            <Text style={styles.clientValue}>{quote.clientTaxId}</Text>
          </View>
        ) : null}
        {quote.clientPhone ? (
          <View style={styles.clientRow}>
            <Text style={styles.clientLabel}>Teléfono:</Text>
            <Text style={styles.clientValue}>{quote.clientPhone}</Text>
          </View>
        ) : null}
        {quote.clientEmail ? (
          <View style={styles.clientRow}>
            <Text style={styles.clientLabel}>Email:</Text>
            <Text style={styles.clientValue}>{quote.clientEmail}</Text>
          </View>
        ) : null}
        {quote.clientAddress ? (
          <View style={styles.clientRow}>
            <Text style={styles.clientLabel}>Dirección:</Text>
            <Text style={styles.clientValue}>{quote.clientAddress}</Text>
          </View>
        ) : null}

        {/* ── Items table ── */}
        <Text style={styles.sectionTitle}>Detalle</Text>
        <View style={styles.tableHeader}>
          <Text style={styles.colProduct}>Producto / Servicio</Text>
          <Text style={styles.colQty}>Cant.</Text>
          <Text style={styles.colUnit}>Unidad</Text>
          <Text style={styles.colPrice}>Precio</Text>
          <Text style={styles.colDiscount}>Dto.%</Text>
          <Text style={styles.colTotal}>Total</Text>
        </View>
        {quote.items.map((item, idx) => (
          <View
            key={item.lineId}
            style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}
          >
            <View style={styles.colProduct}>
              <Text>{item.name}</Text>
              {item.description ? (
                <Text style={{ fontSize: 7, color: "#888" }}>{item.description}</Text>
              ) : null}
            </View>
            <Text style={styles.colQty}>{item.quantity}</Text>
            <Text style={styles.colUnit}>{item.unit}</Text>
            <Text style={styles.colPrice}>{fmt(item.unitPrice, sym)}</Text>
            <Text style={styles.colDiscount}>
              {item.discountPercent > 0 ? `${item.discountPercent}%` : "—"}
            </Text>
            <Text style={styles.colTotal}>{fmt(item.lineTotal, sym)}</Text>
          </View>
        ))}

        {/* ── Totals ── */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{fmt(quote.subtotal, sym)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>IVA ({quote.ivaPercent}%):</Text>
            <Text style={styles.totalValue}>{fmt(quote.ivaAmount, sym)}</Text>
          </View>
          <View style={[styles.totalRow, { marginTop: 4 }]}>
            <Text style={styles.grandTotalLabel}>TOTAL:</Text>
            <Text style={styles.grandTotalValue}>{fmt(quote.total, sym)}</Text>
          </View>
        </View>

        {/* ── Notes ── */}
        {quote.notes ? (
          <>
            <Text style={styles.sectionTitle}>Notas</Text>
            <Text style={styles.noteText}>{quote.notes}</Text>
          </>
        ) : null}

        {/* ── Terms ── */}
        {config.termsText ? (
          <>
            <Text style={styles.sectionTitle}>Términos y condiciones</Text>
            <Text style={styles.noteText}>{config.termsText}</Text>
          </>
        ) : null}

        {/* ── Bank details ── */}
        {config.bankDetails ? (
          <>
            <Text style={styles.sectionTitle}>Datos de pago</Text>
            <Text style={styles.noteText}>{config.bankDetails}</Text>
          </>
        ) : null}

        {/* ── Footer ── */}
        <Text style={styles.footer} fixed>
          {config.businessName} · {quote.quoteNumber} · Este documento es una cotización, no una factura.
        </Text>
      </Page>
    </Document>
  );
}
