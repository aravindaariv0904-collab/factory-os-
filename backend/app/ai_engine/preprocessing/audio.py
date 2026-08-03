import numpy as np

class AudioPreprocessor:
    """Preprocesses acoustic noise signals into spectrogram features for non-contact sound inspection."""
    @staticmethod
    def extract_mel_spectrogram_features(audio_signal: np.ndarray, sample_rate: int = 16000) -> np.ndarray:
        """Extracts log-mel energy features from 1D audio arrays."""
        if len(audio_signal) == 0:
            return np.zeros((64, 100), dtype=np.float32)
        
        # Spectrogram simulation
        signal_len = len(audio_signal)
        features = np.reshape(np.abs(audio_signal[:min(signal_len, 6400)]), (-1, 100)) if signal_len >= 6400 else np.zeros((64, 100))
        return features.astype(np.float32)

audio_preprocessor = AudioPreprocessor()
