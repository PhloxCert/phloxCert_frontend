import React, { useState, useEffect } from 'react';
import Sidebar from './modules/ui/Sidebar';
import { getStatus } from './modules/core/data.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

const History = () => {
  const userDid = localStorage.getItem('userDid');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const statusStyles = {
    green: "bg-emerald-100 text-emerald-800",
    yellow: "bg-amber-100 text-amber-800",
    red: "bg-rose-100 text-rose-800",
    gray: "bg-slate-100 text-slate-800"
  };

  const handleInfoClick = (record) => {
    setSelectedRecord(record);
    setIsDetailsModalOpen(true);
  };

  const fetchRecords = async () => {
    if (!userDid) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/v1/records/${encodeURIComponent(userDid)}`);
      if (res.ok) {
        const data = await res.json();
        // Order from last inserted one (latest createdAt first)
        const sortedData = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setRecords(sortedData);
      }
    } catch (e) {
      console.error('Error fetching records:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [userDid]);

  const handleVerifyClick = (objectId) => {
    setVerifyResult(null);
    setVerifyingId(objectId);
    // Trigger hidden file input
    document.getElementById('verify-file-input').click();
  };

  const handleVerifyFileSelection = async (e) => {
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
      // Clear input
      e.target.value = '';
    }
  };

  const rows = records.map(rec => {
    const isVerifying = verifyingId === rec.objectId;
    const result = verifyResult?.id === rec.objectId ? verifyResult : null;
    const expirationDate = rec.metadata?.expirationDate;
    const status = expirationDate ? getStatus(expirationDate) : { label: 'N/A', color: 'gray' };
    

    return (
      <tr key={rec.objectId} className="hover:bg-gray-50 transition-colors">
        <td className="px-6 py-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10 bg-slate-100 rounded flex items-center justify-center text-slate-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <a
                href={rec.metadata?.offchainUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                {rec.metadata?.name}
              </a>
              <div className="text-[10px] font-mono text-slate-400 mt-1 truncate max-w-[150px]">
                {rec.objectId}
              </div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`px-2 inline-flex text-[10px] font-black uppercase tracking-widest leading-5 rounded-full ${statusStyles[status.color]}`}>
            {status.label}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
          {new Date(rec.createdAt).toLocaleDateString()}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <button
            onClick={() => handleInfoClick(rec)}
            className="text-slate-400 hover:text-indigo-600 transition-colors p-1 rounded-full hover:bg-slate-100"
            title="View Details"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
          {rec.metadata?.expirationDate || 'N/A'}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
          {result ? (
            <div className={`text-[10px] font-bold px-2 py-1 rounded ${result.verified ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              {result.verified ? '✓ VERIFIED' : '✗ MISMATCH'}
              <button onClick={() => setVerifyResult(null)} className="ml-2 text-slate-400 hover:text-slate-600">×</button>
            </div>
          ) : (
            <button
              onClick={() => handleVerifyClick(rec.objectId)}
              disabled={isVerifying}
              className={`text-indigo-600 hover:text-indigo-900 font-bold text-xs uppercase tracking-wider ${isVerifying ? 'opacity-50' : ''}`}
            >
              {isVerifying ? 'Wait...' : 'Verify'}
            </button>
          )}
        </td>
      </tr>
    );
  });

  return (
    <div className="bg-slate-50 font-sans antialiased text-slate-800 min-h-screen">
      <Sidebar activePage="History" />
      <div className="md:pl-64 flex flex-col min-h-screen">
        <main className="flex-1 p-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Certification History</h1>
                <p className="text-sm text-slate-500">Manage and verify your on-chain notarizations</p>
              </div>
            </div>

            {/* Hidden file input for verification */}
            <input
              id="verify-file-input"
              type="file"
              className="hidden"
              onChange={handleVerifyFileSelection}
            />

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Document</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Notarized At</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Details</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Expires</th>
                    <th className="px-6 py-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-50">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-10 text-center">
                        <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                      </td>
                    </tr>
                  ) : records.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-medium italic">
                        No notarized documents found.
                      </td>
                    </tr>
                  ) : (
                    rows
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Details Modal */}
      {isDetailsModalOpen && selectedRecord && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-0 relative overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="bg-slate-900 px-8 py-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black tracking-tight">Notarization Details</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Secure Blockchain Record</p>
              </div>
              <button onClick={() => setIsDetailsModalOpen(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Document Name</label>
                  <p className="text-sm font-extrabold text-slate-900">{selectedRecord.metadata?.name || 'Untitled'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</label>
                  <div>
                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-full ${statusStyles[getStatus(selectedRecord.metadata?.expirationDate).color]}`}>
                      {getStatus(selectedRecord.metadata?.expirationDate).label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Object ID</label>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-600 truncate">{selectedRecord.objectId}</span>
                  <button 
                    onClick={() => navigator.clipboard.writeText(selectedRecord.objectId)}
                    className="text-indigo-600 hover:text-indigo-800 text-[10px] font-bold"
                  >
                    COPY
                  </button>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Uploader DID</label>
                    <p className="text-[11px] font-mono text-slate-700 break-all bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
                      {selectedRecord.metadata?.uploaderDid || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Activity DID (Subject)</label>
                    <p className="text-[11px] font-mono text-slate-700 break-all bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
                      {selectedRecord.metadata?.activityDid || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notarized On</label>
                  <p className="text-xs font-bold text-slate-700">{new Date(selectedRecord.createdAt).toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expiration Date</label>
                  <p className="text-xs font-bold text-slate-700">{new Date(selectedRecord.metadata?.expirationDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="pt-6">
                <a 
                  href={selectedRecord.metadata?.offchainUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="block w-full text-center bg-slate-100 hover:bg-slate-200 text-slate-600 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Download Off-Chain Document
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
