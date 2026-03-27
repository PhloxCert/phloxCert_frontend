// src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import { ConnectButton, useCurrentAccount, useSignPersonalMessage } from '@iota/dapp-kit';
import { useNavigate } from 'react-router-dom';

function App() {
  const account = useCurrentAccount();
  const { mutateAsync: signMessage } = useSignPersonalMessage();
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    const nodes = Array.from({ length: 42 }, () => ({
      x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28,
      r: Math.random() * 1.8 + 0.8,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
      });
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 180) {
            ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(100,80,220,${0.1 * (1 - d / 180)})`; ctx.lineWidth = 0.6; ctx.stroke();
          }
        }
        ctx.beginPath(); ctx.arc(nodes[i].x, nodes[i].y, nodes[i].r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(140,110,240,0.28)'; ctx.fill();
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  const loginWithWallet = async () => {
    if (!account) return alert("Please connect your Wallet first!");
    setLoading(true); setError(null);
    try {
      const resNonce = await fetch(`${API_BASE_URL}/auth/nonce`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: account.address })
      });
      if (!resNonce.ok) throw new Error("Error generating the nonce");
      const { nonce } = await resNonce.json();
      const { signature } = await signMessage({ message: new TextEncoder().encode(nonce) });
      const resVerify = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: account.address, signature })
      });
      if (!resVerify.ok) { const e = await resVerify.json(); throw new Error(e.error || "Invalid signature"); }
      const verifyData = await resVerify.json();
      if (!verifyData) throw new Error("Empty response from backend");
      localStorage.setItem('userAddress', account.address);
      localStorage.setItem('userDid', `did:iota:${account.address}`);
      localStorage.setItem('registered', verifyData.registered ? 'true' : 'false');
      if (verifyData.role === 1) {
        localStorage.setItem('userRole', '1');
        localStorage.setItem('userName', verifyData.name || 'Business User');
        localStorage.setItem('businessAddress', verifyData.business_info?.address || 'N/A');
        localStorage.setItem('vatNumber', verifyData.business_info?.vat_number || 'N/A');
      }
      if (verifyData.role === 2) {
        localStorage.setItem('userRole', '2');
        localStorage.setItem('userName', verifyData.name || 'Technician');
        localStorage.setItem('licenseNumber', verifyData.technician_info?.license_number || 'N/A');
        localStorage.setItem('specialization', verifyData.technician_info?.specialization || 'N/A');
      }
      if (verifyData.registered) navigate('/dashboard'); else navigate('/register');
    } catch (err) {
      setError(err.message || "Connection error. Check that the backend is active.");
    } finally { setLoading(false); }
  };

  const pillars = [
    { label: 'Common', text: 'Passive inspections and superficial maintenance affect millions of public venues globally.' },
    { label: 'In Crescendo', text: 'Growing legal liabilities and demands for transparency from insurers and the tourism sector.' },
    { label: 'Urgent', text: 'Disasters like Crans-Montana prove safety is a here-and-now requirement, not a future checkbox.' },
    { label: 'Mandatory', text: 'Fire safety is governed by strict laws, yet enforcement mechanisms are often non-existent or ignored.' },
    { label: 'Frequent', text: 'Safety checks occur daily or monthly — manual processes are inefficient and prone to human error.' },
  ];

  const features = [
    { icon: '🔐', title: 'Wallet-Based Auth', text: 'Secure access for inspectors and operators using IOTA DIDs — no passwords, no breach risk.' },
    { icon: '📦', title: 'Digital Twin NFTs', text: 'Every safety device is tokenised on-chain, preventing generic or duplicated inspections.' },
    { icon: '🛡', title: 'Locked Notarisations', text: 'SHA256-hashed, unalterable proof-of-inspection. No backdating, no deletion — ever.' },
    { icon: '📊', title: 'Dual-Identity Tracking', text: 'Independent attribution for the uploader inspector and the inspected establishment.' },
    { icon: '📱', title: 'Public Verification', text: 'Anyone verifies a venue\'s safety status via QR code — no wallet or login required.' },
    { icon: '⛓', title: 'IOTA Move Contracts', text: 'Smart contracts manage the user registry and the full lifecycle of notarisation objects.' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;700;800;900&family=Instrument+Sans:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        :root{
          --bg:#060510;--surface:#0c0a1a;
          --border:rgba(120,90,230,0.16);--border2:rgba(120,90,230,0.28);
          --accent:#7c5cf6;--accent2:#b08cff;
          --text:#eceaf8;--muted:#8880aa;--danger:#f87171;
        }
        html{scroll-behavior:smooth;}
        body{background:var(--bg);color:var(--text);font-family:'Instrument Sans',sans-serif;overflow-x:hidden;}
        canvas.bg{position:fixed;inset:0;z-index:0;pointer-events:none;}
        .orb{position:fixed;border-radius:50%;filter:blur(130px);pointer-events:none;z-index:0;}
        .orb-a{width:700px;height:700px;background:radial-gradient(circle,rgba(110,70,255,0.14),transparent 65%);top:-250px;left:-200px;}
        .orb-b{width:500px;height:500px;background:radial-gradient(circle,rgba(180,100,255,0.1),transparent 65%);bottom:-100px;right:-150px;}

        /* NAV */
        nav{position:sticky;top:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:18px 48px;border-bottom:1px solid var(--border);background:rgba(6,5,16,0.78);backdrop-filter:blur(18px);}
        .logo{display:flex;align-items:center;gap:12px;}
        .logo img{height:34px;width:auto;}
        .logo-name{font-family:'Cabinet Grotesk',sans-serif;font-weight:900;font-size:19px;letter-spacing:-0.5px;color:var(--text);}
        .nav-right{display:flex;align-items:center;gap:14px;}
        .nav-pill{font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--accent2);background:rgba(120,90,230,0.1);border:1px solid var(--border2);padding:5px 12px;border-radius:99px;}

        /* HERO */
        .hero{position:relative;z-index:2;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:80px 24px 60px;}
        .hero-tag{display:inline-flex;align-items:center;gap:8px;font-size:11px;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;color:var(--accent2);border:1px solid var(--border2);padding:7px 18px;border-radius:99px;margin-bottom:36px;background:rgba(120,90,230,0.08);animation:fadeUp 1s 0.1s both;}
        .hero-tag::before{content:'';width:7px;height:7px;border-radius:50%;background:#4ade80;box-shadow:0 0 10px #4ade80;animation:blink 2.5s ease-in-out infinite;}
        @keyframes blink{0%,100%{opacity:1;}50%{opacity:0.2;}}
        .hero h1{font-family:'Cabinet Grotesk',sans-serif;font-size:clamp(46px,8vw,92px);font-weight:900;line-height:0.96;letter-spacing:-3px;color:var(--text);margin-bottom:28px;animation:fadeUp 1s 0.2s both;}
        .hero h1 em{font-style:normal;background:linear-gradient(125deg,#a78bfa 0%,#f0abfc 40%,#818cf8 80%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
        .hero-sub{max-width:600px;font-size:17px;color:var(--muted);line-height:1.75;margin-bottom:52px;animation:fadeUp 1s 0.3s both;}
        .hero-sub strong{color:var(--text);font-weight:500;}
        .hero-actions{display:flex;flex-direction:column;align-items:center;gap:14px;animation:fadeUp 1s 0.4s both;}
        .btn-primary{font-family:'Cabinet Grotesk',sans-serif;font-size:15px;font-weight:800;padding:16px 44px;border-radius:14px;border:none;cursor:pointer;background:linear-gradient(135deg,#6d3ef0,#9333ea);color:#fff;box-shadow:0 0 40px rgba(109,62,240,0.4),inset 0 1px 0 rgba(255,255,255,0.15);transition:all 0.25s ease;}
        .btn-primary:hover{transform:translateY(-2px);box-shadow:0 0 60px rgba(109,62,240,0.55),inset 0 1px 0 rgba(255,255,255,0.15);}
        .btn-primary:disabled{background:rgba(110,90,200,0.25);color:var(--muted);cursor:not-allowed;transform:none;box-shadow:none;}
        .error-box{background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.25);color:#fca5a5;padding:12px 20px;border-radius:10px;font-size:13px;}
        .scroll-hint{position:absolute;bottom:32px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:6px;color:var(--muted);font-size:10px;letter-spacing:2px;text-transform:uppercase;animation:fadeUp 1s 1.2s both;}
        .scroll-dot{width:20px;height:34px;border:1.5px solid rgba(130,100,240,0.35);border-radius:10px;display:flex;align-items:flex-start;justify-content:center;padding-top:5px;}
        .scroll-dot::after{content:'';width:4px;height:8px;background:var(--accent2);border-radius:2px;animation:scrollDown 2s ease-in-out infinite;}
        @keyframes scrollDown{0%,100%{transform:translateY(0);opacity:1;}60%{transform:translateY(10px);opacity:0;}}

        /* SECTIONS */
        .sec{position:relative;z-index:2;max-width:1100px;margin:0 auto;padding:72px 24px;}
        .sec-label{font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:var(--accent2);margin-bottom:20px;display:flex;align-items:center;gap:10px;}
        .sec-label::before{content:'';width:28px;height:1.5px;background:var(--accent);}

        /* PROBLEM */
        .two-col{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--border);border:1px solid var(--border);border-radius:20px;overflow:hidden;}
        @media(max-width:768px){.two-col,.iota-block{grid-template-columns:1fr!important;}}
        .panel{background:var(--surface);padding:48px;}
        .panel h2{font-family:'Cabinet Grotesk',sans-serif;font-size:28px;font-weight:900;line-height:1.2;letter-spacing:-0.5px;color:var(--text);margin-bottom:20px;}
        .panel h2 span{color:var(--danger);}
        .panel p{font-size:14.5px;color:var(--muted);line-height:1.8;margin-bottom:14px;}
        .panel p strong{color:var(--text);font-weight:500;}
        .panel h3{font-family:'Cabinet Grotesk',sans-serif;font-size:18px;font-weight:800;color:var(--text);margin-bottom:16px;}
        .stat-row{display:flex;align-items:baseline;gap:10px;margin-top:28px;padding-top:28px;border-top:1px solid var(--border);}
        .stat-num{font-family:'Cabinet Grotesk',sans-serif;font-size:52px;font-weight:900;color:var(--danger);line-height:1;}
        .stat-label{font-size:13px;color:var(--muted);line-height:1.5;max-width:160px;}
        .pillars{display:flex;flex-direction:column;gap:10px;}
        .pillar{padding:14px 18px;border:1px solid var(--border);border-radius:12px;background:rgba(120,90,230,0.04);transition:background 0.2s,border-color 0.2s;}
        .pillar:hover{background:rgba(120,90,230,0.09);border-color:var(--border2);}
        .pillar-label{font-size:9px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:var(--accent2);margin-bottom:4px;}
        .pillar p{font-size:12.5px;color:var(--muted);line-height:1.6;margin:0;}

        /* SOLUTION */
        .solution-box{background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:52px 48px;position:relative;overflow:hidden;}
        .solution-box::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--accent2),transparent);}
        .solution-box h2{font-family:'Cabinet Grotesk',sans-serif;font-size:32px;font-weight:900;letter-spacing:-0.5px;color:var(--text);margin-bottom:20px;}
        .solution-box h2 em{font-style:normal;color:var(--accent2);}
        .solution-box .body-p{font-size:15px;color:var(--muted);line-height:1.8;max-width:660px;margin-bottom:14px;}
        .sol-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-top:32px;}
        .sol-point{padding:20px;background:rgba(120,90,230,0.06);border:1px solid var(--border);border-radius:12px;}
        .sol-title{font-family:'Cabinet Grotesk',sans-serif;font-size:14px;font-weight:800;color:var(--text);margin-bottom:6px;}
        .sol-point p{font-size:12.5px;color:var(--muted);line-height:1.6;margin:0;}

        /* FEATURES */
        .feat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:1px;background:var(--border);border:1px solid var(--border);border-radius:20px;overflow:hidden;}
        .feat-card{background:var(--surface);padding:36px 32px;transition:background 0.25s;}
        .feat-card:hover{background:rgba(120,90,230,0.07);}
        .feat-icon{font-size:22px;margin-bottom:18px;display:block;transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1);}
        .feat-card:hover .feat-icon{transform:scale(1.2) rotate(-5deg);}
        .feat-title{font-family:'Cabinet Grotesk',sans-serif;font-size:15px;font-weight:800;color:var(--text);margin-bottom:10px;}
        .feat-desc{font-size:13px;color:var(--muted);line-height:1.7;}

        /* IOTA */
        .iota-block{background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:52px 48px;display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;position:relative;overflow:hidden;}
        .iota-block::after{content:'IOTA';position:absolute;right:-20px;bottom:-40px;font-family:'Cabinet Grotesk',sans-serif;font-size:180px;font-weight:900;color:rgba(120,90,230,0.04);line-height:1;pointer-events:none;user-select:none;}
        .iota-block h2{font-family:'Cabinet Grotesk',sans-serif;font-size:30px;font-weight:900;letter-spacing:-0.5px;color:var(--text);margin-bottom:16px;}
        .iota-block .iota-intro{font-size:14.5px;color:var(--muted);line-height:1.8;}
        .iota-items{display:flex;flex-direction:column;gap:14px;}
        .iota-item{padding:18px 20px;border:1px solid var(--border);border-radius:12px;background:rgba(120,90,230,0.04);transition:border-color 0.2s;}
        .iota-item:hover{border-color:var(--border2);}
        .iota-item-title{font-family:'Cabinet Grotesk',sans-serif;font-size:13px;font-weight:800;color:var(--text);margin-bottom:5px;}
        .iota-item p{font-size:12.5px;color:var(--muted);line-height:1.6;margin:0;}

        /* CTA + FOOTER */
        .cta-sec{position:relative;z-index:2;text-align:center;padding:80px 24px 100px;border-top:1px solid var(--border);}
        .cta-sec h2{font-family:'Cabinet Grotesk',sans-serif;font-size:clamp(32px,5vw,56px);font-weight:900;letter-spacing:-1.5px;color:var(--text);margin-bottom:16px;}
        .cta-sec h2 em{font-style:normal;color:var(--accent2);}
        .cta-sec .cta-sub{font-size:16px;color:var(--muted);margin-bottom:36px;}
        .footer-bar{position:relative;z-index:2;display:flex;justify-content:space-between;align-items:center;padding:22px 48px;border-top:1px solid var(--border);font-size:12px;color:var(--muted);}
        .footer-iota{display:flex;align-items:center;gap:8px;color:var(--accent2);font-weight:600;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;}
        .footer-iota::before{content:'●';font-size:8px;color:#4ade80;animation:blink 2.5s ease-in-out infinite;}

        @keyframes fadeUp{from{opacity:0;transform:translateY(24px);}to{opacity:1;transform:translateY(0);}}
      `}</style>

      <canvas ref={canvasRef} className="bg" />
      <div className="orb orb-a" />
      <div className="orb orb-b" />

      {/* NAV */}
      <nav>
        <div className="logo">
          <img src="/logoPhloxCert.png" alt="PhloxCert" />
          <span className="logo-name">PhloxCert</span>
        </div>
        <div className="nav-right">
          <span className="nav-pill">IOTA Testnet</span>
          <ConnectButton />
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-tag">Immutable Compliance Infrastructure</div>
        <h1>
          Safety is<br />
          <em>on the Tangle.</em>
        </h1>
        <p className="hero-sub">
          PhloxCert turns fire safety certifications into <strong>unalterable blockchain records</strong> —
          anchored to IOTA, verifiable by anyone, and impossible to falsify or neglect.
        </p>
        <div className="hero-actions">
          {account ? (
            <button className="btn-primary" onClick={loginWithWallet} disabled={loading}>
              {loading ? 'Verifying identity…' : 'Access with Wallet Identity →'}
            </button>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>
              Connect your IOTA wallet in the top-right to get started
            </p>
          )}
          {error && <div className="error-box">⚠ {error}</div>}
        </div>
        <div className="scroll-hint">
          <div className="scroll-dot" />
          Scroll
        </div>
      </section>

      {/* PROBLEM */}
      <div className="sec">
        <div className="sec-label">The problem</div>
        <div className="two-col">
          <div className="panel">
            <h2>A structural failure in<br /><span>fire safety monitoring</span></h2>
            <p>
              The tragedy of Crans-Montana was not an accident — it was a symptom of a systemic
              collapse in compliance monitoring. Investigations revealed the site had not undergone
              a safety inspection in over five years, with blocked exits and non-functional extinguishers.
            </p>
            <p>
              The root cause: <strong>opacity and manipulability of safety data</strong>. Traditional
              paper trails and local databases can be altered, allowing negligence to go unnoticed
              until disaster strikes. PhloxCert addresses this by turning safety into an immutable black box.
            </p>
            <div className="stat-row">
              <span className="stat-num">40</span>
              <span className="stat-label">lives lost due to preventable compliance failures</span>
            </div>
          </div>
          <div className="panel">
            <h3>Why this problem persists</h3>
            <div className="pillars">
              {pillars.map((p, i) => (
                <div className="pillar" key={i}>
                  <div className="pillar-label">{p.label}</div>
                  <p>{p.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SOLUTION */}
      <div className="sec" style={{ paddingTop: 0 }}>
        <div className="sec-label">The solution</div>
        <div className="solution-box">
          <h2>The <em>"Black Box"</em> of building safety</h2>
          <p className="body-p">
            PhloxCert leverages the IOTA Protocol to provide an unalterable architecture of trust.
            By decentralising inspection records onto the Tangle, we ensure that negligence cannot
            be hidden — every check, or deliberate lack thereof, becomes part of a permanent audit trail.
          </p>
          <p className="body-p">
            Moving from checkbox compliance to a verifiable, public record that regulators,
            insurers, and citizens can rely on — in real time.
          </p>
          <div className="sol-grid">
            <div className="sol-point">
              <div className="sol-title">Negligence cannot be hidden</div>
              <p>Every inspection (or missed one) is permanently recorded on the Tangle with a cryptographic timestamp.</p>
            </div>
            <div className="sol-point">
              <div className="sol-title">Real-time awareness</div>
              <p>Consumers verify a venue's safety status instantly via QR code — no wallet, no account required.</p>
            </div>
            <div className="sol-point">
              <div className="sol-title">Enforcement through transparency</div>
              <p>An immutable, verifiable audit trail that regulators and insurers can actually rely on.</p>
            </div>
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div className="sec" style={{ paddingTop: 0 }}>
        <div className="sec-label">Key features</div>
        <div className="feat-grid">
          {features.map((f, i) => (
            <div className="feat-card" key={i}>
              <span className="feat-icon">{f.icon}</span>
              <div className="feat-title">{f.title}</div>
              <div className="feat-desc">{f.text}</div>
            </div>
          ))}
        </div>
      </div>

      {/* IOTA */}
      <div className="sec" style={{ paddingTop: 0 }}>
        <div className="sec-label">Why IOTA</div>
        <div className="iota-block">
          <div>
            <h2>Built for high-frequency micro-notarisations</h2>
            <p className="iota-intro">
              IOTA was chosen for its ability to handle frequent small-data transactions — daily or
              monthly safety checks — with high scalability, feeless micro-transactions, and a growing
              ecosystem of enterprise-grade tooling.
            </p>
          </div>
          <div className="iota-items">
            <div className="iota-item">
              <div className="iota-item-title">IOTA Move Smart Contracts</div>
              <p>Manages the user registry and coordinates the full lifecycle of notarisation objects on-chain.</p>
            </div>
            <div className="iota-item">
              <div className="iota-item-title">IOTA Identity (DIDs)</div>
              <p>Every user and venue is identified via a Decentralised Identifier — sovereign ownership of compliance history.</p>
            </div>
            <div className="iota-item">
              <div className="iota-item-title">Locked Notarisations</div>
              <p>A cryptographic link between digital records and physical safety checks — the Tangle as a permanent data logger.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <section className="cta-sec">
        <h2>
          Start certifying.<br />
          <em>Build trust on-chain.</em>
        </h2>
        <p className="cta-sub">
          Connect your IOTA wallet and access the platform — as a business owner or certified technician.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <ConnectButton />
          {account && (
            <button className="btn-primary" onClick={loginWithWallet} disabled={loading}>
              {loading ? 'Verifying…' : 'Access with Wallet Identity →'}
            </button>
          )}
          {error && <div className="error-box">⚠ {error}</div>}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer-bar">
        <span>© 2025 PhloxCert — All rights reserved</span>
        <span className="footer-iota">Powered by IOTA</span>
      </footer>
    </>
  );
}

export default App;