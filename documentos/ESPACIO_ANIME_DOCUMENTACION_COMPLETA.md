# ESPACIO ANIME — DOCUMENTO MAESTRO DEL PROYECTO
Última actualización: **2026-09-30**.

### 0. Qué es este documento

Esta es la referencia única y completa de Espacio Anime — lo que en un equipo se llamaría el **documento maestro** o la **"biblia" del proyecto**. Reúne en un solo sitio la visión de producto (qué es, para quién, por qué existe), la arquitectura técnica (con qué está hecho, cómo están organizadas las carpetas, cómo fluyen los datos), el funcionamiento interno detallado de cada pieza (filtros, fórmulas, extractor), y un manual de operaciones con los flujos de trabajo del día a día. La idea es que cualquiera —tú dentro de seis meses, o alguien nuevo que se incorpore— pueda leer esto y entender el proyecto entero sin tener que redescubrir nada desde cero. Vive fuera del código del sitio, en `documentos/ESPACIO_ANIME_DOCUMENTACION_COMPLETA.md`; se actualiza cada vez que cambia algo relevante, y se mantiene como un único archivo a propósito, sin fragmentarlo en varios documentos.

Índice:
1. [Visión de producto](#1-visión-de-producto)
2. [Estado actual del proyecto](#2-estado-actual-del-proyecto)
3. [Cómo funciona por dentro](#3-cómo-funciona-por-dentro) (incluye arquitectura, tecnología y estructura de carpetas en 3.0; motor de Afinidad completo en 3.9; cómo ver el proyecto en el móvil en 3.10)
4. [El extractor](#4-el-extractor) (incluye manual de operaciones en 4.7)
5. [Frentes de trabajo abiertos](#5-frentes-de-trabajo-abiertos)

_____________________________________________________________________________________________________________________________
## 1. VISIÓN DE PRODUCTO
_____________________________________________________________________________________________________________________________
### 1.1 Qué es Espacio Anime
Plataforma en español para **descubrir y seguir anime**. No pretende ser otra base de datos genérica de anime — debe ayudar a responder cuatro preguntas: 
	¿qué merece la pena ver?, 
	¿qué contiene y cómo se organiza una franquicia?, 
	¿qué anime encaja conmigo?, 
	¿qué estoy viendo y por dónde voy?
> **Espacio Anime es un hub editorial y práctico para descubrir anime, elegir mejor, saber dónde verlo y llevar tu propio seguimiento.**

### 1.1.1 El problema que resuelve

Descubrir y seguir anime hoy está fragmentado: las bases de datos internacionales (MyAnimeList, AniList) son enormes, sin criterio editorial y en inglés; una franquicia larga (secuelas, películas, OVAs, spin-offs) es difícil de seguir como un todo coherente; y saber "dónde lo veo legalmente en España" casi nunca es evidente. Espacio Anime no compite en tamaño de catálogo — compite en **criterio** (curación editorial en vez de listados infinitos), **claridad** (una franquicia es una sola ficha coherente, no 15 entradas sueltas) y **idioma** (todo en español, pensado para el espectador hispanohablante).

### 1.1.2 Público objetivo

Cualquier aficionado al anime en español que quiera algo más curado que "buscar en Google" y más simple que gestionar una cuenta en MyAnimeList — desde quien solo quiere una recomendación rápida (Afinidad) hasta quien quiere llevar un seguimiento serio de lo que ve, sin que eso implique unirse a una red social o exponer su actividad a nadie más.

### 1.2 Los cuatro pilares

Los cuatro pilares no son cuatro secciones sueltas — cada uno alimenta o depende de los demás. El siguiente esquema resume cómo se conectan, y después se explica cada uno con su propósito real:

```
Descubrir  ──┐
             ├──►  FRANQUICIAS (el núcleo: assets/data/animes.json)  ◄──── Afinidad recomienda UNA de estas
Afinidad   ──┘                    │
                                   ▼
                            Mi espacio (guarda referencias a ids de Franquicias, nunca copia los datos)
```

- **Descubrir** — *propósito:* curación editorial, listas con criterio en vez de volumen (24 listas manuales sobre ~200 franquicias, en 4 grupos temáticos — ver 3.1). Responde "¿qué merece la pena ver?" sin que el usuario tenga que buscar entre cientos de opciones. *Cómo se conecta:* cada franquicia de una lista de Descubrir es en realidad una ficha del catálogo de Franquicias — Descubrir no tiene datos propios, solo selecciona y presenta un subconjunto curado.

- **Franquicias** — *propósito:* el núcleo de información estructurada de todo el proyecto. Una franquicia agrupa series, películas, OVAs, especiales, spin-offs y secuelas de un mismo universo bajo una sola ficha coherente, con buscador, filtros y orden (ver 3.4). *Cómo se conecta:* es la única fuente de datos real (`assets/data/animes.json`) — Descubrir, Afinidad y Mi espacio no tienen su propia base de datos, todos leen o referencian esta.

- **Afinidad** — *propósito:* recomendación por 5 preguntas rápidas (vibra, formato, mundo, motor, época) cruzadas contra las `etiquetas_editoriales` de cada franquicia, para responder "¿qué anime encaja conmigo?" sin que el usuario tenga que explorar el catálogo entero. Diferenciador importante del proyecto — no sustituir por una IA compleja sin necesidad real. *Cómo se conecta:* su calidad depende **directamente** de que las franquicias de Franquicias tengan buenas `etiquetas_editoriales` puestas a mano (ver Frente de trabajo abierto, sección 5, punto 1) — sin eso, recomienda mal aunque el motor de preguntas funcione perfecto.

- **Mi lista** (implementada en código/UI como **"Mi espacio"** — mismo pilar, nombre distinto; unificar el nombre es una decisión pendiente de naming, no técnica) — *propósito:* llevar el seguimiento personal (Pendiente/Viendo/Completado/Favoritos, progreso, valoración y notas propias) de lo que el usuario ya descubrió en los otros tres pilares — hace que vuelva. *Cómo se conecta:* guarda solo **referencias** (el `id_franquicia`) en `localStorage`, nunca copia los datos de la franquicia — así, si Franquicias se actualiza, Mi espacio siempre ve la versión más reciente sin sincronizar nada él mismo.

Filosofía transversal a los cuatro: **gestionar mi anime, no una red social** (nada de seguidores, chat, feed, perfiles públicos, comentarios o rankings sociales; las notas son siempre privadas).

### 1.3 Flujo principal del producto
No sé qué ver → Descubrir/Afinidad/Franquicias → encuentro una obra → 
entro en la franquicia → consulto información → consulto dónde verla → 
la añado a Mi lista → Quiero ver → Viendo → 
actualizo progreso → Vistos → favorito/valoración/nota → vuelvo a descubrir.

### 1.4 Identidad visual
La estética actual (fondo espacial, glassmorfismo, paleta blanco/cian/azul/púrpura) **gusta y debe conservarse** — colores, tipografías, tarjetas, botones, navegación, footer, modales. 
Mejorar producto y arquitectura sin destruir la identidad visual.

### 1.5 Qué NO debe convertirse Espacio Anime
Red social, portal de noticias, tienda, blog SEO, agregador de enlaces, clon de MyAnimeList/AniList, base de datos sin criterio, proyecto saturado de publicidad. 
Monetización (afiliación, publicidad, guías de compra) es una fase posterior — el producto no se construye alrededor de ella.

### 1.6 Tecnología y reglas de decisión
HTML + CSS + JavaScript + Tailwind vía CDN, sin build step. No introducir frameworks ni migrar a React/Vue/Angular sin una razón técnica fuerte. 
Ante cualquier decisión, el orden de prioridad es: identidad de Espacio Anime → funcionamiento → UX → simplicidad → mantenibilidad → escalabilidad → SEO → monetización → nuevas funcionalidades. 
Antes de modificar algo importante: comprender → auditar → identificar dependencias → planificar → modificar → probar → revisar.
_____________________________________________________________________________________________________________________________
## 2. ESTADO ACTUAL DEL PROYECTO
_____________________________________________________________________________________________________________________________
### 2.1 Los cuatro pilares, estado real
| **Descubrir** | Pendiente: sigue sin usar `etiquetas_editoriales` (solo las usa Afinidad, ver 3.9) — decisión de diseño abierta, no un fallo. **Auditoría de contenido hecha el 2026-09-30**: revisadas a mano las ~446 referencias a franquicias de las 24 listas (etiquetas del bloque "Elige según lo que te apetezca hoy", chips de las tarjetas destacadas, subtítulos de estudio/director/década) contra la franquicia real a la que apuntan — prácticamente todas correctas. Se corrigieron 6 errores de montaje encontrados de paso (no eran etiquetas mal puestas, sino copy/HTML mal copiado): `directa-al-corazon.html` y `muy-recomendadas.html`/`rutas-alternativas.html` mostraban el título o `alt` equivocado en las tarjetas de Orange y Fate/Zero (la franquicia `fate-zero` en `animes.json` agrupa toda la saga Fate/stay night bajo ese único id — su `titulo_principal` real es "Fate/Zero", así que todo el texto visible se unificó a ese nombre); `para-desconectar.html` y `rarezas-y-curiosidades.html` tenían una clase Tailwind `drop-shadow` duplicada y rota (mismo patrón de copiar/pegar en los dos, comprobado que no se repite en ningún otro archivo); `pilares-de-cada-generacion.html` tenía un typo de capitalización sin impacto visual (el `uppercase` de CSS lo tapaba, pero el HTML fuente estaba mal). El hueco de `monster` que quedaba se cerró el 2026-09-30 (el usuario añadió la franquicia — ver frente 2, sección 5) — las 5 referencias resuelven bien, 0 enlaces rotos en las 24 listas. |
| **Franquicias** | Poda hecha el 2026-09-07: de 560 franquicias reales (562 era la cifra de memoria, no la del archivo) se pasó a **392**. Metodología en dos rondas: (1) las 207 ya etiquetadas a mano se conservaron todas sin tocar; (2) al resto (353 sin etiquetar) se le aplicó un suelo de popularidad AniList por formato (Serie TV ≥190.000, Película ≥90.000, ONA ≥60.000, OVA ≥30.000); (3) primera ronda de rescate manual (17 casos: Hellsing, InuYasha, Trigun, Cardcaptor Sakura, Initial D 1st Stage, Bakuman., Chihayafuru, SHIROBAKO, Natsume's Book of Friends, Kaiji, Space Brothers, Kids on the Slope, Silver Spoon, Ghibli Porco Rosso/The Cat Returns/When Marnie Was There); (4) segunda ronda de rescate (8 casos más) pedida expresamente por el usuario para comprobar mejor las descartadas mirando antigüedad y votos totales, no solo popularidad: Yu Yu Hakusho: Ghostfiles, Tenchi Muyo! Tenchi Universe, Free! -Iwatobi Swim Club-, Little Witch Academia (TV), Umamusume: Pretty Derby, Kingdom, Ace of the Diamond, Hetalia Axis Powers. Backup del estado previo (560 franquicias) en `assets/data/animes.backup-2026-09-07-antes-de-recorte-560.json`. Auditoría completa con las 560 y su motivo individual, publicada como artifact. Los topes de los botones del extractor ya están ajustados (ver 4.1) para no volver a inflar la base a futuro. |
| **Afinidad** | Funcional, con auditoría y etiquetado completo del catálogo hecho el 2026-09-30 (bug de `RELATED_TAGS` corregido, % recalibrado a un valor real sin suelo/tope inventado, las 389 franquicias con `etiquetas_editoriales` — incluida Monster, añadida ese mismo día). Detalle técnico completo — mecanismo de cada pregunta, cómo se hacen las etiquetas, fórmula del %, casos a revisar, qué mejorar — en **3.9** (los porcentajes y cifras exhaustivas de 3.9 se calcularon sobre 388; con Monster son 389 — la diferencia de una franquicia no cambia ninguna conclusión). |
| **Mi espacio** | Pendiente:usuario y contraseña a futuro. |

### 2.4 Notas técnicas que siguen vigentes
- Tailwind se carga por CDN (`cdn.tailwindcss.com`), sin build step.
- `assets/js/modules/config.js` resuelve `BASE_PATH` según la profundidad de la ruta — no tocar sin necesidad.
- `assets/js/modules/layout.js` inyecta `nav.html`, `home.html` y `footer.html` por `fetch` en tiempo de ejecución.
- La identidad visual (fondo espacial, glassmorfismo, paleta blanco/cian/azul/púrpura) es un activo del proyecto y no se ha tocado.
- **Páginas legales y de proyecto completas desde el 2026-09-30**: `pages/legal/privacidad.html` y `cookies.html` tienen contenido real (antes placeholders vacíos); `pages/proyecto/contacto.html` y `pages/proyecto/sobre-nosotros.html` son nuevas, ambas con el texto final escrito por el propio usuario (correo real: `aaronmorenopizza@gmail.com`). El footer (`partials/layout/footer.html`) ya enlaza "Sobre nosotros" y "Contacto" de verdad — TikTok/Instagram/YouTube siguen en `#` a propósito, hasta que se lance la web y haya cuentas reales que enlazar.
- **Botón "Pendiente" en el resultado de Afinidad (renombrado 2026-09-30)**: antes decía solo "Añadir" / "✓ Añadido", ambiguo para quien llega nuevo (¿añadir a qué?). Ahora dice "Pendiente" / "✓ Pendiente" (se probó "Añadir a Pendiente" primero, pero no cabía en una sola línea junto a los otros dos botones), coincidiendo con el nombre real que ese estado tiene en Mi espacio (`quiero_ver` → label "Pendiente" en `mi-espacio.js`). Cambiado en `assets/js/modules/afinidad.js` (`actualizarBotonEspacio()`) y en el texto estático de `pages/afinidad/index.html`.
- **Bugs de móvil corregidos el 2026-09-30 (detectados por el usuario probando en su propio móvil, ver 3.10)**:
  1. **Ficha de franquicia** — `.modal-left-column` (180px fijos) dejaba casi sin ancho a `.modal-right-column` en móvil, y su `overflow:hidden; max-height:350px` recortaba el título y la sinopsis a mitad de palabra en vez de ajustarse. Arreglado con una media query `@media (max-width: 640px)` en `style.css` que apila las columnas, quita ese recorte del título/género/año y deja la sinopsis en una caja con scroll propio — sin tocar ninguna regla de escritorio. Funcionó a la primera.
  2. **Vista lista de Franquicias** — el bloque "Entradas/Año" de cada tarjeta (`renderCard()` en `catalogo.js`) tenía ancho fijo y no se encogía, y el título no se recortaba con "...", empujando ambos fuera del recuadro en pantallas estrechas. **Esta costó varios intentos** porque las clases de Tailwind por CDN (`[.vista-lista_&]:min-w-0`, `[.vista-lista_&]:truncate`, `hidden md:flex`, etc.) no se aplicaban de forma fiable al tener varias variantes condicionales apiladas en el mismo elemento (el mismo `<div>` lleva clases para vista-grid, vista-lista y vista-compacta a la vez) — visualmente parecía que "no pasaba nada" pese a que el HTML servido sí tenía las clases nuevas, lo que en un primer momento se confundió con un problema de caché del navegador (parte del problema sí era caché — usar una URL de túnel nueva cada vez para descartarlo fue clave para separar ambas causas). **Arreglo definitivo**: se quitaron del todo esas clases de Tailwind conflictivas en `catalogo.js` (ancho de imagen, `flex-1`/`min-w-0` del bloque de texto, `truncate` del título) y se sustituyeron por reglas CSS propias en `pages/franquicias/index.html`, con `!important` y clases dedicadas (`.lista-img`, `.lista-content`, `.lista-info`, `.lista-title`, `.lista-stats`) para que ganen siempre, sin depender de en qué orden cargue cada hoja de estilos. **Lección para futuros bugs de maquetación en este sitio**: si una clase de Tailwind `[.vista-X_&]:algo` no parece aplicarse pese a estar en el HTML servido, no asumir que es solo caché — puede ser que varias variantes condicionales apiladas en el mismo elemento compitan entre sí de forma poco fiable vía el CDN; la solución robusta es CSS propio con `!important`, no más clases de Tailwind encima.
- **Auditoría de enlaces del sitio completo, 2026-09-30**: comprobadas las 446 referencias a franquicias vía `abrirModalFranquicia('id')` en todo el proyecto (no solo Descubrir) contra `animes.json` — 0 rotas. También revisados nav.html, footer.html, home.html y el índice de Descubrir en busca de enlaces muertos o anclas (`#para-empezar-facil` etc.) que no existieran — todo correcto. Sin restos de `TODO`/`FIXME`/placeholders sin rellenar en ningún `.html` del sitio público.
_____________________________________________________________________________________________________________________________
## 3. CÓMO FUNCIONA POR DENTRO
_____________________________________________________________________________________________________________________________

### 3.0 Arquitectura general, tecnología y estructura de carpetas

**Stack tecnológico:** HTML + CSS + JavaScript "vanilla" (sin framework), con Tailwind CSS cargado por CDN (`cdn.tailwindcss.com`) para las clases de estilo. **No hay build step** — no hay `npm install`, no hay compilación, no hay bundler: cada `.html` se abre tal cual en el navegador y funciona. Esta es una decisión de arquitectura deliberada (doc. 1.6): mantener el proyecto simple de tocar y desplegar, sin la complejidad de un pipeline de build.

**No hay backend ni base de datos real.** Todo el "backend" del sitio público es un único archivo estático, `assets/data/animes.json`, que el navegador descarga con `fetch()` al cargar cualquier página que lo necesite. No hay servidor de aplicación, no hay API propia, no hay autenticación de usuarios — el estado del usuario (Mi espacio) vive enteramente en el `localStorage` de su propio navegador.

**Estructura real de carpetas del proyecto:**

```
espacio_anime/
├── index.html                    → Portada (Inicio)
├── CLAUDE.md                     → Instrucciones permanentes del proyecto para trabajar con Claude Code
├── documentos/
│   └── ESPACIO_ANIME_DOCUMENTACION_COMPLETA.md   → Este documento
├── assets/
│   ├── css/style.css              → Toda la hoja de estilos propia (además de Tailwind por CDN)
│   ├── data/
│   │   ├── animes.json            → ÚNICA fuente de verdad del catálogo (ver 3.2)
│   │   └── animes.backup-...json  → Copia de seguridad puntual de una poda pasada
│   ├── img/                       → Imágenes propias del sitio (fondo, descubrir, franquicias)
│   └── js/modules/                → Toda la lógica JS del sitio público (ver tabla de abajo)
├── pages/
│   ├── descubrir/                 → index.html + 24 páginas, una por lista curada
│   ├── franquicias/                → index.html (catálogo con filtros) + ficha.html (detalle de una franquicia)
│   ├── afinidad/index.html         → El cuestionario de recomendación
│   ├── espacio/index.html          → "Mi espacio" (Mi lista)
│   └── legal/                      → cookies.html, privacidad.html (contenido redactado el 2026-09-30, antes eran placeholders vacíos)
├── partials/
│   ├── layout/                     → nav.html, footer.html (inyectados por fetch en cada página)
│   └── sections/home.html          → Bloque de la portada, inyectado igual que el layout
├── tools/
│   └── extractor-franquicias.html  → Herramienta de curación de datos, independiente del sitio público (ver sección 4)
└── static/                         → (vacío salvo un readme.txt, reservado)
```

**Los módulos JS y su responsabilidad** (todos en `assets/js/modules/`, cargados como `<script type="module">`):

| Módulo | Responsabilidad |
|---|---|
| `config.js` | Resuelve `BASE_PATH` según la profundidad de la ruta actual (para que los `fetch` a `animes.json` y a los partials funcionen igual desde `/` que desde `/pages/franquicias/`) — no tocar sin necesidad. |
| `anime-data.js` | Único punto que hace `fetch()` sobre `assets/data/animes.json` y expone el catálogo ya parseado al resto de módulos. |
| `layout.js` | Inyecta `nav.html`, `home.html` y `footer.html` por `fetch` en tiempo de ejecución — así el menú y el footer se mantienen en un solo sitio (`partials/`) en vez de repetidos en cada página HTML. |
| `catalogo.js` | Todo el buscador, filtros y orden de la página Franquicias (ver 3.4) — opera en memoria sobre el array ya cargado, sin llamar a ninguna API. |
| `modal-franquicia.js` | Renderiza la ficha individual de una franquicia (`pages/franquicias/ficha.html`), las flechas de navegación ←→ y el botón "Atrás" (ver 3.8). |
| `afinidad.js` | El motor de las 5 preguntas y el cruce contra `etiquetas_editoriales` para recomendar una franquicia. |
| `mi-espacio.js` | Toda la lógica de "Mi espacio": lee/escribe el store de `localStorage`, estados (Pendiente/Viendo/Completado/Favoritos), progreso, valoración, notas, y exportar/importar esos datos. |
| `plataformas.js` | Helpers compartidos: estilo del badge de cada plataforma de streaming, y `obtenerEntradaPrincipal()` (resuelve cuál es la entrada principal de una franquicia) — lo usan varios módulos para no duplicar esa lógica. |

**Flujo de datos, de arriba a abajo:**

```
tools/extractor-franquicias.html  (fuera del sitio público, ver sección 4)
        │  (proceso manual: cargar → botones → descargar → sustituir a mano)
        ▼
assets/data/animes.json   ← ÚNICA fuente de verdad, el sitio público NUNCA escribe aquí
        │  (fetch en tiempo de ejecución, vía anime-data.js)
        ▼
Descubrir / Franquicias / Afinidad   ← leen el catálogo, cada uno con su propia lógica de presentación
        │
        ▼
Mi espacio (localStorage del navegador)  ← guarda solo referencias (id_franquicia), nunca copia datos
```

No hay ningún paso automático entre el extractor y el sitio — el `animes.json` descargado se sustituye **a mano** en el proyecto (ver 4.5). Esto es intencional: mantiene el control humano sobre qué entra al catálogo público en cada momento.

### 3.1 Los cinco bloques del sitio

Inicio es la puerta de entrada; los otros cuatro son el núcleo del producto.

- **Inicio** — landing con destacados y accesos a los otros cuatro bloques.
- **Descubrir** — 24 listas curadas a mano (~200 franquicias), en 4 grupos temáticos de 6 listas cada uno.
- **Franquicias** — catálogo completo con buscador, filtros, orden y fichas individuales sobre las 562 franquicias.
- **Afinidad** — recomienda una franquicia en base a 5 preguntas rápidas (vibra, formato, mundo, motor, época) cruzadas contra las etiquetas de cada franquicia.
- **Mi espacio** — lista personal (Pendiente/Viendo/Completado/Favoritos) en `localStorage`, con progreso, valoración propia y notas privadas.

### 3.2 La ficha de datos: `assets/data/animes.json`

Única fuente de verdad del catálogo. El sitio público solo **lee** de él (`assets/js/modules/anime-data.js`, vía `fetch`). Nunca se escribe desde el sitio público — el único sitio donde se modifica es el extractor, descargando un `animes.json` nuevo y sustituyendo a mano el del proyecto.

Campos principales de cada franquicia:

| Campo | Qué es |
|---|---|
| `id_franquicia` | Slug único generado del título. Ej: `bakemonogatari`. |
| `titulo_principal` / `titulos_alternativos` | Nombre mostrado + nombres por los que también se busca (romaji, inglés, español, según disponibilidad). |
| `generos` | Máximo 3, en español, tomados de la lista oficial de géneros de AniList. Se usa en el filtro "Géneros". |
| `tags_anilist` | Etiquetas en bruto de AniList (inglés, minúscula). Alimentan el auto-etiquetado; no se muestran al usuario. |
| `etiquetas_editoriales` | Etiquetas en español que sí ve el usuario y que usa Afinidad. Se rellenan con "Auto-generar etiquetas" o a mano. |
| `sinopsis_general` | Sinopsis en español, tomada de la entrada principal. |
| `score_base` | Popularidad AniList (nº de usuarios que la tienen en su lista) — el pico más alto entre todas las entradas de la franquicia. Lo usa el orden "Popularidad". |
| `puntuacion_media` | Nota media de AniList, escala 0-100. |
| `votos_total` | Nº de usuarios que puntuaron esa franquicia en AniList. |
| `puntuacion_ponderada` | Nota ajustada por nº de votos (fórmula en 3.4). La usa el orden "Valoración". |
| `entrada_principal_ani_id` / `_titulo` / `_tipo` / `_ano` / `_episodios` | Cuál entrada es la "cabecera" de la franquicia (ver 3.3). No cambia sola aunque se añadan más entradas. |
| `total_entradas` / `total_episodios_aprox` | Calculados automáticamente a partir de `entradas`. |
| `entradas[]` | Cada temporada/película/OVA: su propio `ani_id`, año, episodios, estado, imagen, dónde verla y en qué plataforma. |

### 3.3 Qué entrada "representa" a la franquicia (la cabecera)

Lo decide `elegirCabeceraAutomatica()` en el extractor. Determina cuál entrada es la "cabecera" (entrada principal), y su tipo/imagen/título son los que se muestran para toda la franquicia — aunque tenga muchas más entradas de otro tipo.

Prioridad de formato: **Serie TV (5) > Película (4) > OVA (3) > ONA (2) > Serie Corta (1) > Especial (0)**.

Reglas, en este orden:
1. Si una entrada es muchísimo más popular que las demás (diferencia de más de 50.000 en popularidad), esa gana sin importar su formato.
2. Si no, gana el formato de mayor prioridad de la lista de arriba (por eso una franquicia con 17 películas y 1 serie TV muestra la serie TV como principal, salvo que alguna película sea muchísimo más popular).
3. Si hay empate en formato, gana la entrada más antigua (la temporada 1 real).
4. Si sigue empatado, gana la más popular.

### 3.4 Franquicias — filtros y orden

Todo ocurre en `assets/js/modules/catalogo.js`, sobre el array ya cargado en memoria — no hay ninguna llamada a AniList al navegar el catálogo del sitio público (eso solo pasa en el extractor).

**Filtros (se combinan entre sí):**

- **Buscar** → contra `titulo_principal` + `titulos_alternativos`. Palabras cortas ("tv", "ona", "ova", "part") buscan por palabra exacta para no dar falsos positivos.

- **Géneros** → el desplegable no muestra los 19 géneros sueltos de AniList (tu biblioteca usa los 19 posibles, es la lista completa, no una muestra): se agrupan en **10 botones**, decidido cruzando cuántas franquicias comparten cada par de géneros en la biblioteca real, no a ojo:

  | Botón mostrado | Géneros de AniList que agrupa (nº franquicias) |
  |---|---|
  | Acción y Aventura | Acción (233) + Aventura (130) — 88 en común |
  | Comedia | Comedia (259) + Ecchi (43) — 31 en común (Ecchi cruza mucho más con Comedia que con Romance: 31 vs 10) |
  | Drama y Psicológico | Drama (232) + Psicológico (49) — 31 en común (Psicológico cruza con Drama/Misterio, casi nada con Fantasía o Sobrenatural: 4 y 1) |
  | Fantasía y Sobrenatural | Fantasía (142) + Sobrenatural (34) |
  | Romance | Romance (137) — solo, sin Ecchi mezclado |
  | Vida Cotidiana | Recuerdos de la vida / Slice of Life (107) |
  | Misterio | Misterio (55) + Thriller (6) — 3 en común |
  | Ciencia Ficción | Ciencia Ficción (53) — solo |
  | Terror | Terror (22) — solo |
  | Deportes | Deportes (21) — solo |

  Cada botón guarda en `data-value` los géneros reales separados por coma (ej. `"Acción,Aventura"`); `catalogo.js` hace match si la franquicia tiene cualquiera de ellos (`genre.split(',').some(...)`). Quedan fuera del dropdown, sin filtro propio por ser cola larga: Music (24), Mecha (14), Mahou Shoujo (3), Hentai (1) — siguen en el campo `generos`, disponibles para un futuro filtro de etiquetas/subgéneros. Los subgéneros que NO son géneros de AniList (isekai, harem, cars, school...) van en `tags_anilist` o `etiquetas_editoriales`.

- **Año** → compara contra `entrada_principal_ano` (el año de la cabecera de la franquicia).

- **Formato** → compara solo `entrada_principal_tipo` (el formato de la cabecera). Una franquicia con su cabecera en Serie TV no aparece al filtrar por "Película" aunque tenga películas dentro — el formato representa a toda la franquicia, no se mira entrada por entrada.

- **Plataforma** → compara solo la plataforma de la **entrada principal**, nunca de otra entrada (a propósito: si mirase cualquier entrada, un filtro podría devolver una franquicia cuyo enlace real de "dónde ver" apunta a otro sitio distinto del filtro pulsado). El desplegable real tiene Crunchyroll, Netflix, Disney+, Prime Video, YouTube y **"Sin plataforma principal"** (renombrado el 2026-09-07: antes decía "Sin streaming", que daba a entender que no hay forma de verlo en España, cuando algunas de estas franquicias sí tienen streaming legal pero fuera de las 5 plataformas de arriba, ej. Filmin o alquiler en Amazon — el desplegable incluye un tooltip explicándolo). No hay botón propio para plataformas menores (HIDIVE, Bilibili, Max...) aunque el dato se guarde.

- **Estado** → comprueba **todas** las entradas de la franquicia (a diferencia de Plataforma): "Finalizado" exige que ninguna esté En Emisión ni Próxima; "En Emisión"/"Próximamente" con que alguna lo esté. *(Bug corregido el 2026-09-07: antes comprobaba solo la entrada principal, lo que dejaba "Próximamente" sin devolver ningún resultado — 0 de 562 pese a que 74 franquicias tenían alguna entrada anunciada; "En Emisión" devolvía 8 en vez de 21; "Finalizado" devolvía 85 franquicias de más.)*

**Orden:** desplegable con 5 opciones — Aleatorio, Alfabéticamente, Fecha, Popularidad, Valoración. Las últimas 4 son un solo botón cada una: la palabra queda fija y solo cambia la flechita (↑ ascendente, ↓ descendente) al volver a pulsar la opción ya activa, en vez de tener una opción aparte por dirección.

- **Aleatorio** → se re-baraja cada vez que se aplica un filtro, a propósito.
- **Alfabéticamente** → `titulo_principal`, alfabético en español.
- **Fecha** → año de la primera entrada.
- **Popularidad** → `score_base`.
- **Valoración** → `puntuacion_ponderada` (fórmula abajo).

Mi espacio usa el mismo sistema, con "Más recientes" en vez de Aleatorio y un criterio extra propio, "Tu puntuación" (tus estrellas personales en `localStorage`, no la nota de AniList).

### 3.5 La fórmula de "Valoración"

Una nota media a pelo favorece a un clásico de nicho con 300 votos frente a algo con 300.000 — así que se pondera, igual que IMDb o Steam:

```
puntuacion_ponderada = (v / (v+m)) × R + (m / (v+m)) × C
```

- `R` = nota media de esa franquicia (`puntuacion_media`)
- `v` = sus votos (`votos_total`)
- `C` = nota media de TODA la biblioteca actual (se recalcula cada vez)
- `m` = mediana de votos de toda la biblioteca actual (se recalcula cada vez)

Cuantos menos votos tiene una franquicia, más "tira" su nota hacia la media general (`C`); con muchos votos, `R` pesa casi todo. El extractor recalcula `C` y `m` cada vez que procesa o actualiza una franquicia — es normal que estos dos números se muevan un poco con el tiempo. Con menos de ~10 franquicias puntuadas cargadas, no hay base suficiente y la franquicia se queda sin `puntuacion_ponderada` hasta el siguiente pase con más datos.

Diferencia en una frase: **Popularidad** = qué tan conocida es (AniList). **Valoración** = qué tan buena es, corregida para que no la infle una nota con pocos votos.

### 3.6 Plataformas de streaming — prioridad al elegir el enlace

`elegirEnlaceStreaming()` en el extractor guarda **un único enlace** por franquicia (nunca varios), cogiendo los enlaces de tipo STREAMING que da AniList y eligiendo el de mayor prioridad, pensada para público español:

```
Crunchyroll > Netflix > Disney Plus > Amazon Prime Video > Funimation > HIDIVE > Hulu > VRV > Wakanim
```

Si hay Crunchyroll disponible, se coge ese aunque también esté en Netflix. Si no hay ninguno de la lista pero sí otra plataforma no listada, se coge esa igualmente (mejor eso que dejarlo vacío). Si AniList no da ningún enlace de streaming, la entrada se queda "Pendiente" (la web usa entonces un buscador de Google como respaldo).

Solo se consulta la **entrada principal** de cada franquicia (~562 consultas, no ~1.555): es la única que se usa en la web para "dónde ver".

**Limitación real, no un bug:** `elegirEnlaceStreaming()` solo puede elegir entre lo que AniList tiene registrado en `externalLinks`, y AniList no rastrea de forma fiable los catálogos de streaming por país (sobre todo en clásicos). Reintentar contra AniList no lo arregla — haría falta una fuente específica de disponibilidad por país (tipo JustWatch) integrada para que esto se compruebe solo.

**Auditoría manual del 2026-09-07** sobre las 41 franquicias que estaban "Pendiente", contra JustWatch España + Crunchyroll/Netflix/Disney+/Prime/YouTube oficial:
- **3 corregidas** (su entrada principal pasó a un enlace real): Captain Tsubasa → Disney+, Kyousougiga → Crunchyroll, Patlabor the Mobile Police → Amazon Prime Video.
- **2 con el dato añadido en OTRA entrada, no en la principal**, porque el streaming real pertenece a otra versión/corte de la franquicia: Bastard!! (el streaming es del reboot 2022/2023 en Netflix, no del OVA de 1992 que es la cabecera — se queda "Pendiente" a propósito) y Dead Dead Demon's Dededededestruction (el Crunchyroll es del corte en episodios de 2024, no de la película "Zenshou" que es la cabecera).
- **1 hueco de catálogo detectado, sin corregir**: "Hori-san to Miyamura-kun" en la base es solo el OVA de 2012 (sin streaming real); la serie TV de 2021 "Horimiya" que sí está en Netflix/Crunchyroll no existe como entrada — falta añadirla con el extractor, no es un fallo de enlace.
- **35 confirmadas correctas**, incluido Doraemon (1973): nunca se distribuyó oficialmente fuera de Japón, así que "Pendiente" es el dato correcto.
- Quedan **38 franquicias** genuinamente sin plataforma principal tras esta auditoría (los 41 originales menos las 3 corregidas).

### 3.7 "?manual" — proteger una portada corregida a mano

Si añades `?manual` al final de la URL de `imagen_principal` (ej. `.../medium/b185-xxx.jpg?manual`), el botón "Recalcular Portadas" nunca volverá a tocar esa imagen, sin importar cuántas veces se pulse ni lo que tenga guardado la entrada individual detrás — es literalmente lo único que comprueba la función `esManual()`.

Esta protección es **solo** para `imagen_principal`. No afecta a si se fusionan temporadas nuevas en la franquicia — el extractor decide eso mirando si el `ani_id` de lo nuevo ya está en el array `entradas` de alguna franquicia, no mira ninguna etiqueta. Por eso se pueden fusionar franquicias partidas a mano con tranquilidad: futuras temporadas se seguirán añadiendo solas.

### 3.8 Cómo se navega entre fichas

Al entrar a una ficha desde una lista con filtros aplicados, las flechas ← → pasean por esa misma lista (el orden exacto que había en pantalla), y "Atrás" salta directo a la página de origen — sin recorrer ficha a ficha — con los filtros tal y como se dejaron.

Claves en `sessionStorage` (solo duran la pestaña abierta):

- `ea_franquicias_filtros` → los filtros activos de Franquicias.
- `ea_ficha_nav_order` → el orden de ids que se estaba viendo.
- `ea_ficha_nav_depth` → cuántos saltos de flecha se dieron, para que "Atrás" sepa cuánto retroceder de golpe.

Estas tres claves se borran solo al pulsar un enlace del menú/footer (cambiar de pilar) o el botón de limpiar filtros — nunca al usar las flechas o "Atrás".

### 3.9 Afinidad — el motor de recomendación de 5 preguntas

#### 3.9.1 Qué es y qué objetivo persigue

Afinidad responde a "¿qué anime encaja conmigo ahora mismo?" sin que el usuario tenga que explorar el catálogo entero. La promesa de producto: 5 preguntas rápidas → 1 recomendación clara y lista para empezar, con un % de afinidad honesto (no una IA generativa, no un modelo de lenguaje — es una fórmula determinista escrita a mano). Página: `pages/afinidad/index.html`. Motor: `assets/js/modules/afinidad.js`. No llama a ninguna API en tiempo real — cruza las respuestas contra el catálogo ya cargado de `assets/data/animes.json`, igual que Franquicias.

#### 3.9.2 La pieza que lo hace posible: `etiquetas_editoriales`

Cada franquicia guarda una lista plana de 0 a ~13 etiquetas en el campo `etiquetas_editoriales`. El vocabulario es **cerrado y fijo — 33 valores posibles, ni uno más**, repartidos en 3 dimensiones que coinciden letra a letra (con sus tildes) con las opciones de las preguntas 1, 3 y 4:

- **Vibra** (11): Adrenalínica, Divertida, Emotiva, Tensa, Cerebral, Terrorífica, Aventurera, Relajante, Romántica, Oscura, Contemplativa.
- **Mundo** (10): Actual / realista, Escolar, Fantasía, Sobrenatural urbano, Ciencia ficción futurista, Distopía / postapocalipsis, Histórico, Otro mundo / isekai, Mundo virtual / videojuego, Guerra / militar.
- **Motor** (12): Acción y combates, Investigación y misterio, Romance central, Vida cotidiana, Crecimiento personal, Viaje y exploración, Deporte y competición, Crimen y bajos fondos, Política y estrategia, Supervivencia / juego mortal, Mechas y pilotos, Música / escenario.

Que el vocabulario sea cerrado (y no etiquetas libres) es la decisión clave: es lo que permite comprobar una **coincidencia exacta** entre lo que responde el usuario y lo que tiene la franquicia, en vez de tener que adivinar por parecido de texto. El sistema de puntos de Afinidad no sustituye a las etiquetas — es solo la forma de combinar 3 coincidencias de etiqueta (vibra/mundo/motor) más 2 filtros (formato/época) en un único ranking ordenable.

**Cómo se ponen las etiquetas — dos vías:**
1. A mano, dentro de `tools/extractor-franquicias.html`, botón "✏️ Revisar Etiquetas Manualmente" (editor fila por franquicia). Existe también "🤖 Auto-generar Etiquetas", una tabla fija de reglas (si género = Acción → añade Adrenalínica, si el tag = isekai → añade "Otro mundo / isekai", etc.) puramente determinista, sin ningún modelo detrás — es solo un punto de partida, nunca sustituye la revisión.
2. **Pasada completa hecha por Claude el 2026-09-30** (petición explícita del usuario: "hazlo tú todo, me fío de ti"): las 388 franquicias del catálogo se repartieron en 5 lotes de ~78 procesados en paralelo. Cada lote revisó las franquicias que ya tenían etiquetas (corrigiendo las contradictorias o forzadas) y etiquetó desde cero las que no tenían ninguna, apoyándose en conocimiento propio de cada obra cuando el título era reconocible, y en géneros/tags de AniList/sinopsis cuando no. Antes de escribir nada se guardó backup del estado previo en `assets/data/animes.backup-2026-09-30-antes-de-etiquetado.json` (183 franquicias sin ninguna etiqueta en ese momento). Resultado: **388/388 con etiquetas puestas**, media de 6.1 etiquetas por franquicia. Verificado tras el merge: mismos títulos/sinopsis/entradas que antes en las 388, sin caracteres mal codificados, formato JSON idéntico al que produce el propio extractor (indentación de 4 espacios, ver 4.5).

**Casos que quedaron con confianza media o baja** (ambigüedad editorial real, no error) — revisar sin prisa si no se está de acuerdo con alguno, no hace falta repasarlos todos:

| Franquicia | Por qué genera duda |
|---|---|
| death-parade | Se dejó "Otro mundo / isekai" para el bar-limbo entre mundos — uso laxo de esa etiqueta, no es el isekai clásico de "transportado a otro mundo". |
| summer-wars | Se dejó "Deporte y competición" por el hanafuda/baseball familiar — aparece pero no es el núcleo de la obra. |
| classroom-of-the-elite | El tono real fluctúa entre cerebral y tenso según el arco. |
| tower-of-god | Adaptación de webtoon con tono cambiante arco a arco. |
| to-your-eternity | Obra muy episódica con tonos distintos por arco (histórico, supervivencia, filosófico) — resumida al tono dominante. |
| my-happy-marriage | Discutible si "Guerra / militar" es central o solo ambientación de fondo. |
| danganronpa-the-animation | Mundo puesto como "Escolar" (el instituto es el escenario) en vez de "Distopía / postapocalipsis" — es un death game encerrado, no un mundo post-apocalíptico real. |
| deadman-wonderland | Mundo puesto como "Distopía / postapocalipsis" por el Japón post-terremoto, pero casi toda la trama ocurre dentro de una prisión — podría discutirse "Actual / realista" con matices. |
| elfen-lied | Mundo puesto como "Sobrenatural urbano" por la mutante Diclonius, aunque el tono es más "ciencia ficción con horror corporal" que sobrenatural clásico. |
| gate | Mundo puesto como "Guerra / militar" por encima de "Otro mundo / isekai" — el eje real es el JSDF luchando en el otro mundo, no el descubrimiento del isekai en sí. |
| inuyasha | Mundo puesto como "Histórico" (Japón feudal) en vez de "Fantasía" — tiene ambos igual de fuerte, se priorizó el escenario temporal. |
| 91-days | Tiene la vibra "Tensa" sin garantía al 100% — es más un thriller de mafia pausado que tenso en el sentido de suspense constante. |
| bludgeoning-angel-dokuro-chan | Comedia gore muy nicho, poco reconocible; etiquetado apoyado casi solo en tags/sinopsis. |
| miru-tights-cosplay-satsuei-tights | Ecchi episódico de bajo perfil, fanservice sin trama fuerte; etiquetas mínimas a propósito. |
| cosmic-princess-kaguya | Título reciente y poco conocido; inferido principalmente de tags, no de conocimiento directo. |
| to-be-hero-x | Antología reciente; estructura inferida de sinopsis/tags, no de visionado directo. |
| kubikiri-cycle-the-blue-savant-and-the-nonsense-user | Novela ligera de nicho (serie Zaregoto); confianza media. |
| loner-life-in-another-world, ningen-fushin, jack-of-all-trades-party-of-none, the-demon-sword-master-of-excalibur-academy, the-unwanted-undead-adventurer | Isekai/fantasía genéricos de catálogo amplio, poco distintivos entre sí; etiquetado apoyado sobre todo en género y tags de AniList. |

(Caso aparte, no es una duda: **pop-team-epic** se quedó con una sola etiqueta, "Divertida" — es un show de sketches absurdistas sin trama ni ambientación fija, así que no se forzó ninguna etiqueta de mundo/motor que no aplicase con honestidad.)

#### 3.9.3 Las 5 preguntas, una por una

El test es lineal y obligatorio (`screen-q1` → `screen-q2` → `screen-q3` → `screen-q4` → `screen-q5` → `screen-result`): no se puede llegar al resultado sin responder las 5. Cada pregunta es de uno de dos tipos: **filtro duro** (si no coincide, la franquicia queda descartada sin excepción) o **puntuación blanda** (suma puntos, pero no descarta por sí sola). El peso de cada una en el % final:

| # | Pregunta | Pantalla | Opciones | Tipo | Peso |
|---|---|---|---|---|---|
| 1 | "¿Qué te pide el cuerpo?" (vibra) | screen-q1 | 11 (ver 3.9.2) | Blanda | 28 |
| 2 | "¿Cómo quieres empezar?" (formato) | screen-q2 | Película / Serie corta / Serie larga | **Dura** | 18 |
| 3 | "¿Dónde quieres entrar?" (mundo) | screen-q3 | 10 (ver 3.9.2) | Blanda | 18 |
| 4 | "¿Qué debe mover la historia?" (motor) | screen-q4 | 12 (ver 3.9.2) | Blanda | 24 |
| 5 | "¿Qué época visual te apetece?" (época) | screen-q5 | Clásica (<2010) / Moderna (2010-2020) / Actual (2020+) | **Dura** | 12 |

Los 5 pesos suman exactamente **100** — no es casualidad, es la base del % final (ver 3.9.4).

**Q1 — Vibra (28 puntos, el peso más alto).** Es la pregunta que más pesa porque el tono es lo que más define "qué apetece ver ahora". Mecanismo (`resolverCoincidencia('vibra', ...)`): ¿la franquicia tiene esa etiqueta exacta en `etiquetas_editoriales`? → 28 puntos. Si no, ¿hay una palabra relacionada en sus géneros o en los `tags_anilist` en bruto (inglés)? → ~17 puntos (62% del máximo, vía el diccionario `RELATED_TAGS.vibra`). Si ninguna de las dos → 0 puntos, pero la franquicia no se descarta solo por esto.

**Q2 — Formato (18 puntos, filtro duro).** `clasificarFormatoPrincipal()` decide el formato de la franquicia mirando su entrada principal: si `entrada_principal_tipo` es "Película" → película; si es "Serie Corta" → serie corta; si es Serie TV/ONA/OVA/Especial, se mira el tamaño real — **serie larga** si la entrada principal tiene ≥24 episodios, o la franquicia entera suma ≥45 episodios totales, o tiene ≥4 entradas; si no, **serie corta**. Si el formato de la franquicia no coincide con lo marcado, queda fuera sin excepción — por eso es el filtro que más se nota bloqueado (medido: **3.7%** de las veces que se muestra una opción de esta pregunta, sale gris).

**Q3 — Mundo (18 puntos, blanda).** Mismo mecanismo que vibra, contra `RELATED_TAGS.mundo` cuando no hay etiqueta exacta.

**Q4 — Motor (24 puntos, la segunda más alta).** Mismo mecanismo, contra `RELATED_TAGS.motor`. Pesa casi tanto como vibra porque "qué mueve la trama" es casi tan decisivo como el tono para saber si algo va a enganchar.

**Q5 — Época (12 puntos, filtro duro).** `clasificarEpoca()` mira el año de la entrada principal (`entrada_principal_ano`): <2010 clásica, 2010-2019 moderna, ≥2020 actual. Igual que formato, si no coincide la franquicia queda fuera sin excepción (medido: bloqueo del **0.4%** de las veces).

**Regla de exclusión adicional:** aunque vibra/mundo/motor no descartan por separado, si las 3 dan 0 puntos a la vez para una franquicia (ninguna señal real en ninguna de las 3), esa franquicia queda fuera igualmente — el mínimo para aparecer en el resultado es al menos 1 coincidencia real entre esas 3 preguntas blandas.

**Por qué el bloqueo de opciones (botón gris + mensaje) casi no se nota en Q1/Q3/Q4 y sí en Q2/Q5:** el mecanismo (`actualizarBotonesDisponibles()` + `cumpleCaminoPosible()`) existe para las 5 preguntas por igual, no es exclusivo de formato. Pero formato/época son filtros todo-o-nada sobre solo 3 casillas cada uno, mirando un único dato fijo de la franquicia — fácil quedarse sin ninguna franquicia en una casilla concreta. Vibra/mundo/motor son puntuación, no exclusión directa, y con las 388 franquicias ya etiquetadas casi siempre hay alguna con algo de señal para cualquier combinación — medido con 400 recorridos completos aleatorios: **0.0%** de bloqueo en vibra, mundo y motor, frente al 3.7% de formato y 0.4% de época.

#### 3.9.4 Cómo se calcula el % final (recalibrado el 2026-09-30)

El % que ve el usuario = puntos realmente conseguidos ÷ 100 (los 5 pesos de la tabla de 3.9.3 suman 100 exactamente, y el test siempre responde las 5). **No hay suelo artificial ni tope inventado** — antes del 2026-09-30 el número se forzaba siempre a un rango falso 74-97%; ahora un match flojo puede salir 45% y uno perfecto, 100%, tal cual sale de la suma.

Hay 3 bonus aparte (`WEIGHTS.bonusEditorial` hasta 8 pts por popularidad AniList, `bonusEntradaClara` 4 pts, `bonusStreaming` 2 pts) que **solo desempatan el orden interno** (`score`, para decidir cuál franquicia gana cuando dos puntúan el mismo % de afinidad) — nunca se suman al % que se muestra en pantalla.

Verificación hecha antes de dar esto por bueno:
- Simulación de 500 combinaciones aleatorias de las 5 preguntas contra los datos reales: 0 errores de ejecución, match real entre 47% y 100%, mediana 82%.
- Comprobación exhaustiva de **las 11.880 combinaciones posibles** (11 vibra × 3 formato × 10 mundo × 12 motor × 3 época): solo el 0.61% (72 combinaciones) se queda sin ningún resultado; **329 de las 388 franquicias (84.8%) llegan a ser la recomendación #1 en al menos una combinación** (cifra tras el arreglo del desempate de 3.9.6 — antes eran 325/83.8%) — las 59 restantes nunca ganan (siempre hay otra que las supera cuando ambas encajarían), aunque sí pueden salir como alternativa en 2º o 3º puesto.
- Caso real verificado a mano: con Adrenalínica / Película / Actual-realista / Acción y combates / Clásica, Ghost in the Shell (1995) sale con 93% — 28/28 vibra (exacta) + 11/18 mundo (por el respaldo de sinónimos, ya que AniList la tiene etiquetada "urban" aunque su mundo editorial real es "Ciencia ficción futurista") + 24/24 motor (exacta) + 18/18 formato + 12/12 época = 93/100. Con su etiqueta real de mundo el resultado sube a 100%.
- El resultado es determinista: no hay ningún elemento aleatorio en el cálculo — las mismas 5 respuestas dan siempre la misma recomendación, en el mismo orden.

#### 3.9.5 Los 22 casos de confianza media/baja — resueltos el 2026-09-30

Revisados uno a uno contra sus etiquetas, géneros y sinopsis completos. **8 se corrigieron:**

| Franquicia | Cambio |
|---|---|
| death-parade | Quitada "Otro mundo / isekai" — el bar-limbo entre mundos no es el isekai clásico, y forzar esa etiqueta confundía a quien busca isekai de verdad. Se queda sin etiqueta de mundo (ninguna de las 10 encaja con honestidad). |
| summer-wars | Quitada "Deporte y competición" — el hanafuda/béisbol familiar es una escena, no el motor real de la obra. |
| my-happy-marriage | Quitada "Guerra / militar" (mundo) — tenía 3 etiquetas de mundo a la vez; la profesión militar del marido es rasgo de personaje, no ambientación bélica real. Se queda con Histórico + Sobrenatural urbano. |
| gate | Añadida "Otro mundo / isekai" (mundo), además de "Guerra / militar" que ya tenía — es genuinamente las dos cosas a la vez (JSDF luchando en otro mundo), no hacía falta elegir solo una. |
| inuyasha | Añadida "Fantasía" (mundo), además de "Histórico" — el Japón feudal con demonios es tan de fantasía como de época real, no hacía falta elegir solo una. |
| 91-days | Añadida "Contemplativa" (vibra), además de Oscura/Tensa — captura mejor el ritmo pausado de thriller de mafia que la vibra "Tensa" sola no transmitía del todo. |
| bludgeoning-angel-dokuro-chan | Añadida "Vida cotidiana" (motor) — no tenía ninguna etiqueta de motor; encaja como comedia episódica de instituto. |
| cosmic-princess-kaguya | Añadida "Fantasía" (mundo), además de "Ciencia ficción futurista" — es una reinterpretación de un cuento popular japonés, tan de fantasía como de ciencia ficción. |

Los otros **14 casos se revisaron y se dejaron tal cual** por estar ya bien justificados en su momento (classroom-of-the-elite, tower-of-god, to-your-eternity, danganronpa-the-animation, deadman-wonderland, elfen-lied, miru-tights-cosplay-satsuei-tights, to-be-hero-x, kubikiri-cycle-the-blue-savant-and-the-nonsense-user, loner-life-in-another-world, ningen-fushin-adventurers-who-don-t-believe-in-humanity-will-save-the-world, jack-of-all-trades-party-of-none, the-demon-sword-master-of-excalibur-academy, the-unwanted-undead-adventurer).

#### 3.9.6 El bug real detrás de las franquicias que nunca ganan — encontrado y corregido el 2026-09-30

Investigando por qué 63 franquicias nunca llegaban a ser la recomendación #1, apareció un fallo de diseño real, no solo "así es como funciona un ranking":

**El diagnóstico:** `WEIGHTS.bonusEditorial` (hasta 8 puntos por popularidad, pensado para desempatar) se calcula como `min(8, round(score_base / 3000 × 8))`. Como **las 388 franquicias del catálogo tienen `score_base` ≥ 6.731** (muy por encima de 3.000, por los umbrales de calidad del extractor, ver 4.3.2), **el 100% del catálogo llega siempre al tope de 8 puntos** — el bonus no diferencia absolutamente nada. Con ese bonus muerto, cuando dos franquicias empataban en `score` (algo frecuente: los pesos son números redondos de pocas combinaciones posibles, así que los empates exactos son habituales), el desempate real era **el orden en que aparecen en `animes.json`** — un accidente de cuándo se añadió cada una al catálogo, sin ningún criterio. Verificado con casos concretos: Your Name., Demon Slayer y Assassination Classroom (tres de los títulos más populares y mejor valorados del catálogo) nunca ganaban ninguna combinación pese a llegar a un match del 100%, por este motivo.

**El arreglo:** nueva función `compararEvaluaciones()` en `afinidad.js`, usada en el `.sort()` de `calcularResultado()` y `construirSnapshotDebug()`. Cuando dos franquicias empatan en `score`, desempata primero por `puntuacion_ponderada` (calidad real, la misma fórmula bayesiana de 3.5) y solo si eso también empata, por `score_base` (popularidad bruta) — nunca por el orden del archivo.

**Resultado verificado** (comprobación exhaustiva de las 11.880 combinaciones, antes/después): de las 63 franquicias que nunca ganaban, **12 pasaron a poder ganar al menos una vez**. Las que siguen sin ganar en su mayoría **no es un bug** — es el sistema funcionando bien: hay otra franquicia casi idéntica (mismo formato, misma época, mismas etiquetas o más) con una valoración igual o mejor. Dos ejemplos comprobados a mano:
- **Your Name.** (ponderada 84.7) siempre pierde contra **A Silent Voice** (ponderada 86.4), que tiene exactamente las mismas 5 etiquetas de Your Name. más 3 extra. Es correcto que gane la mejor valorada de las dos.
- **Demon Slayer** (ponderada 82.3) siempre pierde contra **Vinland Saga** (ponderada 84.8), que cubre todas sus etiquetas más 4 extra.

De paso, este análisis detectó que **Your Name.** estaba incompleta: le faltaba su elemento más distintivo (el intercambio de cuerpos/tiempo por un ritual sintoísta) — no tenía ninguna etiqueta de mundo que lo reflejara, solo "Escolar". Se le añadió **"Sobrenatural urbano"**, dándole un hueco propio donde ya no compite con A Silent Voice (que no tiene ningún elemento sobrenatural).

**Lo que se queda abierto, sin más acción por ahora:** Assassination Classroom sigue sin ganar ninguna combinación, pero no por dominación clara de una sola rival (no hay ninguna franquicia con sus mismas etiquetas y mejor valoración) — pierde por poco margen contra distintas franquicias según la combinación. Es un caso más difuso, de "competencia por reparto" más que de un rival claro que la eclipse; no se ha tocado, no es prioritario. El listado completo de las que aún no ganan puede regenerarse en cualquier momento si se quiere revisar más a fondo.

#### 3.9.7 Qué se podría mejorar todavía (honesto, no urgente)

- El diccionario de sinónimos de respaldo (`RELATED_TAGS`) puede dar coincidencias algo sueltas cuando se usa (ver el ejemplo de Ghost in the Shell/"urban" en 3.9.4) — se usa muy poco (bloqueo del 0.0% en vibra/mundo/motor confirma que casi todo se resuelve por etiqueta exacta), así que no es prioritario, pero conviene saber que existe ese margen de imprecisión.
- **El "secuestro de cabecera"** (frente 4, sección 5) sigue afectando indirectamente a la clasificación de formato/época de Afinidad, porque se lee de la entrada principal de la franquicia — mismo problema ya documentado para la Valoración (3.5), sin relación con las etiquetas.
- `WEIGHTS.bonusEditorial` sigue existiendo en el código aunque esté saturado para el 100% del catálogo (3.9.6) — es inofensivo (suma 8 puntos iguales a todos, no afecta al ranking) pero es peso muerto; no se ha eliminado porque no compensa el riesgo de tocarlo sin necesidad real, y el desempate ya no depende de él.
- Las ~59 franquicias que aún no ganan ninguna combinación (3.9.6) son mayoritariamente casos legítimos de "hay algo mejor casi idéntico", no bugs — revisarlas todas una por una sería trabajo de curación fino, no una corrección de código; se puede retomar si el usuario quiere en el futuro.

Con las 388 franquicias etiquetadas, el bug de `RELATED_TAGS` corregido, el % ya honesto y el desempate arreglado, Afinidad funciona como se diseñó: cruza tags editoriales reales, no descarta por una sola pregunta blanda, el número que ve el usuario es el resultado real del cálculo, y cuando hay empate gana la mejor valorada — no la que llegó antes al archivo.

### 3.10 Cómo ver el proyecto en el móvil (antes de tener hosting)

El proyecto no está publicado todavía (no hay hosting ni dominio, ver frentes de trabajo en la sección 5), así que para verlo en el móvil hay que servirlo desde tu propio ordenador. Dos formas, de más a menos sencilla.

**Esto no es específico de Espacio Anime** — sirve para cualquier proyecto futuro que sea una carpeta de archivos estáticos (HTML/CSS/JS, sin necesidad de backend): solo cambia la ruta del Paso 1 por la carpeta de ese otro proyecto.

**Requisito único:** tener Python instalado (ya lo tienes) — no hace falta instalar nada del proyecto, ni build step, ni dependencias.

#### Paso 1 (siempre) — levantar el servidor local

Abre una terminal (PowerShell) en la carpeta del proyecto (`C:\Users\Pc1\Desktop\espacio_anime`) y ejecuta:

```
python -m http.server 8000 --bind 0.0.0.0
```

Esto sirve todos los archivos del proyecto en `http://localhost:8000` desde tu propio PC. El `--bind 0.0.0.0` es importante: sin él, el servidor solo aceptaría conexiones del propio PC, no de otros dispositivos como el móvil. Déjalo corriendo en esa ventana (no la cierres mientras quieras seguir viéndolo).

#### Opción A — mismo Wi-Fi (rápida, pero puede chocar con el Firewall)

1. Con el móvil conectado **a la misma red Wi-Fi** que el PC, averigua la IP local del PC: en otra terminal, `ipconfig` y busca la línea "Dirección IPv4" del adaptador "Wi-Fi" (algo tipo `192.168.1.40`).
2. En el navegador del móvil, entra a `http://TU_IP:8000` (ej. `http://192.168.1.40:8000`).
3. **Si no carga (pantalla en blanco o no conecta):** casi seguro es el Firewall de Windows bloqueando la conexión entrante de otro dispositivo. Hay que permitirlo a mano — *Configuración → Privacidad y seguridad → Firewall de Windows Defender → Permitir una aplicación a través del firewall* → buscar/añadir Python → marcar "Privada". Claude no puede hacer este paso por ti: requiere permisos de administrador y es una configuración de seguridad del sistema.

#### Opción B — túnel público (funciona siempre, incluso con datos móviles, sin tocar el Firewall)

Si la Opción A no funciona o quieres probarlo fuera de casa, un túnel expone el servidor local con una URL pública temporal, sin cambiar nada del sistema. Requiere tener Node.js instalado (ya lo tienes). Con el servidor del Paso 1 ya corriendo, en otra terminal:

```
npx --yes localtunnel --port 8000
```

La primera vez tarda unos segundos en descargar la herramienta. Al terminar, imprime una línea `your url is: https://algo-aleatorio.loca.lt` — esa es la URL que abres en el móvil, desde cualquier red (Wi-Fi o datos). La primera vez que entres, `loca.lt` muestra un aviso ("Friendly reminder...") — dale a **"Click to Continue"** y ya carga la web.

Esta URL es pública mientras el túnel esté abierto (aleatoria y difícil de adivinar, pero no protegida por contraseña) — ciérrala cuando termines de probar (`Ctrl+C` en esa terminal, o cerrando la ventana).

#### Notas

- Ambos métodos sirven los archivos **tal cual están en el disco** — si editas un archivo y refrescas el móvil, ves el cambio al momento (puede hacer falta forzar recarga si el navegador cacheó algo).
- Ninguno de los dos es el sitio "en producción": son solo para probarlo desde tu propio ordenador antes de publicarlo de verdad (ver hosting en frentes de trabajo, sección 5).

____________________________________________________________________________________________________________________
## 4. EL EXTRACTOR
____________________________________________________________________________________________________________________

`tools/extractor-franquicias.html` es una herramienta aparte, **independiente del sitio público**, un único archivo HTML+JS sin build step (igual que el resto del proyecto). No lee ni escribe `animes.json` directamente: todo el trabajo ocurre en una variable en memoria del navegador (`bibliotecaFranquicias`), y la única forma de que llegue al sitio real es:

1. *(Opcional pero casi siempre necesario)* Cargar el `animes.json` actual con "Seleccionar animes.json" — rellena `bibliotecaFranquicias` con los datos reales. **Si no se hace este paso, se empieza de una biblioteca vacía — es el error más fácil de cometer**, y no es solo un problema de partir de cero: reconstruir una franquicia ya fusionada desde una biblioteca vacía puede **fragmentarla** (ver 4.2.3) o hacer que candidatos que ya conocías no se vuelvan a descubrir, porque el paso de fusión (4.2) solo funciona bien cuando reconoce lo que ya tienes.
2. Usar los botones del extractor, que leen y modifican esa variable en memoria. Ningún botón llama a la API salvo que la tabla de abajo diga lo contrario.
3. Pulsar "Descargar animes.json" — convierte `bibliotecaFranquicias` en un archivo `.json` descargable. No borra ni sobrescribe nada del proyecto por sí solo.
4. Sustituir a mano `assets/data/animes.json` del proyecto por el archivo descargado. Este es el único momento en que el catálogo real cambia — todo lo anterior es reversible sin más que no hacer este paso.

El extractor tiene cinco bloques de trabajo, pensados para usarse más o menos en este orden cuando se quiere ampliar el catálogo con criterio (secciones 4.1 a 4.5), más un bloque de mantenimiento aparte que se usa sobre lo que ya existe, no para traer cosas nuevas (4.4).

### 4.1 Bloque A — Traer candidatos (sourcing)

Estos botones **no crean ninguna ficha todavía**. Su único trabajo es rellenar el cuadro de texto "Mega-Lista a Procesar" con nombres de anime, sacados de AniList, sin tocar `bibliotecaFranquicias` en absoluto. Todos comparten el mismo patrón: piden página(s) de 50 resultados a la consulta `Page(page, perPage: 50) { media(...) { title { english romaji } } }`, sacan `title.english || title.romaji` de cada uno, y lo añaden a un `Set` — por eso nunca salen duplicados, ni entre sí ni con lo que ya hubiera escrito a mano en el cuadro.

#### 4.1.1 Los cinco botones TOP (`obtenerLista(tipo)`)

| Tipo | Orden AniList | Suelo `popularity_greater` | Tope actual (páginas) |
|---|---|---|---|
| `popular` (🔥 TOP 500 Populares) | `POPULARITY_DESC`, sin filtrar formato | Ninguno — cruza todos los formatos, así que su propio ranking ya es el filtro | 500 (10 páginas) |
| `movies` (🎬 TOP 100 Películas) | `POPULARITY_DESC`, `format: MOVIE` | 5.000 | 100 (2 páginas) |
| `tv_best` (⭐ TOP 300 Series TV) | `SCORE_DESC`, `format: TV` | 8.000 | 300 (6 páginas) |
| `onas` (📡 TOP 150 ONAs) | `POPULARITY_DESC`, `format: ONA` | 2.000 | 150 (3 páginas) |
| `ovas` (💿 TOP 150 OVAs) | `POPULARITY_DESC`, `format: OVA` | 2.000 | 150 (3 páginas) |

El suelo de popularidad importa sobre todo en Series TV, que ordena por nota media (`SCORE_DESC`) en vez de por popularidad: sin él, una serie con 4 votos y un 9/10 colaba como "top" aunque nadie la haya visto.

**Historial de estos topes** (por si hay que volver a tocarlos): originalmente 500/100/300/150/100, se bajaron a 300/60/150/40/40 el 2026-09-07 porque sin ningún filtro de calidad automático después, esa combinación llenó la base de relleno hasta 562 franquicias. El 2026-09-08 se subieron de nuevo a los de la tabla (ONAs y OVAs incluso por encima del histórico, por ser los formatos más escasos del catálogo real) porque ya existe el filtro de calidad de 4.3 para depurar lo que sobre — con eso, contener el volumen de entrada con topes bajos dejó de ser necesario.

**Resiliencia (añadida 2026-09-08):** con topes tan altos, este botón pasó a pedir muchas páginas seguidas, lo bastante como para que Cloudflare lo tratase como abuso y lo bloquease (el navegador lo reporta como un fallo de CORS engañoso, no como el bloqueo real que es). Se le añadió la misma lógica que ya usaban "Rellenar Enlaces" y "Actualizar Base de Datos": ante un bloqueo de red (`TypeError`/"Failed to fetch") o un HTTP 429, espera 65 segundos y reintenta esa misma página sin perder el progreso ya conseguido, en vez de abortar todo el botón.

**Aviso importante:** estos cinco botones **no filtran `isAdult`** en la consulta — a diferencia del botón de 4.1.2. Si algo para adultos se cuela por aquí (o se pega el título a mano), no se detecta hasta que "Actualizar Base de Datos" lo revise más tarde (4.4, arreglo 1).

#### 4.1.2 🌊 Traer candidatos masivos (`obtenerListaMasiva()`, añadido 2026-09-08)

Pensado para resolver el problema de "¿cuántas franquicias son las buenas?": en vez de fijar un número objetivo por formato (200, 300, 500...), la filosofía pasa a ser traer un pool grande y dejar que la **barra de calidad** (4.3) decida cuántas sobreviven — el mismo criterio de "curación, no volumen" que ya usa Descubrir (doc. 1.2).

Dispara **12 consultas** por combinación de formato × criterio de orden, todas con `isAdult: false` (a diferencia de los botones de 4.1.1, este si filtra adultos en la propia consulta):

| Formato | Por popularidad (`POPULARITY_DESC`) | Por nota media (`SCORE_DESC`) | Por tendencia (`TRENDING_DESC`) |
|---|---|---|---|
| Serie TV | 6 páginas, suelo 8.000 | 6 páginas, suelo 8.000 | 2 páginas, suelo 5.000 |
| Película | 4 páginas, suelo 5.000 | 4 páginas, suelo 5.000 | 2 páginas, suelo 3.000 |
| ONA | 4 páginas, suelo 2.000 | 4 páginas, suelo 2.000 | 2 páginas, suelo 1.000 |
| OVA | 4 páginas, suelo 2.000 | 4 páginas, suelo 2.000 | 2 páginas, suelo 1.000 |

(Páginas duplicadas el 2026-09-08 respecto a la versión original — mismo razonamiento que en 4.1.1: ya existe el filtro de calidad después, así que se puede sourcear con generosidad.) La consulta por tendencia usa un suelo más bajo a propósito, para no perderse algo bueno que aún no acumuló popularidad histórica.

**Resiliencia:** las 12 combinaciones × sus páginas se aplanan en una sola cola indexable (hasta 44 peticiones seguidas con los topes actuales) para poder reintentar una petición suelta sin repetir las que ya salieron bien — mismo patrón de hibernación de 65s que el resto.

**Bug corregido el 2026-09-08 (histórico, ya no reproducible):** la primera versión no tenía esta resiliencia y disparaba hasta 22 peticiones seguidas sin reintento, así que Cloudflare la bloqueaba por abuso a las pocas veces de usarla — el navegador lo reportaba como fallo de CORS, no como el bloqueo real que era.

### 4.2 Bloque B — Procesar e incorporar a la BD (`construirFranquicias()`)

Este botón es el que convierte los nombres de texto del cuadro de arriba en fichas de verdad dentro de `bibliotecaFranquicias`. Por cada título:

1. Lo busca en AniList por nombre.
2. Sigue sus relaciones (`relations.edges`) hasta dos niveles de profundidad, aceptando solo tipos de relación de una lista blanca (`relacionesValidas`: ADAPTATION, PREQUEL, SEQUEL, PARENT, SIDE_STORY, FRANCHISE, SPIN_OFF, ALTERNATIVE, SUMMARY, COMPILATION) — así agrupa temporadas, películas, OVAs y recaps de la misma familia, y descarta crossovers (`esCrossover()`) y relaciones débiles que no comparten palabras del título (`compartenPalabras()`) para no fusionar franquicias que no tienen nada que ver.
3. Decide si es una franquicia **nueva** o si **amplía una existente**, comparando por `ani_id`: si alguna entrada de la familia ya está en el array `entradas` de una franquicia cargada, se fusiona ahí; si no reconoce nada, crea una franquicia nueva desde cero.
4. Si la franquicia es nueva (o no tenía nota todavía), pide la puntuación a AniList (`actualizarPuntuacionAniList()`, ver 4.3.3).

**Ojo — esto NO sirve para poner al día una franquicia que ya conoces**: si el título ya es la raíz de una franquicia existente, el extractor la reconoce, la amplía con lo que falte, pero **no** vuelve a mirar activamente si tiene temporadas nuevas más allá de lo que la propia búsqueda ya trajo. Para una revisión sistemática de todo lo que ya tienes, está "Actualizar Base de Datos" (4.4, botón 5).

**Al ampliar una franquicia ya existente, se preservan** (nunca se pisan): `titulo_principal`, sinopsis ya escrita, `etiquetas_editoriales`, y `donde_ver`/`plataforma` de entradas que ya tenían un enlace real. **Se recalculan cada vez:** `imagen_principal` (salvo `?manual`, ver 3.7), `generos` (máx. 3), `tags_anilist`, `score_base`.

#### 4.2.3 El riesgo del "arranque en frío": por qué SIEMPRE hay que cargar la base real primero

Confirmado con una prueba real (2026-09-08): procesar candidatos sobre una biblioteca vacía puede **fragmentar** franquicias ya fusionadas — "Dragon Ball" (42 entradas reales, Dragon Ball + Z + GT + Super + películas, todo unido) reapareció como "Dragon Ball Z" suelta con solo 12 entradas al reconstruir desde cero, porque sin la franquicia ya cargada para reconocer, el árbol de relaciones no se reconstruye igual dos veces. Otros títulos (Your Name., Berserk, Pokémon, InuYasha, Digimon) directamente no volvieron a aparecer, porque el pool de candidatos de esa pasada no los volvió a traer. **Los Filtros 1 y 2 de la fórmula de calidad (4.3) no dependen de esto** — son por-franquicia, dan igual el tamaño de la base —, pero el Filtro 3 sí usa constantes (`C`/`m`) calculadas sobre lo que esté cargado en ese momento, y sobre todo, la fusión de franquicias (este bloque) depende completamente de partir de la base real. **Regla práctica: nunca uses el extractor sin cargar antes `animes.json`.**

### 4.3 Bloque C — La fórmula de calidad (`aplicarFormulaCalidad()`, 🧪 2. Aplicar fórmula de calidad, añadido 2026-09-08)

No llama a ninguna API — actúa solo sobre lo que ya está en `bibliotecaFranquicias` en ese momento (tu base real + lo que se acaba de fusionar en 4.2), y es instantáneo. Recorre cada franquicia y aplica tres filtros en este orden; si no pasa alguno, la quita de la lista en memoria (nada se borra del `animes.json` real hasta que descargas) y anota el motivo en el informe (`errorLog`) — **el informe solo vive en pantalla mientras la pestaña está abierta, no se guarda dentro del JSON.**

#### 4.3.1 Filtro 1 — ¿Tiene alguna temporada terminada?

`Array.isArray(f.entradas) && f.entradas.some(e => e.estado === 'Finalizado')`. Si **todas** las entradas están "En Emisión" o "Próximamente", se descarta — evita que un estreno reciente entre solo por tener mucho hype/votos sin haber demostrado nada todavía. Al usar `.some()` sobre **todas** las entradas de la franquicia (no solo la cabecera), esto funciona bien incluso con series que llevan décadas emitiéndose como Detective Conan o One Piece: en AniList cada arco/película/especial es una entrada `Finalizado` aparte, y solo la más reciente está `En Emisión` — verificado contra el catálogo real, ambas franquicias pasan sin problema.

#### 4.3.2 Filtro 2 — ¿Llega al mínimo de votos de su formato?

Constante `UMBRALES_CALIDAD`, con umbrales de partida calibrados contra los mínimos reales del catálogo ya curado a mano (2026-09-08) — **no es un cálculo exacto, son ajustables** si tras usarlos pasan demasiadas o muy pocas franquicias:

| Formato | Votos mínimos | Ponderada mínima |
|---|---|---|
| Serie TV / Serie Corta | 5.000 | 68 |
| Película | 5.000 | 70 |
| ONA | 4.000 | 68 |
| OVA | 3.000 | 65 |

**Excepción por antigüedad** (`obtenerUmbralConAntiguedad()`, escalonada desde el 2026-09-09): el suelo de votos baja en tres tramos según `entrada_principal_ano`, en vez de un salto brusco en el año 2000:

| Antigüedad | Suelo de votos |
|---|---|
| Antes de 2000 | 1.500 (como máximo) |
| 2000-2010 | 3.000 (como máximo) |
| 2011 en adelante | El suelo normal de su formato (tabla de arriba) |

AniList es una plataforma moderna con muchos menos votantes para clásicos de los 70-90 (Mazinger Z, Doraemon, Star Blazers...) que para anime reciente, sin que eso diga nada sobre su calidad — sin la excepción pre-2000, la fórmula habría purgado 9 clásicos legítimos en la primera simulación contra el catálogo real. El tramo intermedio 2000-2010 se añadió porque esa década también arrastra bastante menos votos que la era posterior a Sword Art Online/Attack on Titan (2011+), y un salto de golpe en la frontera del año 2000 era arbitrario. Si aun con el suelo rebajado un clásico (pre-2000) sigue sin pasar, el informe lo marca aparte con `⚠️ CLÁSICO (revisar a mano)` para que reciba doble revisión antes de darlo por descartado — puede ser una obra de nicho, no relleno.

**Sobre subir estos números con el tiempo:** ver Frente de trabajo abierto en la sección 5 — el suelo de votos es un número fijo que se irá quedando corto según AniList gane usuarios, así que hay que revisarlo cada cierto tiempo, igual que ya se hace con `popularity_greater`.

#### 4.3.3 Filtro 3 — ¿Llega al mínimo de `puntuacion_ponderada`?

Es la misma fórmula bayesiana tipo IMDb/Steam ya documentada en 3.5, repetida aquí con el detalle del arreglo que hizo falta:

```
puntuacion_ponderada = (v / (v+m)) × R + (m / (v+m)) × C
```
- `R` = `puntuacion_media` de la franquicia (nota de AniList, 0-100)
- `v` = `votos_total` de la franquicia
- `C` = nota media de TODA la biblioteca cargada en ese momento
- `m` = mediana de votos de TODA la biblioteca cargada en ese momento

`C` y `m` los calcula `calcularConstantesPonderacion()` cada vez, a partir de las franquicias que ya tengan `puntuacion_media` y `votos_total` válidos — por eso se autoajustan solos según crece la biblioteca, sin que haga falta tocar nada a mano. Con menos de 10 franquicias puntuadas cargadas, la función devuelve `null` y no hay base suficiente para calcular nada.

**Importante — de dónde sale `R` y `v`:** no son un promedio de todas las temporadas de la franquicia. `actualizarPuntuacionAniList()` (al Procesar) y el refresco de puntuación en "Actualizar Base de Datos" (4.4) piden la nota **solo de la entrada principal** (`Media(id: entrada_principal_ani_id)`), y esa nota se convierte en la nota de toda la franquicia. Si la Temporada 1 es una obra maestra pero un spin-off mediocre le "roba" la cabecera por ser mucho más popular (regla 1 de `elegirCabeceraAutomatica()`, doc. 3.3), la franquicia entera hereda la nota del spin-off. Ver Frente de trabajo abierto en la sección 5 — necesita ampliar qué se guarda por entrada, no es un ajuste de esta fórmula.

**Bug corregido el 2026-09-08 — el "arranque en frío":** `calcularConstantesPonderacion()` exige al menos 10 franquicias puntuadas para funcionar. Si se procesa una tanda de golpe desde una biblioteca vacía o casi vacía, las primeras ~10 franquicias que se puntúan se quedan con `puntuacion_media`/`votos_total` pero sin `puntuacion_ponderada` para siempre, porque nada las revisita después. Verificado con datos reales: le pasó exactamente a Attack on Titan, Demon Slayer, Jujutsu Kaisen, Death Note, My Hero Academia, Hunter x Hunter, One-Punch Man, One Piece, Tokyo Ghoul y Fullmetal Alchemist Brotherhood (los más populares, procesados primero) en una prueba desde cero. `aplicarFormulaCalidad()` ya no las descarta por este motivo: si detecta `puntuacion_media`/`votos_total` válidos pero `puntuacion_ponderada` ausente, la calcula ahí mismo con la misma fórmula antes de decidir.

#### 4.3.4 Qué pasa con lo que sobrevive y lo que no

Lo que pasa los tres filtros se queda en `bibliotecaFranquicias` tal cual. Lo que no pasa se quita de la lista en memoria y aparece en el informe (`errorLog`) con el motivo exacto (sin temporada terminada / votos insuficientes / ponderada insuficiente), marcado aparte con `⚠️ CLÁSICO (revisar a mano)` si es de antes del año 2000 y aun así no llega. **El informe es la única ventana de revisión**: como las franquicias descartadas no llegan a estar en el `animes.json` final, no hay forma de buscarlas después dentro del archivo — hay que fijarse en el informe en el momento, antes de descargar, si se quiere rescatar algo.

### 4.4 Bloque D — Mantenimiento y sincronización (orden real desde el 2026-09-07)

A diferencia de los bloques A-C (traer y decidir qué entra de nuevo), estos botones actúan sobre lo que **ya tienes** cargado, sin añadir franquicias nuevas (salvo el 5, que sí puede descubrir temporadas nuevas de algo que ya conocías).

| # | Botón | Qué hace | Llama a una API |
|---|---|---|---|
| 1 | Limpiar / Actualizar campos | Normaliza título e id, sincroniza campos calculados solos (totales, géneros, tags). No toca nada puesto a mano. | No — por eso tarda ~1 segundo con el catálogo completo, no es un fallo. |
| 2 | Recalcular Portadas | Sustituye `imagen_principal` por la portada de AniList de la entrada principal en resolución grande, salvo `?manual` (ver 3.7). | No — reescribe una URL ya existente, también ~1 segundo. |
| 3 | Rellenar Enlaces de Streaming | Ver 3.6: consulta AniList por cada entrada principal sin enlace real y aplica la prioridad de plataformas. Nunca toca una entrada que ya tenga un enlace real. | Sí, AniList — tarda varios minutos con el catálogo completo. |
| 4 | Rellenar Títulos (JP/EN/ES) — añadido 2026-09-07 | Completa `titulos_alternativos`: primero, gratis y sin llamar a nada, el `titulo_rom`/`titulo_eng` que ya trae la entrada principal si no se habían copiado; después, una consulta a **Jikan** (MyAnimeList, no AniList) por el `mal_id` de esa entrada, para sacar su título romaji ("Default"), inglés y español cuando existan. Nunca toca `titulo_principal` ni borra ningún alias — solo añade lo que falte. | Sí, Jikan — tarda varios minutos. |
| 5 | Actualizar Base de Datos (`actualizarBaseDeDatos()`) | La herramienta para poner al día franquicias que ya tienes. Repasa TODAS las cargadas con una sola consulta a AniList por franquicia (con relaciones, igual que Procesar): descubre entradas nuevas, refresca estado/episodios/popularidad/**formato** de las que ya tenía, refresca SIEMPRE puntuación media/votos/valoración ponderada (a diferencia de Procesar, que solo la rellena si faltaba), recalcula totales. Nunca toca: id, título, géneros, sinopsis, imagen, streaming, etiquetas, ni cuál entrada es la principal (solo su formato, si cambió). | Sí, AniList — tarda varios minutos. |
| — | *(separados en la UI, bloque "Etiquetas")* | | |
| 6 | Auto-generar Etiquetas | El nombre dice "IA" pero es una tabla fija de reglas (si tiene género Acción → añade "Adrenalínica", si tiene el tag "isekai" → añade "Otro mundo / isekai", etc.). Determinista, sin ningún modelo detrás. Punto de partida, no sustituto de la revisión manual. | No. |
| 7 | Revisar Etiquetas Manualmente | Abre un editor con una fila por franquicia para corregir `etiquetas_editoriales` a mano. Esto es lo que alimenta a Afinidad. | No. |

#### 4.4.1 Los tres arreglos de fiabilidad de "Actualizar Base de Datos" (2026-09-09)

Surgieron de un repaso sistemático de casos límite (qué pasa si AniList borra un ID, reclasifica un formato, marca algo como adulto...). Los tres viven dentro de la misma función, sin tocar Procesar ni la fórmula de calidad:

1. **Aviso de contenido +18, sin purga automática.** La consulta ahora pide también `isAdult`. Si la entrada principal de una franquicia aparece marcada como adulta en AniList, **no se borra sola**: se deja tal cual y queda marcada en el informe con `🔞 REVISAR (marcada como +18 en AniList)` para que decidas tú caso por caso. Se decidió así porque `isAdult` no es un campo infalible — puede marcar como adulto un título con violencia extrema o contenido polémico que en realidad es una obra legítima ("brutal", en palabras del usuario), y un borrado automático por un solo campo de clasificación se la comería sin que nadie se enterara. Mismo criterio que `⚠️ CLÁSICO`: avisar, nunca decidir en tu lugar.
2. **Formato al día.** Antes, si AniList reclasificaba una entrada (ej. de ONA a Película), el campo `tipo` de esa entrada se quedaba congelado con el valor viejo para siempre, y el Filtro 2 de la fórmula de calidad (que decide el umbral de votos/nota según `entrada_principal_tipo`) seguía aplicando el suelo equivocado sin enterarse. Ahora se refresca `tipo` en cada entrada con el dato fresco de AniList, y si cambia el de la propia cabecera, también `entrada_principal_tipo` — con aviso en el informe (`🔄 FORMATO CAMBIADO`).
3. **IDs huérfanos con aviso.** Si AniList devuelve `null` para una entrada (borrada, fusionada con otra, etc.), el código ya comprobaba `if (!anime) continue` y no crasheaba, pero lo saltaba en silencio. Ahora además queda registrado en el informe con `⚠️ ID HUÉRFANO (borrado por AniList)` en vez de desaparecer sin dejar rastro.

**Recordatorio importante:** igual que el informe de la fórmula de calidad (4.3.4), estos avisos (`🔞`, `🔄`, `⚠️`) **solo se ven en pantalla mientras la pestaña del extractor está abierta** — no se guardan como campo dentro del `animes.json`. Si quieres localizarlos más tarde, tiene que ser mirando el informe en el momento en que corres el botón, no buscando dentro del archivo descargado.

### 4.5 Descargar y sustituir

Al terminar cualquier botón, **Descargar animes.json** convierte `bibliotecaFranquicias` en el archivo final. Hay que sustituir a mano `assets/data/animes.json` del proyecto por ese archivo descargado para que el cambio llegue al sitio — es el único paso de todo el proceso que de verdad modifica el catálogo público.

### 4.6 Guía rápida — qué tocar según lo que quieras cambiar

| Quiero... | Tocar |
|---|---|
| Subir o bajar el suelo de votos/nota de un formato | `UMBRALES_CALIDAD` (4.3.2) |
| Cambiar los tramos de antigüedad o sus suelos rebajados | `obtenerUmbralConAntiguedad()` (4.3.2) |
| Traer más o menos candidatos de golpe | `combosMasivos` dentro de `obtenerListaMasiva()` (4.1.2), o los `paginas`/`objetivo` de `obtenerLista()` (4.1.1) |
| Cambiar qué cuenta como "temporada terminada" | El `.some(e => e.estado === 'Finalizado')` del Filtro 1 (4.3.1) |
| Tocar la fórmula de valoración en sí (no los umbrales) | `calcularConstantesPonderacion()` y el cálculo de `ponderada` — aparece en tres sitios que hay que mantener sincronizados: `actualizarPuntuacionAniList()`, `actualizarBaseDeDatos()` y el relleno en frío dentro de `aplicarFormulaCalidad()` |
| Cambiar qué formato prioriza la cabecera de una franquicia | `elegirCabeceraAutomatica()` (doc. 3.3) — cuidado, lo usan tanto Procesar como Actualizar Base de Datos |
| Ajustar los tiempos de espera/reintento ante bloqueos | **No tocar sin necesidad real** (ver nota de la sección 5) — 65 segundos es el valor ya probado en los cinco sitios que lo usan |

### 4.7 Manual de operaciones — flujos de trabajo completos

Recetas paso a paso para las tareas más habituales. En todas, el primer paso es siempre el mismo y no se repite en cada receta: **abrir `tools/extractor-franquicias.html` y cargar el `animes.json` real con "Seleccionar animes.json"** (4.2.3 — nunca empezar de una biblioteca vacía).

**a) Quiero añadir un anime concreto que sé que falta**
1. Escribe su título (en inglés o romaji, es lo que mejor encuentra AniList) en el cuadro de texto "Mega-Lista a Procesar", o pégalo si son varios, uno por línea.
2. Pulsa "📦 Procesar e incorporar a la BD" (4.2).
3. Revisa el "Visor del Archivo JSON" para confirmar que se creó o amplió la franquicia esperada.
4. *(Opcional)* Pulsa "🧪 Aplicar fórmula de calidad" (4.3) si quieres que se valide contra los umbrales igual que el resto del catálogo.
5. "💾 Descargar animes.json" y sustituye a mano `assets/data/animes.json` (4.5).

**b) Quiero ampliar el catálogo con criterio, sin saber exactamente qué falta**
1. Pulsa "🌊 Traer candidatos masivos" (4.1.2) y/o cualquiera de los cinco TOP clásicos (4.1.1) — se pueden combinar, se van sumando sin duplicar.
2. Pulsa "📦 Procesar e incorporar a la BD" (4.2). Con topes altos, puede tardar varios minutos y pasar por alguna hibernación de 65s — es normal.
3. Pulsa "🧪 Aplicar fórmula de calidad" (4.3).
4. Repasa el informe: presta atención sobre todo a lo marcado `⚠️ CLÁSICO (revisar a mano)` — es tu única oportunidad de rescatarlo, porque si descargas ahora ya no estará en el archivo (4.3.4).
5. Si quieres rescatar algo del informe, vuelve a escribir su título en el cuadro de texto y repite desde el paso 2 (así se vuelve a procesar y ya no lo tocará el filtro de votos si tú decides que se quede — aunque si sigue sin llegar al umbral, seguirá apareciendo marcado la próxima vez que apliques la fórmula).
6. "💾 Descargar animes.json" y sustituye a mano.

**c) Quiero poner al día lo que ya tengo (estados, episodios, notas, temporadas anunciadas)**
1. Pulsa "🔄 Actualizar Base de Datos" (4.4, botón 5). Tarda varios minutos con el catálogo completo.
2. Repasa el informe buscando `🔞 REVISAR`, `🔄 FORMATO CAMBIADO` y `⚠️ ID HUÉRFANO` (4.4.1) — decide a mano qué hacer con cada `🔞`, los otros dos son solo informativos.
3. "💾 Descargar animes.json" y sustituye a mano.

**d) Quiero corregir enlaces de streaming, portadas o títulos alternativos**
1. Botón 3 (Rellenar Enlaces de Streaming), botón 2 (Recalcular Portadas) o botón 4 (Rellenar Títulos JP/EN/ES) según lo que toque (4.4) — se pueden pulsar varios seguidos.
2. "💾 Descargar animes.json" y sustituye a mano.

**e) Ciclo de mantenimiento recomendado (cada cuánto tiempo hacer qué)**

| Frecuencia sugerida | Qué hacer | Por qué |
|---|---|---|
| Cuando te apetezca ampliar el catálogo | Receta (b) completa | No hay una cadencia fija — es trabajo de curación, no una tarea automática |
| Cada 1-2 meses | Receta (c), "Actualizar Base de Datos" | Para que estados, episodios y notas no se queden desactualizados, y para pillar temporadas nuevas anunciadas de franquicias que ya tienes |
| Cada vez que "Rellenar Enlaces" deje algo en "Pendiente" tras un estreno reciente | Botón 3 | AniList tarda en registrar los enlaces de streaming de lo recién estrenado |
| Una vez al año, o si notas que entra relleno reciente con facilidad | Revisar a mano `UMBRALES_CALIDAD` (4.3.2) y los `popularity_greater` de 4.1 | Ver Frente de trabajo abierto, sección 5, punto 3 — son números fijos que pierden fuerza según AniList gana usuarios |
| Cuando se retome el trabajo de Afinidad | Botón 6 (Auto-generar Etiquetas) + botón 7 (Revisar Etiquetas Manualmente) | Pendiente pospuesto, sección 5, punto 1 |

_____________________________________________________________________________________________________________________________
## 5. FRENTES DE TRABAJO ABIERTOS
_____________________________________________________________________________________________________________________________
1. **Etiquetas de Descubrir/Afinidad — CERRADO DEL TODO el 2026-09-30.** Las 389 franquicias tienen `etiquetas_editoriales` (ver 2.1/3.9). Además, el bloque "Elige según lo que te apetezca hoy" de las 24 listas de Descubrir ahora usa esas mismas etiquetas reales en vez de texto editorial inventado: 106 botones repartidos en 20 archivos (`grandes-estudios.html`, `reyes-por-genero.html`, `sellos-de-autor.html` y `pilares-de-cada-generacion.html` no tienen ese bloque — están organizados por estudio/género/director/década en su lugar, así que no aplica). Verificado que las 106 etiquetas puestas existen literalmente en `etiquetas_editoriales` de esa franquicia (0 inventadas), que no se rompió ningún enlace (446 referencias, 0 rotas) y que las 24 páginas cargan bien. Las tarjetas "Recomendación 1/2" de arriba y la parrilla de abajo de cada lista no se tocaron — sus etiquetas siguen siendo copy editorial libre, a propósito.

2. **"Monster" (Naoki Urasawa) — CERRADO DEL TODO el 2026-09-30.** El usuario lo añadió con el extractor (Serie TV, 2004, 74 episodios, puntuación 88, `id_franquicia: monster`). Etiquetado con el mismo criterio del resto del catálogo: Oscura, Cerebral, Tensa / Actual / realista / Investigación y misterio, Crimen y bajos fondos, Política y estrategia. Confirmado que las 5 referencias que había en Descubrir a este id ya resuelven bien (0 enlaces rotos en las 24 listas). Catálogo actual: **389 franquicias**, las 389 con `etiquetas_editoriales`.

3. **Inflación de votos con el tiempo — mantenimiento periódico, no un bug. Marcado como fase futura por decisión del usuario (2026-09-30) — no se ha tocado `UMBRALES_CALIDAD` en esta sesión, sigue con los valores de 4.3.2.** Los umbrales de votos de `UMBRALES_CALIDAD` (4.3.2 — 5.000 para Serie TV/Película, 4.000 ONA, 3.000 OVA) son números fijos. AniList gana usuarios con el tiempo, así que un anime mediocre de dentro de un par de años llegará a esos números sin esfuerzo y el filtro perderá fuerza poco a poco — no de golpe, pero sí de forma constante. No es algo que compense automatizar ahora (un umbral que se mueve solo añadiría complejidad para un problema que hoy no existe todavía): la mediana `m` de la fórmula de valoración (4.3.3) ya se autoajusta sola con el tamaño de la biblioteca, así que parte del problema se corrige sin hacer nada. Lo que sí hay que hacer de vez en cuando (igual que ya se hace con `popularity_greater` en 4.1.1) es **revisar a mano y subir estos números cada cierto tiempo** — por ejemplo, si dentro de un año o dos el catálogo se empieza a llenar de anime mediocre reciente que antes no habría pasado el filtro, es la señal de que toca subirlos.

4. **El "secuestro de cabecera" — CERRADO el 2026-09-30, se deja tal cual está, decisión final del usuario.** Se revisó con datos reales antes de decidir: la regla solo se activa en 18 de las 389 franquicias, y en la gran mayoría (Fullmetal Alchemist: Brotherhood, Hunter x Hunter 2011, Devilman Crybaby, Dororo 2019, Fruits Basket 2019...) hace exactamente lo correcto — sin ella, esas franquicias mostrarían la versión antigua/menos vista en vez de la que todo el mundo conoce. El caso que preocupaba (un spin-off mediocre "robando" la cabecera a una obra maestra) no se ha dado nunca en el catálogo real. Confirmado además que franquicias con muchísimas entradas como One Piece no dependen de esta regla — ya ganan por formato (Serie TV) sin necesidad de popularidad. No tocar sin motivo real nuevo. Cada franquicia muestra una sola nota para representarla entera (la "Valoración" del doc. 3.5), y esa nota **no es una media de todas sus temporadas** — es literalmente la nota de una única entrada, la "cabecera", elegida por `elegirCabeceraAutomatica()` (doc. 3.3). Normalmente la cabecera es la Temporada 1 (la más antigua, o la de formato más importante). Pero hay una excepción ya programada: si **cualquier otra entrada** de esa franquicia se vuelve muchísimo más popular (más de 50.000 de diferencia en popularidad de AniList), esa pasa a ser la cabecera, sin importar que sea un spin-off, una película recopilatoria, lo que sea.

   El riesgo: imagina que la Temporada 1 de una franquicia es una obra maestra (nota 90) pero un spin-off mediocre (nota 55) se vuelve viral y su popularidad supera a la Temporada 1 por más de 50.000. Ese spin-off pasa a ser la cabecera, y **toda la franquicia hereda su nota mala (55)** — el Filtro 3 de la fórmula de calidad (4.3.3) vería un 55 y podría descartar la franquicia entera, obra maestra incluida, sin que nadie se entere de que el problema real era solo el spin-off.

   Por qué no se puede arreglar hoy: cada entrada de una franquicia solo guarda su **popularidad** (`popularidad`), nunca su propia **nota** — la nota solo existe a nivel de franquicia entera, sacada de la cabecera. No hay forma de preguntarle a los datos "¿hay alguna otra entrada aquí dentro con nota alta que se está tapando?" porque ese dato ni se pide ni se guarda en ningún sitio. Arreglarlo de verdad significaría ampliar las consultas GraphQL de "Procesar" (4.2) y "Actualizar Base de Datos" (4.4) para pedir y guardar la nota de cada entrada individual, no solo de la principal — un cambio de esquema más grande que tocaría varias funciones a la vez, no un simple ajuste de umbral. **Es un inconveniente menor** (necesita una combinación bastante concreta de circunstancias para darse: un spin-off mediocre, mucho más popular, con una diferencia superior a 50.000) — queda anotado para una sesión aparte si se quiere ir a por ello, sin prisa.

**NOTA (no es una tarea, es información permanente sobre cómo se comporta AniList).** Hay dos tipos de bloqueo distintos y ninguno es un bug del extractor:
   - **429 por rate-limit**: el extractor dispara peticiones a un ritmo que satura AniList temporalmente. Ya tiene ajustada a mano una lógica de espera/reintentos (`sleep`, `fetchConRetryCorto`, hibernaciones de 65s en 429) para manejarlo — **no tocar esa lógica de tiempos sin necesidad real**, cuesta mucho ajustarla bien y cualquier cambio descuidado vuelve a provocar los bloqueos.
   - **403 "temporarily disabled due to severe stability issues"**: caída real del servicio completo de AniList, confirmada el 2026-09-07 con una consulta trivial sin relación con nada que estuviéramos pidiendo (ni rate-limit ni búsqueda concreta). Cuando pasa esto, **ninguna** búsqueda funciona en el extractor (afecta a los botones 3 y 5, que llaman a AniList; el 1, 2 y 4 no, son locales o Jikan) — no es que un título "no exista" o "tenga otro nombre", es que AniList está caída para todo el mundo. Esperar y reintentar más tarde, no tocar el código.

_____________________________________________________________________________________________________________________________

*Fin del documento. Vive fuera del código del sitio; actualízalo cuando cambie cómo funciona algo de esto.*
