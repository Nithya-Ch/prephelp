"""Provider-agnostic LLM client with strict JSON validation, caching, budget tracking, and deterministic fallback."""

import hashlib
import json
import logging
import os
import time
from pathlib import Path
from typing import Any, Dict, Optional, Type, TypeVar
from pydantic import BaseModel

logger = logging.getLogger("prephelp.llm")

T = TypeVar("T", bound=BaseModel)

# In-memory SHA-256 response cache: (prompt_hash -> (data, timestamp))
_RESPONSE_CACHE: Dict[str, Dict[str, Any]] = {}

# Budget & token tracking
_DAILY_BUDGET_CENTS = float(os.getenv("LLM_DAILY_BUDGET_CENTS", "1000"))  # default $10.00
_ESTIMATED_SPEND_CENTS = 0.0
_TOTAL_PROMPT_TOKENS = 0
_TOTAL_COMPLETION_TOKENS = 0


def get_llm_metrics() -> Dict[str, Any]:
    """Return runtime LLM usage and budget statistics."""
    return {
        "provider": os.getenv("LLM_PROVIDER", "none"),
        "daily_budget_cents": _DAILY_BUDGET_CENTS,
        "estimated_spend_cents": round(_ESTIMATED_SPEND_CENTS, 4),
        "total_prompt_tokens": _TOTAL_PROMPT_TOKENS,
        "total_completion_tokens": _TOTAL_COMPLETION_TOKENS,
        "cache_entries": len(_RESPONSE_CACHE),
    }


def compute_cache_key(prompt: str, prompt_version: str) -> str:
    content = f"{prompt_version}::{prompt}"
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def load_prompt_template(filename: str) -> str:
    """Load prompt template from /prompts directory relative to repo root."""
    repo_prompts = Path(__file__).resolve().parent.parent.parent.parent / "prompts" / filename
    if repo_prompts.exists():
        return repo_prompts.read_text(encoding="utf-8")
    # Fallback to local ml-service/prompts if bundled
    bundled = Path(__file__).resolve().parent.parent / "prompts" / filename
    if bundled.exists():
        return bundled.read_text(encoding="utf-8")
    raise FileNotFoundError(f"Prompt template {filename} not found in {repo_prompts} or {bundled}")


class LLMClient:
    """Lightweight provider-agnostic LLM interface."""

    def __init__(self):
        self.provider = os.getenv("LLM_PROVIDER", "").strip().lower()
        self.temperature = float(os.getenv("LLM_TEMPERATURE", "0.2"))
        self.timeout_sec = float(os.getenv("LLM_TIMEOUT_SEC", "10.0"))

    def generate_json(
        self,
        prompt: str,
        schema: Type[T],
        fallback_factory: Any,
        prompt_version: str = "v1",
    ) -> tuple[T, bool]:
        """Generate structured JSON adhering to the provided Pydantic schema.
        
        Returns:
            (result_object, fallback_used: bool)
        """
        global _ESTIMATED_SPEND_CENTS, _TOTAL_PROMPT_TOKENS, _TOTAL_COMPLETION_TOKENS

        # 1. Check in-memory cache
        cache_key = compute_cache_key(prompt, prompt_version)
        if cache_key in _RESPONSE_CACHE:
            try:
                cached_data = _RESPONSE_CACHE[cache_key]
                logger.debug("Cache hit for LLM prompt [%s]", cache_key[:10])
                return schema(**cached_data), False
            except Exception as e:
                logger.warning("Failed deserializing cached LLM response: %s", e)

        # 2. Check if budget exceeded or provider is none/unset
        if not self.provider or self.provider in ("none", "false", "disabled"):
            logger.debug("No LLM_PROVIDER set. Triggering deterministic fallback.")
            return fallback_factory(), True

        if _ESTIMATED_SPEND_CENTS >= _DAILY_BUDGET_CENTS:
            logger.warning(
                "Daily LLM budget reached (spent: %s cents, limit: %s cents). Falling back.",
                _ESTIMATED_SPEND_CENTS,
                _DAILY_BUDGET_CENTS,
            )
            return fallback_factory(), True

        # 3. Call external LLM provider with retries (max 2 attempts)
        for attempt in range(1, 3):
            try:
                raw_json = self._call_provider(prompt)
                parsed = json.loads(raw_json)
                validated = schema(**parsed)

                # Estimate tokens (approx 4 chars per token)
                prompt_toks = len(prompt) // 4
                completion_toks = len(raw_json) // 4
                _TOTAL_PROMPT_TOKENS += prompt_toks
                _TOTAL_COMPLETION_TOKENS += completion_toks
                # Rough estimate: $0.15 / 1M prompt, $0.60 / 1M completion
                cost = (prompt_toks * 0.000015 + completion_toks * 0.000060)
                _ESTIMATED_SPEND_CENTS += cost

                # Save to cache
                _RESPONSE_CACHE[cache_key] = validated.model_dump()
                return validated, False
            except Exception as err:
                logger.warning(
                    "LLM provider [%s] call attempt %d failed: %s",
                    self.provider,
                    attempt,
                    err,
                )
                time.sleep(0.5)

        # 4. If all retries fail, return fallback cleanly
        logger.warning("All LLM attempts failed. Using deterministic fallback.")
        return fallback_factory(), True

    def _call_provider(self, prompt: str) -> str:
        """Dispatch to chosen provider."""
        if self.provider == "anthropic":
            return self._call_anthropic(prompt)
        elif self.provider in ("gemini", "google"):
            return self._call_gemini(prompt)
        elif self.provider == "groq":
            return self._call_groq(prompt)
        elif self.provider == "ollama":
            return self._call_ollama(prompt)
        else:
            raise ValueError(f"Unsupported LLM_PROVIDER: {self.provider}")

    def _call_anthropic(self, prompt: str) -> str:
        import urllib.request
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable is missing")
        url = "https://api.anthropic.com/v1/messages"
        payload = {
            "model": os.getenv("ANTHROPIC_MODEL", "claude-3-5-haiku-latest"),
            "max_tokens": 1024,
            "temperature": self.temperature,
            "messages": [{"role": "user", "content": prompt}],
        }
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
        )
        with urllib.request.urlopen(req, timeout=self.timeout_sec) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            content = res_data["content"][0]["text"]
            return self._extract_json_block(content)

    def _call_gemini(self, prompt: str) -> str:
        import urllib.request
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is missing")
        model = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": self.temperature,
                "responseMimeType": "application/json",
            },
        }
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"content-type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=self.timeout_sec) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            content = res_data["candidates"][0]["content"]["parts"][0]["text"]
            return self._extract_json_block(content)

    def _call_groq(self, prompt: str) -> str:
        import urllib.request
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY environment variable is missing")
        url = "https://api.groq.com/openai/v1/chat/completions"
        payload = {
            "model": os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
            "temperature": self.temperature,
            "response_format": {"type": "json_object"},
            "messages": [{"role": "user", "content": prompt}],
        }
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {api_key}",
                "content-type": "application/json",
            },
        )
        with urllib.request.urlopen(req, timeout=self.timeout_sec) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            content = res_data["choices"][0]["message"]["content"]
            return self._extract_json_block(content)

    def _call_ollama(self, prompt: str) -> str:
        import urllib.request
        host = os.getenv("OLLAMA_HOST", "http://localhost:11434")
        url = f"{host.rstrip('/')}/api/generate"
        payload = {
            "model": os.getenv("OLLAMA_MODEL", "llama3"),
            "prompt": prompt,
            "format": "json",
            "stream": False,
            "options": {"temperature": self.temperature},
        }
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"content-type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=self.timeout_sec) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            return res_data.get("response", "{}")

    def _extract_json_block(self, text: str) -> str:
        text = text.strip()
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        return text.strip()


llm_client = LLMClient()
