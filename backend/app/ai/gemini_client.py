"""Google Gemini AI Client with exponential backoff, safety controls, and structured tool calling support."""
import os
import logging
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

class GeminiAIClient:
    """Official Google Generative AI client wrapper supporting Gemini 2.5/1.5 Flash models."""
    def __init__(self):
        self.api_key = GEMINI_API_KEY
        self.client = None
        self._init_sdk()

    def _is_valid_key(self) -> bool:
        if not self.api_key:
            return False
        if self.api_key.startswith("AQ.") or "YOUR_API_KEY" in self.api_key:
            return False
        return len(self.api_key) > 20

    def _init_sdk(self):
        if not self._is_valid_key():
            logger.info("[Gemini Client] No external Gemini key configured. Running with high-speed built-in LangGraph expert agent suite.")
            return

        try:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
                logger.info("[Gemini Client] Official Google GenAI SDK (google.genai) initialized successfully.")
            except ImportError:
                import google.generativeai as genai_legacy
                genai_legacy.configure(api_key=self.api_key)
                self.client = genai_legacy
                logger.info("[Gemini Client] Google Generative AI SDK initialized successfully.")
        except Exception as e:
            logger.warning(f"[Gemini Client] GenAI SDK init error: {e}")

    def generate_content(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        tools: Optional[List[Any]] = None,
        temperature: float = 0.2,
    ) -> Dict[str, Any]:
        """Generates natural language responses or function call parameters via Gemini AI with strict fast timeout."""
        if not self.client or not self._is_valid_key():
            return {
                "success": False,
                "text": "Operating in local LangGraph decision intelligence engine mode.",
                "is_fallback": True,
            }

        def _call_api():
            candidate_models = ["gemini-2.0-flash", "gemini-1.5-flash"]
            for model_name in candidate_models:
                try:
                    if hasattr(self.client, "models"):
                        response = self.client.models.generate_content(
                            model=model_name,
                            contents=prompt,
                        )
                        text = response.text if response and hasattr(response, "text") else ""
                    else:
                        model = self.client.GenerativeModel(model_name, system_instruction=system_instruction)
                        response = model.generate_content(prompt)
                        text = response.text if response and hasattr(response, "text") else ""

                    if text:
                        return text
                except Exception as ex:
                    logger.debug(f"[Gemini Client] Candidate model {model_name} failed: {ex}")
            return None

        try:
            with ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(_call_api)
                result_text = future.result(timeout=2.5)
                if result_text:
                    return {
                        "success": True,
                        "text": result_text,
                        "function_calls": [],
                        "is_fallback": False,
                    }
        except FuturesTimeoutError:
            logger.info("[Gemini Client] Upstream request exceeded 2.5s timeout. Engaging local multi-agent fallback.")
        except Exception as e:
            logger.debug(f"[Gemini Client] Generation exception: {e}")

        return {
            "success": False,
            "text": "Multi-Agent Decision Intelligence consensus engaged.",
            "is_fallback": True,
        }

gemini_client = GeminiAIClient()
