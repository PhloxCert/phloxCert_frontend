// src/Register.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@iota/dapp-kit';
import { Transaction } from '@iota/iota-sdk/transactions';
import { IotaClient } from '@iota/iota-sdk/client';

// CONFIGURATION - Ensure they match the backend
const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID ?? "";
const REGISTRY_ID = import.meta.env.VITE_REGISTRY_ID ?? "";
const IOTA_NODE_URL = import.meta.env.VITE_IOTA_NODE_URL ?? "http://127.0.0.1:9000";

function Register() {
  const account = useCurrentAccount();
  const navigate = useNavigate();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  
  // Client configured from .env file (fallback to local port 9000)
  const client = useMemo(() => new IotaClient({ url: IOTA_NODE_URL }), []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    localName: '',
    ownerName: '',
    city: '',
    role: '0' // 0 = Locale, 1 = Controllore
  });

  // Protection: If no wallet, return to home
  useEffect(() => {
    if (!account) {
      navigate('/');
    }
  }, [account, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!account) return setError("Wallet not connected");

    setLoading(true);
    setError(null);

    try {
      // 1. Connection check: Can the frontend see the contract?
      try {
        await client.getObject({ id: PACKAGE_ID });
      } catch (e) {
        throw new Error("Contract not found on local network. Verify that iota-test-validator is active and the wallet is on Localhost.");
      }

      const txb = new Transaction();
      const encoder = new TextEncoder();

      // We combine the extra info in the 'name' string accepted by your contract
      const combinedName = `${formData.localName} (${formData.city}) - Prop: ${formData.ownerName}`;
      
      // Conversion to vector<u8> for Move
      const addressBytes = Array.from(encoder.encode(account.address));
      const nameBytes = Array.from(encoder.encode(combinedName));

      // Building Move call
      txb.moveCall({
        target: `${PACKAGE_ID}::LocalRegistry::add_user`,
        arguments: [
          txb.object(REGISTRY_ID),
          txb.pure.vector('u8', addressBytes),
          txb.pure.vector('u8', nameBytes),
          txb.pure.u8(parseInt(formData.role)),
        ],
      });

      // Execution via Wallet
      signAndExecute(
        { transaction: txb },
        {
          onSuccess: (result) => {
            console.log("Transaction successful:", result);
            setSuccess(true);
            
            // Local saving for UI persistence
            localStorage.setItem('registered', 'true');
            localStorage.setItem('userRole', formData.role);
            localStorage.setItem('localName', formData.localName);
            localStorage.setItem('ownerName', formData.ownerName);

            // Redirect to dashboard
            setTimeout(() => {
              navigate('/dashboard');
            }, 2500);
          },
          onError: (err) => {
            console.error("Signature error:", err);
            setError(`Wallet error: ${err.message}`);
            setLoading(false);
          }
        }
      );

    } catch (err) {
      console.error("General error:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={containerStyle}>
        <div style={successBoxStyle}>
          <h2>✓ Registration Completed!</h2>
          <p>Welcome to the IOTA registry. You will be redirected to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h1 style={{ color: '#0f172a', fontSize: '2rem' }}>Register Your Business</h1>
      <p style={{ color: '#64748b', marginBottom: '30px' }}>
        Enter the details. The operation will write the data to the local blockchain.
      </p>

      <form onSubmit={handleSubmit} style={formStyle}>
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Business Name</label>
          <input
            type="text"
            name="localName"
            value={formData.localName}
            onChange={handleChange}
            required
            placeholder="E.g. Mario's Pizzeria"
            style={inputStyle}
          />
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle}>City</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            required
            placeholder="E.g. Rome"
            style={inputStyle}
          />
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle}>Owner Name</label>
          <input
            type="text"
            name="ownerName"
            value={formData.ownerName}
            onChange={handleChange}
            required
            placeholder="E.g. Mario Rossi"
            style={inputStyle}
          />
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle}>Role</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            style={inputStyle}
          >
            <option value="0">Operator (Public Place)</option>
            <option value="1">Inspector (Controller)</option>
          </select>
        </div>

        {error && (
          <div style={errorStyle}>
            <strong>Attention:</strong> {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            ...buttonStyle,
            backgroundColor: loading ? '#94a3b8' : '#0f172a',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? "Waiting for Wallet..." : "Register on Blockchain"}
        </button>

        <button
          type="button"
          onClick={() => navigate('/')}
          style={backButtonStyle}
        >
          Cancel
        </button>
      </form>
    </div>
  );
}

// --- STILI ---
const containerStyle = {
  textAlign: 'center',
  padding: '50px 20px',
  fontFamily: 'system-ui, sans-serif',
  backgroundColor: '#f8fafc',
  minHeight: '100vh'
};

const formStyle = {
  maxWidth: '450px',
  margin: '0 auto',
  backgroundColor: 'white',
  padding: '40px',
  borderRadius: '16px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
};

const inputGroupStyle = { marginBottom: '20px', textAlign: 'left' };
const labelStyle = { display: 'block', marginBottom: '8px', color: '#1e293b', fontWeight: '600', fontSize: '14px' };
const inputStyle = {
  width: '100%',
  padding: '12px',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  fontSize: '15px',
  boxSizing: 'border-box',
  outline: 'none'
};

const buttonStyle = {
  width: '100%',
  padding: '14px',
  fontSize: '16px',
  color: 'white',
  border: 'none',
  borderRadius: '10px',
  fontWeight: 'bold',
  marginTop: '10px',
  transition: 'background 0.2s'
};

const backButtonStyle = {
  width: '100%',
  padding: '12px',
  backgroundColor: 'transparent',
  color: '#64748b',
  border: 'none',
  marginTop: '10px',
  cursor: 'pointer',
  fontSize: '14px'
};

const errorStyle = {
  backgroundColor: '#fef2f2',
  color: '#991b1b',
  padding: '12px',
  borderRadius: '8px',
  marginBottom: '20px',
  fontSize: '13px',
  border: '1px solid #fee2e2'
};

const successBoxStyle = {
  backgroundColor: '#f0fdf4',
  color: '#166534',
  padding: '40px',
  borderRadius: '16px',
  maxWidth: '400px',
  margin: '0 auto',
  border: '1px solid #bbf7d0'
};

export default Register;