import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentAccount } from '@iota/dapp-kit';
import Sidebar from './modules/ui/Sidebar'; // Assicurati che il percorso sia corretto
import { documents, getStatus } from './modules/core/data.js'; 

const Dashboard = () => {
  const account = useCurrentAccount();
  const navigate = useNavigate();
  
  // Stati
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userDid] = useState(localStorage.getItem('userDid'));
  const [localName] = useState(localStorage.getItem('localName'));
  const [ownername] = useState(localStorage.getItem('ownerName'));
  const [iotaObjects, setIotaObjects] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(true);

  // Logic per il documento locale (mock)
  const latestDoc = documents[0];
  const status = getStatus(latestDoc.expirationDate);

  // 1. Reindirizzamento se non loggato
  useEffect(() => {
    if (!account && !localStorage.getItem('userDid')) {
      navigate('/');
    }
  }, [account, navigate]);

  // 2. Fetch degli oggetti reali dal Ledger IOTA
  useEffect(() => {
    const fetchAssets = async () => {
      if (!account?.address) return;
      try {
        setLoadingAssets(true);
        const response = await fetch(`http://localhost:8080/api/objects/${account.address}`);
        if (response.ok) {
          const data = await response.json();
          setIotaObjects(data);
        }
      } catch (err) {
        console.error("Errore nel caricamento asset:", err);
      } finally {
        setLoadingAssets(false);
      }
    };

    fetchAssets();
  }, [account?.address]);

  // Colori del tema
  const statusColors = {
    green: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', badge: 'bg-emerald-100 text-emerald-800', iconBg: 'bg-emerald-600' },
    yellow: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', badge: 'bg-amber-100 text-amber-800', iconBg: 'bg-amber-500' },
    red: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-800', badge: 'bg-rose-100 text-rose-800', iconBg: 'bg-red-600' }
  };
  const theme = statusColors[status.color];

  return (
    <div className="bg-slate-50 font-sans antialiased text-slate-800 min-h-screen">
      <Sidebar activePage="Dashboard" />
      
      <div className="md:pl-64 flex flex-col min-h-screen">
        <main className="flex-1 p-8">
          <div className="max-w-5xl mx-auto space-y-8">
            
            {/* Sezione Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Safety Compliance Overview</h1>
                <p className="text-sm text-slate-500">Gestione identità e asset digitali</p>
              </div>
              <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Live Ledger</span>
              </div>
            </div>

            {/* Card Identità Digitale */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-white shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Verified IOTA DID</h3>
                    <p className="text-sm font-mono text-slate-700 truncate">{userDid || account?.address}</p>
                    <p className="text-sm font-mono text-slate-700 truncate">Local Name: {localName}</p>
                    <p className="text-sm font-mono text-slate-700 truncate">Owner Name: {ownername}</p>
                  </div>
                </div>
            </div>

            {/* Main Compliance Status */}
            <div className={`bg-white rounded-xl shadow-lg border-l-4 ${theme.border} border-t border-r border-b p-8 relative overflow-hidden`}>
                {/* ... (Tua logica della card stato uguale a prima) ... */}
                <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                    <div className="relative flex items-center justify-center w-40 h-40 shrink-0">
                        <div className={`absolute inset-0 rounded-full ${theme.bg} animate-pulse opacity-50`}></div>
                        <div className="relative w-28 h-28 rounded-full bg-white flex items-center justify-center border-[6px] shadow-inner">
                            <div className={`w-16 h-16 rounded-full ${theme.iconBg} flex items-center justify-center text-white shadow-lg`}>
                                <span className="text-3xl font-bold">{status.color === 'green' ? '✓' : '!'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 space-y-4">
                        <div>
                            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Certification Status</h2>
                            <div className={`text-4xl font-black ${theme.text} tracking-tight`}>{status.label.toUpperCase()}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                            <div>
                                <span className="block text-[10px] text-slate-400 font-bold uppercase">Document</span>
                                <span className="text-sm font-bold text-slate-900">{latestDoc.name}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] text-slate-400 font-bold uppercase">Expires</span>
                                <span className="text-sm font-bold text-slate-900">{new Date(latestDoc.expirationDate).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-8 flex justify-end">
                    <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-md hover:bg-slate-800 transition-all">
                        Upload New Certification
                    </button>
                </div>
            </div>

            {/* SEZIONE ASSET IOTA (REALI DAL LEDGER) */}
            <section className="pt-8">
                <div className="flex items-center gap-2 mb-6">
                    <h2 className="text-xl font-bold text-slate-900">Digital Assets on IOTA</h2>
                    <span className="bg-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {iotaObjects.length}
                    </span>
                </div>

                {loadingAssets ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-40 bg-slate-200 animate-pulse rounded-xl"></div>
                        ))}
                    </div>
                ) : iotaObjects.length === 0 ? (
                    <div className="bg-white p-12 rounded-xl border-2 border-dashed border-slate-200 text-center">
                        <p className="text-slate-400 font-medium">Nessun oggetto trovato nel Ledger per questo indirizzo.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {iotaObjects.map((obj) => (
                            <div key={obj.data.objectId} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-400 transition-all group">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-2 py-1 rounded-md uppercase tracking-tighter">
                                        {obj.data.type.split('::').pop()}
                                    </span>
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                </div>
                                
                                <h4 className="font-bold text-slate-800 text-sm mb-1 truncate">
                                    {obj.data.display?.data?.name || "Unlabeled Object"}
                                </h4>
                                <p className="text-[11px] text-slate-500 line-clamp-2 mb-4">
                                    {obj.data.display?.data?.description || "No description provided on-chain."}
                                </p>

                                <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                                    <span className="text-[10px] font-mono text-slate-400">ID: {obj.data.objectId.substring(0, 8)}...</span>
                                    <button className="text-[10px] font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                        VIEW DETAILS →
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

          </div>
        </main>
      </div>

      {/* MODAL (Come prima) */}
      {isModalOpen && (
          /* ... codice modal ... */
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-8">
                  <h3 className="text-lg font-bold mb-4 text-slate-900">Upload New Document</h3>
                  {/* Form qui */}
                  <div className="flex justify-end gap-2 mt-4">
                    <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-500 text-sm">Cancel</button>
                    <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm">Upload</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Dashboard;