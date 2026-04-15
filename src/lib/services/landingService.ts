import { revalidatePath } from "next/cache";
import * as landingRepository from "@/lib/repositories/landingRepository";
import type {
  LandingSection,
  ResolvedSection,
  SectionId,
  UpdateLandingSectionInput,
} from "@/lib/types/LandingSection";

/**
 * Hardcoded content defaults for every section.
 * Used when DynamoDB has no entry for a section yet (empty table on first deploy).
 * Phase 4 admin editor writes to DynamoDB; the landing page always has content.
 */
const DEFAULTS: Record<SectionId, Record<string, unknown>> = {
  hero: {
    headline: "MIXTRAN — Revestimientos que duran",
    subtitle: "Plásticos · Grafiados · Texturizados · Pinturas para interiores y exteriores",
    ctaText: "Agenda tu asesoría",
    ctaHref: "/agendar",
    backgroundImageUrl: "/images/hero-bg.png",
  },
  about: {
    heading: "¿Qué es MIXTRAN?",
    body: "MIXTRAN MLQ es un revestimiento plástico con partículas de cuarzo diseñado para proteger y embellecer cualquier superficie. Su fórmula avanzada lo hace resistente a todos los climas, con desempeño comprobado en zonas costeras de alta salinidad y en regiones montañosas.\n\nSe adhiere a una amplia variedad de sustratos: paredes en buen estado, yeso seco, ladrillos de cemento, madera, hierro, láminas metálicas, vidrio, aluminio, paneles de cualquier tipo y cartón piedra. Ideal tanto para interiores como para exteriores.\n\nAntes de aplicar MLQ, se recomienda usar nuestro Fijador para sellar la superficie, mejorar la adherencia y garantizar un acabado duradero y uniforme.",
    photoUrl: "/images/about-studio.png",
    photoAlt: "Aplicación de revestimiento MIXTRAN MLQ en pared exterior",
  },
  products: {
    heading: "Nuestros productos",
    subtitle: "Soluciones de revestimiento para cada superficie y clima.",
    products: [
      {
        id: "fijador",
        name: "Fijador",
        description:
          "Sellador de superficies que garantiza la máxima adherencia del MLQ. Se aplica antes del revestimiento con rodillo de peluche o esponja. Penetra en el sustrato para unificar la absorción y preparar la base.",
        imageUrl: "/images/product-interior.png",
      },
      {
        id: "mlq",
        name: "MLQ",
        description:
          "Revestimiento plástico con partículas de cuarzo. Resiste cualquier clima: zonas costeras con alta salinidad y áreas montañosas. Uso interior y exterior. Compatible con paredes, yeso, cemento, madera, hierro, vidrio, aluminio y paneles de todo tipo.",
        imageUrl: "/images/product-exterior.png",
      },
    ],
  },
  gallery: {
    heading: "Proyectos recientes",
    subtitle: "Una selección de espacios transformados con MIXTRAN.",
    items: [],
  },
  reviews: {
    heading: "Lo que dicen nuestros clientes",
    subtitle: "Opiniones reales de clientes que confiaron en MIXTRAN.",
  },
  booking_cta: {
    heading: "¿Necesitas asesoría profesional?",
    body: "Agenda una cita con nuestro experto en revestimientos y obtén la solución ideal para tu proyecto.",
    ctaText: "Agendar cita gratis",
    ctaHref: "/agendar",
  },
  contact: {
    heading: "Contáctanos",
    subtitle: "Estamos disponibles para atender tu consulta y orientarte en tu proyecto.",
    contactInfo: {
      company: "MIXTRAN — Emprendimiento Carlos Álvarez 71",
      phone: "0412-4091061",
      phone2: "0412-3859612",
      email: "mixtranrevestimientoplastico@gmail.com",
      address: "CALLE 10-08 CASA NRO 14-A URB CIUDAD JARDIN CAGUA ARAGUA ZONA POSTAL 2122",
      rif: "508062914-MDF",
    },
  },
};

/** Default render order — index in this array = order value. */
const DEFAULT_ORDER: SectionId[] = [
  "hero",
  "about",
  "products",
  "gallery",
  "reviews",
  "booking_cta",
  "contact",
];

/**
 * Merges DynamoDB content over hardcoded defaults, skipping empty-string values.
 * Empty strings are treated as "not set" so the default is preserved.
 * Note: boolean `false` and number `0` are valid values and DO override defaults.
 */
function mergeContent(
  defaults: Record<string, unknown>,
  stored: Record<string, unknown>
): Record<string, unknown> {
  const merged = { ...defaults };
  for (const [key, value] of Object.entries(stored)) {
    if (value !== "" && value !== null && value !== undefined) {
      merged[key] = value;
    }
  }
  return merged;
}

/**
 * Returns all landing sections merged with defaults, keyed by sectionId.
 * Each value includes content, enabled flag, and order for the landing page renderer.
 */
export async function getSections(): Promise<Record<SectionId, ResolvedSection>> {
  const dbSections = await landingRepository.findAll();
  const dbMap = new Map(dbSections.map((s) => [s.sectionId, s]));

  const result = {} as Record<SectionId, ResolvedSection>;
  for (const sectionId of DEFAULT_ORDER) {
    const db = dbMap.get(sectionId);
    result[sectionId] = {
      content: db ? mergeContent(DEFAULTS[sectionId], db.content) : { ...DEFAULTS[sectionId] },
      enabled: db?.enabled ?? true,
      order: db?.order ?? DEFAULT_ORDER.indexOf(sectionId),
    };
  }
  return result;
}

/**
 * Returns a single section's content merged with defaults.
 * Used by the public GET /api/landing/[sectionId] endpoint.
 */
export async function getSection(sectionId: SectionId): Promise<Record<string, unknown>> {
  const dbSection = await landingRepository.findById(sectionId);
  if (!dbSection) return { ...DEFAULTS[sectionId] };
  return mergeContent(DEFAULTS[sectionId], dbSection.content);
}

/**
 * Returns all sections for the admin editor, including metadata (enabled, order, updatedAt).
 * Sections missing from DynamoDB are populated with defaults and enabled=true.
 * Sorted by current order value ascending.
 */
export async function getAllSectionsForAdmin(): Promise<LandingSection[]> {
  const dbSections = await landingRepository.findAll();
  const dbMap = new Map(dbSections.map((s) => [s.sectionId, s]));

  const sections: LandingSection[] = DEFAULT_ORDER.map((sectionId) => {
    const db = dbMap.get(sectionId);
    return {
      sectionId,
      content: db ? mergeContent(DEFAULTS[sectionId], db.content) : { ...DEFAULTS[sectionId] },
      enabled: db?.enabled ?? true,
      order: db?.order ?? DEFAULT_ORDER.indexOf(sectionId),
      updatedAt: db?.updatedAt ?? "",
    };
  });

  return sections.sort((a, b) => a.order - b.order);
}

/**
 * Saves updated fields for a landing section and triggers ISR revalidation.
 * Accepts partial updates: content, enabled, and/or order can be patched independently.
 */
export async function updateSection(input: UpdateLandingSectionInput): Promise<void> {
  /* Read current state so we can merge partial updates. */
  const existing = await landingRepository.findById(input.sectionId);

  const section: LandingSection = {
    sectionId: input.sectionId,
    content: input.content !== undefined
      ? input.content
      : (existing?.content ?? DEFAULTS[input.sectionId]),
    enabled: input.enabled !== undefined ? input.enabled : (existing?.enabled ?? true),
    order: input.order !== undefined ? input.order : (existing?.order ?? DEFAULT_ORDER.indexOf(input.sectionId)),
    updatedAt: new Date().toISOString(),
  };

  await landingRepository.upsert(section);
  revalidatePath("/");
}
