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
    """Retorna o cabeçalho principal focando no novo jogo."""
    return Header(
        H1("🍉 Rockit Ninja", style="color: #ff3366; text-shadow: 0 0 10px rgba(255, 51, 102, 0.5);"),
        P("Slash the fruits with your bare hands!", cls="subtitle")
    )

def render_tabs() -> FT:
    """Retorna a barra de navegação de modos do aplicativo."""
    return Div(
        Button("🍉 Fruit Ninja", id="tab-ninja", cls="tab-btn active"),
        Button("✋ Gesture Match", id="tab-gestures", cls="tab-btn"),
        Button("🚀 Coming Soon", id="tab-soon", cls="tab-btn", disabled=True),
        cls="tabs-container"
    )

def render_vision_section() -> FT:
    """Seção principal: Canvas em destaque com alternância HUD via abas."""
    return Div(
        render_tabs(),
        Div(
            Video(id="video", autoplay=True, playsinline=True, muted=True, style="display:none"),
            
            # HUD Ninja
            Div(
                Div("SCORE: 0", id="game-score", cls="game-score-badge"),
                Div("LIVES: 🍉🍉🍉", id="game-lives", cls="game-lives-badge"),
                id="hud-ninja", cls="game-hud"
            ),
            
            # HUD Gesture Match
            Div(
                H3("Gesture Match", style="color:var(--secondary); margin-bottom: 0.5rem;"),
                Div("Waiting for match...", id="match-status", cls="match-status", style="font-weight: 700; font-size: 1.2rem;"),
                Div(Img(id="gesture-image", style="max-height: 180px; opacity: 0; transition: opacity 0.3s;"), cls="gesture-preview-box"),
                id="hud-gestures", cls="hud-gestures-overlay hidden"
            ),
            
            Canvas(id="canvas", style="width: 100%; border-radius: 16px;"),
            
            # Tela de Game Over Sobreposta Invisível por padrão
            Div(
                H2("GAME OVER", style="color: #ff3366; font-size: 3rem; margin-bottom: 1rem;"),
                P("Final Score: ", Span("0", id="final-score", style="font-weight: bold;")),
                Button("PLAY AGAIN", id="btn-restart", cls="btn-replay"),
                id="game-over-screen",
                cls="game-over-overlay hidden"
            ),
            
            cls="vision-card shared-canvas-container"
        ),
        cls="vision-grid game-grid"
    )

def render_controls_section() -> FT:
    """Controles técnicos mínimos na parte inferior."""
    return Div(
        # Coluna Técnica
        Div(
            H3("Game Engine Info"),
            Div("FPS: 0", id="fps-counter", cls="fps-badge", style="position:static; transform:none; display:inline-block; margin-bottom: 1rem;"),
            Div(id="gesture-container", style="font-size: 0.8rem; opacity: 0.7;"),
            cls="info-card"
        ),
        # Controles
        Div(
            H3("Performance & Vision"),
            Div(
                Label("Engine Camera Quality"),
                Div(
                    Input(type="range", id="quality-slider", min="0.1", max="1.0", step="0.05", value="0.5"),
                    Span("50%", id="quality-value"),
                    cls="quality-control"
                ),
                style="margin-bottom: 1.5rem"
            ),
            Div(
                Label(Input(type="checkbox", id="draw-landmarks-cb", checked=False), " Visualize Neural Tracking (Debug)"),
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
