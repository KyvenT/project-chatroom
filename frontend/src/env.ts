// In development the Vite dev server and the backend run on separate ports.
// In a build, the backend serves the frontend, so both share its host.
const DEV_BACKEND_HOST = "localhost:3000";

export const API_URL = import.meta.env.DEV ? `http://${DEV_BACKEND_HOST}` : "";
export const WS_URL = import.meta.env.DEV
  ? `ws://${DEV_BACKEND_HOST}`
  : `wss://${window.location.host}`;
