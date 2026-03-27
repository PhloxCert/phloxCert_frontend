import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentAccount } from '@iota/dapp-kit';
import Sidebar from './modules/ui/Sidebar.jsx';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

// ─── Expiration Logic ────────────────────────────────────────────────────────

const getExpirationStatus = (expirationDate) => {
  if (!expirationDate) return { label: 'No Date', color: 'gray' };
  const now = new Date();
  const exp = new Date(expirationDate);
  const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));

  if (diffDays < 0)   return { label: 'Expired',    color: 'red',    days: diffDays };
  if (diffDays <= 30) return { label: 'Expiring Soon', color: 'yellow', days: diffDays };
  return               { label: 'Valid',         color: 'green',  days: diffDays };
};

const ExpBadge = ({ expirationDate }) => {
  const { label, color, days } = getExpirationStatus(expirationDate);
  const map = {
    green:  { cls: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: '✓' },
    yellow: { cls: 'bg-amber-100  text-amber-800  border-amber-200',     icon: '⏳' },
    red:    { cls: 'bg-rose-100   text-rose-800   border-rose-200',       icon: '✗' },
    gray:   { cls: 'bg-slate-100  text-slate-500  border-slate-200',      icon: '—' },
  };
  const s = map[color];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${s.cls}`}>
      {s.icon} {label}
      {days != null && days >= 0 && color === 'yellow' && ` (${days}d)`}
    </span>
  );
};

// ─── Details Modal ──────────────────────────────────────────────────────────

const DetailsModal = ({ record, onClose }) => {
  if (!record) return null;

  const meta = record.metadata || {};
  const docName      = meta.name           || '—';
  const uploadedDate = record.createdAt    || meta.createdAt;
  const expirationDate = meta.expirationDate || record.expirationDate;
  const offchainUrl  = meta.offchainUrl    || record.offchainUrl;
  const issuedBy     = meta.issuedBy       || record.issuedBy;
  const { label, color } = getExpirationStatus(expirationDate);

  const bannerMap = {
    green:  { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', icon: '✅', title: 'Valid' },
    yellow: { bg: 'bg-amber-50 border-amber-200',     text: 'text-amber-800',   icon: '⏳', title: 'Expiring Soon' },
    red:    { bg: 'bg-rose-50 border-rose-200',       text: 'text-rose-800',    icon: '❌', title: 'Expired' },
    gray:   { bg: 'bg-slate-50 border-slate-200',     text: 'text-slate-500',   icon: '—',  title: 'No Date' },
  };
  const banner = bannerMap[color];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200">
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
          <div className={`rounded-xl p-4 flex items-center gap-3 border ${banner.bg}`}>
            <span className="text-2xl">{banner.icon}</span>
            <p className={`text-sm font-black uppercase tracking-widest ${banner.text}`}>{banner.title}</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <DRow label="Document Name" value={docName} />
            <DRow label="Uploaded On"   value={uploadedDate ? new Date(uploadedDate).toLocaleDateString() : '—'} />
            <DRow label="Expiration"    value={expirationDate ? new Date(expirationDate).toLocaleDateString() : '—'} />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">On-chain Object ID</label>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between gap-2">
              <span className="text-[11px] font-mono text-slate-600 break-all">{record.objectId}</span>
              <button onClick={() => navigator.clipboard.writeText(record.objectId)}
                className="text-indigo-600 hover:text-indigo-800 text-[10px] font-bold shrink-0">COPY</button>
            </div>
          </div>

          {issuedBy && (
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Issued By (Technician DID)</label>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-slate-600 break-all">{issuedBy}</span>
                <button onClick={() => navigator.clipboard.writeText(issuedBy)}
                  className="text-indigo-600 hover:text-indigo-800 text-[10px] font-bold shrink-0">COPY</button>
              </div>
            </div>
          )}

          {offchainUrl && (
            <a href={offchainUrl} target="_blank" rel="noreferrer" download
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

// ─── Main Dashboard ───────────────────────────────────────────────────────────

const BusinessDashboard = () => {
  const account  = useCurrentAccount();
  const navigate = useNavigate();

  const [userDid] = useState(localStorage.getItem('userDid'));
  const [profile] = useState({
    name:    localStorage.getItem('userName'),
    role:    localStorage.getItem('userRole'),
    address: localStorage.getItem('businessAddress'),
    vat:     localStorage.getItem('vatNumber'),
  });

  const [records,        setRecords]        = useState([]);
  const [loadingRecs,    setLoadingRecs]    = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isModalOpen,    setIsModalOpen]    = useState(false);

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

  const fetchRecords = useCallback(async () => {
    if (!userDid) return;
    try {
      setLoadingRecs(true);
      const res = await fetch(`${API_BASE_URL}/api/v1/records/${encodeURIComponent(userDid)}`);
      if (res.ok) {
        const data = await res.json();
        const recordList = Array.isArray(data) ? data : [];
        const sorted = [...recordList].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setRecords(sorted);
      }
    } catch (err) {
      console.error('Error fetching records:', err);
    } finally {
      setLoadingRecs(false);
    }
  }, [userDid]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const handleFormChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleFileChange = (e) => setFile(e.target.files?.[0] ?? null);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return setError('Select a file to upload');
    if (!form.fileName || !form.expirationDate || !form.activityDid) return setError('Fill in all fields');

    setError(null); setSuccess(null); setIsUploading(true);
    setStatusMessage('Preparing upload...');
    try {
      setStatusMessage('Validating activity identity...');
      const cleanActAddress = form.activityDid.includes(':') ? form.activityDid.split(':').pop() : form.activityDid;
      const resProf = await fetch(`${API_BASE_URL}/api/v1/business/profile/${cleanActAddress}`);

      if (!resProf.ok) {
        throw new Error('Activity DID not found on-chain. Please verify the address.');
      }

      const profData = await resProf.json();
      if (profData.venue?.role === 2) {
        throw new Error('Cannot notarize for a Technician identity. Please use a Business DID.');
      }

      const fd = new FormData();
      fd.append('file', file);
      fd.append('fileName', form.fileName);
      fd.append('expirationDate', form.expirationDate);
      fd.append('activityDid', form.activityDid);
      fd.append('issuedBy', profile.name);
      fd.append('userDid', userDid);
      fd.append('uploaderDid', userDid);

      const res = await fetch(`${API_BASE_URL}/api/v1/notarize/upload`, { method: 'POST', body: fd });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Notarization failed'); }

      setSuccess('Notarization successful!');
      setTimeout(() => {
        setIsModalOpen(false); setSuccess(null);
        setFile(null); setForm(prev => ({ ...prev, fileName: '' }));
        fetchRecords();
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
      setStatusMessage('');
    }
  };

  // Get the record with expiration furthest in the future (or most recent if all expired)
  const latestRecord = records[0] || null;
  const currentExp   = latestRecord?.metadata?.expirationDate || latestRecord?.expirationDate;
  const expStatus    = getExpirationStatus(currentExp);

  const statusColors = {
    green:  { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', iconBg: 'bg-emerald-600' },
    yellow: { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-800',   iconBg: 'bg-amber-500'   },
    red:    { bg: 'bg-rose-50',    border: 'border-rose-200',    text: 'text-rose-800',     iconBg: 'bg-red-600'     },
    gray:   { bg: 'bg-slate-50',   border: 'border-slate-200',   text: 'text-slate-500',    iconBg: 'bg-slate-400'   },
  };
  const theme = statusColors[expStatus.color] || statusColors.gray;

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

            {/* Profile */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-white shrink-0 font-bold text-lg">B</div>
                <div className="overflow-hidden">
                  <h2 className="text-2xl font-extrabold text-slate-900 leading-tight">{profile.name}</h2>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Verified IOTA DID</h3>
                  <p className="text-xs font-mono text-slate-700 truncate">{userDid}</p>
                </div>
              </div>
            </div>

            {/* Status banner */}
            <div className={`bg-white rounded-xl shadow-lg border-l-4 ${theme.border} border-t border-r border-b p-8 relative overflow-hidden`}>
              <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                <div className="relative flex items-center justify-center w-40 h-40 shrink-0">
                  <div className={`absolute inset-0 rounded-full ${theme.bg} animate-pulse opacity-50`}></div>
                  <div className="relative w-28 h-28 rounded-full bg-white flex items-center justify-center border-[6px] shadow-inner">
                    <div className={`w-16 h-16 rounded-full ${theme.iconBg} flex items-center justify-center text-white shadow-lg`}>
                      <span className="text-3xl font-bold">
                        {expStatus.color === 'green' ? '✓' : expStatus.color === 'red' ? '✗' : '!'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Certification Status</h2>
                    <div className={`text-4xl font-black ${theme.text} tracking-tight`}>{expStatus.label.toUpperCase()}</div>
                    {expStatus.days != null && expStatus.color === 'yellow' && (
                      <p className="text-sm text-amber-600 font-bold mt-1">Expires in {expStatus.days} days</p>
                    )}
                    {expStatus.color === 'red' && (
                      <p className="text-sm text-rose-600 font-bold mt-1">
                        Expired {Math.abs(expStatus.days)} days ago
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest">Document</span>
                      <span className="text-sm font-bold text-slate-900 truncate max-w-[200px] block">
                        {loadingRecs ? '...' : (latestRecord?.metadata?.name || latestRecord?.name || 'No Record')}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest">Expires</span>
                      <span className="text-sm font-bold text-slate-900">
                        {currentExp ? new Date(currentExp).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Upload CTA 
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">New Certification</h2>
                <p className="text-xs text-slate-400 mt-0.5">Upload a document to notarize and submit for review</p>
              </div>
              <button onClick={() => setIsModalOpen(true)}
                className="bg-slate-900 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-md hover:bg-slate-800 transition-all shrink-0">
                + Upload New Certification
              </button>
            </div>*/}

            {/* Documents table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">All Documents</h2>
                <span className="text-xs text-slate-400">{records.length} total</span>
              </div>
              {loadingRecs ? (
                <div className="p-12 text-center text-slate-400 text-sm italic">Loading...</div>
              ) : records.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-sm italic">No documents found.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-3 text-left">Document</th>
                      <th className="px-6 py-3 text-left">Uploaded</th>
                      <th className="px-6 py-3 text-left">Expiration</th>
                      <th className="px-6 py-3 text-left">Issued By</th>
                      <th className="px-6 py-3 text-left"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {records.map((rec) => {
                      const expDate = rec.metadata?.expirationDate || rec.expirationDate;
                      return (
                        <tr key={rec.objectId} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-semibold text-slate-900">
                              {rec.metadata?.name || rec.name || 'Untitled Document'}
                            </p>
                            <p className="text-[10px] font-mono text-slate-400">
                              ID: {rec.objectId?.slice(0, 15)}...
                            </p>
                          </td>
                          <td className="px-6 py-4 text-slate-500">
                            {rec.createdAt ? new Date(rec.createdAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <ExpBadge expirationDate={expDate} />
                              <span className="text-[10px] text-slate-400 font-mono">
                                {expDate ? new Date(expDate).toLocaleDateString() : '—'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {rec.metadata?.issuedBy ? (
                              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded block truncate max-w-[140px]"
                                title={rec.metadata.issuedBy}>
                                {rec.metadata.issuedBy.slice(0, 16)}...
                              </span>
                            ) : (
                              <span className="text-slate-300 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => setSelectedRecord(rec)}
                              className="px-3 py-1.5 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-200">
                              Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

          </div>
        </main>
      </div>

      {/* Modal upload */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-8 relative">
            <h3 className="text-xl font-black mb-6 text-slate-900 tracking-tight">Notarize New Certification</h3>
            {error   && <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-700 text-xs font-bold uppercase tracking-widest">⚠️ {error}</div>}
            {success && <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700 text-xs font-bold uppercase tracking-widest">✅ {success}</div>}
            <form onSubmit={handleUpload} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Document Name</label>
                <input name="fileName" value={form.fileName} onChange={handleFormChange} placeholder="e.g. Safety Certificate" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expiration Date</label>
                  <input name="expirationDate" type="date" value={form.expirationDate} onChange={handleFormChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Activity DID</label>
                  <input readOnly value={form.activityDid} className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-400 font-mono" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select File</label>
                <div className="relative group border-2 border-dashed border-slate-200 rounded-xl p-6 text-center bg-slate-50">
                  <input type="file" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <span className="text-xs font-bold text-slate-500 tracking-tight">{file ? file.name : 'Drop file or click to browse'}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 text-slate-500 text-[10px] font-black uppercase tracking-widest">Cancel</button>
                <button type="submit" disabled={isUploading} className="flex-[2] py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg disabled:bg-slate-200">
                  {isUploading ? statusMessage : 'Notarize Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedRecord && (
        <DetailsModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />
      )}
    </div>
  );
};

export default BusinessDashboard;