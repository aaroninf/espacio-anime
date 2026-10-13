import { initLayout } from './modules/layout.js?v=f140fc8f3f';
import { initModalFranquicia } from './modules/modal-franquicia.js?v=f140fc8f3f';
import { initCatalogoPage } from './modules/catalogo.js?v=f140fc8f3f';
import { initAfinidadPage } from './modules/afinidad.js?v=f140fc8f3f';
import { initEspacioPage } from './modules/mi-espacio.js?v=f140fc8f3f';
import { initHomeNovedades } from './modules/home.js?v=f140fc8f3f';

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