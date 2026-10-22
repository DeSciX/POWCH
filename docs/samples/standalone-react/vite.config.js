import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

// The page must be served over HTTPS, and it must delegate the two WebAuthn permissions to the
// Powch origin, so the passkey ceremony can run inside Powch's cross-origin iframe.
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
        'Permissions-Policy': `publickey-credentials-create=(self "${powchOrigin}"), publickey-credentials-get=(self "${powchOrigin}")`,
      },
    },
  };
});
