import { getAnimes } from './anime-data.js?v=baaad63634';
import { obtenerEntradaPrincipal } from './plataformas.js?v=baaad63634';

let allAnimes = [];
let filteredAnimes = [];
let currentPage = 1;
let currentSort = 'default';
const itemsPerPage = 36;

function hasCatalogPage() {
  return Boolean(document.getElementById('contenedor-animes'));
}

function getValue(id, fallback = '') {
  return document.getElementById(id)?.value || fallback;
}

// Los filtros se guardan mientras el usuario se mueve entre Franquicias y
// sus fichas (para que "← Atrás" no los borre). Se descartan solo cuando
// layout.js detecta un clic en un enlace del menú (cambio de pilar) o al
// pulsar la X de "Limpiar todo".
export const FILTERS_STORAGE_KEY = 'ea_franquicias_filtros';

function guardarFiltrosActuales(filtros) {
  sessionStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filtros));
}

function setDropdownValue(dropdownId, value) {
  const dropdown = document.getElementById(dropdownId);
  if (!dropdown) return;
  const option = [...dropdown.querySelectorAll('.dropdown-option')]
    .find((opt) => opt.dataset.value === (value || ''));
  if (!option) return;
  dropdown.querySelector('.dropdown-trigger').textContent = option.textContent;
  dropdown.querySelector('input[type="hidden"]').value = option.dataset.value || '';
}

// Orden: el desplegable solo tiene 5 opciones (Aleatorio + 4 criterios). Las
// 4 con dirección son el mismo botón para las dos formas de ordenar: al
// volver a pulsar la opción ya activa, cambia su propio texto e invierte el
// sentido, en vez de tener una opción aparte para cada dirección.
const SORT_DEFAULT_DIR = { alfabetico: 'asc', fecha: 'desc', popularidad: 'desc', valoracion: 'desc' };
// Palabra fija + flechita que cambia de sentido: ↑ = ascendente, ↓ = descendente
// (A-Z, año antiguo→nuevo, menos→más populares/valoradas, y al revés).
const SORT_WORDS = { alfabetico: 'Alfabéticamente', fecha: 'Fecha', popularidad: 'Popularidad', valoracion: 'Valoración' };
const SORT_ARROWS = { asc: '↑', desc: '↓' };

function etiquetaOrden(criterio, direccion) {
  return `${SORT_WORDS[criterio]} ${SORT_ARROWS[direccion]}`;
}

function resetOpcionesOrden() {
  const dropdown = document.getElementById('dropdown-sort');
  if (!dropdown) return;
  dropdown.querySelectorAll('.dropdown-option[data-criterio]').forEach((opt) => {
    const criterio = opt.dataset.criterio;
    if (criterio === 'default') return;
    const dir = SORT_DEFAULT_DIR[criterio];
    opt.dataset.dir = dir;
    opt.textContent = etiquetaOrden(criterio, dir);
  });
}

function restaurarOrdenGuardado(sortValue) {
  const dropdown = document.getElementById('dropdown-sort');
  const input = document.getElementById('filter-sort');
  if (!dropdown || !input) return;

  const valor = sortValue || 'default';
  input.value = valor;
  resetOpcionesOrden();

  const trigger = dropdown.querySelector('.dropdown-trigger');
  const [criterio, direccion] = valor.split('_');

  if (criterio === 'default') {
    if (trigger) trigger.textContent = 'Aleatorio';
    return;
  }

  const option = dropdown.querySelector(`.dropdown-option[data-criterio="${criterio}"]`);
  if (!option) return;

  const dir = direccion || SORT_DEFAULT_DIR[criterio];
  option.dataset.dir = dir;
  const etiqueta = etiquetaOrden(criterio, dir);
  option.textContent = etiqueta;
  if (trigger) trigger.textContent = etiqueta;
}

function bindSortDropdown() {
  const dropdown = document.getElementById('dropdown-sort');
  const input = document.getElementById('filter-sort');
  if (!dropdown || !input) return;

  dropdown.addEventListener('click', (event) => {
    const option = event.target.closest('.dropdown-option[data-criterio]');
    if (!option) return;

    event.stopImmediatePropagation();

    const criterio = option.dataset.criterio;
    const [criterioActivo] = (input.value || 'default').split('_');
    let nuevoValor;
    let etiqueta;

    if (criterio === 'default') {
      resetOpcionesOrden();
      nuevoValor = 'default';
      etiqueta = 'Aleatorio';
    } else {
      const direccion = criterioActivo === criterio
        ? ((option.dataset.dir === 'asc') ? 'desc' : 'asc')
        : SORT_DEFAULT_DIR[criterio];
      option.dataset.dir = direccion;
      etiqueta = etiquetaOrden(criterio, direccion);
      option.textContent = etiqueta;
      nuevoValor = `${criterio}_${direccion}`;
    }

    input.value = nuevoValor;
    dropdown.querySelector('.dropdown-trigger').textContent = etiqueta;
    dropdown.querySelector('.dropdown-options').classList.remove('show');
    filtrar();
  });
}

function restaurarFiltrosGuardados() {
  let filtros;
  try {
    filtros = JSON.parse(sessionStorage.getItem(FILTERS_STORAGE_KEY) || 'null');
  } catch {
    filtros = null;
  }
  if (!filtros) return;

  const searchInput = document.getElementById('search-input');
  const yearInput = document.getElementById('filter-year');
  if (searchInput) searchInput.value = filtros.searchRaw || '';
  if (yearInput) yearInput.value = filtros.year || '';
  setDropdownValue('dropdown-genre', filtros.genre);
  setDropdownValue('dropdown-format', filtros.format);
  setDropdownValue('dropdown-platform', filtros.platform);
  setDropdownValue('dropdown-status', filtros.status);
  restaurarOrdenGuardado(filtros.sort || 'default');
}

function matchShortTerm(text) {
  return ['ona', 'ova', 'tv', 'part'].includes(text);
}

function matchesText(anime, searchText) {
  if (!searchText) return true;

  const entryTitles = (anime.entradas || []).map((e) => e.titulo).filter(Boolean);
  const titles = [anime.titulo_principal, ...(anime.titulos_alternativos || []), ...entryTitles].filter(Boolean);
  if (matchShortTerm(searchText)) {
    const regex = new RegExp(`\\b${searchText}\\b`, 'i');
    return titles.some((title) => regex.test(title));
  }

  return titles.some((title) => title.toLowerCase().includes(searchText));
}

function updateEmptyState(items) {
  const noResults = document.getElementById('no-results');
  if (!noResults) return;
  noResults.classList.toggle('hidden', items.length !== 0);
}

function renderCard(anime, rank) {
  const genres = anime.generos?.join(', ') || '---';
  const year = anime.entrada_principal_ano || 'N/A';
  const items = anime.entradas?.length || 0;
  const synopsis = anime.sinopsis_general || 'Sin descripción disponible para esta franquicia...';
  const rankBadge = rank ? `<div class="rank-badge">#${rank}</div>` : '';

  return `
    <div onclick="abrirModalFranquicia('${anime.id_franquicia}')"
         class="franquicia-card group w-full cursor-pointer
                [.vista-grid_&]:flex [.vista-grid_&]:flex-col
                [.vista-lista_&]:flex [.vista-lista_&]:flex-row [.vista-lista_&]:mb-4 [.vista-lista_&]:p-3 [.vista-lista_&]:bg-gray-900 [.vista-lista_&]:border [.vista-lista_&]:border-white/10 [.vista-lista_&]:rounded-xl hover:[.vista-lista_&]:border-white/30 hover:[.vista-lista_&]:bg-gray-800 [.vista-lista_&]:transition-colors [.vista-lista_&]:duration-300
                [.vista-compacta_&]:relative [.vista-compacta_&]:aspect-[2/3] [.vista-compacta_&]:rounded-xl [.vista-compacta_&]:overflow-hidden [.vista-compacta_&]:border [.vista-compacta_&]:border-white/10 hover:[.vista-compacta_&]:border-white/50 hover:[.vista-compacta_&]:shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:[.vista-compacta_&]:-translate-y-1 [.vista-compacta_&]:transition-[transform,border-color,box-shadow] [.vista-compacta_&]:duration-300">

      <div class="lista-img relative shrink-0 overflow-hidden bg-gray-950
                  [.vista-grid_&]:w-full [.vista-grid_&]:aspect-[2/3] [.vista-grid_&]:rounded-2xl [.vista-grid_&]:border [.vista-grid_&]:border-white/10 [.vista-grid_&]:transition-[border-color,box-shadow] [.vista-grid_&]:duration-300 group-hover:[.vista-grid_&]:border-white/50 group-hover:[.vista-grid_&]:shadow-[0_0_20px_rgba(255,255,255,0.15)]
                  [.vista-lista_&]:aspect-[2/3] [.vista-lista_&]:rounded-lg [.vista-lista_&]:shadow-md
                  [.vista-compacta_&]:absolute [.vista-compacta_&]:inset-0 [.vista-compacta_&]:w-full [.vista-compacta_&]:h-full">

        <img src="${anime.imagen_principal}" loading="lazy" alt="${anime.titulo_principal}"
             class="w-full h-full object-cover transition-[transform,filter] duration-700 ease-out group-hover:scale-110 group-hover:brightness-110">
        ${rankBadge}
      </div>

      <div class="lista-content [.vista-compacta_&]:hidden flex-grow flex
                  [.vista-grid_&]:flex-col [.vista-grid_&]:mt-4 [.vista-grid_&]:text-center [.vista-grid_&]:px-1
                  [.vista-lista_&]:flex-row [.vista-lista_&]:pl-4 [.vista-lista_&]:md:pl-6 [.vista-lista_&]:items-center">

        <div class="lista-info">

          <h3 title="${anime.titulo_principal}"
              class="lista-title font-black uppercase tracking-tight transition-colors duration-300
                     [.vista-grid_&]:text-[14px] [.vista-grid_&]:md:text-[15px] [.vista-grid_&]:text-gray-400 group-hover:[.vista-grid_&]:text-white [.vista-grid_&]:truncate
                     [.vista-lista_&]:text-white [.vista-lista_&]:text-lg [.vista-lista_&]:md:text-xl">
            ${anime.titulo_principal}
          </h3>

          <p class="[.vista-grid_&]:hidden text-gray-400 font-medium text-xs md:text-sm mt-1 truncate">
            ${genres}
          </p>
          <p class="[.vista-grid_&]:hidden text-gray-500 text-xs md:text-sm line-clamp-2 mt-2 leading-relaxed">
            ${synopsis}
          </p>
        </div>

        <div class="lista-stats [.vista-grid_&]:hidden flex flex-col md:flex-row items-center justify-center gap-3 md:gap-8 text-center shrink-0 pr-2 md:pr-4 border-l border-white/10 pl-4 md:pl-6 ml-2 md:ml-4">
          <div class="w-20">
            <label class="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1 block">Entradas</label>
            <p class="text-white text-sm md:text-base font-bold">${items}</p>
          </div>
          <div class="w-16">
            <label class="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1 block">Año</label>
            <p class="text-white text-sm md:text-base font-bold">${year}</p>
          </div>
        </div>

      </div>
    </div>
  `;
}

function updatePagination() {
  const controls = document.getElementById('pagination-controls');
  if (!controls) return;

  const totalPages = Math.max(1, Math.ceil(filteredAnimes.length / itemsPerPage));
  controls.innerHTML = `
    <button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''} class="px-5 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase disabled:opacity-30 hover:bg-white/10 text-white transition tracking-widest">Anterior</button>
    <span class="text-xs font-bold text-slate-500 uppercase tracking-widest">Pág <span class="text-white text-lg mx-1">${currentPage}</span> / ${totalPages}</span>
    <button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''} class="px-5 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase disabled:opacity-30 hover:bg-white/10 text-white transition tracking-widest">Siguiente</button>
  `;
}

function renderPage(page = 1) {
  const container = document.getElementById('contenedor-animes');
  if (!container) return;

  currentPage = page;
  const start = (page - 1) * itemsPerPage;
  const items = filteredAnimes.slice(start, start + itemsPerPage);
  // El numerito de posición solo tiene sentido cuando el orden es un ranking real
  // (Más populares / Mejor valoradas); en Aleatorio, Año o A-Z no significa nada.
  const esRanking = currentSort.startsWith('popularidad') || currentSort.startsWith('valoracion');
  container.innerHTML = items.map((anime, i) => renderCard(anime, esRanking ? start + i + 1 : null)).join('');
  updateEmptyState(items);
  updatePagination();
}

function sortResults(sortValue) {
  currentSort = sortValue || 'default';
  const [criterio, direccion] = currentSort.split('_');

  if (criterio === 'fecha') {
    filteredAnimes.sort((a, b) => {
      const ya = a.entrada_principal_ano || 0;
      const yb = b.entrada_principal_ano || 0;
      return direccion === 'asc' ? ya - yb : yb - ya;
    });
  } else if (criterio === 'alfabetico') {
    filteredAnimes.sort((a, b) => {
      const cmp = (a.titulo_principal || '').localeCompare(b.titulo_principal || '', 'es', { sensitivity: 'base' });
      return direccion === 'desc' ? -cmp : cmp;
    });
  } else if (criterio === 'popularidad') {
    filteredAnimes.sort((a, b) => {
      const pa = a.score_base || 0;
      const pb = b.score_base || 0;
      return direccion === 'asc' ? pa - pb : pb - pa;
    });
  } else if (criterio === 'valoracion') {
    // puntuacion_ponderada (nota media ponderada por nº de votos, estilo IMDb/Steam):
    // evita que un clásico de nicho con pocos votos gane a algo con muchísimos.
    // Las franquicias sin dato todavía se van al final en el sentido "desc".
    filteredAnimes.sort((a, b) => {
      const va = a.puntuacion_ponderada || 0;
      const vb = b.puntuacion_ponderada || 0;
      return direccion === 'asc' ? va - vb : vb - va;
    });
  } else {
    filteredAnimes.sort(() => Math.random() - 0.5);
  }
}

function resetDropdownLabels() {
  const labels = {
    'dropdown-genre': 'Géneros',
    'dropdown-format': 'Formato',
    'dropdown-platform': 'Plataforma',
    'dropdown-status': 'Estado',
  };

  Object.entries(labels).forEach(([id, text]) => {
    const trigger = document.querySelector(`#${id} .dropdown-trigger`);
    if (trigger) trigger.textContent = text;
  });
}

export function filtrar() {
  if (!hasCatalogPage()) return;

  const searchRaw = getValue('search-input');
  const searchText = searchRaw.toLowerCase().trim();
  const year = getValue('filter-year').trim();
  const genre = getValue('filter-genre');
  const platform = getValue('filter-platform');
  const status = getValue('filter-status');
  const format = getValue('filter-format');
  const sort = getValue('filter-sort', 'default');

  guardarFiltrosActuales({ searchRaw, year, genre, platform, status, format, sort });

  filteredAnimes = allAnimes.filter((anime) => {
    if (anime.incubadora === true) return false;

    // La entrada principal es la que se muestra en la ficha (portada, año,
    // plataforma y enlace "dónde ver"), así que los filtros tienen que
    // comprobar esa misma entrada y no cualquier otra — si no, un filtro
    // puede devolver una franquicia cuyo enlace real apunta a otro sitio
    // distinto del filtro pulsado (p. ej. filtrar por YouTube y que el
    // enlace real de la ficha sea Crunchyroll).
    const entradaPrincipal = obtenerEntradaPrincipal(anime) || {};

    // Algunos botones de género agrupan varios géneros de AniList a la vez
    // (p. ej. "Acción y Aventura"), guardados como data-value separados por
    // coma: basta con que la franquicia tenga alguno de ellos.
    const matchGenre = !genre || genre.split(',').some((g) => anime.generos?.includes(g));
    // "Sin plataforma principal" no es un valor real de plataforma en los datos
    // (los animes sin plataforma confirmada se guardan como "Pendiente"), así que
    // se resuelve aparte: cualquier entrada principal sin plataforma útil cuenta
    // como tal. El nombre evita decir "sin streaming en España" o "sin streaming
    // oficial" porque algunas de estas franquicias sí tienen streaming legal en
    // España (Filmin, alquiler...), solo que no en Crunchyroll/Netflix/Disney+/
    // Prime Video/YouTube, que es lo único que este filtro comprueba.
    const matchPlatform = !platform
      ? true
      : platform.toLowerCase() === 'sin plataforma principal'
        ? !entradaPrincipal.plataforma || entradaPrincipal.plataforma.toLowerCase() === 'pendiente'
        : (entradaPrincipal.plataforma || '').toLowerCase().includes(platform.toLowerCase());
    // El formato ya viene calculado a nivel de franquicia (entrada_principal_tipo).
    // "Serie Corta" se trata como "Serie TV" al filtrar: son series de episodios
    // cortos (ej. Saiki K., Tsuredure Children), no hay botón propio para tan pocos
    // casos y narrativamente encajan mejor con Serie TV que fuera de todo filtro.
    const matchFormat = !format || anime.entrada_principal_tipo === format ||
      (format === 'Serie TV' && anime.entrada_principal_tipo === 'Serie Corta');

    // El estado sí se comprueba contra TODAS las entradas (a diferencia del
    // enlace de streaming, que solo mira la principal): "En Emisión" y
    // "Próximamente" preguntan si hay algo de la franquicia con actividad
    // ahora mismo, y muchas franquicias antiguas tienen su entrada principal
    // (la más antigua o la de formato prioritario) ya finalizada mientras
    // una temporada o película nueva está en emisión o anunciada.
    const enEmisionEstados = ['En Emisión', 'RELEASING'];
    const proximamenteEstados = ['Próximamente', 'NOT_YET_RELEASED'];
    let matchStatus = true;
    if (status === 'En Emisión') {
      matchStatus = Boolean(anime.entradas?.some((e) => enEmisionEstados.includes(e.estado)));
    } else if (status === 'Próximamente') {
      matchStatus = Boolean(anime.entradas?.some((e) => proximamenteEstados.includes(e.estado)));
    } else if (status === 'Finalizado') {
      matchStatus = !anime.entradas?.some((e) => enEmisionEstados.includes(e.estado) || proximamenteEstados.includes(e.estado));
    }

    const matchYear = !year || String(anime.entrada_principal_ano || '') === year;

    return matchesText(anime, searchText) && matchGenre && matchPlatform && matchFormat && matchStatus && matchYear;
  });

  sortResults(sort);
  window.__fichaNavOrder = filteredAnimes.map((anime) => anime.id_franquicia);
  renderPage(1);
}

function handleDropdownClick(event) {
  const trigger = event.target.closest('.dropdown-trigger');
  const option = event.target.closest('.dropdown-option');

  if (option) {
    const dropdown = option.closest('.custom-dropdown');
    dropdown.querySelector('.dropdown-trigger').textContent = option.textContent;
    dropdown.querySelector('input[type="hidden"]').value = option.dataset.value || '';
    dropdown.querySelector('.dropdown-options').classList.remove('show');
    filtrar();
    return;
  }

  if (trigger) {
    const options = trigger.nextElementSibling;
    const wasOpen = options.classList.contains('show');
    document.querySelectorAll('.dropdown-options').forEach((panel) => panel.classList.remove('show'));
    if (!wasOpen) options.classList.add('show');
    return;
  }

  if (!event.target.closest('.custom-dropdown')) {
    document.querySelectorAll('.dropdown-options').forEach((panel) => panel.classList.remove('show'));
  }
}

function bindCatalogEvents() {
  document.addEventListener('click', handleDropdownClick);

  ['search-input', 'filter-year'].forEach((id) => {
    const input = document.getElementById(id);
    if (input) input.addEventListener('input', filtrar);
  });

  const resetButton = document.getElementById('reset-filters');
  if (resetButton) {
    resetButton.addEventListener('click', () => {
      const searchInput = document.getElementById('search-input');
      const yearInput = document.getElementById('filter-year');
      if (searchInput) searchInput.value = '';
      if (yearInput) yearInput.value = '';

      ['filter-genre', 'filter-format', 'filter-platform', 'filter-status'].forEach((id) => {
        const field = document.getElementById(id);
        if (field) field.value = '';
      });

      restaurarOrdenGuardado('default');
      resetDropdownLabels();
      filtrar();
    });
  }

  bindSortDropdown();
}

export function changePage(page) {
  const totalPages = Math.max(1, Math.ceil(filteredAnimes.length / itemsPerPage));
  if (page < 1 || page > totalPages) return;
  renderPage(page);
  document.getElementById('franquicias')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function cambiarVista(tipo) {
  const container = document.getElementById('contenedor-animes');
  if (!container) return;

  if (tipo === 'grid') {
    container.className = 'vista-grid relative z-10 min-h-[300px] switching-view';
  } else if (tipo === 'lista') {
    container.className = 'vista-lista relative z-10 min-h-[300px] switching-view';
  } else if (tipo === 'compacta') {
    container.className = 'vista-compacta relative z-10 min-h-[300px] switching-view';
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      container.classList.remove('switching-view');
    });
  });
}

export async function initCatalogoPage() {
  if (!hasCatalogPage()) return;

  // En móvil, la cuadrícula deja una tarjeta por fila: se arranca en Mini.
  // Los tres botones siguen disponibles para cambiar de vista.
  if (window.matchMedia('(max-width: 767px)').matches) cambiarVista('compacta');

  allAnimes = await getAnimes();
  filteredAnimes = [...allAnimes];
  bindCatalogEvents();
  // Si no hay nada guardado (sesión nueva, o se limpió al cambiar de pilar)
  // esto no hace nada y arranca en el estado por defecto (aleatorio).
  restaurarFiltrosGuardados();
  filtrar();
}

window.changePage = changePage;
window.cambiarVista = cambiarVista;