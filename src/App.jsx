// src/App.jsx
import React, { useState, useEffect } from 'react';
import { ConnectButton, useCurrentAccount, useSignPersonalMessage } from '@iota/dapp-kit';
import { useNavigate } from 'react-router-dom';

function App() {
  const account = useCurrentAccount();
  const { mutateAsync: signMessage } = useSignPersonalMessage();
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loginConWallet = async () => {
    if (!account) return alert("Please connect your Wallet first!");
    
    setLoading(true);
    setError(null);
    try {
      // 1. Ask the backend for the nonce
      const resNonce = await fetch(`${API_BASE_URL}/auth/nonce`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: account.address })
      });
      
      if (!resNonce.ok) throw new Error("Error generating the nonce");
      const data = await resNonce.json();
      const nonce = data.nonce;
      

      // 2. Sign the nonce
      const { signature } = await signMessage({
        message: new TextEncoder().encode(nonce),
      });
      

      // 3. Verify with the backend
      const resVerify = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: account.address,
          signature: signature
        })
      });

      if (!resVerify.ok) {
        const errorData = await resVerify.json();
        throw new Error(errorData.error || "Invalid signature");
      }

      const verifyData = await resVerify.json();
      console.log("Complete response from backend:", verifyData);
      console.log("Type of verifyData:", typeof verifyData);
      console.log("Keys of verifyData:", Object.keys(verifyData));
      
      if (!verifyData) {
        throw new Error("Empty response from backend");
      }

      // Salvataggio dati base
      localStorage.setItem('userAddress', account.address);
      localStorage.setItem('userDid', `did:iota:${account.address}`);
      localStorage.setItem('registered', verifyData.registered ? 'true' : 'false');

      const role = verifyData.role;
      if (role === 1) {
          localStorage.setItem('userRole', '1');
          localStorage.setItem('userName', verifyData.name || 'Business User');
          localStorage.setItem('businessAddress', verifyData.business_info?.address || 'N/A');
          localStorage.setItem('vatNumber', verifyData.business_info?.vat_number || 'N/A');
      }

      if (role === 2) {
          localStorage.setItem('userRole', '2');
          localStorage.setItem('userName', verifyData.name || 'Technician');
          localStorage.setItem('licenseNumber', verifyData.technician_info?.license_number || 'N/A');
          localStorage.setItem('specialization', verifyData.technician_info?.specialization || 'N/A');
      }
      // Navigazione
      if (verifyData.registered) {
          navigate('/dashboard');
      } else {
          navigate('/register');
      }
    } catch (err) {
      console.error("Error during login:", err);
      setError(err.message || "Connection error. Check that the backend is active.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      textAlign: 'center', 
      padding: '50px', 
      fontFamily: 'sans-serif', 
      backgroundColor: '#f8fafc', 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <h1 style={{ color: '#0f172a', marginBottom: '10px' }}>IOTA Local Dashboard</h1>
      <p style={{ color: '#64748b', marginBottom: '30px' }}>Digital Identity for Public Places</p>
      
      <div style={{ margin: '20px', display: 'flex', justifyContent: 'center'}}>
        <ConnectButton style={{backgroundColor: '#c3ccd4'}}/>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          padding: '12px 16px',
          borderRadius: '6px',
          marginTop: '20px',
          maxWidth: '400px'
        }}>
          {error}
        </div>
      )}

      {account && (
        <button 
          onClick={loginConWallet} 
          disabled={loading}
          style={{ 
            padding: '12px 24px', 
            fontSize: '16px', 
            cursor: loading ? 'not-allowed' : 'pointer',
            backgroundColor: loading ? '#cbd5e1' : '#0f172a',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            marginTop: '20px',
            opacity: loading ? 0.7 : 1,
            transition: 'all 0.3s ease'
          }}
        >
          {loading ? "Verification in progress..." : "Access with Wallet Identity"}
        </button>
      )}
    </div>
  );
}

export default App;