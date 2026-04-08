import Image from "next/image";
import { AnimateInView } from "@/components/ui/AnimateInView";

/** A single paint product line card. */
export interface ProductItem {
  /** Unique identifier for the product line. */
  id: string;
  /** Product line name (e.g. "MLQ"). */
  name: string;
  /** Short marketing description. */
  description: string;
  /**
   * Absolute URL to the product image.
   * Pass an empty string while the image is pending — the image slot is hidden.
   */
  imageUrl: string;
}

/** Props accepted by ProductsSection. Matches the Phase 4 DynamoDB content shape. */
export interface ProductsSectionProps {
  /** Section heading. */
  heading: string;
  /** Supporting subtitle for the section. */
  subtitle?: string;
  /** Array of product lines to display in the grid. */
  products: ProductItem[];
}

/**
 * Products section — renders a responsive grid of paint product line cards.
 *
 * Section header fades up on scroll. Cards stagger in with increasing
 * delays (150 ms per card) for a cascading reveal effect.
 *
 * Content is passed as props so Phase 4 can feed it from DynamoDB with
 * zero refactor to this component.
 */
export function ProductsSection({
  heading,
  subtitle,
  products,
}: ProductsSectionProps) {
  return (
    <section
      id="products"
      aria-labelledby="products-heading"
      className="bg-surface py-[var(--section-padding-y)] px-[var(--section-padding-x)]"
    >
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <AnimateInView className="mb-12 text-center">
          <h2
            id="products-heading"
            className="mb-4 font-heading text-3xl font-bold text-text-primary sm:text-4xl"
          >
            {heading}
          </h2>
          {subtitle && (
            <p className="mx-auto max-w-2xl text-base text-text-secondary">
              {subtitle}
            </p>
          )}
        </AnimateInView>

        {/* Grid — each card staggers in */}
        <ul role="list" className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product, index) => (
            <AnimateInView key={product.id} delay={index * 150} className="h-full">
              <li className="h-full overflow-hidden rounded-lg border border-border bg-surface shadow-card transition-shadow hover:shadow-modal">
                {/* Product image — only rendered when a URL is provided */}
                {product.imageUrl.length > 0 && (
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                )}
                {/* Product info */}
                <div className="p-5">
                  <h3 className="mb-2 font-heading text-lg font-semibold text-text-primary">
                    {product.name}
                  </h3>
                  <p className="text-sm leading-relaxed text-text-secondary">
                    {product.description}
                  </p>
                </div>
              </li>
            </AnimateInView>
          ))}
        </ul>
      </div>
    </section>
  );
}
