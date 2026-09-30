export const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
export const DIAS_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export const COLORES = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#64748b',
]

export const OPCIONES_RECORDATORIO = [
  { valor: '', texto: 'Sin recordatorio' },
  { valor: 0, texto: 'A la hora de entrega' },
  { valor: 15, texto: '15 minutos antes' },
  { valor: 60, texto: '1 hora antes' },
  { valor: 180, texto: '3 horas antes' },
  { valor: 1440, texto: '1 día antes' },
  { valor: 2880, texto: '2 días antes' },
  { valor: 10080, texto: '1 semana antes' },
]

// Día de la semana con lunes = 0
export const diaLunes = (fecha) => (fecha.getDay() + 6) % 7

export const mismoDia = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

// Convierte una fecha a lo que espera <input type="datetime-local">
export function aInputLocal(fecha) {
  const d = new Date(fecha)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const hora = (fecha) =>
  new Date(fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })

export const fechaLarga = (fecha) =>
  new Date(fecha).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })

export const horaCorta = (h) => h.slice(0, 5)

export const aMinutos = (h) => {
  const [hh, mm] = h.split(':').map(Number)
  return hh * 60 + mm
}

export function tiempoRestante(fecha) {
  const min = Math.round((new Date(fecha) - Date.now()) / 60000)
  if (min < 0) return 'vencida'
  if (min < 60) return `en ${min} min`
  if (min < 1440) return `en ${Math.round(min / 60)} h`
  const dias = Math.round(min / 1440)
  return dias === 1 ? 'mañana' : `en ${dias} días`
}
