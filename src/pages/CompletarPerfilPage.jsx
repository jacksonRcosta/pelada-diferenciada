import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'

export default function CompletarPerfilPage() {
  const { user, profile, refreshProfile, signOut } = useAuth()
  const [nome, setNome] = useState(profile?.nome_completo || user?.user_metadata?.full_name || '')
  const [telefone, setTelefone] = useState(profile?.telefone || '')
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')

  async function salvar() {
    setErro('')
    if (!nome.trim()) return setErro('Informe seu nome completo.')
    if (!telefone.trim()) return setErro('Informe seu telefone.')
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ nome_completo: nome.trim(), telefone: telefone.trim() })
      .eq('id', user.id)
    setSaving(false)
    if (error) return setErro('Erro ao salvar: ' + error.message)
    await refreshProfile()
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(160deg,var(--navy),var(--navy2))',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{ background: 'var(--sur)', borderRadius: 18, padding: 24, width: '100%', maxWidth: 400, boxShadow: '0 12px 40px var(--shadow)' }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 900, color: 'var(--navy)' }}>Complete seu cadastro</h2>
        <p style={{ margin: '0 0 18px', fontSize: 13, color: 'var(--t3)' }}>Precisamos de mais alguns dados para criar sua conta de administrador.</p>

        <label style={labelStyle}>Nome completo</label>
        <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome completo" style={inputStyle} />

        <label style={labelStyle}>E-mail</label>
        <input value={user?.email || ''} disabled style={{ ...inputStyle, background: 'var(--sur3)', color: 'var(--t3)' }} />

        <label style={labelStyle}>Telefone / WhatsApp</label>
        <input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(00) 00000-0000" style={inputStyle} />

        {erro && <div style={{ color: '#A32D2D', fontSize: 12, fontWeight: 600, marginBottom: 10 }}>{erro}</div>}

        <button onClick={salvar} disabled={saving} style={{
          width: '100%', background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: 12,
          padding: '13px', fontSize: 15, fontWeight: 800, cursor: 'pointer', opacity: saving ? .6 : 1,
        }}>{saving ? 'Salvando...' : 'Salvar e continuar'}</button>

        <button onClick={signOut} style={{
          width: '100%', background: 'transparent', color: 'var(--t3)', border: 'none',
          padding: '10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginTop: 6,
        }}>Sair</button>
      </div>
    </div>
  )
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--txt)', margin: '10px 0 4px' }
const inputStyle = {
  width: '100%', boxSizing: 'border-box', padding: '11px 12px', borderRadius: 10,
  border: '1px solid var(--brd)', fontSize: 14, marginBottom: 4,
}
