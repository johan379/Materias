import { DIAS, aMinutos, diaLunes, horaCorta } from '../utils'

const ALTO_HORA = 56 // px por hora

export default function Horario({ materias }) {
  const clases = materias.flatMap((m) => m.horarios.map((h) => ({ ...h, materia: m })))

  if (clases.length === 0) {
    return (
      <div className="tarjeta vacio">
        <h2>Tu horario está vacío</h2>
        <p className="suave">Ve a la pestaña <strong>Materias</strong>, crea una materia y agrégale los días y horas de clase.</p>
      </div>
    )
  }

  const hayFinDeSemana = clases.some((c) => c.dia_semana >= 5)
  const diasVisibles = hayFinDeSemana ? [0, 1, 2, 3, 4, 5, 6] : [0, 1, 2, 3, 4]
  const inicio = Math.floor(Math.min(...clases.map((c) => aMinutos(c.hora_inicio))) / 60)
  const fin = Math.ceil(Math.max(...clases.map((c) => aMinutos(c.hora_fin))) / 60)
  const horas = Array.from({ length: fin - inicio }, (_, i) => inicio + i)
  const hoy = diaLunes(new Date())

  return (
    <div className="tarjeta">
      <h2>Horario semanal</h2>
      <div className="horario-scroll">
        <div className="horario" style={{ gridTemplateColumns: `56px repeat(${diasVisibles.length}, minmax(110px, 1fr))` }}>
          <div />
          {diasVisibles.map((d) => <div key={d} className={`horario-dia ${d === hoy ? 'hoy' : ''}`}>{DIAS[d]}</div>)}

          <div className="horario-horas" style={{ height: horas.length * ALTO_HORA }}>
            {horas.map((h) => <div key={h} style={{ height: ALTO_HORA }}>{String(h).padStart(2, '0')}:00</div>)}
          </div>

          {diasVisibles.map((d) => (
            <div key={d} className="horario-columna" style={{ height: horas.length * ALTO_HORA, backgroundSize: `100% ${ALTO_HORA}px` }}>
              {clases.filter((c) => c.dia_semana === d).map((c) => {
                const top = ((aMinutos(c.hora_inicio) - inicio * 60) / 60) * ALTO_HORA
                const alto = ((aMinutos(c.hora_fin) - aMinutos(c.hora_inicio)) / 60) * ALTO_HORA
                return (
                  <div key={c.id} className="bloque-clase" style={{ top, height: alto, background: c.materia.color }}>
                    <strong>{c.materia.nombre}</strong>
                    <span>{horaCorta(c.hora_inicio)}–{horaCorta(c.hora_fin)}</span>
                    {c.salon && <span>{c.salon}</span>}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
