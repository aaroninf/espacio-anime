import { initLayout } from './modules/layout.js';
import { initModalFranquicia } from './modules/modal-franquicia.js';
import { initCatalogoPage } from './modules/catalogo.js';
import { initAfinidadPage } from './modules/afinidad.js';
import { initEspacioPage } from './modules/mi-espacio.js';
import { initHomeNovedades } from './modules/home.js';

async function initApp() {
  await initLayout();
  await initModalFranquicia();
  await initCatalogoPage();
  await initAfinidadPage();
  await initEspacioPage();
  await initHomeNovedades();
}

document.addEventListener('DOMContentLoaded', () => {
  initApp().catch((error) => console.error('Error al iniciar la app:', error));
});