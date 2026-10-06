import { getAnimes } from './anime-data.js';

const STORAGE_KEY = 'espacio-anime-mi-espacio';
// Las listas propias van en otra clave: el store de arriba es un mapa id → datos
// y cualquier otra cosa metida ahí descuadraría contadores y limpieza de huérfanas.
const LISTAS_KEY = 'espacio-anime-mi-espacio-listas';
const MAX_NOMBRE_LISTA = 40;

const ESTADOS = [
  { key: 'quiero_ver', label: 'Pendiente' },
  { key: 'viendo', label: 'Viendo' },
  { key: 'vistos', label: 'Completado' },
];

function getStore() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch (error) {
    console.error('Error leyendo Mi espacio:', error);
    return {};
  }
}

function saveStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  document.dispatchEvent(new CustomEvent('mi-espacio:change'));
}

function getEntry(id) {
  return getStore()[id] || null;
}

function upsertEntry(id, changes) {
  const store = getStore();
  const current = store[id] || { favorito: false };
  store[id] = { ...current, ...changes, actualizado: Date.now() };
  saveStore(store);
}

function limpiarSiVacio(store, id) {
  const entry = store[id];
  if (entry && !entry.estado && !entry.favorito) {
    delete store[id];
  }
}

export function toggleEstado(id, estado) {
  const store = getStore();
  const current = store[id] || { favorito: false, estado: null };
  current.estado = current.estado === estado ? null : estado;
  current.actualizado = Date.now();
  store[id] = current;
  limpiarSiVacio(store, id);
  saveStore(store);
}

export function quitarDeLista(id) {
  const store = getStore();
  delete store[id];
  saveStore(store);
}

export function toggleFavorito(id) {
  const store = getStore();
  const current = store[id] || { estado: null, favorito: false };
  current.favorito = !current.favorito;
  current.actualizado = Date.now();
  store[id] = current;
  limpiarSiVacio(store, id);
  saveStore(store);
}

// --- Listas propias: [{ id, nombre, ids: [id_franquicia, ...] }] ---
// Son independientes de los estados: un anime puede estar en una lista sin
// estar en Pendiente/Viendo/Completado.

function getListas() {
  try {
    const listas = JSON.parse(localStorage.getItem(LISTAS_KEY));
    // Se descartan entradas mal formadas (por ejemplo, de un JSON importado editado a mano).
    return Array.isArray(listas)
      ? listas.filter((lista) => lista && typeof lista.id === 'string' && Array.isArray(lista.ids))
      : [];
  } catch (error) {
    console.error('Error leyendo las listas de Mi espacio:', error);
    return [];
  }
}

function saveListas(listas) {
  localStorage.setItem(LISTAS_KEY, JSON.stringify(listas));
  document.dispatchEvent(new CustomEvent('mi-espacio:change'));
}

export function crearLista(nombre) {
  const limpio = String(nombre || '').trim().slice(0, MAX_NOMBRE_LISTA);
  if (!limpio) return null;
  const listas = getListas();
  const id = `lista-${Date.now()}`;
  listas.push({ id, nombre: limpio, ids: [] });
  saveListas(listas);
  return id;
}

export function renombrarLista(listaId) {
  const listas = getListas();
  const lista = listas.find((item) => item.id === listaId);
  if (!lista) return;
  const nombre = prompt('Nuevo nombre de la lista:', lista.nombre);
  const limpio = String(nombre || '').trim().slice(0, MAX_NOMBRE_LISTA);
  if (!limpio) return;
  lista.nombre = limpio;
  saveListas(listas);
}

export function borrarLista(listaId) {
  const listas = getListas();
  const lista = listas.find((item) => item.id === listaId);
  if (!lista) return;
  if (!confirm(`¿Borrar la lista «${lista.nombre}»? Los animes no se quitan de Mi espacio.`)) return;
  saveListas(listas.filter((item) => item.id !== listaId));
}

export function toggleEnLista(listaId, idFranquicia) {
  const listas = getListas();
  const lista = listas.find((item) => item.id === listaId);
  if (!lista) return;
  lista.ids = lista.ids.includes(idFranquicia)
    ? lista.ids.filter((id) => id !== idFranquicia)
    : [...lista.ids, idFranquicia];
  saveListas(listas);
}

window.miEspacioGetListas = getListas;
window.miEspacioCrearLista = crearLista;
window.miEspacioRenombrarLista = renombrarLista;
window.miEspacioBorrarLista = borrarLista;
window.miEspacioToggleEnLista = toggleEnLista;

// La copia incluye animes y listas: { animes, listas }. Las copias antiguas
// (solo el mapa de animes, sin listas) se siguen pudiendo importar.
export function exportarDatos() {
  const datos = { animes: getStore(), listas: getListas() };
  const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `mi-espacio-${new Date().toISOString().slice(0, 10)}.json`;
  enlace.click();
  URL.revokeObjectURL(url);
}

export function importarDatos(file) {
  if (!file) return;

  const lector = new FileReader();
  lector.onload = () => {
    try {
      const datos = JSON.parse(lector.result);
      if (typeof datos !== 'object' || datos === null || Array.isArray(datos)) {
        throw new Error('Formato inválido');
      }
      const formatoNuevo = Array.isArray(datos.listas);
      const animes = formatoNuevo ? datos.animes : datos;
      if (typeof animes !== 'object' || animes === null || Array.isArray(animes)) {
        throw new Error('Formato inválido');
      }
      // Importar sustituye la lista entera: si ya hay algo guardado, se avisa antes.
      // Una copia antigua no trae listas: en ese caso se conservan las actuales.
      const actuales = Object.keys(getStore()).length;
      const listasActuales = formatoNuevo ? getListas().length : 0;
      if ((actuales > 0 || listasActuales > 0) && !confirm(`Esto sustituirá tu lista actual (${actuales} ${actuales === 1 ? 'anime' : 'animes'}${listasActuales ? `, ${listasActuales} ${listasActuales === 1 ? 'lista propia' : 'listas propias'}` : ''}) por la del archivo. ¿Continuar?`)) {
        return;
      }
      if (formatoNuevo) saveListas(datos.listas);
      saveStore(animes);
      alert('Lista importada correctamente.');
    } catch (error) {
      console.error('Error importando Mi espacio:', error);
      alert('No se pudo importar el archivo. Comprueba que sea un JSON exportado desde Mi espacio.');
    }
  };
  lector.readAsText(file);
}

window.miEspacioExportar = exportarDatos;
window.miEspacioImportar = importarDatos;

export function setValoracion(id, valor) {
  const numero = Math.min(10, Math.max(0, Number(valor) || 0));
  upsertEntry(id, { valoracion: numero });
}

export function setNota(id, texto) {
  upsertEntry(id, { nota: texto });
}

// Solo se usa en Viendo: "nota" hace de "Por dónde voy" y "proximo" de "Lo próximo".
export function setProximo(id, texto) {
  upsertEntry(id, { proximo: texto });
}

// Quita de Mi espacio las franquicias que ya no existen en el catálogo, para que
// los contadores (sobre todo Total) cuadren con lo que se ve en pantalla.
function limpiarHuerfanas(animes) {
  if (!animes.length) return; // Sin catálogo cargado no se borra nada.
  const ids = new Set(animes.map((anime) => anime.id_franquicia));
  const store = getStore();
  const huerfanas = Object.keys(store).filter((id) => !ids.has(id));
  if (huerfanas.length) {
    huerfanas.forEach((id) => delete store[id]);
    saveStore(store);
  }

  const listas = getListas();
  let listasCambiadas = false;
  listas.forEach((lista) => {
    const vigentes = lista.ids.filter((id) => ids.has(id));
    if (vigentes.length !== lista.ids.length) {
      lista.ids = vigentes;
      listasCambiadas = true;
    }
  });
  if (listasCambiadas) saveListas(listas);
}

window.miEspacioToggleEstado = toggleEstado;
window.miEspacioToggleFavorito = toggleFavorito;
window.miEspacioQuitar = quitarDeLista;
window.miEspacioSetValoracion = setValoracion;
window.miEspacioSetNota = setNota;
window.miEspacioSetProximo = setProximo;
window.miEspacioGetEntry = getEntry;

let allAnimes = [];
let activeTab = 'quiero_ver';
let activeLista = null;

// La nota la escribe el usuario (o llega en un JSON importado de otra persona):
// se escapa antes de meterla en el HTML para que nunca se interprete como código.
function escaparHtml(texto) {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function notaWidget(idFranquicia, valoracion = 0) {
  return `
    <div class="flex items-center gap-2">
      <input type="number" min="0" max="10" step="1" value="${valoracion || ''}" placeholder="-"
        onclick="event.stopPropagation();"
        onchange="miEspacioSetValoracion('${idFranquicia}', this.value); event.stopPropagation();"
        class="anilist-input w-14 text-center px-1 py-1 text-xs bg-gray-800/50 border-white/10">
      <span class="text-xs text-gray-400">/ 10</span>
    </div>
  `;
}

// Iconos de las notas: cuaderno con lápiz (nota libre), tick (por dónde voy) y reloj (lo próximo).
const ICONOS_NOTA = {
  nota: { color: 'text-gray-500', path: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
  visto: { color: 'text-emerald-400/80', path: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  proximo: { color: 'text-cyan-400/80', path: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
};

function notaTextarea(idFranquicia, setter, placeholder, valor, icono) {
  const { color, path } = ICONOS_NOTA[icono];
  return `<div class="flex items-center gap-2 mt-2 w-full max-w-md">
          <svg class="w-4 h-4 shrink-0 ${color}" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="${path}" />
          </svg>
          <textarea placeholder="${placeholder}" rows="1"
            onchange="${setter}('${idFranquicia}', this.value)"
            class="anilist-input w-full text-xs bg-gray-800/50 border-white/10 resize-none">${escaparHtml(valor || '')}</textarea>
        </div>`;
}

function renderCard(idFranquicia, data, anime) {
  const valoracionHtml = `<div class="mt-3">${notaWidget(idFranquicia, data.valoracion || 0)}</div>`;
  // En Viendo la nota se parte en dos líneas; en el resto de estados es una nota libre.
  const notasHtml = data.estado === 'viendo'
    ? notaTextarea(idFranquicia, 'miEspacioSetNota', 'Por dónde voy...', data.nota, 'visto')
      + notaTextarea(idFranquicia, 'miEspacioSetProximo', 'Lo próximo...', data.proximo, 'proximo')
    : notaTextarea(idFranquicia, 'miEspacioSetNota', 'Nota privada...', data.nota, 'nota');

  return `
    <div class="group w-full flex flex-row items-center mb-4 p-3 bg-gray-900 border border-white/10 rounded-xl hover:border-white/30 hover:bg-gray-800 transition-colors duration-300">
      <div class="relative shrink-0 overflow-hidden bg-gray-950 w-24 md:w-32 aspect-[2/3] rounded-lg shadow-md cursor-pointer"
        onclick="abrirModalFranquicia('${idFranquicia}')">
        <img src="${anime.imagen_principal || ''}" alt="${anime.titulo_principal || ''}"
          class="w-full h-full object-cover transition-[transform,filter] duration-700 ease-out group-hover:scale-110 group-hover:brightness-110">
      </div>
      <div class="flex-1 min-w-0 pl-4 md:pl-6">
        <h3 class="font-black uppercase tracking-tight text-white text-lg md:text-xl truncate cursor-pointer"
          onclick="abrirModalFranquicia('${idFranquicia}')">${anime.titulo_principal || 'Sin título'}</h3>
        ${valoracionHtml}
        ${notasHtml}
        <div class="flex items-center gap-4 mt-2">
          <button onclick="miEspacioToggleFavorito('${idFranquicia}')"
            class="text-lg leading-none ${data.favorito ? 'text-red-500' : 'text-gray-600'} hover:text-red-400 transition-colors">
            ${data.favorito ? '♥' : '♡'}
          </button>
          <button onclick="miEspacioQuitar('${idFranquicia}')"
            class="text-[10px] uppercase tracking-widest text-gray-500 hover:text-white transition-colors">
            Quitar
          </button>
        </div>
      </div>
    </div>
  `;
}

// Mismos colores que los botones de estado de la ficha (modal-franquicia.js).
const COLOR_ESTADO = { quiero_ver: 'text-orange-400', viendo: 'text-blue-400', vistos: 'text-emerald-400' };

// Tarjeta dentro de una lista propia: las listas sirven para organizar, así que
// no lleva puntuación ni notas (eso vive en las pestañas de estado); muestra en
// qué estado está el anime y "Quitar" lo saca solo de la lista.
function renderCardLista(idFranquicia, data, anime, listaId) {
  const estado = ESTADOS.find((item) => item.key === data.estado);
  const estadoHtml = estado
    ? `<span class="text-[10px] font-bold uppercase tracking-widest ${COLOR_ESTADO[estado.key]}">${estado.label}</span>`
    : '<span class="text-[10px] font-bold uppercase tracking-widest text-gray-600">Sin estado</span>';

  return `
    <div class="group w-full flex flex-row items-center mb-4 p-3 bg-gray-900 border border-white/10 rounded-xl hover:border-white/30 hover:bg-gray-800 transition-colors duration-300">
      <div class="relative shrink-0 overflow-hidden bg-gray-950 w-24 md:w-32 aspect-[2/3] rounded-lg shadow-md cursor-pointer"
        onclick="abrirModalFranquicia('${idFranquicia}')">
        <img src="${anime.imagen_principal || ''}" alt="${anime.titulo_principal || ''}"
          class="w-full h-full object-cover transition-[transform,filter] duration-700 ease-out group-hover:scale-110 group-hover:brightness-110">
      </div>
      <div class="flex-1 min-w-0 pl-4 md:pl-6">
        <h3 class="font-black uppercase tracking-tight text-white text-lg md:text-xl truncate cursor-pointer"
          onclick="abrirModalFranquicia('${idFranquicia}')">${anime.titulo_principal || 'Sin título'}</h3>
        <div class="mt-2">${estadoHtml}</div>
        <div class="flex items-center gap-4 mt-2">
          <button onclick="miEspacioToggleFavorito('${idFranquicia}')"
            class="text-lg leading-none ${data.favorito ? 'text-red-500' : 'text-gray-600'} hover:text-red-400 transition-colors">
            ${data.favorito ? '♥' : '♡'}
          </button>
          <button data-lista-id="${escaparHtml(listaId)}" data-franquicia-id="${idFranquicia}" onclick="miEspacioToggleEnLista(this.dataset.listaId, this.dataset.franquiciaId)"
            class="text-[10px] uppercase tracking-widest text-gray-500 hover:text-white transition-colors">
            Quitar de la lista
          </button>
        </div>
      </div>
    </div>
  `;
}

// Barra de la pestaña Listas: una píldora por lista, el campo para crear otra
// y las acciones de la lista elegida.
function renderBarraListas(listas, lista) {
  const chips = listas.map((item) => {
    const activa = lista && item.id === lista.id;
    return `
      <button data-lista-id="${escaparHtml(item.id)}" onclick="miEspacioElegirLista(this.dataset.listaId)"
        class="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition-colors ${activa ? 'bg-white/10 border-white/70 text-white' : 'bg-gray-800/50 border-white/10 text-gray-400 hover:text-white'}">
        ${escaparHtml(item.nombre)}
        <span class="bg-white/10 rounded-full px-2 py-0.5 text-[10px]">${item.ids.length}</span>
      </button>`;
  }).join('');

  const acciones = lista
    ? `<div class="flex items-center gap-4 mt-4">
        <button data-lista-id="${escaparHtml(lista.id)}" onclick="miEspacioRenombrarLista(this.dataset.listaId)"
          class="text-[10px] uppercase tracking-widest text-gray-500 hover:text-white transition-colors">Renombrar</button>
        <button data-lista-id="${escaparHtml(lista.id)}" onclick="miEspacioBorrarLista(this.dataset.listaId)"
          class="text-[10px] uppercase tracking-widest text-gray-500 hover:text-white transition-colors">Borrar lista</button>
      </div>`
    : '';

  return `
    <div class="flex flex-wrap items-center gap-2">
      ${chips}
      <form onsubmit="event.preventDefault(); miEspacioCrearListaDesdeBarra(this.nombre);" class="flex items-center gap-2">
        <input name="nombre" type="text" maxlength="${MAX_NOMBRE_LISTA}" autocomplete="off" placeholder="Nueva lista..."
          class="anilist-input w-40 text-xs bg-gray-800/50 border-white/10">
        <button type="submit"
          class="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors">+ Crear</button>
      </form>
    </div>
    ${acciones}
  `;
}

window.miEspacioElegirLista = (listaId) => {
  activeLista = listaId;
  render();
};

window.miEspacioCrearListaDesdeBarra = (input) => {
  const id = crearLista(input.value);
  if (id) {
    activeLista = id;
    render();
  }
};

function contarPorTab() {
  const store = getStore();
  const entries = Object.entries(store);
  return {
    quiero_ver: entries.filter(([, d]) => d.estado === 'quiero_ver').length,
    viendo: entries.filter(([, d]) => d.estado === 'viendo').length,
    vistos: entries.filter(([, d]) => d.estado === 'vistos').length,
    favoritos: entries.filter(([, d]) => d.favorito).length,
    listas: getListas().length,
    total: entries.length,
  };
}

function actualizarContadores() {
  const counts = contarPorTab();
  Object.entries(counts).forEach(([tab, count]) => {
    const badge = document.querySelector(`[data-tab-count="${tab}"]`);
    if (badge) badge.textContent = count;
  });
}

function actualizarBotonesTab() {
  document.querySelectorAll('[data-tab-espacio]').forEach((btn) => {
    if (btn.dataset.tabEspacio === 'total') return; // Es un contador pasivo, nunca se resalta como pestaña activa.

    const isActive = btn.dataset.tabEspacio === activeTab;
    btn.classList.toggle('bg-white/10', isActive);
    btn.classList.toggle('border-white/70', isActive);
    btn.classList.toggle('text-white', isActive);
    btn.classList.toggle('text-gray-400', !isActive);
  });
}

// "valoracion" y "popularidad" son la nota AniList y su popularidad, igual que en Franquicias.
// "mi_puntuacion" son tus propias estrellas — a propósito con otro nombre, para no confundirlas.
function ordenarItems(items, criterioCombinado) {
  const valor = criterioCombinado || 'reciente';
  const corte = valor.lastIndexOf('_');
  const tipo = corte === -1 ? valor : valor.slice(0, corte);
  const direccion = corte === -1 ? undefined : valor.slice(corte + 1);

  if (tipo === 'mi_puntuacion') {
    return items.sort((a, b) => {
      const va = a.data.valoracion || 0;
      const vb = b.data.valoracion || 0;
      return direccion === 'asc' ? va - vb : vb - va;
    });
  }
  if (tipo === 'valoracion') {
    return items.sort((a, b) => {
      const va = a.anime.puntuacion_ponderada || 0;
      const vb = b.anime.puntuacion_ponderada || 0;
      return direccion === 'asc' ? va - vb : vb - va;
    });
  }
  if (tipo === 'popularidad') {
    return items.sort((a, b) => {
      const pa = a.anime.score_base || 0;
      const pb = b.anime.score_base || 0;
      return direccion === 'asc' ? pa - pb : pb - pa;
    });
  }
  if (tipo === 'fecha') {
    return items.sort((a, b) => {
      const ya = a.anime.entrada_principal_ano || 0;
      const yb = b.anime.entrada_principal_ano || 0;
      return direccion === 'asc' ? ya - yb : yb - ya;
    });
  }
  if (tipo === 'alfabetico') {
    return items.sort((a, b) => {
      const cmp = (a.anime.titulo_principal || '').localeCompare(b.anime.titulo_principal || '', 'es', { sensitivity: 'base' });
      return direccion === 'desc' ? -cmp : cmp;
    });
  }
  // "Más recientes": en las pestañas de estado, lo último que tocaste; en una
  // lista propia, lo último que añadiste a ella.
  return items.sort((a, b) => b.reciente - a.reciente);
}

function render() {
  const grid = document.getElementById('mi-espacio-grid');
  const empty = document.getElementById('mi-espacio-empty');
  if (!grid || !empty) return;

  const criterio = document.getElementById('filter-orden')?.value || 'reciente';
  const busqueda = (document.getElementById('mi-espacio-buscar')?.value || '').trim().toLowerCase();
  const store = getStore();
  const buscarAnime = (id) => allAnimes.find((item) => item.id_franquicia === id);

  // Pestaña Listas: si la lista elegida ya no existe (borrada), se pasa a la primera.
  let lista = null;
  if (activeTab === 'listas') {
    const listas = getListas();
    lista = listas.find((item) => item.id === activeLista) || listas[0] || null;
    activeLista = lista?.id || null;
  }
  const barraListas = document.getElementById('mi-espacio-listas-bar');
  if (barraListas) {
    barraListas.classList.toggle('hidden', activeTab !== 'listas');
    barraListas.innerHTML = activeTab === 'listas' ? renderBarraListas(getListas(), lista) : '';
  }

  const itemsDelTab = (activeTab === 'listas'
    ? (lista?.ids || []).map((id, posicion) => ({ id, data: store[id] || {}, anime: buscarAnime(id), reciente: posicion }))
    : Object.entries(store)
      .filter(([, data]) => {
        if (activeTab === 'total') return true;
        if (activeTab === 'favoritos') return data.favorito;
        return data.estado === activeTab;
      })
      .map(([id, data]) => ({ id, data, anime: buscarAnime(id), reciente: data.actualizado || 0 })))
    .filter((item) => item.anime);

  const items = ordenarItems(
    busqueda
      ? itemsDelTab.filter((item) => (item.anime.titulo_principal || '').toLowerCase().includes(busqueda))
      : itemsDelTab,
    criterio,
  );

  const emptyTitle = document.getElementById('mi-espacio-empty-title');
  const emptyText = document.getElementById('mi-espacio-empty-text');

  if (items.length === 0) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');

    if (activeTab === 'listas' && itemsDelTab.length === 0) {
      if (emptyTitle) emptyTitle.textContent = lista ? 'Esta lista está vacía' : 'Todavía no tienes listas';
      if (emptyText) {
        emptyText.innerHTML = `${lista ? '' : 'Crea tu primera lista arriba (por ejemplo «Ver este año» o «Esperar al doblaje») y luego '}
          ${lista ? 'Abre' : 'abre'} una franquicia desde <a href="../franquicias/index.html" class="text-white underline hover:text-cyan-400 transition-colors">Franquicias</a>
          y pulsa el botón Listas para añadirla.`;
      }
    } else if (itemsDelTab.length === 0) {
      if (emptyTitle) emptyTitle.textContent = 'Todavía no hay nada aquí';
      if (emptyText) {
        emptyText.innerHTML = `Abre una franquicia desde <a href="../descubrir/index.html" class="text-white underline hover:text-cyan-400 transition-colors">Descubrir</a>
          o <a href="../franquicias/index.html" class="text-white underline hover:text-cyan-400 transition-colors">Franquicias</a>
          y añádela a Pendiente, Viendo o Completado.`;
      }
    } else {
      if (emptyTitle) emptyTitle.textContent = 'Sin resultados';
      if (emptyText) emptyText.textContent = `Ninguno de tus animes de esta pestaña coincide con "${busqueda}".`;
    }
  } else {
    empty.classList.add('hidden');
    grid.innerHTML = items.map((item) => (activeTab === 'listas'
      ? renderCardLista(item.id, item.data, item.anime, lista.id)
      : renderCard(item.id, item.data, item.anime))).join('');
  }

  actualizarContadores();
  actualizarBotonesTab();
}

function bindTabs() {
  document.querySelectorAll('[data-tab-espacio]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tabEspacio;
      render();
    });
  });
}

// Abre/cierra el desplegable. Los clics sobre una opción concreta los
// intercepta bindOrdenDropdown() antes de que lleguen aquí (misma idea que
// el desplegable de orden de Franquicias).
function handleOrdenDropdownClick(event) {
  const trigger = event.target.closest('#dropdown-orden .dropdown-trigger');

  if (trigger) {
    const options = trigger.nextElementSibling;
    const wasOpen = options.classList.contains('show');
    document.querySelectorAll('#dropdown-orden .dropdown-options').forEach((panel) => panel.classList.remove('show'));
    if (!wasOpen) options.classList.add('show');
    return;
  }

  if (!event.target.closest('#dropdown-orden')) {
    document.querySelectorAll('#dropdown-orden .dropdown-options').forEach((panel) => panel.classList.remove('show'));
  }
}

// Ordenar: igual que en Franquicias, cada opción con dirección es un solo
// botón — la palabra se queda fija y solo cambia la flechita (↑/↓) al volver
// a pulsar la opción ya activa. "Más recientes" no tiene dirección.
const SORT_WORDS_ESPACIO = {
  alfabetico: 'Alfabéticamente',
  fecha: 'Fecha',
  popularidad: 'Popularidad',
  valoracion: 'Valoración',
  mi_puntuacion: 'Tu puntuación',
};
const SORT_DEFAULT_DIR_ESPACIO = { alfabetico: 'asc', fecha: 'desc', popularidad: 'desc', valoracion: 'desc', mi_puntuacion: 'desc' };
const SORT_ARROWS_ESPACIO = { asc: '↑', desc: '↓' };

function etiquetaOrdenEspacio(criterio, direccion) {
  return `${SORT_WORDS_ESPACIO[criterio]} ${SORT_ARROWS_ESPACIO[direccion]}`;
}

function resetOpcionesOrdenEspacio() {
  const dropdown = document.getElementById('dropdown-orden');
  if (!dropdown) return;
  dropdown.querySelectorAll('.dropdown-option[data-criterio]').forEach((opt) => {
    const criterio = opt.dataset.criterio;
    if (criterio === 'reciente') return;
    const dir = SORT_DEFAULT_DIR_ESPACIO[criterio];
    opt.dataset.dir = dir;
    opt.textContent = etiquetaOrdenEspacio(criterio, dir);
  });
}

function bindOrdenDropdown() {
  const dropdown = document.getElementById('dropdown-orden');
  const input = document.getElementById('filter-orden');
  if (!dropdown || !input) return;

  dropdown.addEventListener('click', (event) => {
    const option = event.target.closest('.dropdown-option[data-criterio]');
    if (!option) return;

    event.stopImmediatePropagation();

    const criterio = option.dataset.criterio;
    const valorActivo = input.value || 'reciente';
    const corteActivo = valorActivo.lastIndexOf('_');
    const criterioActivo = corteActivo === -1 ? valorActivo : valorActivo.slice(0, corteActivo);
    let nuevoValor;
    let etiqueta;

    if (criterio === 'reciente') {
      resetOpcionesOrdenEspacio();
      nuevoValor = 'reciente';
      etiqueta = 'Más recientes';
    } else {
      const direccion = criterioActivo === criterio
        ? ((option.dataset.dir === 'asc') ? 'desc' : 'asc')
        : SORT_DEFAULT_DIR_ESPACIO[criterio];
      option.dataset.dir = direccion;
      etiqueta = etiquetaOrdenEspacio(criterio, direccion);
      option.textContent = etiqueta;
      nuevoValor = `${criterio}_${direccion}`;
    }

    input.value = nuevoValor;
    dropdown.querySelector('.dropdown-trigger').textContent = etiqueta;
    dropdown.querySelector('.dropdown-options').classList.remove('show');
    render();
  });
}

function bindOrden() {
  if (!document.getElementById('dropdown-orden')) return;
  document.addEventListener('click', handleOrdenDropdownClick);
  bindOrdenDropdown();
}

function bindBuscador() {
  document.getElementById('mi-espacio-buscar')?.addEventListener('input', render);
}

export async function initEspacioPage() {
  const root = document.getElementById('mi-espacio-app');
  if (!root) return;

  allAnimes = await getAnimes();
  limpiarHuerfanas(allAnimes);
  bindTabs();
  bindOrden();
  bindBuscador();
  document.addEventListener('mi-espacio:change', render);
  render();
}

export { getEntry, ESTADOS, escaparHtml };
