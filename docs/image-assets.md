# Imágenes requeridas — Landing Page

Todas las imágenes van en la carpeta **`public/images/`** del proyecto.

> **Formato recomendado:** JPG para fotos. PNG solo si necesitas transparencia.  
> Optimiza cada imagen antes de subir (usa [Squoosh](https://squoosh.app) o similar).

---

## Imágenes requeridas ahora (Phase 1)

Estas 5 imágenes son las únicas que el código referencia hoy.
La landing no renderizará correctamente sin ellas.

| # | Archivo | Dónde se usa | Dimensiones recomendadas | Descripción del contenido |
|---|---|---|---|---|
| 1 | `hero-bg.jpg` | Sección Hero — fondo completo | 1920 × 1080 px | Foto de ambiente: pared recién pintada, espacio con paleta de colores, o persona consultando muestras. Imagen de alto impacto visual. |
| 2 | `about-studio.jpg` | Sección Nosotros — foto del equipo/estudio | 800 × 600 px | Foto del estudio, espacio de trabajo, equipo aplicando pintura, o consultor con muestras de color. |
| 3 | `product-interior.jpg` | Sección Productos — línea Interior Premium | 600 × 450 px | Habitación o sala con acabado mate elegante. Colores neutros/cálidos. |
| 4 | `product-exterior.jpg` | Sección Productos — línea Escudo Climático Exterior | 600 × 450 px | Fachada de casa o edificio con pintura exterior de buen acabado. |
| 5 | `product-specialty.jpg` | Sección Productos — línea Especialidades y Acentos | 600 × 450 px | Muro de acento, mueble pintado con acabado metálico o tiza, instalación artística. |

---

## Imagen recomendada para SEO (opcional pero importante)

| # | Archivo | Dónde se usa | Dimensiones recomendadas | Descripción del contenido |
|---|---|---|---|---|
| 6 | `og-default.jpg` | Meta tag Open Graph — previsualización al compartir en redes | 1200 × 630 px | Imagen de marca: logo + fondo de color de la paleta primaria, o la mejor foto del portafolio. |

---

## Imágenes futuras — Galería (Phase 4)

Estas imágenes se subirán a S3 desde el panel de administración en Phase 4.
No van en `public/images/` — se sirven vía CloudFront.

| # | Nombre sugerido en S3 | Sección | Descripción |
|---|---|---|---|
| 7+ | `gallery/proyecto-01.jpg` … `gallery/proyecto-N.jpg` | Sección Galería | Fotos de proyectos terminados: habitaciones, fachadas, locales comerciales. Mínimo 6 para que la galería se vea bien. Dimensiones libres — Next.js Image las optimiza. |

---

## Checklist de preparación

- [ ] `public/images/hero-bg.jpg` — subida y optimizada
- [ ] `public/images/about-studio.jpg` — subida y optimizada
- [ ] `public/images/product-interior.jpg` — subida y optimizada
- [ ] `public/images/product-exterior.jpg` — subida y optimizada
- [ ] `public/images/product-specialty.jpg` — subida y optimizada
- [ ] `public/og-default.jpg` — subida (para OG tags)
- [ ] Imágenes de galería subidas a S3 (Phase 4)

---

## Notas técnicas

- El componente `<Image>` de Next.js optimiza automáticamente formato, tamaño y compresión al servir.
- No uses nombres con espacios ni acentos — usa guiones (`-`) como separadores.
- Las imágenes en `public/images/` se sirven estáticas desde la CDN de Amplify/CloudFront.
- La imagen `og-default.jpg` va directo en `public/` (no en `public/images/`) porque `seo.ts` la referencia como `${BASE_URL}/og-default.jpg`.
