import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@iota/dapp-kit';
import { Transaction } from '@iota/iota-sdk/transactions';
import { IotaClient } from '@iota/iota-sdk/client';

const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID ?? "";
const REGISTRY_ID = import.meta.env.VITE_REGISTRY_ID ?? "";
const IOTA_NODE_URL = import.meta.env.VITE_IOTA_NODE_URL ?? "https://fullnode.testnet.iota.cafe:443";

function Register() {
  const account = useCurrentAccount();
  const navigate = useNavigate();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const client = useMemo(() => new IotaClient({ url: IOTA_NODE_URL }), []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    role: '1', // 1 = Local Business, 2 = Technician (Matching Move constants)
    // Business specific
    address: '',
    vat: '',
    // Technician specific
    license: '',
    specialization: ''
  });

  useEffect(() => {
    if (!account) navigate('/');
  }, [account, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!account) return setError("Wallet not connected");

    setLoading(true);
    setError(null);

    try {
      const txb = new Transaction();
      
      if (formData.role === '1') {
        // CALL REGISTER BUSINESS
        txb.moveCall({
          target: `${PACKAGE_ID}::LocalRegistry::register_business`,
          arguments: [
            txb.object(REGISTRY_ID),
            txb.pure.string(formData.name),
            txb.pure.string(formData.address),
            txb.pure.string(formData.vat),
          ],
        });
      } else {
        // CALL REGISTER TECHNICIAN
        txb.moveCall({
          target: `${PACKAGE_ID}::LocalRegistry::register_technician`,
          arguments: [
            txb.object(REGISTRY_ID),
            txb.pure.string(formData.name),
            txb.pure.string(formData.license),
            txb.pure.string(formData.specialization),
          ],
        });
      }

      signAndExecute(
        { transaction: txb },
        {
          onSuccess: (result) => {
            setSuccess(true);

            localStorage.setItem('registered', 'true');
            localStorage.setItem('userRole', formData.role);
            localStorage.setItem('userName', formData.name);

            if (formData.role === '1') {
              localStorage.setItem('businessAddress', formData.address);
              localStorage.setItem('vatNumber', formData.vat);
            } else if (formData.role === '2') {
              localStorage.setItem('licenseNumber', formData.license);
              localStorage.setItem('specialization', formData.specialization);
            }

            setTimeout(() => navigate('/dashboard'), 2500);
          },
          onError: (err) => {
            setError(`Blockchain error: ${err.message}`);
            setLoading(false);
          }
        }
      );
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={containerStyle}>
        <div style={successBoxStyle}>
          <h2>✓ Profile Created!</h2>
          <p>Your identity has been secured on IOTA. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h1 style={{ color: '#0f172a' }}>Complete your Profile</h1>
      <p style={{ color: '#64748b', marginBottom: '30px' }}>Join the safety network</p>

      <form onSubmit={handleSubmit} style={formStyle}>
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Account Type</label>
          <select name="role" value={formData.role} onChange={handleChange} style={inputStyle}>
            <option value="1">Local Business / Venue</option>
            <option value="2">Authorized Technician</option>
          </select>
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle}>{formData.role === '1' ? 'Business Name' : 'Full Name'}</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required style={inputStyle} />
        </div>

        {formData.role === '1' ? (
          <>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Physical Address</label>
              <input type="text" name="address" value={formData.address} onChange={handleChange} required style={inputStyle} />
            </div>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>VAT Number (P.IVA)</label>
              <input type="text" name="vat" value={formData.vat} onChange={handleChange} required style={inputStyle} />
            </div>
          </>
        ) : (
          <>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Professional License Number</label>
              <input type="text" name="license" value={formData.license} onChange={handleChange} required style={inputStyle} />
            </div>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Specialization</label>
              <input type="text" name="specialization" value={formData.specialization} onChange={handleChange} required placeholder="e.g. Fire Prevention" style={inputStyle} />
            </div>
          </>
        )}

        {error && <div style={errorStyle}>{error}</div>}

        <button type="submit" disabled={loading} style={{...buttonStyle, backgroundColor: loading ? '#94a3b8' : '#0f172a'}}>
          {loading ? "Processing..." : "Confirm Registration"}
        </button>
      </form>
    </div>
  );
}

// --- Styles remain largely the same as your original, just ensure they are imported/defined ---
const containerStyle = { textAlign: 'center', padding: '50px 20px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif' };
const formStyle = { maxWidth: '450px', margin: '0 auto', backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' };
const inputGroupStyle = { marginBottom: '15px', textAlign: 'left' };
const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' };
const buttonStyle = { width: '100%', padding: '12px', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' };
const errorStyle = { color: 'red', marginBottom: '10px', fontSize: '14px' };
const successBoxStyle = { padding: '40px', backgroundColor: '#dcfce7', borderRadius: '12px', border: '1px solid #bbf7d0' };

export default Register;