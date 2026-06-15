import os
from dataclasses import dataclass

from dotenv import load_dotenv


load_dotenv()


@dataclass(frozen=True)
class Settings:
    groq_api_key: str
    tavily_api_key: str

    # Model routing [Groq model IDs]
    model_researcher: str
    model_writer: str
    model_critic: str
    model_fallback: str


def _required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise ValueError(f"Missing required environment variable: {name}")
    return value


def _optional_env(name: str, default: str) -> str:
    value = os.getenv(name)
    return value.strip() if value and value.strip() else default


def get_settings() -> Settings:
    return Settings(
        groq_api_key=_required_env("GROQ_API_KEY"),
        tavily_api_key=_required_env("TAVILY_API_KEY"),
        model_researcher=_optional_env("GROQ_MODEL_RESEARCHER", "openai/gpt-oss-120b"),
        model_writer=_optional_env("GROQ_MODEL_WRITER", "openai/gpt-oss-120b"),
        model_critic=_optional_env("GROQ_MODEL_CRITIC", "openai/gpt-oss-120b"),
        model_fallback=_optional_env("GROQ_MODEL_FALLBACK", "openai/gpt-oss-120b"),
    )
