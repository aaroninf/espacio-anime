import { getAnimes } from './anime-data.js';
import { abrirModalFranquicia } from './modal-franquicia.js';
import { platformData, resolverEnlaceVer } from './plataformas.js';

const DEBUG_AFINIDAD = false;

const state = {
  franquicias: [],
  mejorFranquicia: null,
  resultadoPrincipal: null,
  alternativas: [],
  preferencias: {
    vibra: '',
    formato: '',
    mundo: '',
    motor: '',
    epoca: ''
  },
  // Preguntas de etiquetas (vibra/mundo/motor) respondidas con "Sorpréndeme".
  azar: new Set()
};

// "Me da igual" en formato/época guarda este valor: esa pregunta no filtra y cuenta
// como acertada para todas las franquicias (cualquier formato/época te vale).
const CUALQUIERA = 'cualquiera';
const PREGUNTAS_SIN_FILTRO = ['formato', 'epoca'];

function filtraPor(preferencias, categoria) {
  return Boolean(preferencias[categoria]) && preferencias[categoria] !== CUALQUIERA;
}

const CATEGORY_ORDER = ['vibra', 'formato', 'mundo', 'motor', 'epoca'];

const WEIGHTS = {
  vibra: 28,
  mundo: 18,
  motor: 24,
  formato: 18,
  epoca: 12,
  bonusEditorial: 8,
  bonusEntradaClara: 4,
  bonusStreaming: 2
};

const RELATED_TAGS = {
  vibra: {
    adrenalinica: ['accion', 'acción', 'combates', 'batallas', 'intensa', 'frenetica', 'frenética', 'epica', 'épica'],
    divertida: ['comedia', 'ligera', 'disparatada', 'absurda', 'parodia'],
    emotiva: ['drama', 'dramatica', 'dramática', 'sentimental', 'melancolica', 'melancólica', 'lagrimas', 'lágrimas'],
    tensa: ['thriller', 'suspense', 'inquietante', 'presion', 'presión', 'tension', 'tensión'],
    cerebral: ['psicologico', 'psicológico', 'estrategia', 'mental', 'compleja', 'misterio'],
    terrorifica: ['terror', 'horror', 'gore', 'macabra'],
    aventurera: ['aventura', 'viaje', 'exploracion', 'exploración', 'quest', 'epica', 'épica'],
    relajante: ['slice of life', 'iyashikei', 'tranquila', 'calmada', 'cotidiana', 'vida cotidiana'],
    romantica: ['romance', 'romance central', 'pareja', 'sentimental'],
    oscura: ['oscura', 'tragica', 'trágica', 'sombria', 'sombría', 'violenta', 'retorcida'],
    contemplativa: ['atmosferica', 'atmosférica', 'poetica', 'poética', 'autor', 'intimista', 'lenta']
  },
  mundo: {
    'actual / realista': ['actual', 'realista', 'urbano', 'contemporaneo', 'contemporáneo'],
    escolar: ['school', 'escuela', 'instituto', 'academia', 'liceo'],
    fantasia: ['fantasia', 'fantasía', 'magia', 'reino', 'criaturas'],
    'sobrenatural urbano': ['sobrenatural', 'espiritus', 'espíritus', 'urban fantasy', 'yokai', 'urbano'],
    'ciencia ficcion futurista': ['ciencia ficcion', 'ciencia ficción', 'sci-fi', 'futurista', 'cyberpunk', 'space'],
    'distopia / postapocalipsis': ['distopia', 'distopía', 'post-apocalyptic', 'postapocalipsis', 'ruinas', 'dystopian'],
    historico: ['historico', 'histórico', 'samurai', 'samurái', 'ninja', 'periodo', 'época'],
    'otro mundo / isekai': ['isekai', 'otro mundo', 'reincarnation', 'reencarnacion', 'reencarnación'],
    'mundo virtual / videojuego': ['videojuego', 'virtual', 'vr', 'mmorpg', 'game', 'video games'],
    'guerra / militar': ['military', 'war', 'guerra', 'militar', 'ejercito', 'ejército']
  },
  motor: {
    'accion y combates': ['accion', 'acción', 'combates', 'batallas', 'torneo', 'martial arts', 'swordplay'],
    'investigacion y misterio': ['misterio', 'investigacion', 'investigación', 'detective', 'thriller', 'investigation'],
    'romance central': ['romance', 'pareja', 'sentimental'],
    'vida cotidiana': ['slice of life', 'cotidiana', 'vida diaria', 'everyday', 'costumbrista'],
    'crecimiento personal': ['coming of age', 'madurez', 'crecimiento', 'superacion', 'superación'],
    'viaje y exploracion': ['viaje', 'travel', 'aventura', 'exploracion', 'exploración', 'road'],
    'deporte y competicion': ['sports', 'deporte', 'deportes', 'competicion', 'competición', 'torneo', 'equipo'],
    'crimen y bajos fondos': ['crime', 'mafia', 'yakuza', 'bajos fondos', 'delinquents', 'police'],
    'politica y estrategia': ['politica', 'política', 'strategy', 'estrategia', 'war', 'reinos'],
    'supervivencia / juego mortal': ['survival', 'death game', 'supervivencia', 'juego mortal', 'mortal'],
    'mechas y pilotos': ['mecha', 'mechas', 'robots', 'real robot', 'super robot', 'pilotos'],
    'musica / escenario': ['music', 'musica', 'música', 'idol', 'band', 'escenario']
  }
};

export async function initAfinidadPage() {
  if (!document.getElementById('afinidad-app')) return;

  bindAfinidadEvents();
  await cargarBaseDeDatos();
  exponerDebugGlobal();
  abrirResultadoCompartido();
}

// --- Compartir resultado ---
// El enlace lleva las 5 respuestas en la URL (?vibra=...&formato=...) y la franquicia
// que se está viendo (r=...). Quien lo abre recalcula el test con esas respuestas y,
// si se compartió una alternativa, se le muestra esa en vez de la principal.
function construirEnlaceCompartir() {
  const params = new URLSearchParams();
  CATEGORY_ORDER.forEach((cat) => params.set(cat, state.preferencias[cat]));
  if (state.azar.size) params.set('azar', [...state.azar].join(','));
  if (state.mejorFranquicia?.id_franquicia) params.set('r', state.mejorFranquicia.id_franquicia);
  return `${location.origin}${location.pathname}?${params.toString()}`;
}

function esRespuestaValida(categoria, valor) {
  if (valor === CUALQUIERA) return PREGUNTAS_SIN_FILTRO.includes(categoria);
  return [...document.querySelectorAll(`.js-answer[data-category="${categoria}"]`)]
    .some((button) => button.dataset.value === valor);
}

function abrirResultadoCompartido() {
  if (!state.franquicias.length) return;
  const params = new URLSearchParams(location.search);
  const valida = CATEGORY_ORDER.every((cat) => esRespuestaValida(cat, params.get(cat)));
  if (!valida) return;

  CATEGORY_ORDER.forEach((cat) => {
    state.preferencias[cat] = params.get(cat);
  });
  state.azar = new Set((params.get('azar') || '').split(',').filter((cat) => ['vibra', 'mundo', 'motor'].includes(cat)));
  actualizarBotonesDisponibles();
  changeScreen('screen-result');

  const alternativa = state.alternativas.find((alt) => alt.franquicia?.id_franquicia === params.get('r'));
  if (alternativa) {
    state.mejorFranquicia = alternativa.franquicia;
    state.resultadoPrincipal = alternativa;
    mostrarResultado(alternativa, false);
  }
}

async function compartirResultado() {
  const titulo = state.mejorFranquicia?.titulo_principal || state.mejorFranquicia?.titulo;
  if (!titulo) return;

  const url = construirEnlaceCompartir();
  const texto = `Afinidad me recomienda ${titulo}. Haz el test en Espacio Anime:`;

  if (navigator.share) {
    try {
      await navigator.share({ title: 'Afinidad | Espacio Anime', text: texto, url });
    } catch (error) {
      // Cancelar el menú de compartir no es un error que haya que mostrar.
    }
    return;
  }

  const label = document.getElementById('res-share-label');
  try {
    await navigator.clipboard.writeText(url);
    if (label) label.textContent = 'Enlace copiado';
  } catch (error) {
    if (label) label.textContent = 'No se pudo copiar';
  }
  setTimeout(() => {
    if (label) label.textContent = 'Compartir';
  }, 2000);
}

function actualizarBotonCompartir(visible) {
  const boton = document.getElementById('res-share');
  if (boton) boton.style.display = visible ? '' : 'none';
}

function bindAfinidadEvents() {
  const startButton = document.getElementById('start-test-btn');
  const repeatButton = document.getElementById('repeat-test');
  const fichaButton = document.getElementById('res-link-web');
  const alternativesWrap = document.getElementById('res-alt-list');

  if (startButton) {
    startButton.addEventListener('click', () => {
      resetPreferencias();
      actualizarBotonesDisponibles();
      limpiarFeedbackActivo();
      debugEstado('Inicio del test');
      changeScreen('screen-q1');
    });
  }

  if (repeatButton) {
    repeatButton.addEventListener('click', resetTest);
  }

  document.getElementById('res-share')?.addEventListener('click', compartirResultado);

  // Al abrir "¿Cómo funciona?" (bajo el test) se baja hasta la explicación.
  const comoFunciona = document.querySelector('#afinidad .afinidad-como');
  comoFunciona?.addEventListener('toggle', () => {
    if (comoFunciona.open) comoFunciona.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  if (fichaButton) {
    fichaButton.addEventListener('click', () => {
      const mode = fichaButton.dataset.mode || 'modal';

      if (mode === 'repeat') {
        resetPreferencias();
        actualizarBotonesDisponibles();
        limpiarFeedbackActivo();
        debugEstado('Ajustar respuestas');
        changeScreen('screen-q1');
        return;
      }

      if (!state.mejorFranquicia?.id_franquicia) return;
      abrirModalFranquicia(state.mejorFranquicia.id_franquicia);
    });
  }

  const addEspacioButton = document.getElementById('res-add-espacio');
  if (addEspacioButton) {
    addEspacioButton.addEventListener('click', () => {
      const id = state.mejorFranquicia?.id_franquicia;
      if (!id || !window.miEspacioToggleEstado) return;
      window.miEspacioToggleEstado(id, 'quiero_ver');
      actualizarBotonEspacio(id);
    });
  }

  if (alternativesWrap) {
    alternativesWrap.addEventListener('click', (event) => {
      const button = event.target.closest('.js-alt-result');
      if (!button) return;

      const index = Number(button.dataset.altIndex);
      const alternativa = state.alternativas[index];
      if (!alternativa) return;

      state.mejorFranquicia = alternativa.franquicia;
      state.resultadoPrincipal = alternativa;
      mostrarResultado(alternativa, false);
      debugEstado('Alternativa seleccionada');
    });
  }

  document.querySelectorAll('.js-answer').forEach((button) => {
    button.addEventListener('click', () => {
      if (button.dataset.disabled === 'true') {
        const reason = button.dataset.disabledReason || 'No hay una opción clara con esta combinación en la base actual.';
        mostrarFeedbackEnPantallaActual(reason, true);
        return;
      }

      const category = button.dataset.category;
      const value = button.dataset.value;
      const next = button.dataset.next;

      state.preferencias[category] = value;
      actualizarBotonesDisponibles();
      limpiarFeedbackActivo();
      debugEstado(`Respuesta: ${category} = ${value}`);
      changeScreen(next);
    });

    button.addEventListener('mouseenter', () => {
      if (button.dataset.disabled === 'true') {
        const reason = button.dataset.disabledReason || 'No hay una opción clara con esta combinación en la base actual.';
        mostrarFeedbackEnPantallaActual(reason, false);
      }
    });

    button.addEventListener('focus', () => {
      if (button.dataset.disabled === 'true') {
        const reason = button.dataset.disabledReason || 'No hay una opción clara con esta combinación en la base actual.';
        mostrarFeedbackEnPantallaActual(reason, false);
      }
    });

    button.addEventListener('mouseleave', () => {
      if (button.dataset.disabled === 'true') {
        limpiarFeedbackActivo();
      }
    });

    button.addEventListener('blur', () => {
      if (button.dataset.disabled === 'true') {
        limpiarFeedbackActivo();
      }
    });
  });

  // "Sorpréndeme" (vibra/mundo/motor) elige al azar una de las opciones disponibles;
  // "Me da igual" (formato/época) deja esa pregunta sin filtrar.
  document.querySelectorAll('.js-skip').forEach((button) => {
    button.addEventListener('click', () => {
      const category = button.dataset.category;

      if (PREGUNTAS_SIN_FILTRO.includes(category)) {
        state.preferencias[category] = CUALQUIERA;
      } else {
        const disponibles = [...document.querySelectorAll(`.js-answer[data-category="${category}"]`)]
          .filter((option) => option.dataset.disabled !== 'true');
        if (!disponibles.length) return;
        const elegida = disponibles[Math.floor(Math.random() * disponibles.length)];
        state.preferencias[category] = elegida.dataset.value;
        state.azar.add(category);
      }

      actualizarBotonesDisponibles();
      limpiarFeedbackActivo();
      debugEstado(`Respuesta: ${category} = ${state.preferencias[category]}${state.azar.has(category) ? ' (azar)' : ''}`);
      changeScreen(button.dataset.next);
    });
  });

  document.querySelectorAll('.js-back').forEach((button) => {
    button.addEventListener('click', () => {
      const prevId = button.dataset.prev;
      if (!prevId) return;

      const prevCat = obtenerCategoriaDePantalla(prevId);
      if (prevCat) {
        limpiarPreferenciasDesde(prevCat);
      } else {
        resetPreferencias();
      }

      actualizarBotonesDisponibles();
      limpiarFeedbackActivo();
      debugEstado(`Volver a ${prevId}`);
      changeScreen(prevId);
    });
  });
}

async function cargarBaseDeDatos() {
  const startButton = document.getElementById('start-test-btn');

  try {
    const data = await getAnimes();
    state.franquicias = Array.isArray(data) ? data.filter(esFranquiciaValida) : [];

    if (startButton) {
      startButton.disabled = state.franquicias.length === 0;
      startButton.textContent = state.franquicias.length > 0 ? 'Empezar test' : 'Base vacía';
    }

    actualizarBotonesDisponibles();
    debugEstado('Base cargada');
  } catch (error) {
    console.error('Error cargando base de datos:', error);

    if (startButton) {
      startButton.disabled = true;
      startButton.textContent = 'Error al cargar';
    }
  }
}

function changeScreen(screenId) {
  document.querySelectorAll('#afinidad-app .screen').forEach((screen) => {
    screen.classList.remove('active');
  });

  const target = document.getElementById(screenId);
  if (target) target.classList.add('active');

  limpiarFeedbackActivo();

  if (screenId === 'screen-result') {
    calcularResultado();
  }
}

function obtenerCategoriaDePantalla(screenId) {
  const map = {
    'screen-q1': 'vibra',
    'screen-q2': 'formato',
    'screen-q3': 'mundo',
    'screen-q4': 'motor',
    'screen-q5': 'epoca'
  };
  return map[screenId] || null;
}

function resetPreferencias() {
  CATEGORY_ORDER.forEach((cat) => {
    state.preferencias[cat] = '';
  });
  state.azar.clear();
}

function limpiarPreferenciasDesde(categoriaInicio) {
  const startIndex = CATEGORY_ORDER.indexOf(categoriaInicio);
  if (startIndex === -1) return;

  for (let i = startIndex; i < CATEGORY_ORDER.length; i += 1) {
    state.preferencias[CATEGORY_ORDER[i]] = '';
    state.azar.delete(CATEGORY_ORDER[i]);
  }
}

function resetTest() {
  state.mejorFranquicia = null;
  state.resultadoPrincipal = null;
  state.alternativas = [];
  resetPreferencias();

  // Si se llegó desde un enlace compartido, repetir el test limpia la URL.
  if (location.search) history.replaceState(null, '', location.pathname);

  const img = document.getElementById('res-img');
  const title = document.getElementById('res-title');
  const score = document.getElementById('res-score');
  const scoreLabel = document.getElementById('res-score-label');
  const why = document.getElementById('res-why');
  const entryNote = document.getElementById('res-entry-note');
  const streamLink = document.getElementById('res-link-streaming');
  const streamLabel = document.getElementById('res-link-streaming-label');
  const fichaButton = document.getElementById('res-link-web');
  const meta = document.getElementById('res-meta');
  const alternatives = document.getElementById('res-alt-list');

  if (img) {
    img.src = '';
    img.alt = 'Cover';
  }
  if (title) title.textContent = 'Cargando...';
  if (score) score.textContent = '';
  if (scoreLabel) scoreLabel.textContent = 'Afinidad alta';
  if (why) why.textContent = '—';
  if (entryNote) {
    entryNote.textContent = '';
    entryNote.classList.add('hidden');
  }
  if (meta) meta.innerHTML = '';
  if (alternatives) alternatives.innerHTML = '';

  if (streamLink) {
    streamLink.href = '#';
    streamLink.style.display = 'flex';
  }

  if (streamLabel) {
    streamLabel.textContent = 'Ver';
  }

  if (fichaButton) {
    fichaButton.textContent = 'Ficha';
    fichaButton.disabled = true;
    fichaButton.dataset.mode = 'modal';
    fichaButton.classList.add('opacity-50', 'cursor-not-allowed');
  }

  actualizarBotonesDisponibles();
  limpiarFeedbackActivo();
  debugEstado('Reset del test');
  changeScreen('screen-start');
}

function esFranquiciaValida(franquicia) {
  if (!franquicia || franquicia.incubadora === true) return false;
  if (!Array.isArray(franquicia.entradas) || franquicia.entradas.length === 0) return false;
  if (!franquicia.entrada_principal_titulo && !franquicia.entrada_principal_ani_id) return false;

  // No recomendar algo que el usuario ya marcó como Completado o Favorito en Mi espacio.
  const guardado = window.miEspacioGetEntry?.(franquicia.id_franquicia);
  if (guardado?.estado === 'vistos' || guardado?.favorito) return false;

  return true;
}

function actualizarBotonesDisponibles() {
  const botones = document.querySelectorAll('.js-answer');

  botones.forEach((btn) => {
    const cat = btn.dataset.category;
    const val = btn.dataset.value;
    const preferenciasHipoteticas = { ...state.preferencias, [cat]: val };

    const existeCamino = state.franquicias.some((franquicia) => {
      return cumpleCaminoPosible(franquicia, preferenciasHipoteticas);
    });

    if (existeCamino) {
      btn.classList.remove('is-disabled');
      btn.dataset.disabled = 'false';
      btn.dataset.disabledReason = '';
      btn.removeAttribute('aria-disabled');
      btn.title = '';
    } else {
      const reason = construirMensajeBloqueo(cat, val);
      btn.classList.add('is-disabled');
      btn.dataset.disabled = 'true';
      btn.dataset.disabledReason = reason;
      btn.setAttribute('aria-disabled', 'true');
      btn.title = reason;
    }
  });
}

function construirMensajeBloqueo(categoria, valor) {
  if (categoria === 'formato') {
    return 'No queda una opción cuya entrada principal encaje con ese formato y con lo que ya has marcado.';
  }

  if (categoria === 'epoca') {
    return 'No queda ninguna opción con esta combinación dentro de esa etapa visual.';
  }

  if (categoria === 'mundo') {
    return 'Con lo que ya has elegido, no queda una opción clara dentro de ese tipo de mundo.';
  }

  if (categoria === 'motor') {
    return 'Con esta combinación, ese motor ya no tiene una opción clara en la base.';
  }

  if (categoria === 'vibra') {
    return 'Con esa vibra no se abre un camino claro dentro de la base actual.';
  }

  return `No hay una opción clara con la combinación actual y la opción “${valor}”.`;
}

function cumpleCaminoPosible(franquicia, preferencias) {
  const entradaPrincipal = obtenerEntradaPrincipal(franquicia);
  if (!entradaPrincipal) return false;

  const formatoPrincipal = clasificarFormatoPrincipal(franquicia, entradaPrincipal);
  const epocaPrincipal = clasificarEpoca(obtenerAnoPrincipal(franquicia, entradaPrincipal));
  const etiquetas = obtenerEtiquetasFranquicia(franquicia);

  if (filtraPor(preferencias, 'formato') && formatoPrincipal.key !== preferencias.formato) return false;
  if (filtraPor(preferencias, 'epoca') && epocaPrincipal.key !== preferencias.epoca) return false;

  const prefsSoft = ['vibra', 'mundo', 'motor'].filter((key) => preferencias[key]);
  if (prefsSoft.length === 0) return true;

  let coincidencias = 0;

  if (preferencias.vibra && resolverCoincidencia('vibra', etiquetas, preferencias.vibra, 1).points > 0) {
    coincidencias += 1;
  }
  if (preferencias.mundo && resolverCoincidencia('mundo', etiquetas, preferencias.mundo, 1).points > 0) {
    coincidencias += 1;
  }
  if (preferencias.motor && resolverCoincidencia('motor', etiquetas, preferencias.motor, 1).points > 0) {
    coincidencias += 1;
  }

  return coincidencias >= 1;
}

// El bonus de popularidad (WEIGHTS.bonusEditorial) se satura en +8 para prácticamente todo el catálogo
// (score_base >= 3000 en las 388 franquicias), así que por sí solo no desempata nada real. Cuando dos
// franquicias quedan con el mismo `score`, se decide primero por puntuacion_ponderada (calidad real,
// ver 3.5 del documento maestro) y solo si también empata eso, por popularidad bruta (score_base) —
// nunca por el orden en que aparecen en animes.json, que es arbitrario.
function compararEvaluaciones(a, b) {
  if (b.score !== a.score) return b.score - a.score;
  const pa = Number(a.franquicia?.puntuacion_ponderada) || 0;
  const pb = Number(b.franquicia?.puntuacion_ponderada) || 0;
  if (pb !== pa) return pb - pa;
  const sa = Number(a.franquicia?.score_base) || 0;
  const sb = Number(b.franquicia?.score_base) || 0;
  return sb - sa;
}

function calcularResultado() {
  const evaluaciones = state.franquicias
    .map((franquicia) => evaluarFranquicia(franquicia, state.preferencias))
    .filter((item) => item !== null)
    .sort(compararEvaluaciones);

  if (evaluaciones.length === 0) {
    mostrarSinResultados();
    debugEstado('Sin resultados');
    return;
  }

  const principal = evaluaciones[0];
  const alternativas = evaluaciones.slice(1, 3);

  state.mejorFranquicia = principal.franquicia;
  state.resultadoPrincipal = principal;
  state.alternativas = alternativas;

  mostrarResultado(principal, true);
  debugEstado('Resultado calculado');
}

function evaluarFranquicia(franquicia, preferencias) {
  if (!esFranquiciaValida(franquicia)) return null;

  const entradaPrincipal = obtenerEntradaPrincipal(franquicia);
  if (!entradaPrincipal) return null;

  const formatoPrincipal = clasificarFormatoPrincipal(franquicia, entradaPrincipal);
  const epocaPrincipal = clasificarEpoca(obtenerAnoPrincipal(franquicia, entradaPrincipal));
  const etiquetas = obtenerEtiquetasFranquicia(franquicia);
  const link = resolverEnlaceVer(franquicia, entradaPrincipal);

  if (filtraPor(preferencias, 'formato') && formatoPrincipal.key !== preferencias.formato) {
    return null;
  }

  if (filtraPor(preferencias, 'epoca') && epocaPrincipal.key !== preferencias.epoca) {
    return null;
  }

  let score = 0;
  let matchPeso = 0;
  let matchPuntos = 0;
  let coincidenciasReales = 0;
  const razones = [];

  if (preferencias.vibra) {
    const resVibra = resolverCoincidencia('vibra', etiquetas, preferencias.vibra, WEIGHTS.vibra);
    matchPeso += WEIGHTS.vibra;
    matchPuntos += resVibra.points;
    score += resVibra.points;
    if (resVibra.points > 0) {
      coincidenciasReales += 1;
      razones.push(`una vibra ${preferencias.vibra.toLowerCase()}${state.azar.has('vibra') ? ' (elegida al azar)' : ''}`);
    }
  }

  if (preferencias.mundo) {
    const resMundo = resolverCoincidencia('mundo', etiquetas, preferencias.mundo, WEIGHTS.mundo);
    matchPeso += WEIGHTS.mundo;
    matchPuntos += resMundo.points;
    score += resMundo.points;
    if (resMundo.points > 0) {
      coincidenciasReales += 1;
      razones.push(`un mundo ${preferencias.mundo.toLowerCase()}${state.azar.has('mundo') ? ' (elegido al azar)' : ''}`);
    }
  }

  if (preferencias.motor) {
    const resMotor = resolverCoincidencia('motor', etiquetas, preferencias.motor, WEIGHTS.motor);
    matchPeso += WEIGHTS.motor;
    matchPuntos += resMotor.points;
    score += resMotor.points;
    if (resMotor.points > 0) {
      coincidenciasReales += 1;
      razones.push(`un motor centrado en ${preferencias.motor.toLowerCase()}${state.azar.has('motor') ? ' (elegido al azar)' : ''}`);
    }
  }

  if (preferencias.formato) {
    matchPeso += WEIGHTS.formato;
    matchPuntos += WEIGHTS.formato;
    score += WEIGHTS.formato;
  }

  if (preferencias.epoca) {
    matchPeso += WEIGHTS.epoca;
    matchPuntos += WEIGHTS.epoca;
    score += WEIGHTS.epoca;
  }

  const scoreBaseNormalizado = Math.min(
    WEIGHTS.bonusEditorial,
    Math.round((Number(franquicia.score_base || 0) / 3000) * WEIGHTS.bonusEditorial)
  );
  score += Math.max(0, scoreBaseNormalizado);

  if (entradaPrincipal) {
    score += WEIGHTS.bonusEntradaClara;
  }

  if (link && link !== '#') {
    score += WEIGHTS.bonusStreaming;
  }

  const prefsSoftRespondidas = ['vibra', 'mundo', 'motor'].filter((key) => preferencias[key]).length;

  if (prefsSoftRespondidas > 0 && coincidenciasReales === 0) {
    return null;
  }

  // % real: proporción de las etiquetas/filtros preguntados que la franquicia cumple de verdad,
  // sin bonus de popularidad/streaming (esos solo desempatan el orden interno, "score").
  const match = matchPeso > 0
    ? Math.max(0, Math.min(100, Math.round((matchPuntos / matchPeso) * 100)))
    : 0;
  const explicacion = construirExplicacion({
    entradaPrincipal,
    formatoPrincipal,
    epocaPrincipal,
    razones,
    preferencias
  });

  return {
    franquicia,
    entradaPrincipal,
    formatoPrincipal,
    epocaPrincipal,
    score,
    match,
    razones,
    explicacion
  };
}

function resolverCoincidencia(categoria, etiquetas, valor, pesoMaximo) {
  const objetivo = normalizarTexto(valor);
  if (!objetivo) return { points: 0, mode: 'none' };

  const exacta = etiquetas.some((item) => coincideTextoFlexible(item, objetivo));
  if (exacta) {
    return { points: pesoMaximo, mode: 'exacta' };
  }

  const relacionadas = RELATED_TAGS[categoria]?.[objetivo] || [];
  const parcial = relacionadas.some((term) =>
    etiquetas.some((item) => coincideTextoFlexible(item, term))
  );

  if (parcial) {
    return { points: Math.max(1, Math.round(pesoMaximo * 0.62)), mode: 'relacionada' };
  }

  return { points: 0, mode: 'none' };
}

function obtenerEtiquetasFranquicia(franquicia) {
  const editorial = Array.isArray(franquicia.etiquetas_editoriales) ? franquicia.etiquetas_editoriales : [];
  const generos = Array.isArray(franquicia.generos) ? franquicia.generos : [];
  const tagsAnilist = Array.isArray(franquicia.tags_anilist) ? franquicia.tags_anilist : [];

  return [...new Set(
    [...editorial, ...generos, ...tagsAnilist]
      .map((item) => normalizarTexto(item))
      .filter(Boolean)
  )];
}

function obtenerEntradaPrincipal(franquicia) {
  if (!franquicia) return null;

  if (Array.isArray(franquicia.entradas) && franquicia.entrada_principal_ani_id) {
    const porId = franquicia.entradas.find((item) => item.ani_id === franquicia.entrada_principal_ani_id);
    if (porId) return porId;
  }

  if (Array.isArray(franquicia.entradas) && franquicia.entrada_principal_titulo) {
    const porTitulo = franquicia.entradas.find(
      (item) => normalizarTexto(obtenerTituloEntrada(item)) === normalizarTexto(franquicia.entrada_principal_titulo)
    );
    if (porTitulo) return porTitulo;
  }

  if (Array.isArray(franquicia.entradas)) {
    const marcada = franquicia.entradas.find((item) => item.es_entrada_principal === true);
    if (marcada) return marcada;
  }

  return null;
}

function obtenerAnoPrincipal(franquicia, entradaPrincipal) {
  const posibles = [
    franquicia?.entrada_principal_ano,
    entradaPrincipal?.año,
    entradaPrincipal?.ano
  ];

  for (const value of posibles) {
    const year = Number(value);
    if (!Number.isNaN(year) && year > 1900) return year;
  }

  return 2015;
}

function clasificarEpoca(year) {
  if (year < 2010) return { key: 'clasico', label: 'clásica' };
  if (year >= 2010 && year < 2020) return { key: 'moderno', label: 'moderna' };
  return { key: 'actual', label: 'actual' };
}

function clasificarFormatoPrincipal(franquicia, entradaPrincipal) {
  const tipoPrincipal = normalizarTexto(franquicia?.entrada_principal_tipo || entradaPrincipal?.tipo || '');
  const episodiosEntrada = Number(franquicia?.entrada_principal_episodios || entradaPrincipal?.episodios || 0) || 0;
  const totalEntradas = Number(franquicia?.total_entradas || franquicia?.entradas?.length || 0) || 0;
  const totalEpisodios = Number(franquicia?.total_episodios_aprox || 0) || 0;

  if (tipoPrincipal === 'pelicula' || tipoPrincipal === 'película') {
    return { key: 'pelicula', label: 'película de entrada' };
  }

  if (tipoPrincipal === 'serie corta') {
    return { key: 'serie_corta', label: 'serie corta' };
  }

  if (tipoPrincipal === 'serie tv') {
    if (episodiosEntrada >= 24 || totalEpisodios >= 45 || totalEntradas >= 4) {
      return { key: 'serie_larga', label: 'serie larga' };
    }
    return { key: 'serie_corta', label: 'serie corta' };
  }

  if (tipoPrincipal === 'ona' || tipoPrincipal === 'ova' || tipoPrincipal === 'especial') {
    if (episodiosEntrada >= 24 || totalEpisodios >= 45 || totalEntradas >= 4) {
      return { key: 'serie_larga', label: 'serie larga' };
    }
    return { key: 'serie_corta', label: 'serie corta' };
  }

  if (totalEpisodios >= 45 || totalEntradas >= 4) {
    return { key: 'serie_larga', label: 'serie larga' };
  }

  return { key: 'serie_corta', label: 'serie corta' };
}

function construirExplicacion({ entradaPrincipal, formatoPrincipal, epocaPrincipal, razones, preferencias }) {
  const partes = razones.slice(0, 3);
  const entradaTitulo = obtenerTituloEntrada(entradaPrincipal);

  let bloqueRazones = '';
  if (partes.length === 1) {
    bloqueRazones = partes[0];
  } else if (partes.length === 2) {
    bloqueRazones = `${partes[0]} y ${partes[1]}`;
  } else if (partes.length >= 3) {
    bloqueRazones = `${partes[0]}, ${partes[1]} y ${partes[2]}`;
  }

  let texto = 'Es la opción que mejor encaja';

  if (bloqueRazones) {
    texto += ` porque combina ${bloqueRazones}.`;
  } else {
    texto += ' dentro de la base actual.';
  }

  if (preferencias.formato === CUALQUIERA) {
    texto += ` El formato te daba igual: su entrada principal funciona como ${formatoPrincipal.label}.`;
  } else if (preferencias.formato === 'pelicula') {
    texto += ' Además, entra exactamente en el formato que has marcado: una película como punto de entrada.';
  } else if (preferencias.formato === 'serie_corta') {
    texto += ' Además, funciona bien como una serie corta: entra rápido y se deja ver con mucha facilidad.';
  } else if (preferencias.formato === 'serie_larga') {
    texto += ' Además, funciona bien como una serie larga para quien quiere quedarse dentro del universo y no solo probarlo.';
  } else {
    texto += ` Además, su entrada principal funciona como ${formatoPrincipal.label}.`;
  }

  if (entradaTitulo) {
    texto += ` La opción más clara para empezar es “${entradaTitulo}”.`;
  }

  texto += preferencias.epoca === CUALQUIERA
    ? ` La época te daba igual: visualmente es de una etapa ${epocaPrincipal.label}.`
    : ` Visualmente encaja con una etapa ${epocaPrincipal.label}.`;

  return texto;
}

function obtenerEtiquetaAfinidad(match) {
  if (match >= 90) return 'Afinidad muy alta';
  if (match >= 75) return 'Afinidad alta';
  if (match >= 55) return 'Buena opción';
  return 'Coincidencia parcial';
}

function mostrarResultado(resultado, lanzarCelebracion = true) {
  const img = document.getElementById('res-img');
  const title = document.getElementById('res-title');
  const score = document.getElementById('res-score');
  const scoreLabel = document.getElementById('res-score-label');
  const meta = document.getElementById('res-meta');
  const why = document.getElementById('res-why');
  const entryNote = document.getElementById('res-entry-note');
  const streamLink = document.getElementById('res-link-streaming');
  const streamLabel = document.getElementById('res-link-streaming-label');
  const fichaButton = document.getElementById('res-link-web');

  const franquicia = resultado.franquicia;
  const entradaPrincipal = resultado.entradaPrincipal;
  const tituloFranquicia = franquicia?.titulo_principal || franquicia?.titulo || 'Sin título';
  const tituloEntrada = obtenerTituloEntrada(entradaPrincipal);
  const link = resolverEnlaceVer(franquicia, entradaPrincipal);

  if (img) {
    img.src = franquicia?.imagen_principal || '';
    img.alt = tituloFranquicia;
  }

  if (title) title.textContent = tituloFranquicia;
  if (score) score.textContent = resultado.match;
  if (scoreLabel) scoreLabel.textContent = obtenerEtiquetaAfinidad(resultado.match);

  if (meta) {
    meta.innerHTML = `
      ${crearChip(resultado.formatoPrincipal.label)}
      ${crearChip(`estética ${resultado.epocaPrincipal.label}`)}
    `;
  }

  if (why) why.textContent = resultado.explicacion;

  if (entryNote) {
    if (tituloEntrada && normalizarTexto(tituloEntrada) !== normalizarTexto(tituloFranquicia)) {
      entryNote.textContent = `Entrada principal: ${tituloEntrada}`;
      entryNote.classList.remove('hidden');
    } else {
      entryNote.textContent = '';
      entryNote.classList.add('hidden');
    }
  }

  const { label: streamLabelText, className: streamClassName } = platformData(entradaPrincipal?.plataforma || '');

  if (streamLink) {
    streamLink.style.display = 'flex';
    streamLink.href = link || '#';
    streamLink.className = `sm:flex-1 py-3.5 text-white font-black uppercase tracking-wider rounded-xl transition-all shadow-lg text-center text-sm flex items-center justify-center gap-2 ${streamClassName}`;
  }

  if (streamLabel) {
    streamLabel.textContent = streamLabelText;
  }

  if (fichaButton) {
    fichaButton.textContent = 'Ficha';
    fichaButton.disabled = !franquicia?.id_franquicia;
    fichaButton.dataset.mode = 'modal';
    fichaButton.classList.toggle('opacity-50', !franquicia?.id_franquicia);
    fichaButton.classList.toggle('cursor-not-allowed', !franquicia?.id_franquicia);
  }

  actualizarBotonEspacio(franquicia?.id_franquicia);
  actualizarBotonCompartir(Boolean(franquicia?.id_franquicia));

  renderAlternativas();

  if (lanzarCelebracion) {
    lanzarConfeti();
  }
}

function actualizarBotonEspacio(idFranquicia) {
  const boton = document.getElementById('res-add-espacio');
  if (!boton) return;

  if (!idFranquicia) {
    boton.disabled = true;
    boton.classList.add('opacity-50', 'cursor-not-allowed');
    return;
  }

  boton.disabled = false;
  boton.classList.remove('opacity-50', 'cursor-not-allowed');

  const guardado = window.miEspacioGetEntry?.(idFranquicia);
  const enLista = guardado?.estado === 'quiero_ver';
  boton.textContent = enLista ? '✓ Pendiente' : 'Pendiente';
  boton.classList.toggle('bg-[#1e2f47]', !enLista);
  boton.classList.toggle('bg-emerald-600/80', enLista);
  boton.classList.toggle('hover:bg-[#2a405e]', !enLista);
}

// --- CAMBIO: NUEVO DOM PARA LA TARJETA (Imagen Izquierda, Texto apilado a la Derecha) ---
function renderAlternativas() {
  const container = document.getElementById('res-alt-list');
  const wrap = document.getElementById('res-alt-wrap');

  if (!container || !wrap) return;

  if (!state.alternativas.length) {
    container.innerHTML = '';
    wrap.style.display = 'none';
    return;
  }

  wrap.style.display = 'block';

  container.innerHTML = state.alternativas.map((alt, index) => {
    const titulo = escapeHtml(alt.franquicia?.titulo_principal || alt.franquicia?.titulo || 'Sin título');
    const match = alt.match ?? 0;
    const imagen = escapeHtml(alt.franquicia?.imagen_principal || '');

    return `
      <button
        type="button"
        data-alt-index="${index}"
        class="js-alt-result text-left rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all p-3 w-full"
      >
        <div class="result-mini-card">
          <img src="${imagen}" alt="${titulo}">
          <div class="mini-info">
            <div class="mini-title" title="${titulo}">${titulo}</div>
            <span class="text-[11px] uppercase tracking-[0.16em] text-cyan-400 font-black whitespace-nowrap mt-1">${match}%</span>
          </div>
        </div>
      </button>
    `;
  }).join('');
}
// --- FIN CAMBIO ---

function mostrarSinResultados() {
  state.mejorFranquicia = null;
  state.resultadoPrincipal = null;
  state.alternativas = [];

  const img = document.getElementById('res-img');
  const title = document.getElementById('res-title');
  const score = document.getElementById('res-score');
  const scoreLabel = document.getElementById('res-score-label');
  const meta = document.getElementById('res-meta');
  const why = document.getElementById('res-why');
  const entryNote = document.getElementById('res-entry-note');
  const streamLink = document.getElementById('res-link-streaming');
  const fichaButton = document.getElementById('res-link-web');
  const alternatives = document.getElementById('res-alt-list');
  const wrap = document.getElementById('res-alt-wrap');

  if (img) {
    img.src = '../../assets/img/descubrir/joyas_cinematograficas.png';
    img.alt = 'Sin coincidencia clara';
  }
  if (title) title.textContent = 'No hay una opción clara';
  if (score) score.textContent = '--';
  if (scoreLabel) scoreLabel.textContent = 'Sin resultado';
  if (meta) meta.innerHTML = '';
  if (why) {
    why.textContent = 'Con esta combinación no aparece una opción clara dentro de la base actual. Lo mejor es abrir un poco la búsqueda cambiando el formato, el mundo o la época visual.';
  }
  if (entryNote) {
    entryNote.textContent = '';
    entryNote.classList.add('hidden');
  }
  if (streamLink) {
    streamLink.style.display = 'none';
  }
  if (fichaButton) {
    fichaButton.textContent = 'Ajustar respuestas';
    fichaButton.disabled = false;
    fichaButton.dataset.mode = 'repeat';
    fichaButton.classList.remove('opacity-50', 'cursor-not-allowed');
  }
  if (alternatives) alternatives.innerHTML = '';
  if (wrap) wrap.style.display = 'none';
  actualizarBotonCompartir(false);
}

function crearChip(texto) {
  return `<span class="inline-flex items-center px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs uppercase tracking-[0.12em] text-slate-300 font-bold">${escapeHtml(texto)}</span>`;
}

function mostrarFeedbackEnPantallaActual(texto, warning = false) {
  const activeScreen = document.querySelector('#afinidad-app .screen.active');
  if (!activeScreen) return;

  const feedback = activeScreen.querySelector('.option-feedback');
  if (!feedback) return;

  feedback.textContent = texto;
  feedback.classList.toggle('is-warning', warning);
}

function limpiarFeedbackActivo() {
  document.querySelectorAll('.option-feedback').forEach((node) => {
    node.textContent = '';
    node.classList.remove('is-warning');
  });
}

function obtenerTituloEntrada(entrada) {
  return entrada?.titulo || entrada?.titulo_principal || entrada?.titulo_eng || entrada?.titulo_rom || '';
}

function coincideTextoFlexible(actual, objetivo) {
  const a = normalizarTexto(actual);
  const b = normalizarTexto(objetivo);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

function normalizarTexto(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function escapeHtml(text = '') {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function exponerDebugGlobal() {
  if (!DEBUG_AFINIDAD) return;

  window.afinidadDebug = () => {
    const snapshot = construirSnapshotDebug();
    console.group('[Afinidad Debug] Snapshot manual');
    console.log('Preferencias:', snapshot.preferencias);
    console.log('Candidatas:', snapshot.totalCandidatas);
    console.table(snapshot.topResultados);
    console.groupEnd();
    return snapshot;
  };

  console.info('[Afinidad Debug] Disponible en consola: window.afinidadDebug()');
}

function construirSnapshotDebug() {
  const evaluaciones = state.franquicias
    .map((franquicia) => evaluarFranquicia(franquicia, state.preferencias))
    .filter(Boolean)
    .sort(compararEvaluaciones);

  return {
    preferencias: { ...state.preferencias },
    totalCandidatas: evaluaciones.length,
    topResultados: evaluaciones.slice(0, 10).map((item, index) => ({
      pos: index + 1,
      titulo: item.franquicia?.titulo_principal || 'Sin título',
      score: item.score,
      match: item.match,
      formato: item.formatoPrincipal?.label || '',
      epoca: item.epocaPrincipal?.label || '',
      razones: item.razones.join(' | ')
    }))
  };
}

function debugEstado(contexto) {
  if (!DEBUG_AFINIDAD) return;

  const snapshot = construirSnapshotDebug();

  console.groupCollapsed(`[Afinidad Debug] ${contexto}`);
  console.log('Preferencias:', snapshot.preferencias);
  console.log('Franquicias válidas:', snapshot.totalCandidatas);
  console.table(snapshot.topResultados);
  console.groupEnd();
}

function lanzarConfeti() {
  if (typeof confetti !== 'function') return;

  const duration = 2200;
  const end = Date.now() + duration;
  const defaults = { startVelocity: 28, spread: 340, ticks: 60, zIndex: 9999 };

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(() => {
    const timeLeft = end - Date.now();
    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    const particleCount = 34 * (timeLeft / duration);

    confetti({
      ...defaults,
      particleCount,
      colors: ['#06b6d4', '#3b82f6', '#8b5cf6', '#4ade80'],
      origin: { x: randomInRange(0.12, 0.28), y: Math.random() - 0.15 }
    });

    confetti({
      ...defaults,
      particleCount,
      colors: ['#06b6d4', '#3b82f6', '#8b5cf6', '#4ade80'],
      origin: { x: randomInRange(0.72, 0.88), y: Math.random() - 0.15 }
    });
  }, 250);
}