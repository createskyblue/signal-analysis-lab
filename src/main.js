import './style.css';
import { I18N } from './i18n.js';
import App from './app.js';

// ---- Init ----
window.I18N = I18N;
const app = new App();
window.app = app;

// Apply translations to static HTML
I18N.updateDOM();

// Auto-load saved project, or show hint
if (app.loadFromLocal()) {
  // Auto-run after loading
  setTimeout(() => app.run(), 100);
}
