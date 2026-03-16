import cv2
import base64
import numpy as np
import logging
from typing import Optional

# Configura logger simples para utilitários
logger = logging.getLogger(__name__)

def decode_image(base64_string: str) -> Optional[np.ndarray]:
    """
    Decodifica uma string de imagem em base64 e retorna uma matriz BGR (OpenCV) do numpy.
    Se a conversão falhar, retorna None.
    """
    try:
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        img_data = base64.b64decode(base64_string)
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img
    except Exception as e:
        logger.error(f"Failed to decode image: {e}")
        return None

def encode_image(frame: np.ndarray, quality: int = 60) -> str:
    """
    Codifica uma matriz BGR (OpenCV) do numpy para uma string base64 JPEG.
    Em caso de falha, retorna uma string vazia.
    """
    try:
        _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, quality])
        return base64.b64encode(buffer).decode('utf-8')
    except Exception as e:
        logger.error(f"Failed to encode image: {e}")
        return ""
