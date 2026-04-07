import Image from "next/image";

/** Props accepted by HeroSection. Matches the Phase 4 DynamoDB content shape. */
export interface HeroSectionProps {
  /** Primary headline displayed in the hero. */
  headline: string;
  /** Supporting subtitle rendered below the headline. */
  subtitle: string;
  /** Label text on the call-to-action button. */
  ctaText: string;
  /** Destination href for the CTA button. */
  ctaHref: string;
  /**
   * Absolute URL to the full-bleed background image.
   * Pass an empty string while the image is pending — the section
   * falls back to the primary brand color background.
   */
  backgroundImageUrl: string;
}

/**
 * Full-viewport hero section with an optional background image overlay,
 * headline, subtitle, and a primary CTA button.
 *
 * When `backgroundImageUrl` is empty the section renders with the primary
 * brand color as background so the page looks correct before images are ready.
 *
 * Content is passed as props so Phase 4 can feed it from DynamoDB with
 * zero refactor to this component.
 */
export function HeroSection({
  headline,
  subtitle,
  ctaText,
  ctaHref,
  backgroundImageUrl,
}: HeroSectionProps) {
  const hasImage = backgroundImageUrl.length > 0;

  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-primary"
    >
      {/* Background image — only rendered when a URL is provided */}
      {hasImage && (
        <Image
          src={backgroundImageUrl}
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
      )}

      {/* Dark overlay — always present to keep text legible */}
      <div aria-hidden="true" className="absolute inset-0 bg-primary/70" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <h1
          id="hero-heading"
          className="mb-6 font-heading text-4xl font-bold text-on-primary sm:text-5xl lg:text-6xl"
        >
          {headline}
        </h1>
        <p className="mb-10 text-lg text-on-primary/80 sm:text-xl">
          {subtitle}
        </p>
        <a
          href={ctaHref}
          className="inline-flex items-center justify-center h-12 px-7 rounded-lg bg-accent text-on-accent text-base font-semibold shadow-button transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          {ctaText}
        </a>
      </div>
    </section>
  );
}
