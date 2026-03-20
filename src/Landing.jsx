import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getStatus } from './modules/core/data.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

const Landing = () => {
  const { address } = useParams();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);

  const statusStyles = {
    green: "bg-emerald-100 text-emerald-800",
    yellow: "bg-amber-100 text-amber-800",
    red: "bg-rose-100 text-rose-800",
    gray: "bg-slate-100 text-slate-800"
  };

  const statusColors = {
    green: "emerald",
    yellow: "amber",
    red: "rose",
    gray: "slate"
  };

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/v1/records/${encodeURIComponent(address)}`);
      if (res.ok) {
        const data = await res.json();
        // Sort by createdAt descending and take top 3
        const sortedData = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3);
        setRecords(sortedData);
      }
    } catch (e) {
      console.error('Error fetching records:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (address) fetchRecords();
  }, [address]);

  const handleVerifyClick = (objectId) => {
    setVerifyResult(null);
    setVerifyingId(objectId);
    document.getElementById('public-verify-input').click();
  };

  const handleFileSelection = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !verifyingId) return;

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('objectId', verifyingId);

      const res = await fetch(`${API_BASE_URL}/api/v1/verify`, {
        method: 'POST',
        body: fd,
      });

      if (!res.ok) throw new Error('Verification failed');
      const data = await res.json();
      setVerifyResult({ id: verifyingId, ...data });
    } catch (err) {
      setVerifyResult({ id: verifyingId, error: err.message });
    } finally {
      setVerifyingId(null);
      e.target.value = '';
    }
  };

  const latestDoc = records[0];
  const pulseStatus = latestDoc ? getStatus(latestDoc.metadata?.expirationDate) : { label: 'No Data', color: 'gray' };
  const localNameDisplay = 'Public Venue';
  const themeColor = statusColors[pulseStatus.color];

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900 pb-20">
      {/* Hero Section */}
      <div className={`bg-gradient-to-br from-${themeColor}-600 to-${themeColor}-900 pt-20 pb-40 px-6 text-white text-center rounded-b-[3rem] shadow-2xl relative overflow-hidden`}>
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 100 C 20 0 50 0 100 100 Z" fill="currentColor" />
          </svg>
        </div>
        
        <div className="max-w-3xl mx-auto relative z-10 space-y-6">
          <div className="inline-block bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/30 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
            IOTA Verified Safety Pulse
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none drop-shadow-lg">
            {localNameDisplay}
          </h1>
          <p className="text-white/80 font-mono text-xs md:text-sm break-all max-w-xl mx-auto opacity-70">
            {address}
          </p>
        </div>
      </div>

      {/* Main Pulse Card */}
      <div className="max-w-2xl mx-auto -mt-24 px-6 relative z-20">
        <div className="bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] p-10 border border-slate-100 flex flex-col items-center text-center">
          <div className="relative mb-8">
            <div className={`absolute inset-0 rounded-full bg-${themeColor}-100 animate-ping opacity-30`}></div>
            <div className={`w-32 h-32 rounded-full bg-white border-8 border-${themeColor}-50 flex items-center justify-center shadow-inner`}>
              <div className={`w-20 h-20 rounded-full bg-${themeColor}-600 flex items-center justify-center text-white shadow-lg shadow-${themeColor}-600/30`}>
                <span className="text-4xl font-bold">{pulseStatus.color === 'green' ? '✓' : '!'}</span>
              </div>
            </div>
          </div>

          <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Current Safety Status</h2>
          <div className={`text-6xl font-black text-${themeColor}-600 tracking-tighter mb-4`}>
            {pulseStatus.label.toUpperCase()}
          </div>
          <p className="text-slate-500 text-sm max-w-sm">
            {pulseStatus.color === 'green' 
              ? "This venue has up-to-date safety certifications verified on the IOTA network." 
              : pulseStatus.color === 'yellow' 
                ? "Warning: Some safety certifications are nearing their expiration date."
                : "Danger: This venue's safety certifications have expired or are missing."
            }
          </p>
        </div>

        {/* Documents Section */}
        <div className="mt-16 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-black text-slate-900 tracking-tight text-center w-full">Latest Compliance Records</h3>
          </div>

          {loading ? (
            <div className="flex justify-center p-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : records.length === 0 ? (
            <div className="bg-white/50 backdrop-blur-sm border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400 italic">
              No recent certifications found for this location.
            </div>
          ) : (
            <div className="space-y-4">
              {records.map(rec => {
                const status = getStatus(rec.metadata?.expirationDate);
                const isVerifying = verifyingId === rec.objectId;
                const result = verifyResult?.id === rec.objectId ? verifyResult : null;

                return (
                  <div key={rec.objectId} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">{rec.metadata?.name}</h4>
                          <div className="flex items-center gap-3 mt-1">
                            <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-full ${statusStyles[status.color]}`}>
                              {status.label}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold">EXPIRES: {new Date(rec.metadata?.expirationDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <a 
                          href={rec.metadata?.offchainUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex-1 md:flex-none text-center bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                          Download
                        </a>
                        
                        {result ? (
                          <div className={`px-4 py-3 rounded-2xl text-[10px] font-black border ${result.verified ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                            {result.verified ? '✓ VERIFIED' : '✗ MISMATCH'}
                            <button onClick={() => setVerifyResult(null)} className="ml-2 opacity-50">×</button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleVerifyClick(rec.objectId)}
                            disabled={isVerifying}
                            className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-200 transition-all disabled:opacity-50"
                          >
                            {isVerifying ? 'Wait...' : 'Verify Now'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-20 text-center space-y-4">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Verified by PhloxCert Infrastructure</p>
          <div className="flex justify-center gap-6">
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-slate-900">IMMUTABLE</span>
              <span className="text-[9px] text-slate-400 font-medium">On-Chain Proof</span>
            </div>
            <div className="w-px h-8 bg-slate-200"></div>
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-slate-900">TRANSPARENT</span>
              <span className="text-[9px] text-slate-400 font-medium">Public Audit</span>
            </div>
            <div className="w-px h-8 bg-slate-200"></div>
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-slate-900">SECURE</span>
              <span className="text-[9px] text-slate-400 font-medium">SHA256 Hashing</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden verify input */}
      <input 
        id="public-verify-input" 
        type="file" 
        className="hidden" 
        onChange={handleFileSelection} 
      />
    </div>
  );
};

export default Landing;
