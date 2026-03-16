import json
import time
from collections import deque
from fasthtml.common import *
from core.processor import GestureProcessor
from core.utils import decode_image, encode_image

app, rt = fast_app(hdrs=(
    Link(rel='preconnect', href='https://fonts.googleapis.com'),
    Link(rel='preconnect', href='https://fonts.gstatic.com', crossorigin=''),
    Link(rel='stylesheet', href='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'),
    Link(rel='stylesheet', href=f'/assets/style.css?v={time.time()}'),
    Script(src=f'/assets/script.js?v={time.time()}'),
))

print("Carregando modelo de gestos...", flush=True)
processor = GestureProcessor()
print("Modelo carregado.", flush=True)


class FPSTracker:
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


@rt("/")
def get():
    return Title("Gesture Match"), Main(
        Header(
            Div(
                Span("Gesture", cls="logo-light"), Span("Match", cls="logo-bold"),
                cls="logo"
            ),
            Span("0", id="fps-counter", cls="fps"),
            cls="topbar"
        ),
        Div(
            Video(id="video", autoplay=True, playsinline=True, muted=True, style="display:none"),
            Canvas(id="canvas"),
            Div(id="gesture-container", cls="gesture-badges"),
            Div(
                Div("Aguardando match...", id="match-status", cls="match-label"),
                Img(id="gesture-image", cls="match-img"),
                id="match-overlay", cls="match-overlay"
            ),
            cls="camera"
        ),
        Div(
            Label("Qualidade"),
            Input(type="range", id="quality-slider", min="0.1", max="1.0", step="0.05", value="0.6"),
            Span("60%", id="quality-value"),
            Span(cls="separator"),
            Label(Input(type="checkbox", id="draw-landmarks-cb", checked=True), "Landmarks"),
            cls="toolbar"
        ),
        cls="app"
    )


@app.ws("/ws")
async def ws(image: str, draw_landmarks: bool, send) -> None:
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
    print(f"Servidor iniciando em http://localhost:{port}", flush=True)
    serve(host='0.0.0.0', port=port, reload=False)
