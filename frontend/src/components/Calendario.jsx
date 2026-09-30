import { useMemo, useState } from 'react'
import { DIAS_CORTOS, MESES, diaLunes, fechaLarga, hora, horaCorta, mismoDia } from '../utils'

export default function Calendario({ materias, tareas, onEditarTarea, onNuevaTarea, onAlternar }) {
  const hoy = new Date()
  const [mes, setMes] = useState(new Date(hoy.getFullYear(), hoy.getMonth(), 1))
  const [seleccionado, setSeleccionado] = useState(hoy)

  const materiaDe = (id) => materias.find((m) => m.id === id)

  // 6 semanas empezando en el lunes anterior (o igual) al día 1
  const dias = useMemo(() => {
    const inicio = new Date(mes)
    inicio.setDate(1 - diaLunes(mes))
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(inicio)
      d.setDate(inicio.getDate() + i)
      return d
    })
  }, [mes])

  const tareasDelDia = (d) => tareas.filter((t) => mismoDia(new Date(t.fecha_entrega), d))

  const clasesDelDia = (d) =>
    materias
      .flatMap((m) => m.horarios.filter((h) => h.dia_semana === diaLunes(d)).map((h) => ({ ...h, materia: m })))
      .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))

  const moverMes = (n) => setMes(new Date(mes.getFullYear(), mes.getMonth() + n, 1))

  const tareasSel = tareasDelDia(seleccionado)
  const clasesSel = clasesDelDia(seleccionado)

  return (
    <div className="calendario-layout">
      <section className="tarjeta">
        <div className="cal-cabecera">
          <button className="btn" onClick={() => moverMes(-1)}>‹</button>
          <h2>{MESES[mes.getMonth()]} {mes.getFullYear()}</h2>
          <button className="btn" onClick={() => moverMes(1)}>›</button>
          <button className="btn btn-pequeno" onClick={() => { setMes(new Date(hoy.getFullYear(), hoy.getMonth(), 1)); setSeleccionado(hoy) }}>Hoy</button>
        </div>

        <div className="cal-grid">
          {DIAS_CORTOS.map((d) => <div key={d} className="cal-dia-nombre">{d}</div>)}
          {dias.map((d) => {
            const ts = tareasDelDia(d)
            const clases = clasesDelDia(d)
            const clasesCss = [
              'cal-celda',
              d.getMonth() !== mes.getMonth() && 'fuera',
              mismoDia(d, hoy) && 'hoy',
              mismoDia(d, seleccionado) && 'seleccionada',
            ].filter(Boolean).join(' ')
            return (
              <button key={d.toISOString()} className={clasesCss} onClick={() => setSeleccionado(d)} onDoubleClick={() => onNuevaTarea(d)}>
                <span className="cal-numero">{d.getDate()}</span>
                <div className="cal-puntos">
                  {clases.slice(0, 5).map((c) => <span key={c.id} className="punto" style={{ background: c.materia.color }} title={c.materia.nombre} />)}
                </div>
                {ts.slice(0, 3).map((t) => (
                  <span key={t.id} className={`cal-tarea ${t.completada ? 'hecha' : ''}`}
                    style={{ background: materiaDe(t.materia_id)?.color || '#64748b' }}>
                    {t.titulo}
                  </span>
                ))}
                {ts.length > 3 && <span className="suave mini">+{ts.length - 3} más</span>}
              </button>
            )
          })}
        </div>
        <p className="suave mini">Los puntos de color son tus clases de ese día. Doble clic en un día para agregar una tarea.</p>
      </section>

      <aside className="tarjeta detalle-dia">
        <h3 className="capital">{fechaLarga(seleccionado)}</h3>

        <h4>Clases</h4>
        {clasesSel.length === 0 && <p className="suave">No hay clases este día.</p>}
        {clasesSel.map((c) => (
          <div key={c.id} className="item" style={{ borderLeftColor: c.materia.color }}>
            <strong>{c.materia.nombre}</strong>
            <div className="suave">{horaCorta(c.hora_inicio)} – {horaCorta(c.hora_fin)}{c.salon ? ` · ${c.salon}` : ''}</div>
          </div>
        ))}

        <h4>Entregas</h4>
        {tareasSel.length === 0 && <p className="suave">Nada para entregar.</p>}
        {tareasSel.map((t) => {
          const m = materiaDe(t.materia_id)
          return (
            <div key={t.id} className={`item item-tarea ${t.completada ? 'hecha' : ''}`} style={{ borderLeftColor: m?.color || '#64748b' }}>
              <input type="checkbox" checked={t.completada} onChange={() => onAlternar(t)} title="Marcar como entregada" />
              <button className="item-cuerpo" onClick={() => onEditarTarea(t)}>
                <strong>{t.titulo}</strong>
                <div className="suave">{m ? `${m.nombre} · ` : ''}{hora(t.fecha_entrega)}</div>
              </button>
            </div>
          )
        })}
        <button className="btn btn-primario ancho" onClick={() => onNuevaTarea(seleccionado)}>+ Agregar tarea este día</button>
      </aside>
    </div>
  )
}
