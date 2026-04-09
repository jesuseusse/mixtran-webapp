import * as bookingService from "@/lib/services/bookingService";
import { BookingTable } from "@/components/admin/BookingTable";

/**
 * Admin bookings page — /dashboard/calendar/bookings.
 *
 * Loads all booked slots (pending + confirmed + cancelled) for the current week
 * and passes them to the BookingTable client component for status management.
 * Server Component — data is fetched at request time.
 */
export default async function BookingsPage() {
  /* Fetch the last 30 days + next 30 days as a reasonable window. */
  const dates = getDateRange(30, 30);
  const slotArrays = await Promise.all(
    dates.map((d) => bookingService.getAllSlots(d).catch(() => [] as import("@/lib/types/Slot").CalendarSlot[]))
  );
  const allSlots = slotArrays.flat();

  /* Only show booked slots (status !== null && !isAvailable). */
  const bookings = allSlots
    .filter((s) => !s.isAvailable && s.status !== null)
    .sort((a, b) => {
      /* Sort by date desc, then startTime asc. */
      const dateCmp = b.date.localeCompare(a.date);
      return dateCmp !== 0 ? dateCmp : a.startTime.localeCompare(b.startTime);
    });

  return (
    <div>
      <h1 className="mb-8 font-heading text-3xl font-bold text-text-primary">Reservas</h1>
      <BookingTable bookings={bookings} />
    </div>
  );
}

/**
 * Returns an array of YYYY-MM-DD strings spanning [pastDays] days ago through
 * [futureDays] days from today.
 */
function getDateRange(pastDays: number, futureDays: number): string[] {
  const dates: string[] = [];
  const today = new Date();

  for (let i = -pastDays; i <= futureDays; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${day}`);
  }

  return dates;
}
