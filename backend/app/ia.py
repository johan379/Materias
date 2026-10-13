"""Asistente de estudio con IA usando la API gratuita de Groq (https://console.groq.com).

Si el modelo principal llega a su límite diario/por minuto, se intenta con el siguiente de la lista,
así el asistente sigue respondiendo aunque haya muchos estudiantes usándolo.
"""
import json
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import HTTPException

from . import models
from .config import settings

URL_GROQ = "https://api.groq.com/openai/v1/chat/completions"

INSTRUCCIONES_TUTOR = """Eres un tutor paciente que ayuda a un estudiante a prepararse para sus evaluaciones.
- Responde siempre en español, claro y al nivel del estudiante.
- Explica paso a paso y con ejemplos. Si el estudiante se equivoca, corrígelo con amabilidad.
- Cuando te pidan practicar, haz UNA pregunta a la vez y espera su respuesta antes de dar la solución.
- Si hay apuntes del estudiante, básate en ellos primero.
- Usa formato simple: párrafos cortos, listas con "-" y **negritas** para lo importante. No uses tablas."""

INSTRUCCIONES_QUIZ = """Eres un profesor que arma quices de práctica en español.
Responde SOLO con un JSON con esta forma exacta:
{"preguntas": [{"pregunta": "...", "opciones": ["...", "...", "...", "..."], "correcta": 0, "explicacion": "..."}]}
- Cada pregunta tiene exactamente 4 opciones y "correcta" es el índice (0 a 3) de la opción correcta.
- Varía la posición de la respuesta correcta.
- La explicación dice en una o dos frases por qué esa es la respuesta.
- Si hay apuntes del estudiante, las preguntas deben salir de ellos."""


def contexto_materia(materia: models.Materia | None, tareas: list[models.Tarea], tema: str | None, apuntes: str | None) -> str:
    partes = []
    if materia:
        partes.append(f"Materia: {materia.nombre}" + (f" (profesor/a: {materia.profesor})" if materia.profesor else ""))
        ahora = datetime.now(timezone.utc)
        proximas = [
            t for t in tareas
            if t.materia_id == materia.id and not t.completada and ahora <= _utc(t.fecha_entrega) <= ahora + timedelta(days=45)
        ]
        if proximas:
            lineas = [f"- {t.titulo} ({_utc(t.fecha_entrega):%d/%m/%Y})" + (f": {t.descripcion}" if t.descripcion else "") for t in proximas[:8]]
            partes.append("Próximas entregas y evaluaciones del estudiante en esta materia:\n" + "\n".join(lineas))
    if tema:
        partes.append(f"Tema a estudiar: {tema}")
    if apuntes:
        partes.append(f"Apuntes del estudiante:\n\"\"\"\n{apuntes}\n\"\"\"")
    return "\n\n".join(partes)


def _utc(fecha: datetime) -> datetime:
    return fecha if fecha.tzinfo else fecha.replace(tzinfo=timezone.utc)


def completar(mensajes: list[dict], formato_json: bool = False) -> str:
    if not settings.groq_api_key:
        raise HTTPException(503, "El asistente de IA no está configurado (falta GROQ_API_KEY en el servidor)")

    ultimo_error = "No se pudo contactar al asistente"
    for modelo in settings.modelos_ia:
        # max_tokens incluye el "razonamiento" interno de gpt-oss, por eso es amplio y el esfuerzo es bajo
        cuerpo = {"model": modelo, "messages": mensajes, "temperature": 0.5, "max_tokens": 4096}
        if modelo.startswith("openai/gpt-oss"):
            cuerpo["reasoning_effort"] = "low"
        if formato_json:
            cuerpo["response_format"] = {"type": "json_object"}
        try:
            r = httpx.post(
                URL_GROQ,
                headers={"Authorization": f"Bearer {settings.groq_api_key}"},
                json=cuerpo,
                timeout=60,
            )
        except httpx.HTTPError:
            ultimo_error = "No se pudo contactar al asistente, intenta de nuevo"
            continue
        if r.status_code == 200:
            contenido = r.json()["choices"][0]["message"].get("content")
            if contenido:
                return contenido
            ultimo_error = "El asistente no alcanzó a responder, intenta de nuevo"
            continue
        # 429 = límite gratuito alcanzado; 413 = mensaje muy largo para ese modelo; 5xx = falla temporal
        # 404/400 de modelo = Groq lo retiró o no lo ofrece gratis: se pasa al siguiente
        if r.status_code in (404, 413, 429) or r.status_code >= 500 or "model" in r.text[:300].lower():
            print(f"[ia] {modelo} respondió {r.status_code}: {r.text[:200]}", flush=True)
            ultimo_error = "El asistente está muy ocupado en este momento, intenta en un minuto"
            continue
        raise HTTPException(502, f"Error del asistente de IA ({r.status_code})")
    raise HTTPException(503, ultimo_error)


def generar_quiz(contexto: str, cantidad: int) -> list[dict]:
    mensajes = [
        {"role": "system", "content": INSTRUCCIONES_QUIZ},
        {"role": "user", "content": f"{contexto}\n\nArma un quiz de {cantidad} preguntas de selección múltiple."},
    ]
    for _ in range(2):  # si el JSON viene mal formado, se reintenta una vez
        try:
            datos = json.loads(completar(mensajes, formato_json=True))
            preguntas = [
                {
                    "pregunta": str(p["pregunta"]),
                    "opciones": [str(o) for o in p["opciones"]][:4],
                    "correcta": int(p["correcta"]),
                    "explicacion": str(p.get("explicacion", "")),
                }
                for p in datos["preguntas"]
            ]
            preguntas = [p for p in preguntas if len(p["opciones"]) == 4 and 0 <= p["correcta"] < 4]
            if preguntas:
                return preguntas[:cantidad]
        except (ValueError, KeyError, TypeError):
            pass
    raise HTTPException(502, "El asistente no pudo armar el quiz, intenta de nuevo")
