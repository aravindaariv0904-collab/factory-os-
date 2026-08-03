import numpy as np
from typing import Tuple, List

class TimeSeriesPreprocessor:
    """Processes continuous high-frequency industrial telemetry into sliding windows and FFT spectral features."""
    @staticmethod
    def create_sliding_windows(
        data: np.ndarray, window_size: int = 50, step_size: int = 10
    ) -> Tuple[np.ndarray, List[int]]:
        """Generates 3D sliding window tensors (n_windows, window_size, n_features)."""
        windows = []
        indices = []
        n_samples = len(data)
        
        for start in range(0, n_samples - window_size + 1, step_size):
            end = start + window_size
            windows.append(data[start:end])
            indices.append(end - 1)
            
        return np.array(windows), indices

    @staticmethod
    def extract_fft_features(vibration_signal: np.ndarray) -> dict:
        """Extracts Fast Fourier Transform (FFT) peak frequency and spectral energy."""
        fft_vals = np.abs(np.fft.rfft(vibration_signal))
        peak_freq_bin = int(np.argmax(fft_vals))
        total_energy = float(np.sum(fft_vals ** 2))
        return {
            "fft_peak_freq_bin": peak_freq_bin,
            "fft_spectral_energy": round(total_energy, 2),
            "fft_max_amplitude": round(float(np.max(fft_vals)), 4),
        }

timeseries_preprocessor = TimeSeriesPreprocessor()
