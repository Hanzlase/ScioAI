import os
from dataclasses import dataclass

from dotenv import load_dotenv


load_dotenv()


@dataclass(frozen=True)
class Settings:
    openrouter_api_key: str
    tavily_api_key: str
    pinecone_api_key: str
    pinecone_index_name: str

    # Model routing (OpenRouter model IDs)
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
        openrouter_api_key=_required_env("OPENROUTER_API_KEY"),
        tavily_api_key=_required_env("TAVILY_API_KEY"),
        pinecone_api_key=_required_env("PINECONE_API_KEY"),
        pinecone_index_name=_required_env("PINECONE_INDEX_NAME"),
        model_researcher=_optional_env("OPENROUTER_MODEL_RESEARCHER", "nvidia/nemotron-3-super-120b-a12b:free"),
        model_writer=_optional_env("OPENROUTER_MODEL_WRITER", "nousresearch/hermes-3-llama-3.1-405b:free"),
        model_critic=_optional_env("OPENROUTER_MODEL_CRITIC", "nousresearch/hermes-3-llama-3.1-405b:free"),
        model_fallback=_optional_env("OPENROUTER_MODEL_FALLBACK", "openai/gpt-oss-120b:free"),
    )
