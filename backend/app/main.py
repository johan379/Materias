from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from . import ia, models, schemas
from .auth import crear_token, hash_password, usuario_actual, verificar_password
from .config import settings
from .database import Base, engine, get_db

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Agenda Estudiantil API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origenes,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def salud():
    return {"ok": True}


# ---------- Autenticación ----------

@app.post("/auth/registro", response_model=schemas.TokenOut, status_code=201)
def registro(datos: schemas.Registro, db: Session = Depends(get_db)):
    email = datos.email.lower()
    if db.scalar(select(models.Usuario).where(models.Usuario.email == email)):
        raise HTTPException(400, "Ese correo ya está registrado")
    usuario = models.Usuario(nombre=datos.nombre, email=email, password_hash=hash_password(datos.password))
    db.add(usuario)
    db.commit()
    return {"access_token": crear_token(usuario.id), "usuario": usuario}


@app.post("/auth/login", response_model=schemas.TokenOut)
def login(datos: schemas.Login, db: Session = Depends(get_db)):
    usuario = db.scalar(select(models.Usuario).where(models.Usuario.email == datos.email.lower()))
    if usuario is None or not verificar_password(datos.password, usuario.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Correo o contraseña incorrectos")
    return {"access_token": crear_token(usuario.id), "usuario": usuario}


@app.get("/auth/yo", response_model=schemas.UsuarioOut)
def yo(usuario: models.Usuario = Depends(usuario_actual)):
    return usuario


# ---------- Materias y horario ----------

def _materia_del_usuario(db: Session, materia_id: int, usuario: models.Usuario) -> models.Materia:
    materia = db.get(models.Materia, materia_id)
    if materia is None or materia.usuario_id != usuario.id:
        raise HTTPException(404, "Materia no encontrada")
    return materia


@app.get("/materias", response_model=list[schemas.MateriaOut])
def listar_materias(usuario: models.Usuario = Depends(usuario_actual), db: Session = Depends(get_db)):
    return db.scalars(
        select(models.Materia)
        .where(models.Materia.usuario_id == usuario.id)
        .options(selectinload(models.Materia.horarios))
        .order_by(models.Materia.nombre)
    ).all()


@app.post("/materias", response_model=schemas.MateriaOut, status_code=201)
def crear_materia(
    datos: schemas.MateriaIn, usuario: models.Usuario = Depends(usuario_actual), db: Session = Depends(get_db)
):
    materia = models.Materia(
        usuario_id=usuario.id,
        nombre=datos.nombre,
        color=datos.color,
        profesor=datos.profesor,
        horarios=[models.Horario(**h.model_dump()) for h in datos.horarios],
    )
    db.add(materia)
    db.commit()
    db.refresh(materia)
    return materia


@app.put("/materias/{materia_id}", response_model=schemas.MateriaOut)
def editar_materia(
    materia_id: int,
    datos: schemas.MateriaIn,
    usuario: models.Usuario = Depends(usuario_actual),
    db: Session = Depends(get_db),
):
    materia = _materia_del_usuario(db, materia_id, usuario)
    materia.nombre = datos.nombre
    materia.color = datos.color
    materia.profesor = datos.profesor
    materia.horarios = [models.Horario(**h.model_dump()) for h in datos.horarios]
    db.commit()
    db.refresh(materia)
    return materia


@app.delete("/materias/{materia_id}", status_code=204)
def borrar_materia(
    materia_id: int, usuario: models.Usuario = Depends(usuario_actual), db: Session = Depends(get_db)
):
    db.delete(_materia_del_usuario(db, materia_id, usuario))
    db.commit()


# ---------- Tareas ----------

def _tarea_del_usuario(db: Session, tarea_id: int, usuario: models.Usuario) -> models.Tarea:
    tarea = db.get(models.Tarea, tarea_id)
    if tarea is None or tarea.usuario_id != usuario.id:
        raise HTTPException(404, "Tarea no encontrada")
    return tarea


def _validar_materia(db: Session, materia_id: int | None, usuario: models.Usuario):
    if materia_id is not None:
        _materia_del_usuario(db, materia_id, usuario)


@app.get("/tareas", response_model=list[schemas.TareaOut])
def listar_tareas(usuario: models.Usuario = Depends(usuario_actual), db: Session = Depends(get_db)):
    return db.scalars(
        select(models.Tarea).where(models.Tarea.usuario_id == usuario.id).order_by(models.Tarea.fecha_entrega)
    ).all()


@app.post("/tareas", response_model=schemas.TareaOut, status_code=201)
def crear_tarea(
    datos: schemas.TareaIn, usuario: models.Usuario = Depends(usuario_actual), db: Session = Depends(get_db)
):
    _validar_materia(db, datos.materia_id, usuario)
    tarea = models.Tarea(usuario_id=usuario.id, **datos.model_dump())
    db.add(tarea)
    db.commit()
    return tarea


@app.put("/tareas/{tarea_id}", response_model=schemas.TareaOut)
def editar_tarea(
    tarea_id: int,
    datos: schemas.TareaIn,
    usuario: models.Usuario = Depends(usuario_actual),
    db: Session = Depends(get_db),
):
    tarea = _tarea_del_usuario(db, tarea_id, usuario)
    _validar_materia(db, datos.materia_id, usuario)
    for campo, valor in datos.model_dump().items():
        setattr(tarea, campo, valor)
    db.commit()
    return tarea


@app.delete("/tareas/{tarea_id}", status_code=204)
def borrar_tarea(tarea_id: int, usuario: models.Usuario = Depends(usuario_actual), db: Session = Depends(get_db)):
    db.delete(_tarea_del_usuario(db, tarea_id, usuario))
    db.commit()


# ---------- Asistente de estudio (IA) ----------

def _contexto_ia(datos: schemas.ContextoIA, usuario: models.Usuario, db: Session) -> str:
    materia = _materia_del_usuario(db, datos.materia_id, usuario) if datos.materia_id is not None else None
    tareas = db.scalars(select(models.Tarea).where(models.Tarea.usuario_id == usuario.id)).all() if materia else []
    return ia.contexto_materia(materia, tareas, datos.tema, datos.apuntes)


@app.post("/ia/chat", response_model=schemas.ChatIAOut)
def chat_ia(datos: schemas.ChatIAIn, usuario: models.Usuario = Depends(usuario_actual), db: Session = Depends(get_db)):
    sistema = ia.INSTRUCCIONES_TUTOR + f"\n\nEl estudiante se llama {usuario.nombre}."
    contexto = _contexto_ia(datos, usuario, db)
    if contexto:
        sistema += "\n\n" + contexto
    # Solo los últimos mensajes, para no gastar el límite gratuito con conversaciones largas
    historial = [{"role": m.rol, "content": m.contenido} for m in datos.mensajes[-12:]]
    return {"respuesta": ia.completar([{"role": "system", "content": sistema}, *historial])}


@app.post("/ia/quiz", response_model=schemas.QuizIAOut)
def quiz_ia(datos: schemas.QuizIAIn, usuario: models.Usuario = Depends(usuario_actual), db: Session = Depends(get_db)):
    contexto = _contexto_ia(datos, usuario, db)
    if not contexto:
        raise HTTPException(400, "Elige una materia, escribe un tema o pega tus apuntes")
    return {"preguntas": ia.generar_quiz(contexto, datos.cantidad)}
