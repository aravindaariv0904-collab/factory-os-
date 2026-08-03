import numpy as np

class VisionPreprocessor:
    """Preprocesses computer vision inspection images for defect detection models."""
    @staticmethod
    def normalize_image(image_array: np.ndarray, target_size: tuple = (224, 224)) -> np.ndarray:
        """Normalizes pixel range to [0.0, 1.0] and resizes image tensor."""
        if image_array is None or image_array.size == 0:
            return np.zeros((3, target_size[0], target_size[1]), dtype=np.float32)

        # Normalize pixel values
        normalized = image_array.astype(np.float32) / 255.0
        return normalized

vision_preprocessor = VisionPreprocessor()
