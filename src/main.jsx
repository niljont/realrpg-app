import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);

async function setupServiceWorker() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;

  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
    reg.update().catch(() => {});

    // Новый SW сразу перехватывает вкладку.
    if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    reg.addEventListener('updatefound', () => {
      const sw = reg.installing;
      if (!sw) return;
      sw.addEventListener('statechange', () => {
        if (sw.state === 'installed' && navigator.serviceWorker.controller) {
          sw.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    });

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  } catch (e) {
    console.warn('[СИСТЕМА] SW register failed', e);
  }
}

window.addEventListener('load', () => {
  setupServiceWorker();
});
