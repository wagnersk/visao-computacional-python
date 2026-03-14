import json
import time
from collections import deque
from fasthtml.common import *
from core.processor import GestureProcessor
from core.utils import decode_image, encode_image

app, rt = fast_app(hdrs=(
    Link(rel='stylesheet', href=f'/assets/style.css?v={time.time()}'),
    Script(src=f'/assets/script.js?v={time.time()}'),
))
processor = GestureProcessor()

class FPSTracker:
    """Rastreador de FPS utilizando média móvel para resultados mais estáveis."""
    def __init__(self, window_size: int = 30) -> None:
        self.times = deque(maxlen=window_size)
        
    def update(self) -> int:
        curr = time.time()
        self.times.append(curr)
        if len(self.times) > 1:
            diff = self.times[-1] - self.times[0]
            if diff > 0:
                return int((len(self.times) - 1) / diff)
        return 0

fps_tracker = FPSTracker()

def render_header() -> FT:
    """Retorna o cabeçalho principal da aplicação."""
    return Header(
        H1("Rockit Vision"),
        P("Intelligent Hand Gesture Recognition System", cls="subtitle")
    )

def render_vision_section() -> FT:
    """Retorna a seção principal contendo o feed de câmera e a área de match."""
    return Div(
        Div(
            Video(id="video", autoplay=True, playsinline=True, muted=True, style="display:none"),
            Canvas(id="canvas"),
            Div("FPS: 0", id="fps-counter", cls="fps-badge"),
            cls="vision-card"
        ),
        Div(
            H3("Gesture Match"),
            Div("Waiting for match...", id="match-status", cls="match-status"),
            Div(Img(id="gesture-image"), cls="gesture-preview-box"),
            id="match-card", cls="match-card"
        ),
        cls="vision-grid"
    )

def render_controls_section() -> FT:
    """Retorna a seção inferior com dados analíticos e controles visuais."""
    return Div(
        # Coluna 1: Dados em tempo real
        Div(
            H3("Live Feed Data"),
            Div(id="gesture-container"),
            cls="info-card"
        ),
        # Coluna 2: Configurações
        Div(
            H3("Performance & View"),
            Div(
                Label("Image Quality"),
                Div(
                    Input(type="range", id="quality-slider", min="0.1", max="1.0", step="0.05", value="0.6"),
                    Span("60%", id="quality-value"),
                    cls="quality-control"
                ),
                style="margin-bottom: 1.5rem"
            ),
            Div(
                Label(Input(type="checkbox", id="draw-landmarks-cb", checked=True), " Visualize Neural Landmarks"),
                cls="settings-control"
            ),
            cls="info-card"
        ),
        cls="controls-section"
    )

@rt("/")
def get():
    """Rota principal, monta e renderiza a interface FastHTML."""
    return Title("Rockit Vision — AI Hand Gesture Recognition"), Main(
        render_header(),
        Div(
            render_vision_section(),
            render_controls_section(),
            cls="main-content"
        ),
        cls="app-container"
    )

@app.ws("/ws")
async def ws(image: str, draw_landmarks: bool, send) -> None:
    """Websocket Handler: Recebe frames da câmera, processa na IA e retorna os resultados e a imagem."""
    img = decode_image(image)
    if img is not None:
        processed_img, labels, matched_gesture_image = processor.process_frame(img)
        fps = fps_tracker.update()
        await send(json.dumps({
            "image": encode_image(processed_img),
            "labels": labels,
            "matched_gesture_image": matched_gesture_image,
            "fps": fps
        }))

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5001))
    serve(host='0.0.0.0', port=port)
