import { getAnimes } from './anime-data.js?v=9711ea3d94';
import { platformData, resolverEnlaceVer, obtenerEntradaPrincipal } from './plataformas.js?v=9711ea3d94';
import { resolvePath } from './config.js?v=9711ea3d94';
import { escaparHtml } from './mi-espacio.js?v=9711ea3d94';

export const NAV_STORAGE_KEY = 'ea_ficha_nav_order';
// Cuántos saltos de flecha ← → separan la ficha actual de la página de
// origen (el catálogo/lista con sus filtros). "← Atrás" usa este número para
// volver directo a esa página con history.go(-n), en vez de deshacer ficha a
// ficha las flechas ya usadas.
export const DEPTH_STORAGE_KEY = 'ea_ficha_nav_depth';

// Ids de las fichas visibles en la página actual, en el mismo orden en que se
// muestran (respeta cualquier filtro/orden ya aplicado), a partir de los
// onclick="abrirModalFranquicia('...')" presentes en el DOM en ese momento.
function getVisibleFranquiciaIdsFromDOM() {
  const ids = [];
  document.querySelectorAll('[onclick*="abrirModalFranquicia("]').forEach((el) => {
    const match = el.getAttribute('onclick').match(/abrirModalFranquicia\('([^']+)'\)/);
    const id = match?.[1];
    if (id && !ids.includes(id)) ids.push(id);
  });
  return ids;
}

function getFichaElements() {
  return {
    image: document.getElementById('modalImg'),
    title: document.getElementById('modalTitulo'),
    genres: document.getElementById('modalGeneros'),
    year: document.getElementById('modalAno'),
    synopsis: document.getElementById('modalSinopsis'),
    buttons: document.getElementById('modalBotonesPrincipales'),
    entries: document.getElementById('modalEntradas'),
  };
}

function renderMiEspacioBar(idFranquicia) {
  const guardado = window.miEspacioGetEntry ? window.miEspacioGetEntry(idFranquicia) : null;
  const estadoActivo = guardado?.estado || null;
  const favoritoActivo = !!guardado?.favorito;
  const noMeGustaActivo = !!guardado?.noMeGusta;

  const botonEstado = (estado, label, svgPaths, activo, colorActivo) => `
    <button onclick="miEspacioToggleEstado('${idFranquicia}','${estado}'); window.dispatchEvent(new Event('ficha:refrescar'));"
      class="flex flex-col items-center gap-2 transition-colors ${activo ? colorActivo : 'text-[#A0AECA] hover:text-white'}">
      <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">${svgPaths}</svg>
      <span class="text-[10px] font-bold uppercase tracking-widest">${label}</span>
    </button>
  `;

  // En escritorio, los 5 botones en una fila; en móvil no caben, así que van los
  // 3 estados arriba y Favorito/No me gusta debajo (con sm:contents las dos
  // filas desaparecen y los botones pasan a ser una sola fila). Debajo de todo,
  // el botón de Listas.
  return `
    <div class="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-around sm:gap-0">
    <div class="flex items-center justify-around sm:contents">
    ${botonEstado('quiero_ver', 'Pendiente',
      '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>',
      estadoActivo === 'quiero_ver', 'text-orange-400')}
    ${botonEstado('viendo', 'Viendo',
      '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>',
      estadoActivo === 'viendo', 'text-blue-400')}
    ${botonEstado('vistos', 'Completado',
      '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>',
      estadoActivo === 'vistos', 'text-emerald-400')}
    </div>
    <div class="flex items-center justify-around sm:contents">
    <button onclick="miEspacioToggleFavorito('${idFranquicia}'); window.dispatchEvent(new Event('ficha:refrescar'));"
      class="flex flex-col items-center gap-2 transition-colors ${favoritoActivo ? 'text-red-500' : 'text-[#A0AECA] hover:text-white'}">
      <svg class="w-7 h-7" fill="${favoritoActivo ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
      </svg>
      <span class="text-[10px] font-bold uppercase tracking-widest">Favorito</span>
    </button>
    <button onclick="miEspacioToggleNoMeGusta('${idFranquicia}'); window.dispatchEvent(new Event('ficha:refrescar'));"
      class="flex flex-col items-center gap-2 transition-colors ${noMeGustaActivo ? 'text-gray-200' : 'text-[#A0AECA] hover:text-white'}">
      <svg class="w-7 h-7" fill="${noMeGustaActivo ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3zm7-13h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17"></path>
      </svg>
      <span class="text-[10px] font-bold uppercase tracking-widest">No me gusta</span>
    </button>
    </div>
    </div>
    ${renderBotonListas(idFranquicia)}
  `;
}

// El desplegable de Listas sigue abierto al marcar/crear una lista (la barra se
// vuelve a pintar entera con ficha:refrescar) y se cierra al pulsar fuera.
let panelListasAbierto = false;

function renderBotonListas(idFranquicia) {
  const listas = window.miEspacioGetListas ? window.miEspacioGetListas() : [];
  const enCuantas = listas.filter((lista) => lista.ids.includes(idFranquicia)).length;
  const texto = enCuantas ? `En ${enCuantas} ${enCuantas === 1 ? 'lista' : 'listas'}` : 'Añadir a una lista';

  const opciones = listas.map((lista) => `
    <label class="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer text-sm text-gray-300">
      <input type="checkbox" ${lista.ids.includes(idFranquicia) ? 'checked' : ''} class="accent-purple-400"
        onchange="miEspacioToggleEnLista('${lista.id}','${idFranquicia}'); window.dispatchEvent(new Event('ficha:refrescar'));">
      <span class="truncate">${escaparHtml(lista.nombre)}</span>
    </label>`).join('');

  return `
    <div id="ficha-listas" class="relative flex justify-center mt-5" onclick="event.stopPropagation();">
      <button onclick="fichaTogglePanelListas()"
        class="flex items-center gap-2 px-4 py-1.5 rounded-full border transition-colors ${enCuantas ? 'border-purple-400/50 text-purple-400' : 'border-white/10 text-[#A0AECA] hover:text-white hover:border-white/30'}">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"></path>
        </svg>
        <span class="text-[10px] font-bold uppercase tracking-widest">${texto}</span>
      </button>
      <div id="ficha-listas-panel"
        class="${panelListasAbierto ? '' : 'hidden'} absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 max-w-[85vw] z-50 p-3 rounded-xl border border-white/10 bg-gray-900/95 backdrop-blur-xl shadow-2xl">
        ${opciones ? `<div class="max-h-60 overflow-y-auto mb-3">${opciones}</div>` : '<p class="text-xs text-gray-500 mb-3 px-2">Todavía no tienes listas.</p>'}
        <form onsubmit="event.preventDefault(); fichaCrearLista(this.nombre.value, '${idFranquicia}');" class="flex items-center gap-2">
          <input name="nombre" type="text" maxlength="40" autocomplete="off" placeholder="Nueva lista..."
            class="anilist-input w-full text-xs bg-gray-800/50 border-white/10">
          <button type="submit"
            class="shrink-0 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors">+ Crear</button>
        </form>
      </div>
    </div>
  `;
}

window.fichaTogglePanelListas = () => {
  panelListasAbierto = !panelListasAbierto;
  document.getElementById('ficha-listas-panel')?.classList.toggle('hidden', !panelListasAbierto);
};

// Crear una lista desde la ficha ya mete en ella la franquicia que estás viendo.
window.fichaCrearLista = (nombre, idFranquicia) => {
  const listaId = window.miEspacioCrearLista?.(nombre);
  if (!listaId) return;
  window.miEspacioToggleEnLista(listaId, idFranquicia);
  window.dispatchEvent(new Event('ficha:refrescar'));
};

async function renderFicha(idFranquicia) {
  const contenido = document.getElementById('ficha-contenido');
  const noEncontrada = document.getElementById('ficha-no-encontrada');
  const elements = getFichaElements();

  try {
    const allAnimes = await getAnimes();
    const franquicia = allAnimes.find((item) => item.id_franquicia === idFranquicia);

    if (!franquicia) {
      if (contenido) contenido.classList.add('hidden');
      if (noEncontrada) noEncontrada.classList.remove('hidden');
      return;
    }

    const entradaPrincipal = obtenerEntradaPrincipal(franquicia);
    const { label, className, sinPlataforma } = platformData(entradaPrincipal?.plataforma || '');

    // TÍTULO DE LA PÁGINA Y SEO
    document.title = `${franquicia.titulo_principal || 'Franquicia'} | Espacio Anime`;
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = (franquicia.sinopsis_general || `Ficha de ${franquicia.titulo_principal} en Espacio Anime.`).slice(0, 155);

    // IMAGEN Y TÍTULO
    elements.image.src = franquicia.imagen_principal || '';
    elements.image.alt = franquicia.titulo_principal || 'Portada';
    elements.title.textContent = franquicia.titulo_principal || 'Sin título';

    // GÉNEROS
    elements.genres.innerHTML = (franquicia.generos || []).map((genre) => `<span>${genre}</span>`).join('');
    elements.genres.style.marginBottom = '8px';

    // AÑO
    const yearText = entradaPrincipal?.año || '---';
    elements.year.style.marginBottom = '8px';
    elements.year.innerHTML = `<h3 class="text-xl md:text-2xl text-gray-300 font-light m-0">${yearText}</h3>`;

    // SINOPSIS
    elements.synopsis.className = 'text-base md:text-lg text-gray-400 leading-relaxed';
    elements.synopsis.textContent = franquicia.sinopsis_general || 'Sin sinopsis disponible.';
    elements.synopsis.style.marginTop = '0px';

    // BLINDAJE DEL ENLACE: si la plataforma está bloqueada ("Sin streaming"), no hay enlace.
    let watchLink = resolverEnlaceVer(franquicia, entradaPrincipal) || 'javascript:void(0)';
    if (className.includes('pointer-events-none')) watchLink = 'javascript:void(0)';

    // BOTÓN PRINCIPAL (ver online)
    elements.buttons.innerHTML = `
      <a href="${watchLink}" target="_blank" rel="noopener noreferrer" ${sinPlataforma ? 'title="Buscar en Google dónde verlo"' : ''} class="w-full py-2.5 ${sinPlataforma ? 'px-2 leading-snug' : ''} rounded font-black text-white text-center uppercase text-[11px] tracking-wider shadow-lg ${className}">${label}</a>
    `;

    // BARRA MI ESPACIO
    const miEspacioBar = document.getElementById('modalMiEspacioBar');
    if (miEspacioBar) miEspacioBar.innerHTML = renderMiEspacioBar(idFranquicia);

    // ENTRADAS
    elements.entries.innerHTML = (franquicia.entradas || []).map((entry) => {
      const displayType = entry.tipo === 'TV' ? 'Serie TV' : (entry.tipo || 'Desconocido');

      let statusColor = '#34d399'; // Finalizado -> verde (mismo verde que "Completado" en Mi espacio)
      if (entry.estado === 'En Emisión' || entry.estado === 'RELEASING') statusColor = '#60a5fa'; // En emisión -> azul (mismo azul que "Viendo")
      if (entry.estado === 'Próximamente' || entry.estado === 'NOT_YET_RELEASED') statusColor = '#fb923c'; // Próximamente -> naranja (mismo naranja que "Pendiente")

      return `
        <div class="p-4 rounded-xl border border-white/10 bg-transparent">
          <h4 class="text-white font-bold text-sm mb-3">${entry.titulo || 'Sin título'}</h4>
          <div class="flex justify-between items-end">
            <div class="flex flex-col gap-1.5 text-xs text-gray-400">
              <span>📺 ${displayType}</span>
              <span class="font-semibold" style="color:${statusColor};">Estado: ${entry.estado || '---'}</span>
            </div>
            <div class="text-xs text-gray-400 font-medium">
              <span>📅 ${entry.año || '---'}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (contenido) contenido.classList.remove('hidden');
    if (noEncontrada) noEncontrada.classList.add('hidden');
  } catch (error) {
    console.error('Error cargando la ficha de franquicia:', error);
    if (contenido) contenido.classList.add('hidden');
    if (noEncontrada) noEncontrada.classList.remove('hidden');
  }
}

export async function initModalFranquicia() {
  const root = document.getElementById('ficha-app');
  if (!root) return;

  // Cada franquicia tiene su propia página (pages/franquicias/<id>.html,
  // generada con tools/generar-fichas.mjs) que lleva el id en data-franquicia.
  // ficha.html?id=... se mantiene como respaldo para enlaces antiguos.
  const idFranquicia = root.dataset.franquicia || new URLSearchParams(window.location.search).get('id');

  if (!idFranquicia) {
    document.getElementById('ficha-contenido')?.classList.add('hidden');
    document.getElementById('ficha-no-encontrada')?.classList.remove('hidden');
    return;
  }

  await renderFicha(idFranquicia);
  renderNavArrows(idFranquicia);
  bindBackButton();
  window.addEventListener('ficha:refrescar', () => renderFicha(idFranquicia));
  // Los clics dentro del desplegable de Listas no llegan aquí (stopPropagation).
  document.addEventListener('click', () => {
    if (!panelListasAbierto) return;
    panelListasAbierto = false;
    document.getElementById('ficha-listas-panel')?.classList.add('hidden');
  });
}

// El botón "← Atrás" usa el historial del navegador (así vuelve a la página
// de origen tal cual estaba: filtros, sección, scroll…) siempre que se haya
// llegado a la ficha navegando dentro del propio sitio. Salta tantas
// posiciones como flechas ← → se hayan usado para llegar hasta aquí, así se
// vuelve directo a esa página de origen en vez de deshacer ficha a ficha.
// Si la ficha se abrió directamente (enlace externo, marcador, pestaña
// nueva), no hay nada a lo que volver y se usa el enlace de reserva a
// Franquicias.
function bindBackButton() {
  const backBtn = document.getElementById('ficha-back-btn');
  if (!backBtn) return;

  let mismoOrigen = false;
  try {
    mismoOrigen = Boolean(document.referrer) && new URL(document.referrer).origin === window.location.origin;
  } catch {
    mismoOrigen = false;
  }

  if (mismoOrigen) {
    const depth = parseInt(sessionStorage.getItem(DEPTH_STORAGE_KEY), 10) || 1;
    backBtn.addEventListener('click', (event) => {
      event.preventDefault();
      history.go(-depth);
    });
  }
}

// Página propia de cada franquicia, relativa a pages/franquicias/.
function urlFicha(idFranquicia) {
  return `${encodeURIComponent(idFranquicia)}.html`;
}

// Navega a la ficha de la franquicia. Se mantiene este nombre porque se usa
// desde onclick="abrirModalFranquicia(...)" en decenas de páginas ya existentes.
export function abrirModalFranquicia(idFranquicia) {
  // Guarda el orden de las fichas que el usuario estaba viendo (con sus
  // filtros/orden ya aplicados) para poder navegar con las flechas ← → en la
  // ficha sin perder ese contexto. Si la vista expone su propio orden
  // filtrado (por ejemplo el catálogo de Franquicias) se usa ese; si no, se
  // deduce del propio DOM en el momento del clic.
  const ordenFiltrado = Array.isArray(window.__fichaNavOrder) ? window.__fichaNavOrder : null;
  const ids = (ordenFiltrado?.includes(idFranquicia) ? ordenFiltrado : getVisibleFranquiciaIdsFromDOM());

  if (ids.includes(idFranquicia) && ids.length > 1) {
    sessionStorage.setItem(NAV_STORAGE_KEY, JSON.stringify(ids));
  } else {
    sessionStorage.removeItem(NAV_STORAGE_KEY);
  }
  // Se llega desde una página distinta a la ficha (catálogo, Descubrir, Mi
  // lista…), así que un solo salto de "← Atrás" basta para volver a ella.
  sessionStorage.setItem(DEPTH_STORAGE_KEY, '1');

  window.location.href = resolvePath(`pages/franquicias/${urlFicha(idFranquicia)}`);
}

// Pinta (o esconde) las flechas ← → de la ficha según el contexto de
// navegación guardado por abrirModalFranquicia. No se pisa al pasar de una
// ficha a otra con las propias flechas, así se conserva la lista mientras el
// usuario sigue paseando por ella.
function renderNavArrows(idFranquicia) {
  const prevBtn = document.getElementById('ficha-nav-prev');
  const nextBtn = document.getElementById('ficha-nav-next');
  if (!prevBtn || !nextBtn) return;

  let ids = [];
  try {
    ids = JSON.parse(sessionStorage.getItem(NAV_STORAGE_KEY) || '[]');
  } catch {
    ids = [];
  }

  const index = ids.indexOf(idFranquicia);
  const prevId = index > 0 ? ids[index - 1] : null;
  const nextId = index >= 0 && index < ids.length - 1 ? ids[index + 1] : null;
  const depthActual = parseInt(sessionStorage.getItem(DEPTH_STORAGE_KEY), 10) || 1;

  const marcarSaltoAntesDeNavegar = () => sessionStorage.setItem(DEPTH_STORAGE_KEY, String(depthActual + 1));

  prevBtn.classList.toggle('hidden', !prevId);
  nextBtn.classList.toggle('hidden', !nextId);
  if (prevId) {
    prevBtn.href = urlFicha(prevId);
    prevBtn.addEventListener('click', marcarSaltoAntesDeNavegar);
  }
  if (nextId) {
    nextBtn.href = urlFicha(nextId);
    nextBtn.addEventListener('click', marcarSaltoAntesDeNavegar);
  }
}

window.abrirModalFranquicia = abrirModalFranquicia;
