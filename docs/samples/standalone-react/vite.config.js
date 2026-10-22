import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

// The page must be served over HTTPS, and it delegates publickey-credentials-get to the Powch
// origin, so Returning sign-in can run inside Powch's cross-origin iframe. A passkey is never
// created in the iframe: New account opens Powch's own page top-level in a popup.
// VITE_POWCH_BRIDGE_URL has no default: an unset value stops the dev server here.
export default defineConfig(() => {
  const powchUrl = process.env.VITE_POWCH_BRIDGE_URL;
  if (!powchUrl) {
    throw new Error('Set VITE_POWCH_BRIDGE_URL to the Powch origin, e.g. VITE_POWCH_BRIDGE_URL=https://powch.descix.net/ npm run dev');
  }
  const powchOrigin = new URL(powchUrl).origin;

  return {
    root: '.',
    plugins: [basicSsl()],
    server: {
      port: 5176,
      https: true,
      headers: {
        'Permissions-Policy': `publickey-credentials-get=(self "${powchOrigin}")`,
      },
    },
  };
});
