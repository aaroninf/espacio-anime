import { initLayout } from './modules/layout.js?v=a0430ceff7';
import { initModalFranquicia } from './modules/modal-franquicia.js?v=a0430ceff7';
import { initCatalogoPage } from './modules/catalogo.js?v=a0430ceff7';
import { initAfinidadPage } from './modules/afinidad.js?v=a0430ceff7';
import { initEspacioPage } from './modules/mi-espacio.js?v=a0430ceff7';
import { initHomeNovedades } from './modules/home.js?v=a0430ceff7';

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