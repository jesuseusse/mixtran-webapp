/** Props accepted by BookingCtaSection. Matches the Phase 4 DynamoDB content shape. */
export interface BookingCtaSectionProps {
  /** Persuasive heading. */
  heading: string;
  /** Supporting copy that reinforces the value proposition. */
  body: string;
  /** CTA button label. */
  ctaText: string;
  /** Destination href — typically the public booking page `/agendar`. */
  ctaHref: string;
}

/**
 * Full-width call-to-action section that drives users to the booking page.
 *
 * Uses a contrasting primary background to stand out from surrounding sections.
 * Content is passed as props so Phase 4 can feed it from DynamoDB with
 * zero refactor to this component.
 */
export function BookingCtaSection({
  heading,
  body,
  ctaText,
  ctaHref,
}: BookingCtaSectionProps) {
  return (
    <section
      id="booking_cta"
      aria-labelledby="booking-cta-heading"
      className="bg-primary py-[var(--section-padding-y)] px-[var(--section-padding-x)]"
    >
      <div className="mx-auto max-w-3xl text-center">
        <h2
          id="booking-cta-heading"
          className="mb-6 font-heading text-3xl font-bold text-on-primary sm:text-4xl"
        >
          {heading}
        </h2>
        <p className="mb-10 text-base leading-relaxed text-on-primary/80 sm:text-lg">
          {body}
        </p>
        <a
          href={ctaHref}
          className="inline-flex items-center justify-center h-12 px-8 rounded-lg bg-accent text-on-accent text-base font-semibold shadow-button transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
        >
          {ctaText}
        </a>
      </div>
    </section>
  );
}
