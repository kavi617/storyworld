from pathlib import Path

from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_ROOT = Path(__file__).resolve().parent.parent

load_dotenv(BACKEND_ROOT / ".env", override=True)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    openai_api_key: str = ""
    openai_chat_model: str = "gpt-4o-mini"
    openai_embedding_model: str = "text-embedding-3-small"
    # Vision model for kallvettu photos (defaults to openai_chat_model if empty)
    openai_vision_model: str = ""
    embedding_provider: str = "local"
    # Only LLM_PROVIDER=local skips ChatGPT (archive-only). Otherwise OpenAI is required.
    llm_provider: str = "openai"
    chroma_persist_directory: str = "chroma_db"
    chroma_collection_name: str = "tamil_history"


def get_settings() -> Settings:
    """Fresh read each call so .env changes apply after server reload."""
    return Settings()


def get_openai_api_key(*, required: bool = True) -> str:
    import os

    settings = get_settings()
    key = settings.openai_api_key or os.getenv("OPENAI_API_KEY", "")
    if not key and required:
        raise ValueError(
            "OPENAI_API_KEY is not set. Copy .env.example to .env and add your key, "
            "or set LLM_PROVIDER=local and EMBEDDING_PROVIDER=local."
        )
    return key


def use_local_llm() -> bool:
    """True only when LLM_PROVIDER=local — otherwise always use ChatGPT (requires API key)."""
    return get_settings().llm_provider.lower().strip() == "local"


def get_chroma_path() -> Path:
    settings = get_settings()
    path = Path(settings.chroma_persist_directory)
    if not path.is_absolute():
        path = BACKEND_ROOT / path
    return path
