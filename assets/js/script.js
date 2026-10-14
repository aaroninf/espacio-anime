import { initLayout } from './modules/layout.js?v=bacd16e455';
import { initModalFranquicia } from './modules/modal-franquicia.js?v=bacd16e455';
import { initCatalogoPage } from './modules/catalogo.js?v=bacd16e455';
import { initAfinidadPage } from './modules/afinidad.js?v=bacd16e455';
import { initEspacioPage } from './modules/mi-espacio.js?v=bacd16e455';
import { initHomeNovedades } from './modules/home.js?v=bacd16e455';

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