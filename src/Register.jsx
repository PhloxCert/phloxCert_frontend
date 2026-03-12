// src/Register.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@iota/dapp-kit';
import { Transaction } from '@iota/iota-sdk/transactions';
import { IotaClient } from '@iota/iota-sdk/client';

// CONFIGURAZIONE - Verifica che siano identici al backend
const PACKAGE_ID = "0x9bf6b9515e995cb7cf2ee08a7a1e956454a9ab723d5b766e75a0575654df1579";
const REGISTRY_ID = "0x6bace8e70cf7a7e19b60c35d51bc7a2b01a92d0c748d8cc9c9358072bc3cb56f";

function Register() {
  const account = useCurrentAccount();
  const navigate = useNavigate();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  
  // Client configurato esplicitamente sulla porta locale 9000
  const client = useMemo(() => new IotaClient({ url: "http://127.0.0.1:9000" }), []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    localName: '',
    ownerName: '',
    city: '',
    role: '0' // 0 = Locale, 1 = Controllore
  });

  // Protezione: Se non c'è il wallet, torna alla home
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
    if (!account) return setError("Wallet non connesso");

    setLoading(true);
    setError(null);

    try {
      // 1. Check di connessione: Il frontend vede il contratto?
      try {
        await client.getObject({ id: PACKAGE_ID });
      } catch (e) {
        throw new Error("Contratto non trovato sulla rete locale. Verifica che iota-test-validator sia attivo e il wallet sia su Localhost.");
      }

      const txb = new Transaction();
      const encoder = new TextEncoder();

      // Uniamo le info extra nella stringa 'name' accettata dal tuo contratto
      const combinedName = `${formData.localName} (${formData.city}) - Prop: ${formData.ownerName}`;
      
      // Conversione in vector<u8> per Move
      const addressBytes = Array.from(encoder.encode(account.address));
      const nameBytes = Array.from(encoder.encode(combinedName));

      // Costruzione chiamata Move
      txb.moveCall({
        target: `${PACKAGE_ID}::LocalRegistry::add_user`,
        arguments: [
          txb.object(REGISTRY_ID),
          txb.pure.vector('u8', addressBytes),
          txb.pure.vector('u8', nameBytes),
          txb.pure.u8(parseInt(formData.role)),
        ],
      });

      // Esecuzione tramite Wallet
      signAndExecute(
        { transaction: txb },
        {
          onSuccess: (result) => {
            console.log("Transazione successiva:", result);
            setSuccess(true);
            
            // Salvataggio locale per persistenza UI
            localStorage.setItem('registered', 'true');
            localStorage.setItem('userRole', formData.role);
            localStorage.setItem('localName', formData.localName);

            // Reindirizzamento al dashboard
            setTimeout(() => {
              navigate('/dashboard');
            }, 2500);
          },
          onError: (err) => {
            console.error("Errore firma:", err);
            setError(`Errore Wallet: ${err.message}`);
            setLoading(false);
          }
        }
      );

    } catch (err) {
      console.error("Errore generale:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={containerStyle}>
        <div style={successBoxStyle}>
          <h2>✓ Registrazione Completata!</h2>
          <p>Benvenuto nel registro IOTA. Verrai reindirizzato al tuo dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h1 style={{ color: '#0f172a', fontSize: '2rem' }}>Registra la tua Attività</h1>
      <p style={{ color: '#64748b', marginBottom: '30px' }}>
        Inserisci i dettagli. L'operazione scriverà i dati sulla blockchain locale.
      </p>

      <form onSubmit={handleSubmit} style={formStyle}>
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Nome del Locale</label>
          <input
            type="text"
            name="localName"
            value={formData.localName}
            onChange={handleChange}
            required
            placeholder="Es. Pizzeria da Mario"
            style={inputStyle}
          />
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle}>Città</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            required
            placeholder="Es. Roma"
            style={inputStyle}
          />
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle}>Nome Proprietario</label>
          <input
            type="text"
            name="ownerName"
            value={formData.ownerName}
            onChange={handleChange}
            required
            placeholder="Es. Mario Rossi"
            style={inputStyle}
          />
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle}>Ruolo</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            style={inputStyle}
          >
            <option value="0">Esercente (Locale Pubblico)</option>
            <option value="1">Controllore (Ispettore)</option>
          </select>
        </div>

        {error && (
          <div style={errorStyle}>
            <strong>Attenzione:</strong> {error}
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
          {loading ? "In attesa del Wallet..." : "Registra su Blockchain"}
        </button>

        <button
          type="button"
          onClick={() => navigate('/')}
          style={backButtonStyle}
        >
          Annulla
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