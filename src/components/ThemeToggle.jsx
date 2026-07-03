import { useTheme } from '../context/ThemeContext'

// Botão de alternar tema claro/escuro. `variant="light"` usa cores claras
// (para superfícies escuras, como o cabeçalho navy e a tela de login).
export default function ThemeToggle({ variant = 'light', size = 36 }) {
  const { isDark, toggle } = useTheme()

  const light = variant === 'light'
  const style = light
    ? { background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.3)', color: '#fff' }
    : { background: 'var(--sur2)', border: '1px solid var(--brd)', color: 'var(--txt)' }

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      title={isDark ? 'Tema claro' : 'Tema escuro'}
      style={{
        width: size, height: size, borderRadius: 9, cursor: 'pointer', flexShrink: 0,
        fontSize: Math.round(size * 0.44), lineHeight: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        ...style,
      }}
    >
      {isDark ? '☀' : '☾'}
    </button>
  )
}
