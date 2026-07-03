import { useAuth } from '../context/AuthContext'
import ThemeToggle from '../components/ThemeToggle'
import EMBLEM from '../assets/emblem-peladeiros.png'

export default function LoginPage() {
  const { signInWithGoogle } = useAuth()

  return (
    <div style={{
      minHeight: '100vh', position: 'relative',
      background: 'radial-gradient(120% 90% at 50% 0%, var(--navy) 0%, var(--navy2) 60%, #081a35 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px', overflow: 'hidden',
    }}>
      {/* Alternador de tema no canto */}
      <div style={{ position: 'absolute', top: 16, right: 16 }}>
        <ThemeToggle variant="light" size={38} />
      </div>

      {/* Brilho sutil ao fundo, atrás do emblema */}
      <div aria-hidden style={{
        position: 'absolute', top: '18%', width: 380, height: 380, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(201,168,76,.18) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 360 }}>
        <img src={EMBLEM} alt="Peladeiros Diferenciados" style={{
          width: 'clamp(160px, 52vw, 220px)', height: 'auto', objectFit: 'contain',
          filter: 'drop-shadow(0 12px 34px rgba(0,0,0,.45))',
        }} />

        <h1 style={{
          textAlign: 'center', margin: '20px 0 0', lineHeight: 1.02,
          fontSize: 'clamp(30px, 8.5vw, 44px)', fontWeight: 900, letterSpacing: '.5px',
          textShadow: '0 2px 14px rgba(0,0,0,.35)',
        }}>
          <span style={{ color: '#fff', display: 'block' }}>PELADEIROS</span>
          <span style={{ color: 'var(--gold)', display: 'block' }}>DIFERENCIADOS</span>
        </h1>

        <p style={{ color: 'rgba(255,255,255,.72)', fontSize: 14, margin: '14px 0 0', textAlign: 'center' }}>
          Gerencie suas peladas, scouts e rankings
        </p>

        <button onClick={signInWithGoogle} style={{
          marginTop: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          background: '#fff', color: '#1f2937', border: 'none', borderRadius: 14,
          padding: '14px 22px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
          width: '100%', boxShadow: '0 8px 24px rgba(0,0,0,.3)',
        }}>
          <GoogleIcon />
          Entrar com Google
        </button>

        <p style={{ color: 'rgba(255,255,255,.5)', fontSize: 11, marginTop: 22, textAlign: 'center' }}>
          Ao entrar, você cria sua conta de administrador e pode gerenciar quantas peladas quiser.
        </p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}
