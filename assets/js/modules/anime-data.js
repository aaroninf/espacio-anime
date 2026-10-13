import { resolvePath, VERSION } from './config.js?v=f140fc8f3f';

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
