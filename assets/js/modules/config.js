export const BASE_PATH = window.location.pathname.includes('/pages/') ? '../../' : '';
export const resolvePath = (path) => `${BASE_PATH}${path}`;
