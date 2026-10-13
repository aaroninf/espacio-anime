import { initLayout } from './modules/layout.js?v=78fcdf4f77';
import { initModalFranquicia } from './modules/modal-franquicia.js?v=78fcdf4f77';
import { initCatalogoPage } from './modules/catalogo.js?v=78fcdf4f77';
import { initAfinidadPage } from './modules/afinidad.js?v=78fcdf4f77';
import { initEspacioPage } from './modules/mi-espacio.js?v=78fcdf4f77';
import { initHomeNovedades } from './modules/home.js?v=78fcdf4f77';

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