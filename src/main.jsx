// src/main.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { createNetworkConfig, IotaClientProvider, WalletProvider } from '@iota/dapp-kit';
import { getFullnodeUrl } from '@iota/iota-sdk/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx';
import Register from './Register.jsx';
import Dashboard from './Dashboard.jsx';
import History from './History.jsx';

// Importa lo stile necessario per il tasto "Connect" del wallet
import '@iota/dapp-kit/dist/index.css';

// Configurazione per la rete locale IOTA (quella che gira sul tuo PC)
const { networkConfig } = createNetworkConfig({
  localnet: { url: getFullnodeUrl('localnet') },
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <IotaClientProvider networks={networkConfig} defaultNetwork="localnet">
        <WalletProvider autoConnect={true}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<App />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/history" element={<History />} />
            </Routes>
          </BrowserRouter>
        </WalletProvider>
      </IotaClientProvider>
    </QueryClientProvider>
  </React.StrictMode>
);