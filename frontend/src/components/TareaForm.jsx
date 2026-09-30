import { useState } from 'react'
import { OPCIONES_RECORDATORIO, aInputLocal } from '../utils'

export default function TareaForm({ tarea, materias, onGuardar, onBorrar, onCancelar }) {
  const [form, setForm] = useState({
    titulo: tarea.titulo || '',
    descripcion: tarea.descripcion || '',
    materia_id: tarea.materia_id ?? '',
    fecha_entrega: aInputLocal(tarea.fecha_entrega),
    recordatorio_minutos: tarea.recordatorio_minutos ?? '',
    completada: tarea.completada || false,
  })
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value })

  const enviar = async (e) => {
    e.preventDefault()
    setError('')
    setEnviando(true)
    try {
      await onGuardar({
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim() || null,
        materia_id: form.materia_id === '' ? null : Number(form.materia_id),
        fecha_entrega: new Date(form.fecha_entrega).toISOString(),
        recordatorio_minutos: form.recordatorio_minutos === '' ? null : Number(form.recordatorio_minutos),
        completada: form.completada,
      })
    } catch (err) {
      setError(err.message)
      setEnviando(false)
    }
  }

  return (
    <form className="formulario" onSubmit={enviar}>
      <label>Título
        <input value={form.titulo} onChange={cambiar('titulo')} required maxLength={200} autoFocus placeholder="Ej: Taller de derivadas" />
      </label>
      <label>Materia
        <select value={form.materia_id} onChange={cambiar('materia_id')}>
          <option value="">Sin materia</option>
          {materias.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
        </select>
      </label>
      <div className="fila">
        <label>Fecha y hora de entrega
          <input type="datetime-local" value={form.fecha_entrega} onChange={cambiar('fecha_entrega')} required />
        </label>
        <label>Recordatorio
          <select value={form.recordatorio_minutos} onChange={cambiar('recordatorio_minutos')}>
            {OPCIONES_RECORDATORIO.map((o) => <option key={o.texto} value={o.valor}>{o.texto}</option>)}
          </select>
        </label>
      </div>
      <label>Notas
        <textarea value={form.descripcion} onChange={cambiar('descripcion')} rows={3} placeholder="Qué hay que entregar, páginas, formato…" />
      </label>
      {tarea.id && (
        <label className="check">
          <input type="checkbox" checked={form.completada} onChange={(e) => setForm({ ...form, completada: e.target.checked })} />
          Entregada
        </label>
      )}

      {error && <div className="error">{error}</div>}

      <div className="acciones">
        {onBorrar && <button type="button" className="btn btn-peligro" onClick={onBorrar}>Borrar</button>}
        <span className="espacio" />
        <button type="button" className="btn" onClick={onCancelar}>Cancelar</button>
        <button className="btn btn-primario" disabled={enviando}>{enviando ? 'Guardando…' : 'Guardar'}</button>
      </div>
    </form>
  )
}
