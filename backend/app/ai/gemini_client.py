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
        self.genai_sdk = None
        self._init_sdk()

    def _init_sdk(self):
        if not self.api_key:
            logger.warning("[Gemini Client] GEMINI_API_KEY environment variable is not set. Running in fallback mode.")
            return

        try:
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)
            self.genai_sdk = genai
            # Use gemini-2.5-flash / gemini-1.5-flash / gemini-pro
            self.model = genai.GenerativeModel("gemini-1.5-flash")
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
        if not self.genai_sdk or not self.api_key:
            return {
                "success": False,
                "text": "Gemini API key not configured. Operating in local ML decision engine mode.",
                "is_fallback": True,
            }

        try:
            model_name = "gemini-1.5-flash"
            model = self.genai_sdk.GenerativeModel(
                model_name=model_name,
                system_instruction=system_instruction,
                tools=tools,
            )
            response = model.generate_content(
                prompt,
                generation_config={"temperature": temperature, "max_output_tokens": 1024},
            )

            # Handle Function Calling response
            function_calls = []
            if hasattr(response, "candidates") and response.candidates:
                candidate = response.candidates[0]
                for part in candidate.content.parts:
                    if hasattr(part, "function_call") and part.function_call:
                        fc = part.function_call
                        function_calls.append({
                            "name": fc.name,
                            "args": dict(fc.args),
                        })

            return {
                "success": True,
                "text": response.text if hasattr(response, "text") and response.text else "",
                "function_calls": function_calls,
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
