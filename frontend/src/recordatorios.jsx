import { useEffect, useRef, useState } from 'react'
import { hora } from './utils'

const CLAVE = 'agenda_recordatorios_vistos'

function leerVistos() {
  try { return new Set(JSON.parse(localStorage.getItem(CLAVE) || '[]')) } catch { return new Set() }
}

function guardarVistos(vistos) {
  try { localStorage.setItem(CLAVE, JSON.stringify([...vistos].slice(-500))) } catch { /* sin almacenamiento */ }
}

// Revisa cada 30 s si alguna tarea llegó a su hora de recordatorio y avisa
// con una notificación del navegador y un aviso dentro de la app.
export function useRecordatorios(tareas, materias) {
  const [avisos, setAvisos] = useState([])
  const [permiso, setPermiso] = useState(() => ('Notification' in window ? Notification.permission : 'no-soportado'))
  const vistos = useRef(leerVistos())

  useEffect(() => {
    const revisar = () => {
      const ahora = Date.now()
      const nuevos = []
      for (const t of tareas) {
        if (t.completada || t.recordatorio_minutos === null || t.recordatorio_minutos === undefined) continue
        const entrega = new Date(t.fecha_entrega).getTime()
        const aviso = entrega - t.recordatorio_minutos * 60000
        const clave = `${t.id}|${t.fecha_entrega}|${t.recordatorio_minutos}`
        if (ahora >= aviso && ahora <= entrega + 3600000 && !vistos.current.has(clave)) {
          vistos.current.add(clave)
          nuevos.push(t)
        }
      }
      if (!nuevos.length) return
      guardarVistos(vistos.current)
      setAvisos((a) => [...a, ...nuevos])
      if ('Notification' in window && Notification.permission === 'granted') {
        for (const t of nuevos) {
          const materia = materias.find((m) => m.id === t.materia_id)
          new Notification(`⏰ ${t.titulo}`, {
            body: `${materia ? materia.nombre + ' · ' : ''}Entrega ${new Date(t.fecha_entrega).toLocaleDateString('es-CO')} a las ${hora(t.fecha_entrega)}`,
            tag: `tarea-${t.id}`,
          })
        }
      }
    }
    revisar()
    const intervalo = setInterval(revisar, 30000)
    return () => clearInterval(intervalo)
  }, [tareas, materias])

  const pedirPermiso = async () => setPermiso(await Notification.requestPermission())

  return (
    <>
      {permiso === 'default' && (
        <div className="banner">
          🔔 Activa las notificaciones para recibir los recordatorios de tus entregas.
          <button className="btn btn-primario btn-pequeno" onClick={pedirPermiso}>Activar</button>
        </div>
      )}
      {avisos.length > 0 && (
        <div className="avisos">
          {avisos.map((t) => {
            const materia = materias.find((m) => m.id === t.materia_id)
            return (
              <div key={t.id} className="aviso" style={{ borderLeftColor: materia?.color || '#64748b' }}>
                <div>
                  <strong>⏰ {t.titulo}</strong>
                  <div className="suave">
                    {materia ? `${materia.nombre} · ` : ''}entrega {new Date(t.fecha_entrega).toLocaleDateString('es-CO')} {hora(t.fecha_entrega)}
                  </div>
                </div>
                <button className="btn-link" onClick={() => setAvisos((a) => a.filter((x) => x.id !== t.id))}>✕</button>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
