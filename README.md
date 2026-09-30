# 📚 Agenda Estudiantil

Materias con color, horario semanal de clases, calendario mensual y tareas con fecha de entrega y recordatorios.

- **frontend/**: React + Vite → se publica en **Vercel**
- **backend/**: Python (FastAPI) → se publica en **Render**
- **Base de datos**: PostgreSQL en **Supabase**

## Correr en tu computador

Backend (usa SQLite local si no hay `.env`):

```powershell
cd backend
.venv\Scripts\activate
uvicorn app.main:app --reload
```

Frontend (en otra terminal):

```powershell
cd frontend
npm run dev
```

Abre http://localhost:5173

## Desplegar

1. **Supabase**: crea un proyecto → botón **Connect** → copia la cadena de **Session pooler**
   (reemplaza `[YOUR-PASSWORD]` por la contraseña de la base). Opcional: pega `backend/supabase.sql` en el SQL Editor
   (el backend también crea las tablas solo al arrancar).
2. **GitHub**: sube este repositorio.
3. **Render** → New → **Blueprint** → elige el repo (lee `render.yaml`). Llena:
   - `DATABASE_URL` = la cadena de Supabase
   - `ORIGENES_PERMITIDOS` = la URL de Vercel (puedes poner `http://localhost:5173` mientras tanto; cualquier `*.vercel.app` ya está permitido)
4. **Vercel** → Add New → Project → elige el repo → **Root Directory: `frontend`** →
   Environment Variable `VITE_API_URL` = la URL de Render (ej. `https://agenda-estudiantil-api.onrender.com`) → Deploy.

> El plan gratis de Render se duerme tras 15 min sin uso: la primera petición puede tardar ~50 s.

## Recordatorios

La app revisa cada 30 s las tareas con recordatorio y muestra una notificación del navegador
(hay que darle "Permitir") y un aviso dentro de la app. Funcionan mientras la app esté abierta en alguna pestaña.
