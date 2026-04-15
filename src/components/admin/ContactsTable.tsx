"use client";

import { useRouter } from "next/navigation";
import { DataTable, type ColumnDef } from "@/components/ui/DataTable";
import { WhatsappContact } from "@/components/ui/WhatsappContact";
import type { Contact } from "@/lib/types/Contact";

/** Props for ContactsTable. */
export interface ContactsTableProps {
  /** Contact list passed from the server component. */
  contacts: Contact[];
}

/** Formats an ISO 8601 string to a short Spanish date. */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-VE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Admin contacts table.
 *
 * Navigates to the contact detail page on row click.
 * On small screens only name and total bookings are shown.
 */
export function ContactsTable({ contacts }: ContactsTableProps) {
  const router = useRouter();

  const columns: ColumnDef<Contact>[] = [
    {
      key: "name",
      header: "Nombre",
      span: 2,
      render: (c) => (
        <span className="font-medium text-text-primary">
          {c.name}
          {c.company && (
            <span className="ml-2 text-xs text-text-muted">{c.company}</span>
          )}
        </span>
      ),
    },
    {
      key: "email",
      header: "Email",
      span: 2,
      render: (c) => (
        <a
          href={`mailto:${c.email}`}
          className="break-all text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {c.email}
        </a>
      ),
    },
    {
      key: "phone",
      header: "Teléfono",
      render: (c) => <WhatsappContact phone={c.phone} />,
    },
    {
      key: "totalBookings",
      header: "Reservas",
      render: (c) => (
        <span className="font-semibold text-text-primary">{c.totalBookings}</span>
      ),
    },
    {
      key: "lastBookingAt",
      header: "Última reserva",
      render: (c) => (c.lastBookingAt ? formatDate(c.lastBookingAt) : "—"),
    },
    {
      key: "createdAt",
      header: "Registrado",
      render: (c) => formatDate(c.createdAt),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={contacts}
      getRowKey={(c) => c.email}
      onRowClick={(c) =>
        router.push(`/dashboard/contacts/${encodeURIComponent(c.email)}`)
      }
      emptyMessage="No hay contactos registrados. Se crean automáticamente al recibir una reserva."
    />
  );
}
