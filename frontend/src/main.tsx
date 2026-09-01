import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* The v7_startTransition and v7_relativeSplatPath flags are gone: React
        Router 7 makes both the default, so opting in is no longer a thing you
        can do. Keeping them would be a type error, not a no-op. */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
