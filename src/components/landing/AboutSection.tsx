import Image from "next/image";
import { AnimateInView } from "@/components/ui/AnimateInView";

/** Props accepted by AboutSection. Matches the Phase 4 DynamoDB content shape. */
export interface AboutSectionProps {
  /** Section heading. */
  heading: string;
  /** Brand story or about copy. Supports multiple paragraphs separated by `\n\n`. */
  body: string;
  /**
   * Absolute URL to the brand/studio photo.
   * Pass an empty string while the image is pending — the photo column is hidden.
   */
  photoUrl: string;
  /** Accessible alt text for the photo. */
  photoAlt: string;
}

/**
 * About / brand story section.
 *
 * Renders a two-column layout (copy + photo) on large screens when a photo URL
 * is provided. When `photoUrl` is empty the section switches to a single
 * centered column so the page looks correct before images are ready.
 *
 * Text column slides in from the left; photo slides in from the right on scroll.
 * Content is passed as props so Phase 4 can feed it from DynamoDB with
 * zero refactor to this component.
 */
export function AboutSection({
  heading,
  body,
  photoUrl,
  photoAlt,
}: AboutSectionProps) {
  const paragraphs = body.split("\n\n").filter(Boolean);
  const hasPhoto = photoUrl.length > 0;

  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="bg-background py-[var(--section-padding-y)] px-[var(--section-padding-x)]"
    >
      <div
        className={[
          "mx-auto max-w-6xl",
          hasPhoto
            ? "grid gap-12 lg:grid-cols-2 lg:items-center"
            : "max-w-3xl",
        ].join(" ")}
      >
        {/* Text column — slides in from left */}
        <AnimateInView variant="left">
          <h2
            id="about-heading"
            className="mb-6 font-heading text-3xl font-bold text-text-primary sm:text-4xl"
          >
            {heading}
          </h2>
          <div className="space-y-4">
            {paragraphs.map((p, i) => (
              <p key={i} className="text-base leading-relaxed text-text-secondary">
                {p}
              </p>
            ))}
          </div>
        </AnimateInView>

        {/* Photo column — slides in from right */}
        {hasPhoto && (
          <AnimateInView variant="right" delay={150}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl shadow-card">
              <Image
                src={photoUrl}
                alt={photoAlt}
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 50vw"
                loading="eager"
              />
            </div>
          </AnimateInView>
        )}
      </div>
    </section>
  );
}
