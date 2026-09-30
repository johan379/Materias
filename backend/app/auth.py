from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from .config import settings
from .database import get_db
from .models import Usuario

bearer = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verificar_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def crear_token(usuario_id: int) -> str:
    exp = datetime.now(timezone.utc) + timedelta(hours=settings.token_horas)
    return jwt.encode({"sub": str(usuario_id), "exp": exp}, settings.secret_key, algorithm="HS256")


def usuario_actual(
    cred: HTTPAuthorizationCredentials | None = Depends(bearer), db: Session = Depends(get_db)
) -> Usuario:
    error = HTTPException(status.HTTP_401_UNAUTHORIZED, "Sesión inválida o vencida")
    if cred is None:
        raise error
    try:
        usuario_id = int(jwt.decode(cred.credentials, settings.secret_key, algorithms=["HS256"])["sub"])
    except (JWTError, KeyError, ValueError):
        raise error
    usuario = db.get(Usuario, usuario_id)
    if usuario is None:
        raise error
    return usuario
