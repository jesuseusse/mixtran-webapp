import { revalidatePath } from "next/cache";
import * as landingRepository from "@/lib/repositories/landingRepository";
import type {
  LandingSection,
  SectionId,
  UpdateLandingSectionInput,
} from "@/lib/types/LandingSection";

/**
 * Hardcoded defaults for every section.
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

/**
 * Merges DynamoDB content over hardcoded defaults, skipping empty-string values.
 * This ensures fields left blank in the editor fall back to the default rather
 * than overwriting it with an empty string.
 * e.g. backgroundImageUrl="" → uses "/images/hero-bg.png" from DEFAULTS.
 */
function mergeWithDefaults(
  defaults: Record<string, unknown>,
  stored: Record<string, unknown>
): Record<string, unknown> {
  const merged = { ...defaults };
  for (const [key, value] of Object.entries(stored)) {
    /* Only override the default when the stored value is non-empty. */
    if (value !== "" && value !== null && value !== undefined) {
      merged[key] = value;
    }
  }
  return merged;
}

/**
 * Returns all landing sections, merging DynamoDB content with hardcoded defaults.
 * Sections not yet saved in DynamoDB fall back to DEFAULTS — the landing page
 * always renders correctly even on a fresh deployment.
 */
export async function getSections(): Promise<Record<SectionId, Record<string, unknown>>> {
  const dbSections = await landingRepository.findAll();
  const result = { ...DEFAULTS };

  for (const section of dbSections) {
    result[section.sectionId] = mergeWithDefaults(
      DEFAULTS[section.sectionId],
      section.content
    );
  }

  return result;
}

/**
 * Returns a single section merged with its hardcoded default.
 */
export async function getSection(sectionId: SectionId): Promise<Record<string, unknown>> {
  const dbSection = await landingRepository.findById(sectionId);
  if (!dbSection) return { ...DEFAULTS[sectionId] };
  return mergeWithDefaults(DEFAULTS[sectionId], dbSection.content);
}

/**
 * Returns the raw DynamoDB records for all sections (admin view).
 * Sections not in DynamoDB are represented with their default content.
 */
export async function getAllSectionsForAdmin(): Promise<LandingSection[]> {
  const dbSections = await landingRepository.findAll();
  const dbMap = new Map(dbSections.map((s) => [s.sectionId, s]));

  const allSectionIds = Object.keys(DEFAULTS) as SectionId[];
  return allSectionIds.map((sectionId) => ({
    sectionId,
    content: dbMap.has(sectionId)
      ? mergeWithDefaults(DEFAULTS[sectionId], dbMap.get(sectionId)!.content)
      : { ...DEFAULTS[sectionId] },
    updatedAt: dbMap.get(sectionId)?.updatedAt ?? "",
  }));
}

/**
 * Saves updated content for a landing section and triggers ISR revalidation.
 * The landing page reflects changes within seconds without a full rebuild.
 */
export async function updateSection(input: UpdateLandingSectionInput): Promise<void> {
  const section: LandingSection = {
    sectionId: input.sectionId,
    content: input.content,
    updatedAt: new Date().toISOString(),
  };
  await landingRepository.upsert(section);
  revalidatePath("/");
}
