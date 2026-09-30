from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./agenda.db"
    secret_key: str = "desarrollo-no-usar-en-produccion"
    origenes_permitidos: str = "http://localhost:5173"
    token_horas: int = 24 * 30

    @property
    def origenes(self) -> list[str]:
        return [o.strip().rstrip("/") for o in self.origenes_permitidos.split(",") if o.strip()]


settings = Settings()
