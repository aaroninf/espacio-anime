import { BASE_PATH, resolvePath, VERSION } from './config.js?v=baaad63634';
import { FILTERS_STORAGE_KEY } from './catalogo.js?v=baaad63634';
import { NAV_STORAGE_KEY, DEPTH_STORAGE_KEY } from './modal-franquicia.js?v=baaad63634';

async function loadComponent(targetId, filePath) {
  const target = document.getElementById(targetId);
  if (!target) return;

  try {
    const response = await fetch(resolvePath(`${filePath}?v=${VERSION}`));
    if (!response.ok) return;
    let html = await response.text();
    html = html.replaceAll('{{BASE_PATH}}', BASE_PATH);
    target.innerHTML = html;
  } catch (error) {
    console.error(`Error cargando ${filePath}:`, error);
  }
}

function resetMobileMenuState(menu) {
  if (!menu) return;
  const submenus = menu.querySelectorAll('[id$="-sub"]');
  submenus.forEach((submenu) => {
    submenu.classList.add('hidden');
    submenu.classList.remove('flex');
  });

  const arrows = menu.querySelectorAll('svg.rotate-180');
  arrows.forEach((arrow) => arrow.classList.remove('rotate-180'));
}

export function toggleMenu() {
  const menu = document.getElementById('mobile-menu');
  if (!menu) return;

  menu.classList.toggle('hidden');
  menu.classList.toggle('open');

  if (menu.classList.contains('hidden')) {
    resetMobileMenuState(menu);
  }
}

export function toggleSubMenu(id, button) {
  const submenu = document.getElementById(id);
  if (!submenu) return;

  submenu.classList.toggle('hidden');
  submenu.classList.toggle('flex');

  const arrow = button?.querySelector('svg');
  if (arrow) arrow.classList.toggle('rotate-180');
}

// Un clic en cualquier enlace del menú o del footer es, por definición, un
// cambio de pilar (Descubrir/Franquicias/Afinidad/Mi espacio) o una vuelta al
// inicio. Ahí sí debe olvidarse el contexto de filtros/fichas: solo debe
// sobrevivir mientras el usuario se mueve dentro del propio pilar (por
// ejemplo, entrando y saliendo de fichas de Franquicias con sus flechas).
function limpiarContextoAlCambiarDePilar(container) {
  if (!container) return;
  container.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      sessionStorage.removeItem(FILTERS_STORAGE_KEY);
      sessionStorage.removeItem(NAV_STORAGE_KEY);
      sessionStorage.removeItem(DEPTH_STORAGE_KEY);
    }
  });
}

export async function initLayout() {
  await loadComponent('include-nav', 'partials/layout/nav.html');
  await loadComponent('include-home', 'partials/sections/home.html');
  await loadComponent('include-footer', 'partials/layout/footer.html');

  limpiarContextoAlCambiarDePilar(document.getElementById('include-nav'));
  limpiarContextoAlCambiarDePilar(document.getElementById('include-footer'));
}

window.toggleMenu = toggleMenu;
window.toggleSubMenu = toggleSubMenu;
