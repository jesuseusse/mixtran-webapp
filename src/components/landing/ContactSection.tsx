"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { Textarea } from "@/components/ui/Textarea";
import { Snackbar } from "@/components/ui/Snackbar";
import { Spinner } from "@/components/ui/Spinner";
import { AnimateInView } from "@/components/ui/AnimateInView";

/** Contact details shown alongside the form. */
export interface ContactInfo {
  /** Company display name shown above the contact details. */
  company: string;
  /** Primary phone number. Also used as `href="tel:..."`. */
  phone: string;
  /** Optional secondary phone number. */
  phone2?: string;
  /** Business email address. */
  email?: string;
  /** Full street address. */
  address: string;
  /** Tax identification number (RIF) for Venezuelan businesses. */
  rif?: string;
}

/** Props accepted by ContactSection. Matches the Phase 4 DynamoDB content shape. */
export interface ContactSectionProps {
  /** Section heading. */
  heading: string;
  /** Supporting copy. */
  subtitle?: string;
  /** Static contact details displayed alongside the form. */
  contactInfo: ContactInfo;
}

/**
 * Contact section with a two-column layout: contact details left, form right.
 *
 * The form is client-side only in Phase 1 (no backend submission yet).
 * In Phase 2+ it will POST to `/api/contacts`. The props signature is
 * already complete so no refactor will be needed.
 *
 * Content is passed as props so Phase 4 can feed it from DynamoDB with
 * zero refactor to this component.
 */
export function ContactSection({
  heading,
  subtitle,
  contactInfo,
}: ContactSectionProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+58");
  const [message, setMessage] = useState("");
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarType, setSnackbarType] = useState<"success" | "error">("success");
  const [snackbarMessage, setSnackbarMessage] = useState("¡Mensaje enviado! Te responderemos a la brevedad.");
  const [submitting, setSubmitting] = useState(false);

  /** Submits the contact form and upserts the contact record via the API. */
  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      /* Upsert the contact record with the provided data. */
      await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, message }),
      });
      setSnackbarMessage("¡Mensaje enviado! Te responderemos a la brevedad.");
      setSnackbarType("success");
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch {
      setSnackbarMessage("Error al enviar. Intenta de nuevo.");
      setSnackbarType("error");
    } finally {
      setSubmitting(false);
      setSnackbarVisible(true);
    }
  }

  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="bg-background py-[var(--section-padding-y)] px-[var(--section-padding-x)]"
    >
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-start">
        {/* Contact details — slides in from left */}
        <AnimateInView variant="left">
          <h2
            id="contact-heading"
            className="mb-4 font-heading text-3xl font-bold text-text-primary sm:text-4xl"
          >
            {heading}
          </h2>
          {subtitle && (
            <p className="mb-6 text-base leading-relaxed text-text-secondary">
              {subtitle}
            </p>
          )}

          {/* Company name */}
          <p className="mb-6 font-semibold text-text-primary">
            {contactInfo.company}
          </p>

          <ul className="space-y-4 text-text-secondary">
            {/* Primary phone */}
            <li className="flex items-start gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mt-0.5 shrink-0 text-accent"
                aria-hidden="true"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.05 3.4 2 2 0 0 1 3 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16l.92.92z" />
              </svg>
              <div className="flex flex-col gap-1">
                <a
                  href={`tel:${contactInfo.phone.replace(/\D/g, "")}`}
                  className="hover:text-accent transition-colors"
                >
                  {contactInfo.phone}
                </a>
                {/* Secondary phone — only rendered when provided */}
                {contactInfo.phone2 && (
                  <a
                    href={`tel:${contactInfo.phone2.replace(/\D/g, "")}`}
                    className="hover:text-accent transition-colors"
                  >
                    {contactInfo.phone2}
                  </a>
                )}
              </div>
            </li>

            {/* Email — only rendered when provided */}
            {contactInfo.email && (
              <li className="flex items-start gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mt-0.5 shrink-0 text-accent"
                  aria-hidden="true"
                >
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <a
                  href={`mailto:${contactInfo.email}`}
                  className="hover:text-accent transition-colors"
                >
                  {contactInfo.email}
                </a>
              </li>
            )}

            {/* Address */}
            <li className="flex items-start gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mt-0.5 shrink-0 text-accent"
                aria-hidden="true"
              >
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{contactInfo.address}</span>
            </li>

            {/* RIF — only rendered when provided */}
            {contactInfo.rif && (
              <li className="flex items-start gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mt-0.5 shrink-0 text-accent"
                  aria-hidden="true"
                >
                  <rect width="18" height="14" x="3" y="5" rx="2" />
                  <path d="M3 10h18" />
                  <path d="M7 15h.01M11 15h2" />
                </svg>
                <span>
                  <span className="font-medium text-text-primary">RIF:</span>{" "}
                  {contactInfo.rif}
                </span>
              </li>
            )}
          </ul>
        </AnimateInView>

        {/* Contact form — slides in from right */}
        <AnimateInView variant="right" delay={150}>
        <form
          onSubmit={handleSubmit}
          noValidate
          className="rounded-lg border border-border bg-surface p-6 shadow-card space-y-5"
        >
          <Input
            label="Nombre"
            type="text"
            required
            autoComplete="name"
            placeholder="Tu nombre completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            required
            autoComplete="email"
            placeholder="tu@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <PhoneInput
            label="Teléfono"
            required
            value={phone}
            onChange={setPhone}
          />
          <Textarea
            label="Mensaje"
            required
            rows={5}
            placeholder="¿En qué podemos ayudarte?"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-md bg-primary text-on-primary text-sm font-semibold shadow-button transition-colors hover:bg-primary-dark disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {submitting && <Spinner size="sm" />}
            {submitting ? "Enviando…" : "Enviar mensaje"}
          </button>
        </form>
        </AnimateInView>
      </div>

      <Snackbar
        visible={snackbarVisible}
        message={snackbarMessage}
        type={snackbarType}
        onDismiss={() => setSnackbarVisible(false)}
      />
    </section>
  );
}
