import React, { useState } from 'react';
import { Buffer } from 'buffer';
import Sidebar from './modules/ui/Sidebar.jsx';
import { 
  useCurrentAccount, 
  useIotaClient,
  useSignTransaction,
  ConnectButton 
} from '@iota/dapp-kit';
import { Transaction } from '@iota/iota-sdk/transactions';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

const getExpirationStatus = (expirationDate) => {
  if (!expirationDate) return { label: 'No Date', color: 'gray' };
  const now = new Date();
  const exp = new Date(expirationDate);
  const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0)   return { label: 'Expired',       color: 'red',    days: diffDays };
  if (diffDays <= 30) return { label: 'Expiring Soon', color: 'yellow', days: diffDays };
  return               { label: 'Valid',           color: 'green',  days: diffDays };
};

const ExpBadge = ({ expirationDate }) => {
  const { label, color, days } = getExpirationStatus(expirationDate);
  const map = {
    green:  { cls: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: '✓' },
    yellow: { cls: 'bg-amber-100 text-amber-800 border-amber-200',       icon: '⏳' },
    red:    { cls: 'bg-rose-100 text-rose-800 border-rose-200',           icon: '✗' },
    gray:   { cls: 'bg-slate-100 text-slate-500 border-slate-200',        icon: '—' },
  };
  const s = map[color];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${s.cls}`}>
      {s.icon} {label}
      {days != null && days >= 0 && color === 'yellow' && ` (${days}d)`}
    </span>
  );
};

const TechnicianDashboard = () => {
  const userDid = localStorage.getItem('userDid'); 
  const userName = localStorage.getItem('userName');

  // Usiamo useSignTransaction + client.executeTransactionBlock
  // per poter passare le options e ricevere objectChanges
  const currentAccount = useCurrentAccount(); 
  const iotaClient = useIotaClient();
  const { mutateAsync: signTransaction } = useSignTransaction();

  const [searchDid, setSearchDid] = useState('');
  const [businessRecords, setBusinessRecords] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);

  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({ fileName: '', expirationDate: '' });

  const handleSearch = async (e, didOverride) => {
    if (e) e.preventDefault();
    const did = didOverride ?? searchDid;
    if (!did?.trim()) return;

    setLoadingSearch(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/records/${encodeURIComponent(did)}`);
      if (res.ok) {
        const data = await res.json();
        setBusinessRecords(Array.isArray(data) ? data : []);
        setSelectedBusiness(did);
      } else {
        alert("Business DID not found or no records available.");
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleNotarize = async (e) => {
    e.preventDefault();

    if (!currentAccount) {
      alert("Connect IOTA wallet to notarize documents.");
      return;
    }

    setIsUploading(true);

    try {
      const pubKey = currentAccount.publicKey;
      const pubKeyBase64 = Buffer.from(pubKey).toString('base64');

      const fd = new FormData();
      fd.append('file', file);
      fd.append('fileName', form.fileName);
      fd.append('activityDid', selectedBusiness);
      fd.append('issuedBy', userDid);
      fd.append('expirationDate', form.expirationDate);
      fd.append('technicianAddress', currentAccount.address); 
      fd.append('publicKey', pubKeyBase64);

      const res = await fetch(`${API_BASE_URL}/api/v1/notarize/upload`, { 
        method: 'POST', 
        body: fd 
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Errore nella preparazione del backend");
      }

      const { txBytes } = await res.json();

      const bytes = Uint8Array.from(atob(txBytes), c => c.charCodeAt(0));
      const transaction = Transaction.from(bytes);

      const { bytes: signedBytes, signature } = await signTransaction({ transaction });

      const result = await iotaClient.executeTransactionBlock({
        transactionBlock: signedBytes,
        signature,
        options: {
          showObjectChanges: true,
          showEffects: true,
        },
      });

      const objectId =
        result.objectChanges?.find(c => c.type === 'created')?.objectId ??
        result.effects?.created?.[0]?.reference?.objectId;

      if (!objectId) {
        throw new Error('objectId non trovato nel risultato della transazione');
      }

      await fetch(`${API_BASE_URL}/api/v1/identity/save-id`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectId, activityDid: selectedBusiness })
      });

      await new Promise(r => setTimeout(r, 1500));
      await handleSearch(null, selectedBusiness);

    } catch (err) {
      console.error("Workflow failed:", err);
      alert("Error: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-slate-50 font-sans antialiased text-slate-800 min-h-screen">
      <Sidebar activePage="Dashboard" />
      
      <div className="md:pl-64 flex flex-col min-h-screen">
        <main className="flex-1 p-8">
          <div className="max-w-5xl mx-auto space-y-8">
            
            {/* Header & Wallet Connection */}
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Direct Asset Notarization</h1>
                <p className="text-sm text-slate-500">Issue and pay for compliance records using your wallet</p>
              </div>
              <div className="flex flex-col items-end gap-3">
                <ConnectButton />
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-right min-w-[220px]">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Technician Identity</p>
                  <p className="text-sm font-bold text-slate-900">{userName}</p>
                  <p className="text-[10px] font-mono text-emerald-600 truncate max-w-[180px]">{userDid}</p>
                </div>
              </div>
            </div>

            {/* Business Search Bar */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <form onSubmit={handleSearch} className="flex gap-4">
                <input 
                  type="text" 
                  placeholder="Paste Business DID (iota:...) to manage assets" 
                  value={searchDid}
                  onChange={(e) => setSearchDid(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                />
                <button 
                  type="submit" 
                  disabled={loadingSearch}
                  className="bg-slate-900 text-white px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all disabled:bg-slate-300"
                >
                  {loadingSearch ? 'Searching...' : 'Select Business'}
                </button>
              </form>
            </div>

            {selectedBusiness && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Records Table */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">Business Assets</h2>
                      <span className="text-[10px] font-bold text-slate-400 truncate max-w-[150px]">DID: {selectedBusiness}</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <tr>
                            <th className="px-6 py-4 text-left">Document</th>
                            <th className="px-6 py-4 text-left">Expiration</th>
                            <th className="px-6 py-4 text-left">Issuer</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {businessRecords.length === 0 ? (
                            <tr><td colSpan="3" className="px-6 py-12 text-center text-slate-400 italic font-medium">No documents linked to this business identity yet.</td></tr>
                          ) : (
                            businessRecords.map(rec => (
                              <tr key={rec.objectId} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-900">
                                  {rec.metadata?.name}
                                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">{rec.objectId.slice(0, 15)}...</p>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex flex-col gap-1">
                                    <ExpBadge expirationDate={rec.metadata?.expirationDate} />
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {rec.metadata?.expirationDate
                                        ? new Date(rec.metadata.expirationDate).toLocaleDateString()
                                        : '—'}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                    {rec.metadata?.issuedBy?.slice(0, 15)}...
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Issuance Form */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sticky top-8">
                    <div className="mb-6">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">New Certification</h3>
                      <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Fees will be paid by your connected wallet</p>
                    </div>
                    
                    <form onSubmit={handleNotarize} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Document Title</label>
                        <input 
                          type="text" 
                          required
                          placeholder="e.g. Fire Safety Certificate"
                          value={form.fileName}
                          onChange={(e) => setForm({...form, fileName: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expiration Date</label>
                        <input 
                          type="date" 
                          required
                          value={form.expirationDate}
                          onChange={(e) => setForm({...form, expirationDate: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                        />
                      </div>

                      <div className="pt-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Technical Document (PDF)</label>
                        <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-6 text-center bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer group">
                          <input 
                            type="file" 
                            required
                            accept=".pdf"
                            onChange={(e) => setFile(e.target.files[0])}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                          <div className="space-y-2">
                            <span className="text-2xl group-hover:scale-110 transition-transform block">📄</span>
                            <span className="text-[10px] font-bold text-slate-500 truncate block px-2">
                              {file ? file.name : 'Select PDF file'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button 
                        type="submit" 
                        disabled={isUploading}
                        className="w-full bg-slate-900 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-slate-700 hover:-translate-y-0.5 transition-all disabled:bg-slate-200 disabled:translate-y-0"
                      >
                        {isUploading ? 'Processing...' : '🚀 Sign & Notarize'}
                      </button>
                    </form>

                    {isUploading && (
                      <div className="mt-4 p-3 bg-emerald-50 text-emerald-700 rounded-lg flex items-center justify-center gap-3 border border-emerald-100">
                        <div className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-[9px] font-black uppercase tracking-widest">Waiting for Wallet confirmation...</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TechnicianDashboard;