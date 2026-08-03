import re
from typing import List

class TextPreprocessor:
    """Preprocesses industrial maintenance narrative logs and SOP manuals for LLM RAG ingestion."""
    @staticmethod
    def clean_text(text: str) -> str:
        text = re.sub(r"\s+", " ", text)
        return text.strip()

    @staticmethod
    def chunk_document(text: str, chunk_size: int = 250, overlap: int = 50) -> List[str]:
        words = text.split()
        chunks = []
        for i in range(0, len(words), chunk_size - overlap):
            chunk = " ".join(words[i : i + chunk_size])
            if chunk:
                chunks.append(chunk)
        return chunks or [text]

text_preprocessor = TextPreprocessor()
