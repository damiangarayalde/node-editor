from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    # Required
    OPENAI_API_KEY: str = Field(..., env="OPENAI_API_KEY")

    # Optional with defaults
    OPENAI_MODEL: str = Field("gpt-3.5-turbo", env="OPENAI_MODEL")
    DEBUG: bool = Field(True, env="DEBUG")
    PORT: int = Field(5001, env="PORT")
    HOST: str = Field("0.0.0.0", env="HOST")
    MAX_CONTENT_LENGTH: int = Field(
        16 * 1024 * 1024, env="MAX_CONTENT_LENGTH")  # 16MB max upload

    # CORS settings
    # In production, specify exact origins
    CORS_ORIGINS: str = Field("*", env="CORS_ORIGINS")

    class Config:
        env_file = ".env"
        case_sensitive = True
        env_file_encoding = 'utf-8'


# Create settings instance
settings = Settings()
