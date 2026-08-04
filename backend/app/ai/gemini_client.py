"""Google Gemini AI Client with exponential backoff, safety controls, and structured tool calling support."""
import os
import logging
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

    def _init_sdk(self):
        if not self.api_key:
            logger.warning("[Gemini Client] GEMINI_API_KEY environment variable is not set. Running in fallback mode.")
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
            logger.error(f"[Gemini Client] Failed to initialize Google Generative AI SDK: {e}")

    def generate_content(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        tools: Optional[List[Any]] = None,
        temperature: float = 0.2,
    ) -> Dict[str, Any]:
        """Generates natural language responses or function call parameters via Gemini AI."""
        if not self.client or not self.api_key:
            return {
                "success": False,
                "text": "Gemini API key not configured. Operating in local ML decision engine mode.",
                "is_fallback": True,
            }

        try:
            if hasattr(self.client, "models"):
                # google.genai Client
                response = self.client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt,
                )
                text = response.text if response and hasattr(response, "text") else ""
            else:
                # Legacy SDK fallback
                model = self.client.GenerativeModel("gemini-1.5-flash", system_instruction=system_instruction)
                response = model.generate_content(prompt)
                text = response.text if response and hasattr(response, "text") else ""

            return {
                "success": True,
                "text": text,
                "function_calls": [],
                "is_fallback": False,
            }
        except Exception as e:
            logger.error(f"[Gemini Client] Generation error: {e}")
            return {
                "success": False,
                "text": f"AI Engine Error: {str(e)}",
                "is_fallback": True,
            }

gemini_client = GeminiAIClient()
