/**
 * Crypto Quest — a standalone host page that reaches Powch through PowchClient.
 *
 * 3rd-party DApp demo: Google-style SSO + single wallet via Powch.
 * The nav button comes from PowchClient's createButton().
 */
import { PowchClient } from '@descix/app-sdk/powch-client';

// bridgeUrl has no default: PowchClient throws when it is unset, naming the ways to set it.
// Start the dev server with VITE_POWCH_BRIDGE_URL=https://powch.descix.net/
const powch = new PowchClient({
  bridgeUrl: import.meta.env.VITE_POWCH_BRIDGE_URL,
});

powch.createButton(document.getElementById('powch-button-root'), {
  toggle: true,
  signInLabel: 'Sign in with Powch',
  signedInLabel: (user) => user?.email || 'My Powch',
  classNames: { button: 'powch-sdk-button', signedIn: 'powch-sdk-button--signed-in' },
});

const resultEl = document.getElementById('result');
const btnAuth = document.getElementById('btn-auth');
const btnSignTx = document.getElementById('btn-sign-tx');
const btnConnectWc = document.getElementById('btn-connect-wc');
const btnOpenHoldings = document.getElementById('btn-open-holdings');
const btnOpenWallet = document.getElementById('btn-open-wallet');
const btnManage = document.getElementById('btn-manage');
const btnOpenUi = document.getElementById('btn-open-ui');
const btnCloseUi = document.getElementById('btn-close-ui');
const btnLogout = document.getElementById('btn-logout');
const btnCopyResult = document.getElementById('btn-copy-result');

function setResult(text, isError = false) {
  resultEl.textContent = text || 'Result will appear here.';
  resultEl.classList.toggle('empty', !text);
  resultEl.classList.toggle('error', isError);
  resultEl.classList.toggle('ok', text && !isError);
}

powch.on('ready', () => {
  setResult('Powch SDK ready. Click "Sign in with Powch" or try other actions.');
});

powch.on('ui_open', () => { console.log('Powch UI opened'); });
powch.on('ui_close', () => { console.log('Powch UI closed'); });
powch.on('error', (err) => { setResult('Error: ' + (err?.message || err), true); });

btnAuth.addEventListener('click', async () => {
  setResult('Requesting auth (Tier 2)…');
  try {
    const user = await powch.auth();
    setResult(
      'Auth success (Tier 2 - Identity Session):\n' +
      'email: ' + (user?.email ?? '—') + '\n' +
      'address: ' + (user?.address ?? '—') + '\n' +
      'powchToken: ' + (user?.powchToken ? user.powchToken.slice(0, 20) + '…' : '—') + '\n\n' +
      'Note: Subsequent clicks will be silent if session is active.'
    );
  } catch (e) {
    setResult('Auth failed: ' + (e?.message || e), true);
  }
});

btnSignTx.addEventListener('click', async () => {
  setResult('Requesting purchase (sign tx, Tier 1)…');
  try {
    const demoTx = {
      to: '0x0000000000000000000000000000000000000000',
      value: '0x0',
      data: '0x',
      gasLimit: '0x5208',
    };
    const payload = await powch.signTransaction({ tx: demoTx });
    setResult(
      'Purchase success (Starter NFT — Tier 1 / Vault Session):\n' +
      'signedTransaction: ' + (payload?.signedTransaction ? payload.signedTransaction.slice(0, 40) + '…' : '—') + '\n' +
      'hash: ' + (payload?.hash ?? '—') + '\n\n' +
      'Note: This always requires explicit consent and may trigger biometric unlock.'
    );
  } catch (e) {
    setResult('Purchase failed: ' + (e?.message || e), true);
  }
});

btnConnectWc.addEventListener('click', async () => {
  setResult('Requesting link wallet…');
  try {
    const wc = await powch.connectWallet();
    setResult(
      'Wallet linked:\n' +
      'connected: ' + wc?.connected + '\n' +
      'session: ' + (wc?.session ? 'Active' : 'None')
    );
  } catch (e) {
    setResult('Link wallet failed: ' + (e?.message || e), true);
  }
});

btnOpenHoldings.addEventListener('click', () => {
  powch.open({ tab: 'portfolio' });
  setResult('Opened Powch panel to the Portfolio tab.');
});

btnOpenWallet.addEventListener('click', () => {
  powch.open({ tab: 'cards' });
  setResult('Opened Powch panel to the Cards tab.');
});

btnManage.addEventListener('click', async () => {
  setResult('Opening Wallet Management…');
  try {
    await powch.manage();
    setResult('Powch management screen closed.');
  } catch (e) {
    setResult('Management failed: ' + (e?.message || e), true);
  }
});

btnOpenUi.addEventListener('click', () => {
  powch.open();
  setResult('Powch panel opened (Home tab).');
});

btnCloseUi.addEventListener('click', () => {
  powch.close();
  setResult('Powch panel closed.');
});

btnCopyResult.addEventListener('click', () => {
  const text = resultEl.textContent?.trim() || '';
  if (!text || text === 'Result will appear here.') return;
  navigator.clipboard.writeText(text).then(() => {
    btnCopyResult.textContent = 'Copied!';
    setTimeout(() => { btnCopyResult.textContent = 'Copy'; }, 2000);
  });
});

btnLogout.addEventListener('click', async () => {
  setResult('Logging out…');
  try {
    await powch.logout();
    setResult('Logged out. The Powch session is cleared and the vault is locked.');
  } catch (e) {
    setResult('Logout failed: ' + (e?.message || e), true);
  }
});
