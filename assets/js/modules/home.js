import { getAnimes } from './anime-data.js?v=9711ea3d94';

// Franquicias con una entrada "Próximamente" y año de estreno conocido (año > 0),
// ordenadas por la más cercana primero y, a igualdad de año, por popularidad. Salen
// siempre de franquicias que YA están en el catálogo (se recorre `animes`, no una
// fuente externa), así que siempre tienen ficha real a la que llevar al hacer clic.
function obtenerProximamente(animes, limite = 8) {
  const candidatos = [];

  for (const franquicia of animes) {
    if (!Array.isArray(franquicia.entradas)) continue;

    const proximas = franquicia.entradas
      .filter((e) => e.estado === 'Próximamente' && Number(e.año) > 0)
      .sort((a, b) => Number(a.año) - Number(b.año));

    if (proximas.length === 0) continue;

    const entrada = proximas[0];
    candidatos.push({
      id: franquicia.id_franquicia,
      titulo: franquicia.titulo_principal || entrada.titulo || '',
      año: Number(entrada.año),
      popularidad: Number(franquicia.score_base) || 0,
      imagen: entrada.imagen_propia || franquicia.imagen_principal || '',
    });
  }

  candidatos.sort((a, b) => a.año - b.año || b.popularidad - a.popularidad);
  return candidatos.slice(0, limite);
}

function renderNovedades(items) {
  return items
    .map(
      (item) => `
        <div class="w-28 lg:w-32 shrink-0 cursor-pointer group"
             title="${escapeHtml(item.titulo)} (${item.año})"
             onclick="abrirModalFranquicia('${item.id}')">
          <div class="aspect-[2/3] rounded-md overflow-hidden bg-gray-900 border border-white/10 group-hover:border-white/40 transition-colors">
            <img src="${escapeHtml(item.imagen)}" alt="${escapeHtml(item.titulo)}" loading="lazy"
                 class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity">
          </div>
        </div>
      `
    )
    .join('');
}

function escapeHtml(text = '') {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export async function initHomeNovedades() {
  const container = document.getElementById('novedades-strip');
  if (!container) return;

  try {
    const animes = await getAnimes();
    const items = obtenerProximamente(animes, 6);
    if (items.length === 0) {
      container.closest('section')?.classList.add('hidden');
      return;
    }
    container.innerHTML = renderNovedades(items);
  } catch (error) {
    console.error('Error cargando Próximamente:', error);
    container.closest('section')?.classList.add('hidden');
  }
}
