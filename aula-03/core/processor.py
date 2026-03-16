import cv2
import mediapipe as mp
import numpy as np
import os
import joblib
import warnings
import time
from typing import Tuple, List, Dict, Any

# Ignora warnings do sklearn sobre nomes de features durante a predição
warnings.filterwarnings("ignore", category=UserWarning, module="sklearn")

class GestureProcessor:
    """
    Processador de frames de vídeo para detecção de landmarks e reconhecimento de gestos manuais usando
    MediaPipe e um modelo customizado Scikit-Learn.
    """
    
    # Mapeamento de nomes de gestos previstos para arquivos locais de imagem no frontend
    ASSET_MAP: Dict[str, str] = {
        "paz": "paz.png",
        "coracao": "coracao.png",
        "ola": "ola.png",
        "rock": "rock.png",
        "hangloose": "hangloose.png",
        "spock": "spock.png",
        "joinha": "joinha.png"
    }

    def __init__(self, 
                 mp_model_path: str = "models/gesture_recognizer.task", 
                 custom_model_path: str = "models/gesture_model.joblib", 
                 encoder_path: str = "models/label_encoder.joblib") -> None:
        
        # Verifica se os modelos existem
        if not all(os.path.exists(p) for p in [mp_model_path, custom_model_path, encoder_path]):
            # Fallback para caminhos relativos se rodando de outro lugar
            base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            mp_model_path = os.path.join(base, mp_model_path)
            custom_model_path = os.path.join(base, custom_model_path)
            encoder_path = os.path.join(base, encoder_path)
            
            if not all(os.path.exists(p) for p in [mp_model_path, custom_model_path, encoder_path]):
                raise FileNotFoundError("Um ou mais arquivos de modelo não foram encontrados.")

        # Carrega o modelo customizado e o encoder de labels
        self.clf = joblib.load(custom_model_path)
        self.label_encoder = joblib.load(encoder_path)

        # Inicializa o modelo do MediaPipe Tasks
        self.BaseOptions = mp.tasks.BaseOptions
        self.GestureRecognizer = mp.tasks.vision.GestureRecognizer
        self.GestureRecognizerOptions = mp.tasks.vision.GestureRecognizerOptions
        self.VisionRunningMode = mp.tasks.vision.RunningMode

        # Configurações do MediaPipe
        self.options = self.GestureRecognizerOptions(
            base_options=self.BaseOptions(model_asset_path=mp_model_path),
            running_mode=self.VisionRunningMode.VIDEO,
            num_hands=2,
            min_hand_detection_confidence=0.5,
            min_hand_presence_confidence=0.5,
            min_tracking_confidence=0.5,
        )
        self.recognizer = self.GestureRecognizer.create_from_options(self.options)

    def process_frame(self, frame: np.ndarray) -> Tuple[np.ndarray, List[Dict[str, Any]], str]:
        """
        Recebe uma imagem BGR, processa e extrai landmarks da mão e a previsão do gesto.
        
        Args:
            frame: Imagem BGR do OpenCV (numpy array).
            
        Returns:
            Tuple contendo:
                - Imagem original não modificada.
                - Lista de dicionários contendo os labels, confiança e landmarks.
                - Nome da imagem a ser exibida como preview no frontend (se houver match duplo).
        """
        timestamp_ms = int(time.time() * 1000)
        
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
        
        recognition_result = self.recognizer.recognize_for_video(mp_image, timestamp_ms)

        labels: List[Dict[str, Any]] = []
        matched_gesture_image: str = "" 

        if recognition_result.hand_landmarks:
            for i, hand_landmarks in enumerate(recognition_result.hand_landmarks):
                hand_label = recognition_result.handedness[i][0].category_name
                handedness_val = 0 if hand_label == 'Left' else 1
                
                # Prepara os dados brutos 3D (x,y,z) para passar para o RandomForest (clf)
                landmarks_array = [handedness_val]
                for lm in hand_landmarks:
                    landmarks_array.extend([lm.x, lm.y, lm.z])
                
                features = np.array(landmarks_array).reshape(1, -1)
                
                prediction_idx = self.clf.predict(features)[0]
                prediction_prob = float(np.max(self.clf.predict_proba(features)))
                gesture_name = self.label_encoder.inverse_transform([prediction_idx])[0].lower()
                
                # Coordenadas bidimensionais essenciais para o Frontend desenhar
                lms_coords = [{"x": float(lm.x), "y": float(lm.y)} for lm in hand_landmarks]
                
                labels.append({
                    "hand": hand_label,
                    "gesture": gesture_name,
                    "confidence": prediction_prob,
                    "landmarks": lms_coords
                })

            # The "Perfect Match" Logic - Se ambas as mãos estiverem fazendo o mesmo gesto
            if len(labels) == 2:
                g1 = labels[0]["gesture"]
                g2 = labels[1]["gesture"]
                if g1 == g2 and g1 in self.ASSET_MAP:
                    matched_gesture_image = self.ASSET_MAP[g1]
        
        return frame, labels, matched_gesture_image

    def close(self) -> None:
        """Limpa e fecha as instâncias do MediaPipe na memória."""
        self.recognizer.close()
