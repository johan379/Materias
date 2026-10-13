const API_PRODUCCION = 'https://agenda-estudiantil-api.onrender.com'
const API_URL = (
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : API_PRODUCCION)
).replace(/\/$/, '')
const CLAVE_TOKEN = 'agenda_token'

export const sesion = {
  token: () => localStorage.getItem(CLAVE_TOKEN),
  guardar: (token) => localStorage.setItem(CLAVE_TOKEN, token),
  cerrar: () => localStorage.removeItem(CLAVE_TOKEN),
}

async function pedir(ruta, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = sesion.token()
  if (token) headers.Authorization = `Bearer ${token}`

  // Render (plan gratis) se duerme: mientras despierta falla la conexión o responde 502/503/504.
  // Se reintenta durante ~1 minuto en vez de mostrar error de una vez.
  let res
  for (let intento = 0; ; intento++) {
    try {
      res = await fetch(`${API_URL}${ruta}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      })
      if (![502, 503, 504].includes(res.status) || intento >= 6) break
    } catch (e) {
      if (intento >= 6) throw new Error('No se pudo conectar con el servidor. Revisa tu internet e intenta de nuevo.')
    }
    await new Promise((r) => setTimeout(r, 10000))
  }

  if (res.status === 401 && token) {
    sesion.cerrar()
    window.location.reload()
  }
  if (!res.ok) {
    let mensaje = `Error ${res.status}`
    try {
      const data = await res.json()
      if (typeof data.detail === 'string') mensaje = data.detail
      else if (Array.isArray(data.detail)) mensaje = data.detail.map((d) => d.msg.replace(/^Value error, /, '')).join('. ')
    } catch { /* respuesta sin JSON */ }
    throw new Error(mensaje)
  }
  return res.status === 204 ? null : res.json()
}

export const api = {
  registro: (datos) => pedir('/auth/registro', { method: 'POST', body: datos }),
  login: (datos) => pedir('/auth/login', { method: 'POST', body: datos }),
  yo: () => pedir('/auth/yo'),

  materias: () => pedir('/materias'),
  crearMateria: (d) => pedir('/materias', { method: 'POST', body: d }),
  editarMateria: (id, d) => pedir(`/materias/${id}`, { method: 'PUT', body: d }),
  borrarMateria: (id) => pedir(`/materias/${id}`, { method: 'DELETE' }),

  tareas: () => pedir('/tareas'),
  crearTarea: (d) => pedir('/tareas', { method: 'POST', body: d }),
  editarTarea: (id, d) => pedir(`/tareas/${id}`, { method: 'PUT', body: d }),
  borrarTarea: (id) => pedir(`/tareas/${id}`, { method: 'DELETE' }),

  chatIA: (d) => pedir('/ia/chat', { method: 'POST', body: d }),
  quizIA: (d) => pedir('/ia/quiz', { method: 'POST', body: d }),
}
