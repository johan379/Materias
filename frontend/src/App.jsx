import { useCallback, useEffect, useState } from 'react'
import { api, sesion } from './api'
import Login from './components/Login'
import Calendario from './components/Calendario'
import Horario from './components/Horario'
import Tareas from './components/Tareas'
import Materias from './components/Materias'
import Estudiar from './components/Estudiar'
import TareaForm from './components/TareaForm'
import Modal from './components/Modal'
import { useRecordatorios } from './recordatorios'

const PESTANAS = [
  { id: 'calendario', texto: 'Calendario', icono: '📅' },
  { id: 'horario', texto: 'Horario', icono: '🕒' },
  { id: 'tareas', texto: 'Tareas', icono: '✅' },
  { id: 'materias', texto: 'Materias', icono: '📚' },
  { id: 'estudiar', texto: 'Estudiar con IA', icono: '🤖' },
]

export default function App() {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(Boolean(sesion.token()))
  const [errorConexion, setErrorConexion] = useState('')
  const [pestana, setPestana] = useState('calendario')
  const [materias, setMaterias] = useState([])
  const [tareas, setTareas] = useState([])
  const [tareaEditando, setTareaEditando] = useState(null) // objeto tarea o { fecha_entrega } para nueva

  const recargar = useCallback(async () => {
    const [m, t] = await Promise.all([api.materias(), api.tareas()])
    setMaterias(m)
    setTareas(t)
  }, [])

  useEffect(() => {
    if (!sesion.token()) return
    api.yo()
      .then(async (u) => { setUsuario(u); await recargar() })
      // Si falla por conexión, la sesión se conserva (solo un 401 la cierra, eso lo hace api.js)
      .catch((e) => setErrorConexion(e.message))
      .finally(() => setCargando(false))
  }, [recargar])

  const avisos = useRecordatorios(tareas, materias)

  const entrar = async ({ access_token, usuario: u }) => {
    sesion.guardar(access_token)
    setUsuario(u)
    await recargar()
  }

  const salir = () => {
    sesion.cerrar()
    setUsuario(null)
    setMaterias([])
    setTareas([])
  }

  const guardarTarea = async (datos) => {
    if (tareaEditando?.id) await api.editarTarea(tareaEditando.id, datos)
    else await api.crearTarea(datos)
    setTareaEditando(null)
    await recargar()
  }

  const borrarTarea = async (tarea) => {
    if (!confirm(`¿Borrar la tarea "${tarea.titulo}"?`)) return
    await api.borrarTarea(tarea.id)
    setTareaEditando(null)
    await recargar()
  }

  const alternarCompletada = async (tarea) => {
    const { id, ...resto } = tarea
    await api.editarTarea(id, { ...resto, completada: !tarea.completada })
    await recargar()
  }

  const nuevaTarea = (fecha) => {
    const d = fecha ? new Date(fecha) : new Date()
    if (!fecha) d.setDate(d.getDate() + 1)
    d.setHours(23, 59, 0, 0)
    setTareaEditando({ fecha_entrega: d.toISOString(), materia_id: materias[0]?.id ?? null, recordatorio_minutos: 1440 })
  }

  if (cargando) return <div className="pantalla-centro">Cargando… (si el servidor estaba dormido puede tardar hasta un minuto)</div>
  if (errorConexion) return (
    <div className="pantalla-centro">
      <div className="tarjeta">
        <p>{errorConexion}</p>
        <button className="btn btn-primario" onClick={() => window.location.reload()}>Reintentar</button>
      </div>
    </div>
  )
  if (!usuario) return <Login onEntrar={entrar} />

  const props = { materias, tareas, onEditarTarea: setTareaEditando, onNuevaTarea: nuevaTarea, onAlternar: alternarCompletada }

  return (
    <div className="app">
      <header className="barra">
        <div className="marca">📚 Agenda Estudiantil</div>
        <nav className="pestanas">
          {PESTANAS.map((p) => (
            <button key={p.id} className={pestana === p.id ? 'activa' : ''} onClick={() => setPestana(p.id)}>
              <span>{p.icono}</span> <span className="texto-pestana">{p.texto}</span>
            </button>
          ))}
        </nav>
        <div className="usuario">
          <span className="nombre-usuario">{usuario.nombre}</span>
          <button className="btn-link" onClick={salir}>Salir</button>
        </div>
      </header>

      {avisos}

      <main className="contenido">
        {pestana === 'calendario' && <Calendario {...props} />}
        {pestana === 'horario' && <Horario materias={materias} />}
        {pestana === 'tareas' && <Tareas {...props} />}
        {pestana === 'materias' && <Materias materias={materias} tareas={tareas} onCambio={recargar} />}
        <div hidden={pestana !== 'estudiar'}><Estudiar materias={materias} /></div>
      </main>

      {tareaEditando && (
        <Modal titulo={tareaEditando.id ? 'Editar tarea' : 'Nueva tarea'} onCerrar={() => setTareaEditando(null)}>
          <TareaForm
            tarea={tareaEditando}
            materias={materias}
            onGuardar={guardarTarea}
            onBorrar={tareaEditando.id ? () => borrarTarea(tareaEditando) : null}
            onCancelar={() => setTareaEditando(null)}
          />
        </Modal>
      )}
    </div>
  )
}
