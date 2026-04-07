import Image from "next/image";

/** A single paint product line card. */
export interface ProductItem {
  /** Unique identifier for the product line. */
  id: string;
  /** Product line name (e.g. "Premium Interior"). */
  name: string;
  /** Short marketing description. */
  description: string;
  /** Absolute URL to the product image. */
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
 * Each card shows the product image, name, and description.
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
        <div className="mb-12 text-center">
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
        </div>

        {/* Grid */}
        <ul
          role="list"
          className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
        >
          {products.map((product) => (
            <li
              key={product.id}
              className="overflow-hidden rounded-lg border border-border bg-surface shadow-card transition-shadow hover:shadow-modal"
            >
              {/* Product image */}
              <div className="relative aspect-[4/3]">
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>

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
          ))}
        </ul>
      </div>
    </section>
  );
}
