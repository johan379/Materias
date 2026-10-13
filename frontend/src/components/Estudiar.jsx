import { useEffect, useRef, useState } from 'react'
import { api } from '../api'

const ATAJOS = [
  { texto: '📖 Explícame el tema', mensaje: 'Explícame el tema desde lo básico, con ejemplos.' },
  { texto: '❓ Hazme preguntas', mensaje: 'Hazme preguntas tipo examen, una a la vez, y corrígeme cuando responda.' },
  { texto: '📝 Resume mis apuntes', mensaje: 'Haz un resumen con los puntos más importantes para la evaluación.' },
  { texto: '🗓️ Plan de estudio', mensaje: 'Ármame un plan de estudio para llegar preparado a la evaluación.' },
]

// Convierte **negritas** del asistente en <strong> sin usar HTML crudo
function Texto({ contenido }) {
  return contenido.split(/(\*\*[^*]+\*\*)/g).map((parte, i) =>
    parte.startsWith('**') && parte.endsWith('**') ? <strong key={i}>{parte.slice(2, -2)}</strong> : parte,
  )
}

export default function Estudiar({ materias }) {
  const [materiaId, setMateriaId] = useState('')
  const [tema, setTema] = useState('')
  const [apuntes, setApuntes] = useState('')
  const [verApuntes, setVerApuntes] = useState(false)
  const [modo, setModo] = useState('chat')

  const contexto = () => ({
    materia_id: materiaId === '' ? null : Number(materiaId),
    tema: tema.trim() || null,
    apuntes: apuntes.trim() || null,
  })
  const materia = materias.find((m) => String(m.id) === materiaId)

  return (
    <div className="estudiar">
      <div className="tarjeta estudiar-panel">
        <h2>🤖 Estudiar con IA</h2>
        <p className="suave">Tu tutor para preparar las evaluaciones. Elige la materia y el tema; si pegas tus apuntes, se basa en ellos.</p>
        <label className="campo">Materia
          <select value={materiaId} onChange={(e) => setMateriaId(e.target.value)}>
            <option value="">General (sin materia)</option>
            {materias.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
        </label>
        <label className="campo">Tema de la evaluación
          <input value={tema} onChange={(e) => setTema(e.target.value)} maxLength={200} placeholder="Ej: Fracciones, Revolución Francesa…" />
        </label>
        <button className="btn-link" onClick={() => setVerApuntes(!verApuntes)}>
          {verApuntes ? '▾' : '▸'} Mis apuntes {apuntes.trim() && '✓'}
        </button>
        {verApuntes && (
          <>
            <textarea rows={8} value={apuntes} onChange={(e) => setApuntes(e.target.value)} maxLength={8000}
              placeholder="Pega aquí lo que viste en clase…" />
            <div className="suave mini">{apuntes.length}/8000</div>
          </>
        )}
        <div className="selector-modo">
          <button className={modo === 'chat' ? 'activa' : ''} onClick={() => setModo('chat')}>💬 Tutor</button>
          <button className={modo === 'quiz' ? 'activa' : ''} onClick={() => setModo('quiz')}>🎯 Quiz</button>
        </div>
      </div>

      <div className="tarjeta estudiar-principal" style={{ borderTop: `5px solid ${materia?.color || 'var(--primario)'}` }}>
        <div hidden={modo !== 'chat'}><Chat contexto={contexto} /></div>
        <div hidden={modo !== 'quiz'}><Quiz contexto={contexto} /></div>
      </div>
    </div>
  )
}

function Chat({ contexto }) {
  const [mensajes, setMensajes] = useState([])
  const [texto, setTexto] = useState('')
  const [pensando, setPensando] = useState(false)
  const [error, setError] = useState('')
  const finRef = useRef(null)

  useEffect(() => { finRef.current?.scrollIntoView({ block: 'nearest' }) }, [mensajes, pensando])

  const enviar = async (contenido) => {
    contenido = contenido.trim()
    if (!contenido || pensando) return
    const nuevos = [...mensajes, { rol: 'user', contenido }]
    setMensajes(nuevos)
    setTexto('')
    setError('')
    setPensando(true)
    try {
      const { respuesta } = await api.chatIA({ ...contexto(), mensajes: nuevos })
      setMensajes([...nuevos, { rol: 'assistant', contenido: respuesta }])
    } catch (e) {
      setError(e.message)
      setMensajes(mensajes)
      setTexto(contenido)
    } finally {
      setPensando(false)
    }
  }

  return (
    <div className="chat">
      <div className="cabecera-seccion">
        <h3 className="espacio">Pregúntale a tu tutor</h3>
        {mensajes.length > 0 && <button className="btn btn-pequeno" onClick={() => setMensajes([])}>Nueva conversación</button>}
      </div>
      <div className="chat-mensajes">
        {mensajes.length === 0 && (
          <div className="atajos">
            {ATAJOS.map((a) => <button key={a.texto} className="btn" onClick={() => enviar(a.mensaje)}>{a.texto}</button>)}
          </div>
        )}
        {mensajes.map((m, i) => (
          <div key={i} className={`burbuja ${m.rol === 'user' ? 'mia' : ''}`}><Texto contenido={m.contenido} /></div>
        ))}
        {pensando && <div className="burbuja pensando">Pensando…</div>}
        <div ref={finRef} />
      </div>
      {error && <div className="error">{error}</div>}
      <form className="chat-entrada" onSubmit={(e) => { e.preventDefault(); enviar(texto) }}>
        <textarea rows={2} value={texto} maxLength={4000} placeholder="Escribe tu pregunta o tu respuesta…"
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(texto) } }} />
        <button className="btn btn-primario" disabled={pensando || !texto.trim()}>Enviar</button>
      </form>
    </div>
  )
}

function Quiz({ contexto }) {
  const [cantidad, setCantidad] = useState(5)
  const [preguntas, setPreguntas] = useState([])
  const [respuestas, setRespuestas] = useState({})
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  const generar = async () => {
    setCargando(true)
    setError('')
    try {
      const datos = await api.quizIA({ ...contexto(), cantidad })
      setPreguntas(datos.preguntas)
      setRespuestas({})
    } catch (e) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }

  const respondidas = Object.keys(respuestas).length
  const aciertos = preguntas.filter((p, i) => respuestas[i] === p.correcta).length

  return (
    <div>
      <div className="cabecera-seccion">
        <h3 className="espacio">Quiz de práctica</h3>
        <select value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))}>
          {[3, 5, 8, 10].map((n) => <option key={n} value={n}>{n} preguntas</option>)}
        </select>
        <button className="btn btn-primario" onClick={generar} disabled={cargando}>
          {cargando ? 'Armando quiz…' : preguntas.length ? 'Otro quiz' : 'Generar quiz'}
        </button>
      </div>
      {error && <div className="error">{error}</div>}
      {preguntas.length === 0 && !cargando && (
        <p className="suave">Elige la materia y escribe el tema (o pega tus apuntes) y genera preguntas como las del examen.</p>
      )}

      {preguntas.map((p, i) => {
        const elegida = respuestas[i]
        return (
          <div key={i} className="pregunta">
            <strong>{i + 1}. {p.pregunta}</strong>
            <div className="opciones">
              {p.opciones.map((o, j) => {
                let clase = ''
                if (elegida !== undefined) {
                  if (j === p.correcta) clase = 'correcta'
                  else if (j === elegida) clase = 'incorrecta'
                }
                return (
                  <button key={j} className={`opcion ${clase}`} disabled={elegida !== undefined}
                    onClick={() => setRespuestas({ ...respuestas, [i]: j })}>
                    {String.fromCharCode(65 + j)}. {o}
                  </button>
                )
              })}
            </div>
            {elegida !== undefined && (
              <div className="nota">{elegida === p.correcta ? '✅ ¡Correcto! ' : '❌ '}{p.explicacion}</div>
            )}
          </div>
        )
      })}

      {preguntas.length > 0 && respondidas === preguntas.length && (
        <div className="resultado-quiz">
          Sacaste <strong>{aciertos} de {preguntas.length}</strong>
          {aciertos === preguntas.length ? ' 🏆 ¡Perfecto!' : aciertos / preguntas.length >= 0.6 ? ' 👍 ¡Vas bien!' : ' 💪 Repasa con el tutor y vuelve a intentarlo.'}
        </div>
      )}
    </div>
  )
}
