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
import Landing from './Landing.jsx';
import BusinessDashboard    from './BusinessDashboard.jsx';
import TechnicianDashboard  from './TechnicianDashboard.jsx';
// Importa lo stile necessario per il tasto "Connect" del wallet
import '@iota/dapp-kit/dist/index.css';

// Configurazione per la rete locale IOTA (quella che gira sul tuo PC)
const IOTA_NODE_URL = import.meta.env.VITE_IOTA_NODE_URL ?? getFullnodeUrl('localnet');

const { networkConfig } = createNetworkConfig({
  localnet: { url: IOTA_NODE_URL },
});

const DashboardRouter = () => {
  const role = localStorage.getItem('userRole');
  return role === '2' ? <TechnicianDashboard /> : <BusinessDashboard />;
};

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
              <Route path="/history" element={<History />} />
              <Route path="/landing/:address" element={<Landing />} />
              <Route path="/dashboard" element={<DashboardRouter />} />
            </Routes>
          </BrowserRouter>
        </WalletProvider>
      </IotaClientProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
