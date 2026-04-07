import Image from "next/image";

/** A single gallery photo item. */
export interface GalleryItem {
  /** Unique identifier for the photo. */
  id: string;
  /** Absolute URL to the photo (served via CloudFront). */
  url: string;
  /** Accessible alt text describing the project. */
  alt: string;
}

/** Props accepted by GallerySection. Matches the Phase 4 DynamoDB content shape. */
export interface GallerySectionProps {
  /** Section heading. */
  heading: string;
  /** Supporting subtitle for the section. */
  subtitle?: string;
  /** Ordered array of gallery photos. */
  items: GalleryItem[];
}

/**
 * Gallery section — displays project photos in a responsive masonry-style grid.
 *
 * Photos are served via CloudFront (presigned S3 URLs in dev, public CDN in prod).
 * Content is passed as props so Phase 4 can feed it from DynamoDB with
 * zero refactor to this component.
 */
export function GallerySection({
  heading,
  subtitle,
  items,
}: GallerySectionProps) {
  if (items.length === 0) return null;

  return (
    <section
      id="gallery"
      aria-labelledby="gallery-heading"
      className="bg-background py-[var(--section-padding-y)] px-[var(--section-padding-x)]"
    >
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2
            id="gallery-heading"
            className="mb-4 font-heading text-3xl font-bold text-text-primary sm:text-4xl"
          >
            {heading}
          </h2>
          {subtitle && (
            <p className="mx-auto max-w-2xl text-base text-text-secondary">
              {subtitle}
            </p>
          )}
        </div>

        {/*
          Masonry-style grid using CSS columns.
          Tailwind does not ship a masonry grid utility natively in v4 yet,
          so we use columns-* with break-inside-avoid.
        */}
        <ul
          role="list"
          className="columns-1 gap-4 sm:columns-2 lg:columns-3"
        >
          {items.map((item) => (
            <li key={item.id} className="mb-4 break-inside-avoid overflow-hidden rounded-lg shadow-card">
              <div className="relative w-full">
                <Image
                  src={item.url}
                  alt={item.alt}
                  width={600}
                  height={400}
                  className="w-full object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
