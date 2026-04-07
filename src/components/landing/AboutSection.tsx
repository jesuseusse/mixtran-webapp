import Image from "next/image";

/** Props accepted by AboutSection. Matches the Phase 4 DynamoDB content shape. */
export interface AboutSectionProps {
  /** Section heading. */
  heading: string;
  /** Brand story or about copy. Supports multiple paragraphs separated by `\n\n`. */
  body: string;
  /** Absolute URL to the brand/studio photo. */
  photoUrl: string;
  /** Accessible alt text for the photo. */
  photoAlt: string;
}

/**
 * About / brand story section with a two-column layout on larger screens:
 * body copy on the left, brand photo on the right.
 *
 * Content is passed as props so Phase 4 can feed it from DynamoDB with
 * zero refactor to this component.
 */
export function AboutSection({
  heading,
  body,
  photoUrl,
  photoAlt,
}: AboutSectionProps) {
  /** Split body on double newline to support multi-paragraph content. */
  const paragraphs = body.split("\n\n").filter(Boolean);

  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="bg-background py-[var(--section-padding-y)] px-[var(--section-padding-x)]"
    >
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
        {/* Text column */}
        <div>
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
        </div>

        {/* Photo column */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl shadow-card">
          <Image
            src={photoUrl}
            alt={photoAlt}
            fill
            className="object-cover object-center"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
      </div>
    </section>
  );
}
