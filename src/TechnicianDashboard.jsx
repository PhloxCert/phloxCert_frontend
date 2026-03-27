import React, { useState, useEffect } from 'react';
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
  const userRole = localStorage.getItem('userRole');

  const [profile] = useState({
    name: localStorage.getItem('userName'),
    role: localStorage.getItem('userRole'),
    license: localStorage.getItem('licenseNumber'),
    specialization: localStorage.getItem('specialization')
  });

  const currentAccount = useCurrentAccount(); 
  const iotaClient = useIotaClient();
  const { mutateAsync: signTransaction } = useSignTransaction();

  const [searchDid, setSearchDid] = useState(() => localStorage.getItem('lastSearchDid') || '');
  const [businessInfo, setBusinessInfo] = useState(null); // On-chain profile data
  const [businessRecords, setBusinessRecords] = useState([]); // Database/IPFS certificates
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);

  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({ fileName: '', expirationDate: '' });
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [searchError, setSearchError] = useState(null);

  useEffect(() => {
  const savedDid = localStorage.getItem('lastSearchDid');
  if (savedDid) {
    handleSearch(null, savedDid);
  }
}, []);

  const handleSearch = async (e, didOverride) => {
  if (e) e.preventDefault();
  let rawInput = didOverride ?? searchDid;
  if (!rawInput?.trim()) return;

  // 1. Prepare the two formats
  // Clean address for the blockchain (e.g. 0x123...)
  const cleanAddress = rawInput.includes(':') ? rawInput.split(':').pop() : rawInput;
  // Full DID for the database (e.g. did:iota:0x123...)
  const fullDid = cleanAddress.startsWith('did:iota:') ? cleanAddress : `did:iota:${cleanAddress}`;

  setLoadingSearch(true);
  setBusinessInfo(null);
  setBusinessRecords([]);
  try {
    setSearchError(null);
    // 2. Execute parallel calls with the correct formats
    const [resOnChain, resRecords] = await Promise.allSettled([
      // Blockchain expects the ADDRESS (0x...)
      fetch(`${API_BASE_URL}/api/v1/business/profile/${cleanAddress}`),
      
      // Database/Pinata registry expects the FULL DID (did:iota:0x...)
      // If your backend for records expects only 0x, use cleanAddress here as well
      fetch(`${API_BASE_URL}/api/v1/records/${encodeURIComponent(fullDid)}`)
    ]);

    // Blockchain Profile Handling
    if (resOnChain.status === 'fulfilled') {
      if (resOnChain.value.ok) {
        const data = await resOnChain.value.json();
        const role = data.venue?.role;

        if (role === 2) {
          setSearchError("Cannot certify a Technician identity. Please verify a Business DID.");
          setSelectedBusiness(null);
          localStorage.removeItem('lastSearchDid');
        } else {
          setBusinessInfo(data.venue);
          setSelectedBusiness(cleanAddress); // Only set if valid
          localStorage.setItem('lastSearchDid', cleanAddress);
        }
      } else if (resOnChain.value.status === 404) {
        setSearchError("Identity not registered on-chain.");
        setSelectedBusiness(null);
        localStorage.removeItem('lastSearchDid');
      } else {
        setSearchError("Error fetching identity profile.");
        setSelectedBusiness(null);
        localStorage.removeItem('lastSearchDid');
      }
    }

    // Database Records Handling
    if (resRecords.status === 'fulfilled' && resRecords.value.ok) {
      const records = await resRecords.value.json();
      console.log("Assets found:", records); // Check console for the result
      setBusinessRecords(Array.isArray(records) ? records : []);
    }

  } catch (err) {
    console.error("Fetch error:", err);
    setSearchError("An unexpected error occurred during search.");
  } finally {
    setLoadingSearch(false);
  }
};

  const handleNotarize = async (e) => {
    e.preventDefault();
    if (!currentAccount) { alert("Connect IOTA wallet to notarize documents."); return; }

    setIsUploading(true);
    try {
      const pubKey = currentAccount.publicKey;
      const pubKeyBase64 = Buffer.from(pubKey).toString('base64');

      const fd = new FormData();
      fd.append('file', file);
      fd.append('fileName', form.fileName);
      fd.append('activityDid', selectedBusiness);
      fd.append('uploaderDid', userDid);
      fd.append('issuedBy', userDid);
      fd.append('expirationDate', form.expirationDate);
      fd.append('technicianAddress', currentAccount.address); 
      fd.append('publicKey', pubKeyBase64);

      const res = await fetch(`${API_BASE_URL}/api/v1/notarize/upload`, { method: 'POST', body: fd });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Backend preparation failed");
      }

      const { txBytes } = await res.json();
      const bytes = Uint8Array.from(atob(txBytes), c => c.charCodeAt(0));
      const transaction = Transaction.from(bytes);

      const { bytes: signedBytes, signature } = await signTransaction({ transaction });

      const result = await iotaClient.executeTransactionBlock({
        transactionBlock: signedBytes,
        signature,
        options: { showObjectChanges: true, showEffects: true },
      });

      const objectId = result.objectChanges?.find(c => c.type === 'created')?.objectId ??
                       result.effects?.created?.[0]?.reference?.objectId;

      if (!objectId) throw new Error('Transaction successful but objectId not found');

      await fetch(`${API_BASE_URL}/api/v1/identity/save-id`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          objectId, 
          activityDid: selectedBusiness,
          uploaderDid: userDid
        })
      });

      await new Promise(r => setTimeout(r, 5000));
      await handleSearch(null, selectedBusiness);
      setForm({ fileName: '', expirationDate: '' });
      setFile(null);

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
            
            {/* Header */}
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">Technician Dashboard</h1>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-tighter">Certify venues on IOTA Testnet</p>
              </div>
            </div>

            {/* Profile */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-white shrink-0 font-bold text-lg">T</div>
                <div className="overflow-hidden w-full">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-extrabold text-slate-900 leading-tight">{profile.name}</h2>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Verified IOTA DID</h3>
                      <p className="text-xs font-mono text-slate-700 truncate max-w-md">{userDid}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-6 border-l border-slate-100 pl-6 h-full">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">License Number</p>
                        <p className="text-sm font-bold text-slate-700">{profile.license || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Specialization</p>
                        <p className="text-sm font-bold text-slate-700">{profile.specialization || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <form onSubmit={handleSearch} className="flex gap-4">
                <input 
                  type="text" 
                  placeholder="Enter Venue DID (iota:...) to fetch on-chain data" 
                  value={searchDid}
                  onChange={(e) => setSearchDid(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                />
                <button 
                  type="submit" 
                  disabled={loadingSearch}
                  className="bg-slate-900 text-white px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all disabled:bg-slate-300"
                >
                  {loadingSearch ? 'Verifying...' : 'Verify Venue'}
                </button>
              </form>
              {searchError && (
                <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-bold animate-in fade-in slide-in-from-top-2">
                  ⚠️ {searchError}
                </div>
              )}
            </div>

            {/* On-Chain Venue Data View */}
            {selectedBusiness && businessInfo && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-l-emerald-500 border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6 animate-in fade-in slide-in-from-top-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg font-black">
                      {businessInfo.name.charAt(0)}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white text-[8px] px-1.5 py-0.5 rounded-full border-2 border-white font-black uppercase shadow-sm">
                      Live
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 leading-tight">{businessInfo.name}</h2>
                    <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">Verified IOTA Object: {selectedBusiness.slice(0, 24)}...</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-8 border-l border-slate-100 pl-8 w-full md:w-auto">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Vat Number</p>
                    <p className="text-sm font-bold text-slate-700">{businessInfo.vat}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Legal Address</p>
                    <p className="text-sm font-bold text-slate-700 truncate max-w-[150px]">{businessInfo.address}</p>
                  </div>
                </div>
              </div>
            )}

            {selectedBusiness && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Records Table */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">Current Certifications</h2>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Synchronized</span>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <tr>
                            <th className="px-6 py-4 text-left">Document</th>
                            <th className="px-6 py-4 text-left">Expiration</th>
                            <th className="px-6 py-4 text-left">Status</th>
                            <th className="px-6 py-4 text-left">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {businessRecords.length === 0 ? (
                            <tr><td colSpan="3" className="px-6 py-12 text-center text-slate-400 italic font-medium">No assets recorded for this identity.</td></tr>
                          ) : (
                            businessRecords.map(rec => (
                              <tr key={rec.objectId} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-900">
                                  {rec.metadata?.name}
                                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">{rec.objectId.slice(0, 15)}...</p>
                                </td>
                                <td className="px-6 py-4 text-slate-500 font-mono text-[10px]">
                                  {rec.metadata?.expirationDate ? new Date(rec.metadata.expirationDate).toLocaleDateString() : '—'}
                                </td>
                                <td className="px-6 py-4">
                                  <ExpBadge expirationDate={rec.metadata?.expirationDate} />
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <button
                                    onClick={() => setSelectedRecord(rec)}
                                    className="px-3 py-1.5 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-200"
                                  >
                                    Details
                                  </button>
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
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Issue Certification</h3>
                      <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">You are paying for the notarization gas fees</p>
                    </div>
                    
                    <form onSubmit={handleNotarize} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Certificate Name</label>
                        <input 
                          type="text" required
                          placeholder="Fire Safety, HACCP, etc."
                          value={form.fileName}
                          onChange={(e) => setForm({...form, fileName: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valid Until</label>
                        <input 
                          type="date" required
                          value={form.expirationDate}
                          onChange={(e) => setForm({...form, expirationDate: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                        />
                      </div>

                      <div className="pt-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Upload PDF Evidence</label>
                        <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-6 text-center bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer group">
                          <input 
                            type="file" required accept=".pdf"
                            onChange={(e) => setFile(e.target.files[0])}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                          <div className="space-y-2">
                            <span className="text-2xl group-hover:rotate-12 transition-transform block">📂</span>
                            <span className="text-[10px] font-bold text-slate-500 truncate block px-2">
                              {file ? file.name : 'Click to select PDF'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button 
                        type="submit" 
                        disabled={isUploading}
                        className="w-full bg-slate-900 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-slate-700 hover:-translate-y-0.5 transition-all disabled:bg-slate-200 disabled:translate-y-0"
                      >
                        {isUploading ? 'Sending to IOTA...' : '🚀 Sign & Notarize'}
                      </button>
                    </form>

                    {isUploading && (
                      <div className="mt-4 p-3 bg-slate-900 text-white rounded-lg flex items-center justify-center gap-3 animate-pulse">
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-[9px] font-black uppercase tracking-widest">Confirm on Wallet...</span>
                      </div>
                    )}
                    {selectedRecord && (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 relative">

      <button
        onClick={() => setSelectedRecord(null)}
        className="absolute top-4 right-4 text-slate-400 hover:text-slate-800"
      >
        ✕
      </button>

      <div className="p-8 space-y-6">

        <h3 className="text-lg font-black">Certificate Details</h3>

        {/* STATUS */}
        <ExpBadge expirationDate={selectedRecord.metadata?.expirationDate} />

        {/* INFO */}
        <div className="space-y-3 text-sm">

          <div>
            <p className="text-xs text-slate-400 uppercase font-bold">Name</p>
            <p className="font-bold">{selectedRecord.metadata?.name}</p>
          </div>

          <div>
            <p className="text-xs text-slate-400 uppercase font-bold">Expiration</p>
            <p>
              {selectedRecord.metadata?.expirationDate
                ? new Date(selectedRecord.metadata.expirationDate).toLocaleDateString()
                : '—'}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400 uppercase font-bold">Object ID</p>
            <p className="font-mono text-xs break-all">{selectedRecord.objectId}</p>
          </div>

          {selectedRecord.metadata?.issuedBy && (
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold">Issued By</p>
              <p className="font-mono text-xs break-all">{selectedRecord.metadata.issuedBy}</p>
            </div>
          )}
        </div>

        {/* DOWNLOAD */}
        <a
          href={
            selectedRecord.metadata?.offchainUrl ||
            `${API_BASE_URL}/api/v1/records/${selectedRecord.objectId}/download`
          }
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center bg-slate-900 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-all"
        >
          ⬇ Download PDF
        </a>

      </div>
    </div>
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