import { useState } from 'react'
import { fechaLarga, hora, tiempoRestante } from '../utils'

export default function Tareas({ materias, tareas, onEditarTarea, onNuevaTarea, onAlternar }) {
  const [filtro, setFiltro] = useState('')
  const [verHechas, setVerHechas] = useState(false)

  const materiaDe = (id) => materias.find((m) => m.id === id)
  const filtradas = tareas.filter((t) => filtro === '' || String(t.materia_id) === filtro)
  const pendientes = filtradas.filter((t) => !t.completada)
  const hechas = filtradas.filter((t) => t.completada).reverse()

  const fila = (t) => {
    const m = materiaDe(t.materia_id)
    const vencida = !t.completada && new Date(t.fecha_entrega) < new Date()
    return (
      <div key={t.id} className={`item item-tarea ${t.completada ? 'hecha' : ''}`} style={{ borderLeftColor: m?.color || '#64748b' }}>
        <input type="checkbox" checked={t.completada} onChange={() => onAlternar(t)} title="Marcar como entregada" />
        <button className="item-cuerpo" onClick={() => onEditarTarea(t)}>
          <strong>{t.titulo}</strong>
          <div className="suave">
            {m && <span className="etiqueta" style={{ background: m.color }}>{m.nombre}</span>}{' '}
            <span className="capital">{fechaLarga(t.fecha_entrega)}</span>, {hora(t.fecha_entrega)}
            {t.recordatorio_minutos !== null && ' · 🔔'}
          </div>
          {t.descripcion && <div className="nota">{t.descripcion}</div>}
        </button>
        {!t.completada && <span className={`insignia ${vencida ? 'roja' : ''}`}>{tiempoRestante(t.fecha_entrega)}</span>}
      </div>
    )
  }

  return (
    <div className="tarjeta">
      <div className="cabecera-seccion">
        <h2>Tareas y entregas</h2>
        <select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
          <option value="">Todas las materias</option>
          {materias.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
        </select>
        <button className="btn btn-primario" onClick={() => onNuevaTarea()}>+ Nueva tarea</button>
      </div>

      <h4>Pendientes ({pendientes.length})</h4>
      {pendientes.length === 0 && <p className="suave">¡Estás al día! 🎉</p>}
      {pendientes.map(fila)}

      <button className="btn-link" onClick={() => setVerHechas(!verHechas)}>
        {verHechas ? '▾' : '▸'} Entregadas ({hechas.length})
      </button>
      {verHechas && hechas.map(fila)}
    </div>
  )
}
