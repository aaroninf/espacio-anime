import { resolvePath, VERSION } from './config.js?v=9711ea3d94';

let animesCache = null;

export async function getAnimes() {
  if (animesCache) return animesCache;

  const response = await fetch(resolvePath(`assets/data/animes.json?v=${VERSION}`));
  if (!response.ok) {
    throw new Error('No se pudo cargar animes.json');
  }

  animesCache = await response.json();
  return animesCache;
}
