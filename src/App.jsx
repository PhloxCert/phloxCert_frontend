// src/App.jsx
import React, { useState, useEffect } from 'react';
import { ConnectButton, useCurrentAccount, useSignPersonalMessage } from '@iota/dapp-kit';
import { useNavigate } from 'react-router-dom';

function App() {
  const account = useCurrentAccount();
  const { mutateAsync: signMessage } = useSignPersonalMessage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Controllo sessione esistente
  /*useEffect(() => {
    const userDid = localStorage.getItem('userDid');
    if (userDid) {
      console.log("Sessione trovata:", userDid);
      navigate('/dashboard');
    }
  }, [navigate]);*/

  const loginConWallet = async () => {
    if (!account) return alert("Per favore, connetti prima il tuo Wallet!");
    
    setLoading(true);
    setError(null);
    try {
      // 1. Chiedi al backend il nonce
      const resNonce = await fetch('http://localhost:8080/auth/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: account.address })
      });
      
      if (!resNonce.ok) throw new Error("Errore nel generare il nonce");
      const data = await resNonce.json();
      const nonce = data.nonce;

      // 2. Firma il nonce
      const { signature } = await signMessage({
        message: new TextEncoder().encode(nonce),
      });

      // 3. Verifica al backend
      const resVerify = await fetch('http://localhost:8080/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: account.address,
          signature: signature
        })
      });

      if (!resVerify.ok) {
        const errorData = await resVerify.json();
        throw new Error(errorData.error || "Firma non valida");
      }

      const verifyData = await resVerify.json();
      console.log("Risposta completa dal backend:", verifyData);
      console.log("Tipo di verifyData:", typeof verifyData);
      console.log("Chiavi di verifyData:", Object.keys(verifyData));
      
      if (!verifyData) {
        throw new Error("Risposta vuota dal backend");
      }
      
      // Salva i dati dell'utente nel localStorage
      localStorage.setItem('userDid', `did:iota:${account.address}`);
      localStorage.setItem('userAddress', account.address);
      localStorage.setItem('userRole', String(verifyData.role !== undefined ? verifyData.role : 0));
      localStorage.setItem('registered', String(verifyData.registered === true ? 'true' : 'false'));

      console.log("Login verificato:", verifyData);

      // Se l'utente è registrato nel contratto, vai al dashboard
      // Altrimenti vai alla pagina di registrazione
      if (verifyData && verifyData.registered === true) {
        navigate('/dashboard');
      } else {
        navigate('/register');
      }
    } catch (err) {
      console.error("Errore durante il login:", err);
      setError(err.message || "Errore di connessione. Controlla che il backend sia attivo.");
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
      <p style={{ color: '#64748b', marginBottom: '30px' }}>Identità Digitale per Locali Pubblici</p>
      
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
          {loading ? "Verifica in corso..." : "Accedi con Wallet Identity"}
        </button>
      )}
    </div>
  );
}

export default App;