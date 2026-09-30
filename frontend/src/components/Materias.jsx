import { useState } from 'react'
import { api } from '../api'
import { COLORES, DIAS, horaCorta } from '../utils'
import Modal from './Modal'

const HORARIO_VACIO = { dia_semana: 0, hora_inicio: '07:00', hora_fin: '09:00', salon: '' }

function MateriaForm({ materia, onGuardado, onCancelar }) {
  const [form, setForm] = useState({
    nombre: materia?.nombre || '',
    color: materia?.color || COLORES[5],
    profesor: materia?.profesor || '',
    horarios: materia?.horarios.map((h) => ({ ...h, hora_inicio: horaCorta(h.hora_inicio), hora_fin: horaCorta(h.hora_fin), salon: h.salon || '' })) || [],
  })
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const cambiarHorario = (i, campo, valor) =>
    setForm({ ...form, horarios: form.horarios.map((h, j) => (j === i ? { ...h, [campo]: valor } : h)) })

  const enviar = async (e) => {
    e.preventDefault()
    setError('')
    setEnviando(true)
    const datos = {
      nombre: form.nombre.trim(),
      color: form.color,
      profesor: form.profesor.trim() || null,
      horarios: form.horarios.map((h) => ({
        dia_semana: Number(h.dia_semana), hora_inicio: h.hora_inicio, hora_fin: h.hora_fin, salon: h.salon.trim() || null,
      })),
    }
    try {
      if (materia) await api.editarMateria(materia.id, datos)
      else await api.crearMateria(datos)
      await onGuardado()
    } catch (err) {
      setError(err.message)
      setEnviando(false)
    }
  }

  return (
    <form className="formulario" onSubmit={enviar}>
      <label>Nombre de la materia
        <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required maxLength={120} autoFocus placeholder="Ej: Cálculo I" />
      </label>
      <label>Profesor (opcional)
        <input value={form.profesor} onChange={(e) => setForm({ ...form, profesor: e.target.value })} maxLength={120} />
      </label>

      <div className="campo">
        <span>Color</span>
        <div className="paleta">
          {COLORES.map((c) => (
            <button type="button" key={c} className={`muestra ${form.color === c ? 'elegida' : ''}`} style={{ background: c }}
              onClick={() => setForm({ ...form, color: c })} aria-label={`Color ${c}`} />
          ))}
          <label className="muestra personalizada" title="Otro color" style={{ background: COLORES.includes(form.color) ? undefined : form.color }}>
            <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
            {COLORES.includes(form.color) && '+'}
          </label>
        </div>
      </div>

      <div className="campo">
        <span>Horario de clases</span>
        {form.horarios.length === 0 && <p className="suave mini">Agrega los días y horas en que ves esta materia.</p>}
        {form.horarios.map((h, i) => (
          <div key={i} className="fila-horario">
            <select value={h.dia_semana} onChange={(e) => cambiarHorario(i, 'dia_semana', e.target.value)}>
              {DIAS.map((d, n) => <option key={d} value={n}>{d}</option>)}
            </select>
            <input type="time" value={h.hora_inicio} onChange={(e) => cambiarHorario(i, 'hora_inicio', e.target.value)} required />
            <span>a</span>
            <input type="time" value={h.hora_fin} onChange={(e) => cambiarHorario(i, 'hora_fin', e.target.value)} required />
            <input placeholder="Salón" value={h.salon} onChange={(e) => cambiarHorario(i, 'salon', e.target.value)} maxLength={60} />
            <button type="button" className="btn-link" onClick={() => setForm({ ...form, horarios: form.horarios.filter((_, j) => j !== i) })} aria-label="Quitar">✕</button>
          </div>
        ))}
        <button type="button" className="btn btn-pequeno" onClick={() => setForm({ ...form, horarios: [...form.horarios, { ...HORARIO_VACIO }] })}>+ Agregar clase</button>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="acciones">
        <span className="espacio" />
        <button type="button" className="btn" onClick={onCancelar}>Cancelar</button>
        <button className="btn btn-primario" disabled={enviando}>{enviando ? 'Guardando…' : 'Guardar'}</button>
      </div>
    </form>
  )
}

export default function Materias({ materias, tareas, onCambio }) {
  const [editando, setEditando] = useState(null) // null | 'nueva' | materia

  const borrar = async (m) => {
    if (!confirm(`¿Borrar "${m.nombre}"? Sus clases se borran y sus tareas quedan sin materia.`)) return
    await api.borrarMateria(m.id)
    await onCambio()
  }

  return (
    <div className="tarjeta">
      <div className="cabecera-seccion">
        <h2>Mis materias</h2>
        <button className="btn btn-primario" onClick={() => setEditando('nueva')}>+ Nueva materia</button>
      </div>

      {materias.length === 0 && <p className="suave">Todavía no tienes materias. Crea la primera y elige su color.</p>}

      <div className="materias-grid">
        {materias.map((m) => {
          const pendientes = tareas.filter((t) => t.materia_id === m.id && !t.completada).length
          return (
            <div key={m.id} className="materia" style={{ borderTopColor: m.color }}>
              <div className="materia-titulo">
                <span className="punto grande" style={{ background: m.color }} />
                <strong>{m.nombre}</strong>
              </div>
              {m.profesor && <div className="suave">👤 {m.profesor}</div>}
              <ul className="lista-horario">
                {m.horarios.map((h) => (
                  <li key={h.id}>{DIAS[h.dia_semana]} {horaCorta(h.hora_inicio)}–{horaCorta(h.hora_fin)}{h.salon ? ` · ${h.salon}` : ''}</li>
                ))}
                {m.horarios.length === 0 && <li className="suave">Sin horario</li>}
              </ul>
              <div className="suave mini">{pendientes} tarea{pendientes === 1 ? '' : 's'} pendiente{pendientes === 1 ? '' : 's'}</div>
              <div className="acciones">
                <button className="btn btn-pequeno" onClick={() => setEditando(m)}>Editar</button>
                <button className="btn btn-pequeno btn-peligro" onClick={() => borrar(m)}>Borrar</button>
              </div>
            </div>
          )
        })}
      </div>

      {editando && (
        <Modal titulo={editando === 'nueva' ? 'Nueva materia' : 'Editar materia'} onCerrar={() => setEditando(null)}>
          <MateriaForm
            materia={editando === 'nueva' ? null : editando}
            onGuardado={async () => { await onCambio(); setEditando(null) }}
            onCancelar={() => setEditando(null)}
          />
        </Modal>
      )}
    </div>
  )
}
