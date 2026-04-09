import { SlotManager } from "@/components/admin/SlotManager";

/**
 * Admin calendar page — /dashboard/calendar.
 *
 * Renders the SlotManager client component which handles slot creation,
 * listing, and deletion for a selected date.
 */
export default function CalendarPage() {
  return (
    <div>
      <h1 className="mb-8 font-heading text-3xl font-bold text-text-primary">Calendario</h1>
      <SlotManager />
    </div>
  );
}
