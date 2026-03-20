import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignPersonalMessage } from '@iota/dapp-kit';
import Sidebar from './modules/ui/Sidebar.jsx';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

const StatusBadge = ({ status }) => {
  const map = {
    certified: { label: 'Certified', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    pending:   { label: 'Pending',   cls: 'bg-amber-100  text-amber-800  border-amber-200'  },
    rejected:  { label: 'Rejected',  cls: 'bg-rose-100   text-rose-800   border-rose-200'   },
  };
  const s = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${s.cls}`}>
      {status === 'certified' && '✓ '}
      {status === 'pending'   && '⏳ '}
      {status === 'rejected'  && '✗ '}
      {s.label}
    </span>
  );
};

// Modal to inspect a document and certify it with wallet signature
const CertifyModal = ({ record, onClose, onCertified }) => {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [step,    setStep]    = useState('review'); // 'review' | 'signing' | 'sending'
  const userDid = localStorage.getItem('userDid');
  const { mutateAsync: signMessage } = useSignPersonalMessage();

  const handleCertify = async () => {
    setLoading(true); setError(null);
    try {
      // 1. Build the VC payload
      const vcPayload = {
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        type: ["VerifiableCredential", "DocumentCertification"],
        issuer: userDid,
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: `iota:object:${record.objectId}`,
          type: "CertifiedDocument",
          notarizationObjectId: record.objectId,
          documentName: record.metadata?.name,
          uploaderDid: record.metadata?.uploaderDid,
          certifiedBy: userDid,
          certificationStatus: "approved"
        }
      };

      // 2. Ask the wallet to sign the payload
      setStep('signing');
      const payloadBytes = new TextEncoder().encode(JSON.stringify(vcPayload));
      const { signature } = await signMessage({ message: payloadBytes });

      // 3. Send payload + signature to backend for verification and storage
      setStep('sending');
      const res = await fetch(`${API_BASE_URL}/api/documents/${record.objectId}/certify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technicianDid: userDid,
          vcPayload,
          signature,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Certification failed');
      }

      onCertified();
    } catch (err) {
      // User rejected wallet signature
      if (err.message?.includes('rejected') || err.message?.includes('cancel')) {
        setError('Wallet signature rejected. Please try again.');
      } else {
        setError(err.message);
      }
      setStep('review');
    } finally {
      setLoading(false);
    }
  };

  const stepLabel = {
    review:  '✓ Certify Document',
    signing: '✍ Sign with Wallet...',
    sending: '⏳ Sending to backend...',
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-8 space-y-6">

        {/* Title */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Review Document</h3>
            <p className="text-xs text-slate-400 mt-0.5">Your wallet will sign the Verifiable Credential</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
        </div>

        {/* Document details */}
        <div className="bg-slate-50 rounded-xl p-5 space-y-3 border border-slate-100">
          <Row label="Document Name"   value={record.metadata?.name        || '—'} />
          <Row label="Uploaded by"     value={record.metadata?.uploaderDid  || '—'} mono />
          <Row label="Activity DID"    value={record.metadata?.activityDid  || '—'} mono />
          <Row label="Expiration Date" value={record.metadata?.expirationDate ? new Date(record.metadata.expirationDate).toLocaleDateString() : '—'} />
          <Row label="Uploaded At"     value={new Date(record.createdAt).toLocaleString()} />
          <Row label="On-chain ID"     value={record.objectId} mono />
          {record.metadata?.offchainUrl && (
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">File</span>
              <a href={record.metadata.offchainUrl} target="_blank" rel="noreferrer" download
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-black rounded-lg hover:bg-slate-700 transition-colors">
                ⬇ Download File
              </a>
            </div>
          )}
        </div>

        {/* Signing steps indicator */}
        {loading && (
          <div className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0"></div>
            <span className="text-xs font-bold text-indigo-700">
              {step === 'signing' ? 'Check your wallet to sign the credential...' : 'Verifying signature on backend...'}
            </span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-700 text-xs font-bold">⚠️ {error}</div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} disabled={loading}
            className="flex-1 py-3 rounded-xl text-slate-500 text-sm font-bold hover:bg-slate-50 border border-slate-200 transition-all disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleCertify} disabled={loading}
            className={`flex-[2] py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg transition-all ${loading ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
            {loading ? stepLabel[step] : stepLabel.review}
          </button>
        </div>
      </div>
    </div>
  );
};

const Row = ({ label, value, mono = false }) => (
  <div>
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{label}</span>
    <span className={`text-sm text-slate-800 font-semibold break-all ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
  </div>
);

const TechnicianDashboard = () => {
  const [profile] = useState({
    name:           localStorage.getItem('userName'),
    license:        localStorage.getItem('licenseNumber'),
    specialization: localStorage.getItem('specialization'),
  });
  const userDid = localStorage.getItem('userDid');

  const [pendingDocs,   setPendingDocs]   = useState([]);
  const [certifiedDocs, setCertifiedDocs] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [selectedDoc,   setSelectedDoc]   = useState(null);
  const [successMsg,    setSuccessMsg]     = useState(null);
  const [activeTab,     setActiveTab]     = useState('pending'); // 'pending' | 'certified'

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/documents/all`);
      if (res.ok) {
        const data = await res.json();
        setPendingDocs(data.filter(d => d.status === 'pending' || !d.status));
        setCertifiedDocs(data.filter(d => d.status === 'certified'));
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleCertified = () => {
    setSelectedDoc(null);
    setSuccessMsg('Document certified successfully! VC issued.');
    fetchDocs();
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const displayed = activeTab === 'pending' ? pendingDocs : certifiedDocs;

  return (
    <div className="bg-slate-50 font-sans antialiased text-slate-800 min-h-screen">
      <Sidebar activePage="Dashboard" />

      <div className="md:pl-64 flex flex-col min-h-screen">
        <main className="flex-1 p-8">
          <div className="max-w-5xl mx-auto space-y-8">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Certification Queue — Technician</h1>
                <p className="text-sm text-slate-500">Review and certify pending documents</p>
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
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900">{profile.name}</h2>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Verified IOTA DID</h3>
                  <p className="text-sm font-mono text-slate-700 truncate">{userDid}</p>
                  <div className="mt-1 text-sm text-slate-600 space-y-0.5">
                    <p><strong>License:</strong> {profile.license}</p>
                    <p><strong>Specialization:</strong> {profile.specialization}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-amber-200 p-6 flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-xl font-black">
                  {loading ? '…' : pendingDocs.length}
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending</p>
                  <p className="text-sm font-bold text-slate-900">Awaiting certification</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-emerald-200 p-6 flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xl font-black">
                  {loading ? '…' : certifiedDocs.length}
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Certified</p>
                  <p className="text-sm font-bold text-slate-900">Documents approved</p>
                </div>
              </div>
            </div>

            {/* Success message */}
            {successMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-bold flex items-center gap-2">
                ✅ {successMsg}
              </div>
            )}

            {/* Tabs + Document List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Tab bar */}
              <div className="flex border-b border-slate-100">
                {['pending', 'certified'].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-colors ${activeTab === tab ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>
                    {tab === 'pending' ? `⏳ Pending (${pendingDocs.length})` : `✓ Certified (${certifiedDocs.length})`}
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="p-8 text-center text-slate-400 text-sm">Loading documents...</div>
              ) : displayed.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  {activeTab === 'pending' ? 'No documents pending certification.' : 'No certified documents yet.'}
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-3 text-left">Document</th>
                      <th className="px-6 py-3 text-left">Uploaded By</th>
                      <th className="px-6 py-3 text-left">Date</th>
                      <th className="px-6 py-3 text-left">Status</th>
                      <th className="px-6 py-3 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {displayed.map((doc) => (
                      <tr key={doc.objectId} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900">{doc.metadata?.name || '—'}</td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-400 truncate max-w-[140px]">
                          {doc.metadata?.uploaderDid?.slice(0, 20)}...
                        </td>
                        <td className="px-6 py-4 text-slate-500">{new Date(doc.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4"><StatusBadge status={doc.status ?? 'pending'} /></td>
                        <td className="px-6 py-4">
                          {(doc.status === 'pending' || !doc.status) ? (
                            <button onClick={() => setSelectedDoc(doc)}
                              className="px-3 py-1.5 bg-slate-900 text-white text-xs font-black rounded-lg hover:bg-slate-700 transition-colors">
                              Review & Certify
                            </button>
                          ) : (
                            <button onClick={() => setSelectedDoc(doc)}
                              className="px-3 py-1.5 bg-slate-100 text-slate-500 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors">
                              View Details
                            </button>
                          )}
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

      {/* Certify Modal */}
      {selectedDoc && (
        <CertifyModal
          record={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onCertified={handleCertified}
        />
      )}
    </div>
  );
};

export default TechnicianDashboard;