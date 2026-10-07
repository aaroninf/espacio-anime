export const BASE_PATH = window.location.pathname.includes('/pages/') ? '../../' : '';
export const resolvePath = (path) => `${BASE_PATH}${path}`;

// Versión de la web: la pone tools/generar-fichas.mjs (no editar a mano). Va en las
// direcciones de scripts, estilos y datos para que, tras subir cambios, el navegador
// descargue lo nuevo en vez de usar su copia guardada.
export const VERSION = 'baaad63634';
