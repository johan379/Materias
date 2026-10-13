from datetime import datetime, time
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

COLOR = r"^#[0-9a-fA-F]{6}$"


class Registro(BaseModel):
    nombre: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)


class Login(BaseModel):
    email: EmailStr
    password: str = Field(max_length=72)


class UsuarioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    nombre: str
    email: str


class TokenOut(BaseModel):
    access_token: str
    usuario: UsuarioOut


class HorarioIn(BaseModel):
    dia_semana: int = Field(ge=0, le=6)
    hora_inicio: time
    hora_fin: time
    salon: str | None = Field(default=None, max_length=60)

    @model_validator(mode="after")
    def validar_horas(self):
        if self.hora_fin <= self.hora_inicio:
            raise ValueError("La hora de fin debe ser posterior a la de inicio")
        return self


class HorarioOut(HorarioIn):
    model_config = ConfigDict(from_attributes=True)
    id: int
    materia_id: int


class MateriaIn(BaseModel):
    nombre: str = Field(min_length=1, max_length=120)
    color: str = Field(default="#4f46e5", pattern=COLOR)
    profesor: str | None = Field(default=None, max_length=120)
    horarios: list[HorarioIn] = []


class MateriaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    nombre: str
    color: str
    profesor: str | None
    horarios: list[HorarioOut]


class TareaIn(BaseModel):
    titulo: str = Field(min_length=1, max_length=200)
    descripcion: str | None = None
    materia_id: int | None = None
    fecha_entrega: datetime
    recordatorio_minutos: int | None = Field(default=None, ge=0, le=60 * 24 * 30)
    completada: bool = False


class TareaOut(TareaIn):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ---------- Asistente de estudio ----------

class MensajeIA(BaseModel):
    rol: Literal["user", "assistant"]
    contenido: str = Field(min_length=1, max_length=4000)


class ContextoIA(BaseModel):
    materia_id: int | None = None
    tema: str | None = Field(default=None, max_length=200)
    apuntes: str | None = Field(default=None, max_length=8000)


class ChatIAIn(ContextoIA):
    mensajes: list[MensajeIA] = Field(min_length=1, max_length=40)


class ChatIAOut(BaseModel):
    respuesta: str


class QuizIAIn(ContextoIA):
    cantidad: int = Field(default=5, ge=3, le=10)


class PreguntaQuiz(BaseModel):
    pregunta: str
    opciones: list[str]
    correcta: int
    explicacion: str


class QuizIAOut(BaseModel):
    preguntas: list[PreguntaQuiz]
