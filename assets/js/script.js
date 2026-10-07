import { initLayout } from './modules/layout.js?v=baaad63634';
import { initModalFranquicia } from './modules/modal-franquicia.js?v=baaad63634';
import { initCatalogoPage } from './modules/catalogo.js?v=baaad63634';
import { initAfinidadPage } from './modules/afinidad.js?v=baaad63634';
import { initEspacioPage } from './modules/mi-espacio.js?v=baaad63634';
import { initHomeNovedades } from './modules/home.js?v=baaad63634';

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