<div align="center">
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/Python-Dark.svg" height="40" alt="Python logo" />
  <img width="12" />
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/JavaScript.svg" height="40" alt="JavaScript logo" />
  <img width="12" />
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/OpenCV-Dark.svg" height="40" alt="OpenCV logo" />
  <br>
  <h1>🚀 Rockit Vision</h1>
  <p><strong>Intelligent Hand Gesture Recognition System in Real-Time</strong></p>
  
  <p>
    <a href="#about">About</a> •
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#installation">Installation</a> •
    <a href="#how-it-works">How it Works</a>
  </p>
</div>

---

## 🧠 About
**Rockit Vision** is a state-of-the-art computer vision web application designed to detect and classify hand gestures in real-time. Built entirely with Python on the backend and pure Vanilla JS and HTML Canvas on the frontend, this project demonstrates high-performance, low-latency video processing using WebSockets.

This application is capable of reading a webcam feed, tracking up to 21 neural landmak points per hand, and predicting exact gestures using a Custom Machine Learning Model trained with **Scikit-Learn** and powered by Google's **MediaPipe**.

## ✨ Features
-   🎥 **Real-Time Processing:** Zero-latency webcam feed streamed dynamically to the python backend via WebSockets.
-   🖖 **Gesture Classification:** Detects gestures like 'Peace', 'Heart', 'Rock', 'Spock', and 'Hangloose'.
-   👯 **"The Perfect Match" Logic:** When two hands execute the identical gesture simultaneously, the UI responds with a premium visual match event.
-   ⚡ **High Performance Design:** Client-side Canvas rendering offloads graphical work from the server.
-   🎛️ **Live Data & Controls:** Built-in FPS tracking, dynamic JPEG compression slider, and toggleable visual neural landmarks.

## 🛠 Tech Stack

**Core Backend:**
*   [FastHTML](https://fastht.ml/) - The modern framework for fast python Web Apps.
*   [OpenCV](https://opencv.org/) - Industry standard for live Computer Vision matrix analysis.
*   [MediaPipe](https://mediapipe.dev/) - By Google, for precise 3D Hand Tracking.
*   [Scikit-Learn](https://scikit-learn.org/) - Random Forest classifier for custom gesture inference.

**Frontend:**
*   Vanilla JS (`WebSocket` API, `requestAnimationFrame`, `Canvas 2D API`).
*   Modern Vanilla CSS (Glassmorphism, Flexbox Grids, Radial Gradients).

---

## 🚀 Installation & Local Setup

### 1. Requirements
-   Python 3.10+
-   [UV Package Manager](https://github.com/astral-sh/uv) *(Recommended)* or standard `pip`.
-   A working Webcam.

### 2. Clone the repository
```bash
git clone https://github.com/wagnersk/visao-computacional-python.git
cd visao-computacional-python
```

### 3. Install dependencies
Using UV (Blazing Fast):
```bash
uv pip install -r requirements.txt --system
```
*Or using standard pip:*
```bash
pip install -r requirements.txt
```

### 4. Run the Application
Start the FastHTML server:
```bash
python app.py
```
Open your browser and navigate to:
👉 **`http://localhost:5001`**

---

## ⚙️ How It Works (Architecture)
1.  **Client-Side Capture:** The browser captures the webcam via `navigator.mediaDevices` and paints the invisible video to an offscreen Canvas.
2.  **WebSockets Transmission:** Compresses the frame into a JPEG Base64 string and sends it instantly to the Python Backend.
3.  **Inference:** The `core/processor.py` intercepts the frame. MediaPipe extracts 21x `(X,Y,Z)` coordinates if hands are found. These 63 data points per hand are fed into the Scikit-Learn `.joblib` model.
4.  **Feedback Loop:** The Python server replies via WebSocket with the analyzed text features (Confidence, Hands side, Gesture Name) and the processed frame.
5.  **Rendering:** JavaScript overlays the neural connections locally via `ctx.arc()` and processes the 'Perfect Match' logic when needed.

---
<div align="center">
  <p>Built with 💻 and ☕ by <strong>Wagner Sobreira</strong>.</p>
</div>
