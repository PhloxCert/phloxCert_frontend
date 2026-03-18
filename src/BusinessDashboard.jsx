import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentAccount } from '@iota/dapp-kit';
import Sidebar from './modules/ui/Sidebar.jsx';
import { getStatus } from './modules/core/data.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

const CertBadge = ({ status }) => {
  const map = {
    certified: { label: 'Certified', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    pending:   { label: 'Pending',   cls: 'bg-amber-100  text-amber-800  border-amber-200'  },
    rejected:  { label: 'Rejected',  cls: 'bg-rose-100   text-rose-800   border-rose-200'   },
  };
  const s = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${s.cls}`}>
      {status === 'certified' && '✓ '}
      {status === 'pending'   && '⏳ '}
      {status === 'rejected'  && '✗ '}
      {s.label}
    </span>
  );
};

const DetailsModal = ({ record, onClose }) => {
  if (!record) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 px-8 py-6 text-white flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black tracking-tight">Certification Details</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Blockchain Record</p>
          </div>
          <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-8 space-y-6">
          {/* Cert status banner */}
          <div className={`rounded-xl p-4 flex items-center gap-3 ${record.status === 'certified' ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
            <span className="text-2xl">{record.status === 'certified' ? '✅' : '⏳'}</span>
            <div>
              <p className={`text-sm font-black uppercase tracking-widest ${record.status === 'certified' ? 'text-emerald-800' : 'text-amber-800'}`}>
                {record.status === 'certified' ? 'Certified' : 'Pending Certification'}
              </p>
              {record.certifiedAt && (
                <p className="text-xs text-emerald-600 mt-0.5">
                  Certified on {new Date(record.certifiedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <DRow label="Document Name"  value={record.metadata?.name || '—'} />
            <DRow label="Uploaded On"    value={new Date(record.createdAt).toLocaleDateString()} />
            <DRow label="Expiration"     value={record.metadata?.expirationDate ? new Date(record.metadata.expirationDate).toLocaleDateString() : '—'} />
            <DRow label="Certified On"   value={record.certifiedAt ? new Date(record.certifiedAt).toLocaleString() : '—'} />
          </div>

          {record.certifiedBy && (
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Certified By (Technician DID)</label>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-slate-600 break-all">{record.certifiedBy}</span>
                <button onClick={() => navigator.clipboard.writeText(record.certifiedBy)}
                  className="text-indigo-600 hover:text-indigo-800 text-[10px] font-bold shrink-0">COPY</button>
              </div>
            </div>
          )}

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">On-chain Object ID</label>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between gap-2">
              <span className="text-[11px] font-mono text-slate-600 break-all">{record.objectId}</span>
              <button onClick={() => navigator.clipboard.writeText(record.objectId)}
                className="text-indigo-600 hover:text-indigo-800 text-[10px] font-bold shrink-0">COPY</button>
            </div>
          </div>

          {record.metadata?.uploaderDid && (
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Uploader DID</label>
              <p className="text-[11px] font-mono text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 break-all">{record.metadata.uploaderDid}</p>
            </div>
          )}

          {/* Download */}
          {record.metadata?.offchainUrl && (
            <a href={record.metadata.offchainUrl} target="_blank" rel="noreferrer" download
              className="block w-full text-center bg-slate-900 hover:bg-slate-700 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
              ⬇ Download Document
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

const DRow = ({ label, value }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{label}</label>
    <p className="text-sm font-bold text-slate-800">{value}</p>
  </div>
);

const BusinessDashboard = () => {
  const account = useCurrentAccount();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [userDid]                        = useState(localStorage.getItem('userDid'));
  const [profile]                        = useState({
    name:           localStorage.getItem('userName'),
    role:           localStorage.getItem('userRole'),
    address:        localStorage.getItem('businessAddress'),
    vat:            localStorage.getItem('vatNumber'),
  });

  const [records,       setRecords]       = useState([]);
  const [loadingRecs,   setLoadingRecs]   = useState(true);
  const [latestRecord,  setLatestRecord]  = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const [isUploading,   setIsUploading]   = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error,         setError]         = useState(null);
  const [success,       setSuccess]       = useState(null);
  const [file,          setFile]          = useState(null);
  const [form,          setForm]          = useState({
    fileName:       '',
    expirationDate: '',
    activityDid:    localStorage.getItem('userDid') || '',
  });

  // Fetch all records for this business
  const fetchRecords = async () => {
    if (!userDid) return;
    try {
      setLoadingRecs(true);
      const res = await fetch(`${API_BASE_URL}/api/v1/records/${encodeURIComponent(userDid)}`);
      if (res.ok) {
        const data = await res.json();
        const sorted = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setRecords(sorted);
        setLatestRecord(sorted[0] ?? null);
      }
    } catch (err) {
      console.error('Error fetching records:', err);
    } finally {
      setLoadingRecs(false);
    }
  };

  useEffect(() => { fetchRecords(); }, [userDid]);

  const handleFormChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleFileChange = (e) => setFile(e.target.files?.[0] ?? null);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return setError('Select a file to upload');
    if (!form.fileName || !form.expirationDate || !form.activityDid) return setError('Fill in all fields');

    setError(null); setSuccess(null); setIsUploading(true);
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
      const res = await fetch(`${API_BASE_URL}/api/v1/notarize/upload`, { method: 'POST', body: fd });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Notarization failed'); }

      setStatusMessage('Success! Document notarized.');
      setSuccess('Notarization successful! Waiting for technician certification.');
      setTimeout(() => {
        setIsModalOpen(false); setSuccess(null); setStatusMessage('');
        setFile(null); setForm(prev => ({ ...prev, fileName: '' }));
        fetchRecords(); // refresh list
      }, 2000);
    } catch (err) {
      setError(err.message); setStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const expStatus = latestRecord?.metadata?.expirationDate
    ? getStatus(latestRecord.metadata.expirationDate)
    : { label: 'No Data', color: 'gray' };

  const statusColors = {
    green: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', iconBg: 'bg-emerald-600' },
    yellow:{ bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-800',   iconBg: 'bg-amber-500'   },
    red:   { bg: 'bg-rose-50',    border: 'border-rose-200',    text: 'text-rose-800',     iconBg: 'bg-red-600'     },
    gray:  { bg: 'bg-slate-50',   border: 'border-slate-200',   text: 'text-slate-500',    iconBg: 'bg-slate-400'   },
  };
  const theme = statusColors[expStatus.color];

  return (
    <div className="bg-slate-50 font-sans antialiased text-slate-800 min-h-screen">
      <Sidebar activePage="Dashboard" />

      <div className="md:pl-64 flex flex-col min-h-screen">
        <main className="flex-1 p-8">
          <div className="max-w-5xl mx-auto space-y-8">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Safety Compliance Overview — Business</h1>
                <p className="text-sm text-slate-500">Digital identity and asset management</p>
              </div>
              <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Live Ledger</span>
              </div>
            </div>

            {/* Identity Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-white shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="overflow-hidden">
                  <h2 className="text-2xl font-extrabold text-slate-900">{profile.name}</h2>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Verified IOTA DID</h3>
                  <p className="text-sm font-mono text-slate-700 truncate">{userDid}</p>
                  <div className="mt-1 text-sm text-slate-600 space-y-0.5">
                    <p><strong>Local address:</strong> {profile.address}</p>
                    <p><strong>VAT Number:</strong> {profile.vat}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Compliance Status */}
            <div className={`bg-white rounded-xl shadow-lg border-l-4 ${theme.border} border-t border-r border-b p-8 relative overflow-hidden`}>
              <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                <div className="relative flex items-center justify-center w-40 h-40 shrink-0">
                  <div className={`absolute inset-0 rounded-full ${theme.bg} animate-pulse opacity-50`}></div>
                  <div className="relative w-28 h-28 rounded-full bg-white flex items-center justify-center border-[6px] shadow-inner">
                    <div className={`w-16 h-16 rounded-full ${theme.iconBg} flex items-center justify-center text-white shadow-lg`}>
                      <span className="text-3xl font-bold">{expStatus.color === 'green' ? '✓' : '!'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Certification Status</h2>
                    <div className={`text-4xl font-black ${theme.text} tracking-tight`}>{expStatus.label.toUpperCase()}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Document</span>
                      <span className="text-sm font-bold text-slate-900 truncate max-w-[200px] block">
                        {loadingRecs ? 'Loading...' : (latestRecord?.metadata?.name || 'No Active Document')}
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
                  {/* Latest record certification badge */}
                  {latestRecord && (
                    <div className="flex items-center gap-2 pt-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Certification:</span>
                      <CertBadge status={latestRecord.status ?? 'pending'} />
                      {latestRecord.certifiedBy && (
                        <span className="text-[10px] text-slate-400 font-mono truncate max-w-[180px]">by {latestRecord.certifiedBy}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Upload Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">New Certification</h2>
                <p className="text-xs text-slate-400 mt-0.5">Upload a document to notarize and submit for technician review</p>
              </div>
              <button onClick={() => setIsModalOpen(true)}
                className="bg-slate-900 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-md hover:bg-slate-800 transition-all shrink-0">
                + Upload New Certification
              </button>
            </div>

            {/* All Documents Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">All Documents</h2>
                <span className="text-xs text-slate-400">{records.length} total</span>
              </div>
              {loadingRecs ? (
                <div className="p-8 text-center text-slate-400 text-sm">Loading...</div>
              ) : records.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">No documents uploaded yet.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-3 text-left">Document</th>
                      <th className="px-6 py-3 text-left">Uploaded</th>
                      <th className="px-6 py-3 text-left">Expires</th>
                      <th className="px-6 py-3 text-left">Certification</th>
                      <th className="px-6 py-3 text-left">On-chain ID</th>
                      <th className="px-6 py-3 text-left"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {records.map((rec) => (
                      <tr key={rec.objectId} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900">{rec.metadata?.name || '—'}</td>
                        <td className="px-6 py-4 text-slate-500">{new Date(rec.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-slate-500">
                          {rec.metadata?.expirationDate ? new Date(rec.metadata.expirationDate).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-6 py-4">
                          <CertBadge status={rec.status ?? 'pending'} />
                          {rec.certifiedAt && (
                            <span className="ml-2 text-[10px] text-slate-400">{new Date(rec.certifiedAt).toLocaleDateString()}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-400 truncate max-w-[120px]">{rec.objectId}</td>
                        <td className="px-6 py-4">
                          <button onClick={() => setSelectedRecord(rec)}
                            className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors">
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

          </div>
        </main>
      </div>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-8 relative">
            <h3 className="text-xl font-black mb-6 text-slate-900 tracking-tight">Notarize New Certification</h3>

            {error   && <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-700 text-xs font-bold">⚠️ {error}</div>}
            {success && <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700 text-xs font-bold">✅ {success}</div>}

            <form onSubmit={handleUpload} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Document Name</label>
                <input name="fileName" value={form.fileName} onChange={handleFormChange}
                  placeholder="e.g. Safety Certificate 2024"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-slate-900 outline-none transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expiration Date</label>
                  <input name="expirationDate" type="date" value={form.expirationDate} onChange={handleFormChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-slate-900 outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Activity DID</label>
                  <input name="activityDid" value={form.activityDid} onChange={handleFormChange} placeholder="did:iota:..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-slate-900 outline-none transition-all" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select File</label>
                <div className="relative group">
                  <input type="file" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className="w-full border-2 border-dashed border-slate-200 group-hover:border-slate-400 rounded-xl p-6 text-center transition-all bg-slate-50">
                    <span className="text-xs font-bold text-slate-500">{file ? file.name : 'Drop file or click to browse'}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 text-slate-500 text-sm font-bold hover:bg-slate-50 rounded-xl transition-all">Cancel</button>
                <button type="submit" disabled={isUploading}
                  className={`flex-[2] py-4 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg transition-all ${isUploading ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                  {isUploading ? statusMessage : 'Notarize Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Details Modal */}
      {selectedRecord && (
        <DetailsModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />
      )}
    </div>
  );
};

export default BusinessDashboard;