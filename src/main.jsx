/* First import, deliberately: side effect only, and it has to run before any
   module that builds a Zod schema. Modules evaluate in import order, so behind
   `./App` it was too late — the schemas were already built and Zod had already
   probed `new Function`, which a strict CSP refuses. */
import './lib/zodConfig';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './assets/styles/index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
