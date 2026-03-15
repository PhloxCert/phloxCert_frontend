import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentAccount } from '@iota/dapp-kit';
import Sidebar from './modules/ui/Sidebar'; // Make sure the path is correct
import { getStatus } from './modules/core/data.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

const Dashboard = () => {
  const account = useCurrentAccount();
  const navigate = useNavigate();

  // States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userDid] = useState(localStorage.getItem('userDid'));
  const [localName] = useState(localStorage.getItem('localName'));
  const [ownerName] = useState(localStorage.getItem('ownerName'));
  const [iotaObjects, setIotaObjects] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [latestRecord, setLatestRecord] = useState(null);
  const [loadingLatest, setLoadingLatest] = useState(true);

  // States for Notarization
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({
    fileName: '',
    expirationDate: '',
    activityDid: localStorage.getItem('userDid') || '',
  });


  const handleFormChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files?.[0] ?? null);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return setError('Select a file to upload');
    if (!form.fileName || !form.expirationDate || !form.activityDid) return setError('Fill in all fields');

    setError(null);
    setSuccess(null);
    setIsUploading(true);
    setStatusMessage('Preparing upload...');

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('fileName', form.fileName);
      fd.append('expirationDate', form.expirationDate);
      fd.append('activityDid', form.activityDid);
      fd.append('userDid', userDid);
      fd.append('uploaderDid', userDid);

      setStatusMessage('Uploading and notarizing on backend...');
      const res = await fetch(`${API_BASE_URL}/api/v1/notarize/upload`, {
        method: 'POST',
        body: fd,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Notarization failed');
      }

      const result = await res.json();
      setStatusMessage('Success! Document notarized.');
      setSuccess(`Notarization successful!`);

      // Close modal after a short delay on success
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccess(null);
        setStatusMessage('');
        setFile(null);
        setForm(prev => ({ ...prev, fileName: '' }));
      }, 2000);

    } catch (err) {
      setError(err.message);
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Fetch latest certification from backend
  useEffect(() => {
    const fetchLatest = async () => {
      if (!userDid) return;
      try {
        setLoadingLatest(true);
        const res = await fetch(`${API_BASE_URL}/api/v1/records/${encodeURIComponent(userDid)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            // Sort by createdAt descending and take the first one
            const sorted = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setLatestRecord(sorted[0]);
          }
        }
      } catch (err) {
        console.error("Error fetching latest record:", err);
      } finally {
        setLoadingLatest(false);
      }
    };
    fetchLatest();
  }, [userDid]);

  const status = latestRecord && latestRecord.metadata?.expirationDate 
    ? getStatus(latestRecord.metadata.expirationDate) 
    : { label: 'No Data', color: 'gray' };

  const statusColors = {
    green: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', badge: 'bg-emerald-100 text-emerald-800', iconBg: 'bg-emerald-600' },
    yellow: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', badge: 'bg-amber-100 text-amber-800', iconBg: 'bg-amber-500' },
    red: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-800', badge: 'bg-rose-100 text-rose-800', iconBg: 'bg-red-600' },
    gray: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-500', badge: 'bg-slate-100 text-slate-500', iconBg: 'bg-slate-400' }
  };
  const theme = statusColors[status.color];

  return (
    <div className="bg-slate-50 font-sans antialiased text-slate-800 min-h-screen">
      <Sidebar activePage="Dashboard" />

      <div className="md:pl-64 flex flex-col min-h-screen">
        <main className="flex-1 p-8">
          <div className="max-w-5xl mx-auto space-y-8">

            {/* Header Section */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Safety Compliance Overview</h1>
                <p className="text-sm text-slate-500">Digital identity and asset management</p>
              </div>
              <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Live Ledger</span>
              </div>
            </div>

            {/* Digital Identity Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-white shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="overflow-hidden">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Verified IOTA DID</h3>
                  <p className="text-sm font-mono text-slate-700 truncate">{userDid}</p>
                  <p className="text-sm font-mono text-slate-700 truncate">Local Name: {localName}</p>
                  <p className="text-sm font-mono text-slate-700 truncate">Owner Name: {ownerName}</p>
                </div>
              </div>
            </div>

            {/* Main Compliance Status */}
            <div className={`bg-white rounded-xl shadow-lg border-l-4 ${theme.border} border-t border-r border-b p-8 relative overflow-hidden`}>
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
                      <span className="text-sm font-bold text-slate-900 truncate max-w-[200px] block">
                        {loadingLatest ? 'Loading...' : (latestRecord?.metadata?.name || 'No Active Document')}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Expires</span>
                      <span className="text-sm font-bold text-slate-900">
                        {latestRecord?.metadata?.expirationDate 
                          ? new Date(latestRecord.metadata.expirationDate).toLocaleDateString() 
                          : 'N/A'}
                      </span>
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

            {/* IOTA ASSETS SECTION (REAL FROM LEDGER) */}
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
                  <p className="text-slate-400 font-medium">No objects found in the Ledger for this address.</p>
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

      {/* MODAL (Notarization Form) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-8 relative overflow-hidden">
            <h3 className="text-xl font-black mb-6 text-slate-900 tracking-tight">Notarize New Certification</h3>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-700 text-xs font-bold flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700 text-xs font-bold flex items-center gap-2">
                <span>✅</span> {success}
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Document Name</label>
                <input
                  name="fileName"
                  value={form.fileName}
                  onChange={handleFormChange}
                  placeholder="e.g. Safety Certificate 2024"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expiration Date</label>
                  <input
                    name="expirationDate"
                    type="date"
                    value={form.expirationDate}
                    onChange={handleFormChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Activity DID</label>
                  <input
                    name="activityDid"
                    value={form.activityDid}
                    onChange={handleFormChange}
                    placeholder="did:iota:..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select File</label>
                <div className="relative group">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-full border-2 border-dashed border-slate-200 group-hover:border-slate-400 rounded-xl p-6 text-center transition-all bg-slate-50">
                    <span className="text-xs font-bold text-slate-500">
                      {file ? file.name : "Drop file or click to browse"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 text-slate-500 text-sm font-bold hover:bg-slate-50 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className={`flex-[2] py-4 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg transition-all ${isUploading ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                >
                  {isUploading ? statusMessage : 'Notarize Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;