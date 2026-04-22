import { sendEmail } from "@/lib/aws/ses";
import type { CreateBookingInput } from "@/lib/types/Booking";
import type { CalendarSlot } from "@/lib/types/Slot";
import type { UpsertContactInput } from "@/lib/types/Contact";

/**
 * Formats a date string (YYYY-MM-DD) and time (HH:MM) into a human-readable
 * Spanish locale string, e.g. "lunes, 14 de abril de 2025 — 10:00 AM".
 */
function formatDateTime(date: string, startTime: string): string {
  const iso = `${date}T${startTime}:00`;
  const d = new Date(iso);
  return d.toLocaleDateString("es-VE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }) + ` — ${startTime}`;
}

/**
 * Sends an admin notification when a new contact submits the landing page form.
 * Called from contactService.upsertFromLanding().
 */
export async function sendContactNotification(input: UpsertContactInput): Promise<void> {
  const label = "[emailService.sendContactNotification]";
  const adminEmail = process.env.NEXT_SES_ADMIN_EMAIL;

  if (!adminEmail) {
    console.warn(`${label} NEXT_SES_ADMIN_EMAIL not set — skipping`);
    return;
  }

  console.info(`${label} to=${adminEmail} from=${input.email}`);

  try {
    await sendEmail({
      to: adminEmail,
      subject: `Nuevo contacto — ${input.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1A2A4A;">
          <h1 style="color: #2E4A7F; border-bottom: 3px solid #C9A34E; padding-bottom: 12px;">
            MIXTRAN — Nuevo contacto
          </h1>
          <p>Se ha recibido un nuevo mensaje desde el formulario de contacto.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr>
              <td style="padding: 8px; background: #F2F2F2; font-weight: bold; width: 40%;">Nombre</td>
              <td style="padding: 8px;">${input.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px; background: #F2F2F2; font-weight: bold;">Email</td>
              <td style="padding: 8px;">${input.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px; background: #F2F2F2; font-weight: bold;">Teléfono</td>
              <td style="padding: 8px;">${input.phone}</td>
            </tr>
            ${input.message ? `<tr>
              <td style="padding: 8px; background: #F2F2F2; font-weight: bold;">Mensaje</td>
              <td style="padding: 8px;">${input.message}</td>
            </tr>` : ""}
          </table>
          <p>Accede al panel de administración para ver el contacto.</p>
        </div>
      `,
    });
    console.info(`${label} sent ok to=${adminEmail}`);
  } catch (err) {
    console.error(`${label} FAILED to=${adminEmail}`, err);
    throw err;
  }
}

/**
 * Sends the booking confirmation email to the client.
 * Called after a slot is successfully booked.
 */
export async function sendBookingConfirmation(
  input: CreateBookingInput,
  slot: CalendarSlot
): Promise<void> {
  const label = "[emailService.sendBookingConfirmation]";
  console.info(`${label} to=${input.email} slot=${slot.slotId} date=${slot.date} time=${slot.startTime}`);

  const when = formatDateTime(slot.date, slot.startTime);
  try {
    await sendEmail({
      to: input.email,
      subject: "Confirmación de cita — MIXTRAN Revestimientos",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1A2A4A;">
          <h1 style="color: #2E4A7F; border-bottom: 3px solid #C9A34E; padding-bottom: 12px;">
            MIXTRAN Revestimientos
          </h1>
          <h2>¡Tu cita ha sido recibida!</h2>
          <p>Hola <strong>${input.name}</strong>,</p>
          <p>Hemos recibido tu solicitud de asesoría de color. A continuación los detalles:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr>
              <td style="padding: 8px; background: #F2F2F2; font-weight: bold; width: 40%;">Fecha y hora</td>
              <td style="padding: 8px;">${when}</td>
            </tr>
            <tr>
              <td style="padding: 8px; background: #F2F2F2; font-weight: bold;">Tu nombre</td>
              <td style="padding: 8px;">${input.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px; background: #F2F2F2; font-weight: bold;">Teléfono</td>
              <td style="padding: 8px;">${input.phone}</td>
            </tr>
            ${input.message ? `<tr>
              <td style="padding: 8px; background: #F2F2F2; font-weight: bold;">Mensaje</td>
              <td style="padding: 8px;">${input.message}</td>
            </tr>` : ""}
          </table>
          <p style="color: #4A5568;">
            Pronto recibirás una confirmación de nuestro equipo con el enlace para la reunión virtual.
          </p>
          <p style="color: #4A5568;">Si tienes alguna pregunta, contáctanos:</p>
          <ul style="color: #4A5568;">
            <li>📞 0412-4091061 / 0412-3859612</li>
            <li>✉️ mixtranrevestimientoplastico@gmail.com</li>
          </ul>
          <p>¡Gracias por confiar en MIXTRAN!</p>
        </div>
      `,
    });
    console.info(`${label} sent ok to=${input.email}`);
  } catch (err) {
    console.error(`${label} FAILED to=${input.email}`, err);
    throw err;
  }
}

/**
 * Sends a new booking notification email to the admin.
 * Called after a slot is successfully booked.
 */
export async function sendBookingNotification(
  input: CreateBookingInput,
  slot: CalendarSlot
): Promise<void> {
  const label = "[emailService.sendBookingNotification]";
  const adminEmail = process.env.NEXT_SES_ADMIN_EMAIL;

  if (!adminEmail) {
    console.warn(`${label} NEXT_SES_ADMIN_EMAIL not set — skipping admin notification`);
    return;
  }

  console.info(`${label} to=${adminEmail} from=${input.email} slot=${slot.slotId} date=${slot.date} time=${slot.startTime}`);

  const when = formatDateTime(slot.date, slot.startTime);
  try {
    await sendEmail({
      to: adminEmail,
      subject: `Nueva solicitud de cita — ${input.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1A2A4A;">
          <h1 style="color: #2E4A7F; border-bottom: 3px solid #C9A34E; padding-bottom: 12px;">
            MIXTRAN — Nueva cita
          </h1>
          <p>Se ha recibido una nueva solicitud de asesoría de color.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr>
              <td style="padding: 8px; background: #F2F2F2; font-weight: bold; width: 40%;">Fecha y hora</td>
              <td style="padding: 8px;">${when}</td>
            </tr>
            <tr>
              <td style="padding: 8px; background: #F2F2F2; font-weight: bold;">Cliente</td>
              <td style="padding: 8px;">${input.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px; background: #F2F2F2; font-weight: bold;">Email</td>
              <td style="padding: 8px;">${input.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px; background: #F2F2F2; font-weight: bold;">Teléfono</td>
              <td style="padding: 8px;">${input.phone}</td>
            </tr>
            ${input.message ? `<tr>
              <td style="padding: 8px; background: #F2F2F2; font-weight: bold;">Mensaje</td>
              <td style="padding: 8px;">${input.message}</td>
            </tr>` : ""}
          </table>
          <p>
            Accede al panel de administración para confirmar o cancelar la cita.
          </p>
        </div>
      `,
    });
    console.info(`${label} sent ok to=${adminEmail}`);
  } catch (err) {
    console.error(`${label} FAILED to=${adminEmail}`, err);
    throw err;
  }
}

/**
 * Sends a status update email to the client when admin confirms or cancels their booking.
 */
export async function sendStatusUpdate(
  slot: CalendarSlot,
  status: "confirmed" | "cancelled"
): Promise<void> {
  const label = "[emailService.sendStatusUpdate]";

  if (!slot.contactEmail || !slot.name) {
    console.warn(`${label} skipping — missing contactEmail or name on slot=${slot.slotId}`);
    return;
  }

  console.info(`${label} to=${slot.contactEmail} slot=${slot.slotId} status=${status}`);

  const when = formatDateTime(slot.date, slot.startTime);
  const isConfirmed = status === "confirmed";

  try {
    await sendEmail({
      to: slot.contactEmail,
      subject: isConfirmed
        ? "Tu cita ha sido confirmada — MIXTRAN"
        : "Tu cita ha sido cancelada — MIXTRAN",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1A2A4A;">
          <h1 style="color: #2E4A7F; border-bottom: 3px solid #C9A34E; padding-bottom: 12px;">
            MIXTRAN Revestimientos
          </h1>
          <h2>${isConfirmed ? "✅ Cita confirmada" : "❌ Cita cancelada"}</h2>
          <p>Hola <strong>${slot.name}</strong>,</p>
          ${isConfirmed
            ? `<p>Tu cita de asesoría de color ha sido <strong>confirmada</strong>.</p>
               <p><strong>Fecha y hora:</strong> ${when}</p>
               ${slot.meetLink ? `<p><strong>Enlace de reunión:</strong> <a href="${slot.meetLink}">${slot.meetLink}</a></p>` : ""}
               <p>¡Nos vemos pronto!</p>`
            : `<p>Lamentamos informarte que tu cita de asesoría de color del <strong>${when}</strong> ha sido cancelada.</p>
               <p>Por favor contáctanos para reagendar.</p>`
          }
          <ul style="color: #4A5568;">
            <li>📞 0412-4091061 / 0412-3859612</li>
            <li>✉️ mixtranrevestimientoplastico@gmail.com</li>
          </ul>
        </div>
      `,
    });
    console.info(`${label} sent ok to=${slot.contactEmail} status=${status}`);
  } catch (err) {
    console.error(`${label} FAILED to=${slot.contactEmail} status=${status}`, err);
    throw err;
  }
}
