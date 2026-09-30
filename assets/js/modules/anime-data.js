import { resolvePath } from './config.js';

let animesCache = null;

export async function getAnimes() {
  if (animesCache) return animesCache;

  const response = await fetch(resolvePath('assets/data/animes.json'));
  if (!response.ok) {
    throw new Error('No se pudo cargar animes.json');
  }

  animesCache = await response.json();
  return animesCache;
}
