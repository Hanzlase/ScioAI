import os
from dataclasses import dataclass

from dotenv import load_dotenv


load_dotenv()


@dataclass(frozen=True)
class Settings:
    groq_api_key: str
    tavily_api_key: str
    pinecone_api_key: str
    pinecone_index_name: str


def _required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise ValueError(f"Missing required environment variable: {name}")
    return value


def get_settings() -> Settings:
    return Settings(
        groq_api_key=_required_env("GROQ_API_KEY"),
        tavily_api_key=_required_env("TAVILY_API_KEY"),
        pinecone_api_key=_required_env("PINECONE_API_KEY"),
        pinecone_index_name=_required_env("PINECONE_INDEX_NAME"),
    )
