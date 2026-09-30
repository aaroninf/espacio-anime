export function platformData(platform = '') {
  const value = platform.toLowerCase();
  if (value.includes('crunchyroll')) return { label: 'CRUNCHYROLL', className: 'bg-[#F47521]' };
  if (value.includes('netflix')) return { label: 'NETFLIX', className: 'bg-[#E50914]' };
  if (value.includes('disney')) return { label: 'DISNEY+', className: 'bg-[#113CCF]' };
  if (value.includes('prime')) return { label: 'PRIME VIDEO', className: 'bg-[#00A8E1]' };
  if (value.includes('sin streaming')) return { label: 'SIN STREAMING', className: 'bg-gray-800 opacity-50 cursor-not-allowed pointer-events-none' };
  if (value && value !== 'pendiente') return { label: platform.toUpperCase(), className: 'bg-gray-700' };
  return { label: 'VER', className: 'bg-gray-700' };
}

export function obtenerEntradaPrincipal(franquicia) {
  if (!franquicia || !Array.isArray(franquicia.entradas) || franquicia.entradas.length === 0) return null;

  if (franquicia.entrada_principal_ani_id) {
    const porId = franquicia.entradas.find((item) => item.ani_id === franquicia.entrada_principal_ani_id);
    if (porId) return porId;
  }

  const marcada = franquicia.entradas.find((item) => item.es_entrada_principal === true);
  if (marcada) return marcada;

  return franquicia.entradas[0];
}

export function resolverEnlaceVer(franquicia, entradaPrincipal) {
  // Solo la entrada principal decide el enlace de "dónde ver": nunca se cae a
  // otra entrada (una película o un OVA de la franquicia puede estar en una
  // plataforma distinta, y mostrar ese enlace confundiría al usuario).
  const link = entradaPrincipal?.donde_ver || entradaPrincipal?.link || entradaPrincipal?.url;
  if (link && link !== '#' && !String(link).startsWith('javascript:')) {
    return link;
  }

  const tituloBusqueda = franquicia?.titulo_principal || franquicia?.titulo || '';
  if (!tituloBusqueda) return null;

  return `https://www.google.com/search?q=${encodeURIComponent(`${tituloBusqueda} anime streaming oficial españa`)}`;
}
