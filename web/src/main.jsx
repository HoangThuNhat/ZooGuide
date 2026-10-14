import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AppProvider } from './context/AppContext.jsx'
import { registerServiceWorker } from './pwa/registerServiceWorker'
import '../css/style.css'

// Register PWA Service Worker
registerServiceWorker({
  onUpdate: (registration) => {
    console.log('[ZooGuide PWA] New version detected.');
  },
  onSuccess: (registration) => {
    console.log('[ZooGuide PWA] Service Worker active and ready for offline use.');
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
