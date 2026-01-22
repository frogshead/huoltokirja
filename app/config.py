from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    database_url: str = "postgresql+asyncpg://huoltokirja:huoltokirja@localhost:5432/huoltokirja"
    uploads_dir: str = "uploads"
    max_upload_size_mb: int = 50


settings = Settings()
