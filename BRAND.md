# EthicVoice — Brand Book

Sistema de marca del sitio público (landing, páginas de producto, flujos del
denunciante, acceso). El código vive en `src/modules/brand/` y
`src/styles/brand.css`; este documento explica el porqué de cada decisión.

---

## 1. Idea central

**"Cada denuncia cuenta una historia."**

EthicVoice existe para que una persona se atreva a hablar y para que la
organización actúe con evidencia. La marca se mueve entre dos registros, y
el diseño los hace visibles:

| Registro | Qué representa | Cómo se ve |
|---|---|---|
| **La voz** | La persona que reporta: humana, vulnerable, valiente | Serif itálica (Instrument Serif), una palabra por titular |
| **El registro** | El caso: trazable, auditable, cifrado | Mono (Geist Mono), etiquetas, códigos `EV-2026-0148` |
| **La plataforma** | La herramienta que une ambos | Grotesca (Geist), titulares grandes, tracking negativo |

**Tono:** sobrio, directo, en español neutro de Latinoamérica. Frases cortas.
Nada de superlativos vacíos ("revolucionario", "de vanguardia"). Se habla de
lo que pasa con un caso, no de lo que "potencia" la IA.

---

## 2. Logotipo

El isotipo es una burbuja de conversación con tres líneas de texto; la
última termina en dos puntos — la voz que sigue hablando.

- Componente vectorial: `<LogoMark />` y `<Logo />` en `src/modules/brand/components/Logo.tsx`.
- Wordmark: **Lexend 600**, "Ethic" en slate + "Voice" en signal.
- Sobre fondo oscuro: `tone="dark"` ("Ethic" en blanco, borde sutil en la burbuja).
- Área de respeto: la altura de una línea del isotipo alrededor.
- Tamaño mínimo: 24 px de alto para el isotipo.
- No: rotar, cambiar colores, poner sombras, usar el PNG rasterizado cuando hay vector disponible.

El isotipo también es **elemento gráfico**: a escala monumental (hero, cierre
lima, pantallas de estado, panel de acceso) y en el wordmark gigante del
footer. Sus tres líneas "se escriben" (trazo SVG animado) cuando aparecen.

---

## 3. Color

Los dos colores del logotipo son la base exacta. El resto se deriva de ellos.

| Token | Hex | Uso |
|---|---|---|
| `ev-night` | `#0B1D21` | Texto principal, fondos oscuros, botón primario sobre claro |
| `ev-deep` | `#12292E` | Superficies oscuras secundarias |
| `ev-ink` | `#16323A` | Texto de cuerpo fuerte |
| **`ev-slate`** | **`#244850`** | Color del logotipo. Hover de botones oscuros, acentos |
| `ev-mute` | `#5A6D70` | Texto secundario |
| `ev-haze` | `#8FA2A5` | Texto terciario, placeholders |
| **`ev-signal`** | **`#98D050`** | Color del logotipo. CTA principal, énfasis sobre oscuro, el bloque de cierre |
| `ev-signal-soft` | `#C6E89A` | Fondos suaves de estado positivo |
| `ev-signal-wash` | `#EEF6E2` | Chips y resaltados muy suaves |
| `ev-moss` | `#44731A` | Signal legible como texto sobre claro (índices, etiquetas) |
| `ev-paper` | `#F4F3EE` | Fondo base — papel, no blanco digital |
| `ev-bone` | `#EAE8E0` | Secciones alternas |
| `ev-line` | `#DCDAD1` | Reglas y bordes |
| `ev-coral` | `#DB4F3A` | Riesgo alto, tachados, errores |
| `ev-amber` | `#E09A2B` | Prioridad, advertencias |

**Reglas**
- `signal` nunca como color de texto sobre fondo claro (no pasa contraste): usa `moss`.
- Sobre `signal` el texto siempre es `night`.
- Un solo bloque a sangre en `signal` por página: el cierre (`ClosingCta`).
- Nada de degradados en texto, blobs de color flotantes ni glows de neón.

---

## 4. Tipografía

| Rol | Familia | Variable CSS | Clase |
|---|---|---|---|
| Interfaz y titulares | Geist 400–700 | `--font-display` | `font-display` (por defecto en `.ev-site`) |
| La voz | Instrument Serif itálica | `--font-serif` | `.ev-serif` / `<Voice>` |
| El registro | Geist Mono 400–500 | `--font-mono` | `.ev-label`, `font-mono` |
| Wordmark | Lexend 600 | `--font-wordmark` | `font-wordmark` |

**Escala** (en `brand.css`, fluida con `clamp`):

| Clase | Tamaño | Interlineado | Tracking |
|---|---|---|---|
| `.ev-display-xl` | 48 → 140 px | 0.92 | −0.058em |
| `.ev-display` | 40 → 88 px | 0.96 | −0.05em |
| `.ev-h2` | 33 → 64 px | 1.0 | −0.045em |
| `.ev-h3` | 22 → 28 px | 1.15 | −0.025em |
| `.ev-lead` | 17 → 21 px | 1.5 | −0.012em |
| `.ev-label` | 11 px mono, mayúsculas | 1.2 | +0.06em |

- El tracking se estrecha a medida que crece el tamaño (nunca un valor fijo).
- **Una sola palabra en serif por titular**, siempre la que carga el sentido: *historia*, *evidencia*, *promesa*.
- Las cifras usan `.ev-num` (tabular) y van grandes: son parte del relato.

---

## 5. Layout

- Contenedor: `max-width: 84rem`, gutter fluido `clamp(1.25rem, 4vw, 3rem)` (`<Container>`).
- Retícula de 12 columnas. **Patrón de sección:** índice `(03)` + etiqueta en 3 columnas, titular en 9 (`<Section>` en `sections.tsx`).
- Cada sección abre con una etiqueta de registro: `(01) El costo de no actuar`.
- Reglas finas (`border-ev-line`) en lugar de tarjetas con sombra. Las tarjetas se reservan para objetos reales del producto (un caso, un formulario, un chat).
- Superficies en alternancia: `paper` → `white` → `bone` → `night`. Nunca dos oscuras seguidas.
- Radios: 9999px (botones, chips), 20–28px (tarjetas de producto), 12px (inputs).

---

## 6. Componentes (`src/modules/brand/components`)

| Componente | Para qué |
|---|---|
| `SiteShell` | Cromo único del sitio: nav, footer, CTA flotante, WhatsApp, cierre lima |
| `SiteNav` | Franja de servicio "¿Vienes a reportar?" + barra translúcida + menú móvil a pantalla completa |
| `SiteFooter` | Footer en tinta con wordmark monumental |
| `ClosingCta` | Bloque lima de cierre (el único a sangre en signal) |
| `StickyDemoBar` | CTA persistente; se oculta si hay otro CTA grande en pantalla (`data-hide-sticky`) |
| `PageHero`, `Section`, `IndexList`, `BrowserFrame` | Patrones de página |
| `Button`, `ButtonLink`, `buttonClasses` | Variantes `signal`, `ink`, `outline`, `outline-dark`, `text`; tamaños `md`, `lg` |
| `Eyebrow`, `RevealHeading`, `Voice`, `reveal()` | Etiquetas, titulares revelados línea a línea, palabra serif, revelado al scroll |
| `StatusScreen` | 404 y errores |
| `useDemoCta()` | Abre Calendly respetando cookies y registra `landing_cta_click` |

**Botones:** un solo CTA primario (`signal` o `ink`) por bloque. El secundario
es `outline` o `text`. Todos responden al presionar (`scale(0.97)`); la flecha
se desplaza 2 px al hover — no hay otra animación en el botón.

---

## 7. Movimiento

Principios (Emil Kowalski / Apple HIG): el movimiento explica o confirma,
nunca decora algo que se ve cien veces al día.

- Curvas: `--ev-ease-out: cubic-bezier(0.23, 1, 0.32, 1)` para entradas; `--ev-ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)` para trazos.
- **Revelado al scroll**: un solo `IntersectionObserver` global (`RevealController`) y transiciones CSS. Atributos: `data-reveal`, `data-reveal-lines`, `data-inview`, `data-draw`.
- Titulares: cada línea sube desde detrás de su máscara (90 ms entre líneas).
- Trazos SVG que se dibujan (`pathLength="1"` + `data-draw`): el isotipo, flechas, tachados.
- Solo `transform` y `opacity` (y `stroke-dashoffset` / `background-size` en trazos).
- `prefers-reduced-motion`: sin desplazamientos; todo aparece con fundido o estático. Marquesinas y paquetes animados se detienen.
- El contenido nunca queda oculto sin JS: el estado inicial oculto solo aplica con `html.ev-js`.

---

## 8. Imágenes

- **Nada de imágenes generadas por IA ni stock con texto incrustado.** Es lo primero que hace que un sitio "parezca hecho por IA".
- El producto se muestra con UI construida en código (paneles de `v5/HowItWorks.tsx`) o capturas reales **sin datos personales**.
- Fotografía de personas solo si es real (equipo, clientes con autorización).
- Logos de clientes en escala de grises; color al hover.

---

## 9. Conversión

- Dos audiencias en la misma URL: **compradores** (compliance, RR. HH., legal) y **denunciantes**. La franja superior desvía a los segundos en un clic (`/submit`, `/track`); nunca se les muestra venta en esos flujos (sin CTA flotante, sin cierre comercial, sin WhatsApp de ventas).
- Narrativa de la landing: promesa → costo de no actuar → antes/después → cómo funciona → prueba (video, seguridad, voces) → denunciantes → precio → objeciones → lead magnet → cierre.
- CTA principal constante: **"Agendar demo gratis"** + microcopia "30 min · Sin compromiso · En español".
- Lead magnets con el formulario en la primera pantalla y cabecera sin navegación.
- Todas las cifras del sitio vienen de fuentes aprobadas (ver `v5/content.ts`); no inventar métricas ni certificaciones.

---

## 10. Checklist antes de publicar una página

- [ ] Usa `SiteShell` (o `MarketingPageShell`) — nada de headers propios.
- [ ] Titular con `RevealHeading` y, como máximo, una palabra en `<Voice>`.
- [ ] Secciones con índice `(0n)` y patrón 3/9 columnas.
- [ ] Un CTA primario por bloque, registrado con `useDemoCta` / `trackCta`.
- [ ] Sin imágenes generadas, sin degradados en texto, sin blobs ni glows.
- [ ] Probado a 390 px y 1440 px, sin scroll horizontal.
- [ ] Funciona con `prefers-reduced-motion`.
