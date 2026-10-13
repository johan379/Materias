import { useState } from 'react'
import { api } from '../api'

export default function Login({ onEntrar }) {
  const [modo, setModo] = useState('login')
  const [form, setForm] = useState({ nombre: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const enviar = async (e) => {
    e.preventDefault()
    setError('')
    setEnviando(true)
    try {
      const datos = modo === 'login'
        ? await api.login({ email: form.email.trim(), password: form.password })
        : await api.registro({ ...form, email: form.email.trim() })
      await onEntrar(datos)
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="pantalla-centro">
      <form className="tarjeta login" onSubmit={enviar}>
        <h1>📚 Agenda Estudiantil</h1>
        <p className="suave">Tus materias, horario y entregas en un solo lugar.</p>

        {modo === 'registro' && (
          <label>Nombre
            <input name="nombre" value={form.nombre} onChange={cambiar} required autoComplete="name" />
          </label>
        )}
        <label>Correo
          <input name="email" type="email" value={form.email} onChange={cambiar} required autoComplete="email" />
        </label>
        <label>Contraseña
          <input name="password" type="password" value={form.password} onChange={cambiar} required minLength={6}
            autoComplete={modo === 'login' ? 'current-password' : 'new-password'} />
        </label>

        {error && <div className="error">{error}</div>}

        <button className="btn btn-primario" disabled={enviando}>
          {enviando ? 'Un momento…' : modo === 'login' ? 'Entrar' : 'Crear cuenta'}
        </button>
        {enviando && <p className="suave mini">Si el servidor estaba dormido, puede tardar hasta un minuto en responder.</p>}
        <button type="button" className="btn-link" onClick={() => { setModo(modo === 'login' ? 'registro' : 'login'); setError('') }}>
          {modo === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Entra'}
        </button>
      </form>
    </div>
  )
}
