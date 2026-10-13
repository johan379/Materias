from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./agenda.db"
    secret_key: str = "desarrollo-no-usar-en-produccion"
    origenes_permitidos: str = "http://localhost:5173"
    token_horas: int = 24 * 30
    # Asistente de estudio (gratis en https://console.groq.com/keys)
    groq_api_key: str = ""
    # Se prueban en orden: si el primero llega a su límite gratuito, se usa el siguiente
    ia_modelos: str = "openai/gpt-oss-120b,openai/gpt-oss-20b"

    @property
    def modelos_ia(self) -> list[str]:
        return [m.strip() for m in self.ia_modelos.split(",") if m.strip()]

    @property
    def origenes(self) -> list[str]:
        return [o.strip().rstrip("/") for o in self.origenes_permitidos.split(",") if o.strip()]


settings = Settings()
