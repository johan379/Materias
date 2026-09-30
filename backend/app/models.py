from datetime import datetime, time

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, Time, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Materia(Base):
    __tablename__ = "materias"

    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id", ondelete="CASCADE"), index=True)
    nombre: Mapped[str] = mapped_column(String(120))
    color: Mapped[str] = mapped_column(String(7), default="#4f46e5")
    profesor: Mapped[str | None] = mapped_column(String(120), nullable=True)

    horarios: Mapped[list["Horario"]] = relationship(
        back_populates="materia", cascade="all, delete-orphan", passive_deletes=True
    )


class Horario(Base):
    __tablename__ = "horarios"

    id: Mapped[int] = mapped_column(primary_key=True)
    materia_id: Mapped[int] = mapped_column(ForeignKey("materias.id", ondelete="CASCADE"), index=True)
    dia_semana: Mapped[int] = mapped_column(Integer)  # 0 = lunes ... 6 = domingo
    hora_inicio: Mapped[time] = mapped_column(Time)
    hora_fin: Mapped[time] = mapped_column(Time)
    salon: Mapped[str | None] = mapped_column(String(60), nullable=True)

    materia: Mapped[Materia] = relationship(back_populates="horarios")


class Tarea(Base):
    __tablename__ = "tareas"

    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id", ondelete="CASCADE"), index=True)
    materia_id: Mapped[int | None] = mapped_column(
        ForeignKey("materias.id", ondelete="SET NULL"), nullable=True, index=True
    )
    titulo: Mapped[str] = mapped_column(String(200))
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    fecha_entrega: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    recordatorio_minutos: Mapped[int | None] = mapped_column(Integer, nullable=True)
    completada: Mapped[bool] = mapped_column(Boolean, default=False)
