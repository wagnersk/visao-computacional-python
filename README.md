<div align="center">
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/Python-Dark.svg" height="40" alt="Python" />
  <img width="8" />
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/OpenCV-Dark.svg" height="40" alt="OpenCV" />
  <img width="8" />
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/JavaScript.svg" height="40" alt="JavaScript" />

  <h1>Rockit Vision</h1>
  <p><strong>Reconhecimento de gestos manuais em tempo real com visao computacional</strong></p>
</div>

---

## Sobre

Aplicacao web que captura a webcam do navegador, envia os frames via WebSocket para um backend Python e retorna a classificacao do gesto detectado em cada mao.

O pipeline usa **MediaPipe** para extrair 21 pontos 3D de cada mao e um **Random Forest** (Scikit-Learn) treinado com esses pontos para classificar o gesto.

### Gestos reconhecidos

| Gesto | Label |
|-------|-------|
| Paz | `paz` |
| Coracao | `coracao` |
| Ola | `ola` |
| Rock | `rock` |
| Hangloose | `hangloose` |
| Spock | `spock` |
| Joinha | `joinha` |

Quando as duas maos executam o mesmo gesto simultaneamente, a interface exibe um evento de **"Perfect Match"** com a imagem correspondente.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework web | [FastHTML](https://fastht.ml/) |
| Visao computacional | [OpenCV](https://opencv.org/) |
| Deteccao de maos | [MediaPipe](https://mediapipe.dev/) (Google) |
| Classificador | [Scikit-Learn](https://scikit-learn.org/) — Random Forest |
| Frontend | Vanilla JS, Canvas 2D, WebSocket API |

---

## Estrutura

```
visao-computacional-python/
├── app.py                  # Servidor FastHTML + WebSocket
├── core/
│   ├── processor.py        # GestureProcessor (MediaPipe + sklearn)
│   └── utils.py            # Encode/decode de imagens base64
├── models/
│   ├── gesture_recognizer.task   # Modelo MediaPipe
│   ├── gesture_model.joblib      # Random Forest treinado
│   └── label_encoder.joblib      # Encoder de labels
├── assets/
│   ├── style.css
│   ├── script.js
│   └── images/gestures/    # PNGs dos gestos (match)
└── requirements.txt
```

---

## Como rodar

**Requisitos:** [UV](https://github.com/astral-sh/uv), Python 3.10+ e uma webcam.  
*(Rodar com `python app.py` direto pode travar; use o uv.)*

```bash
git clone https://github.com/wagnersk/visao-computacional-python.git
cd visao-computacional-python
```

Instalar dependencias e subir o servidor:

```bash
uv sync
uv run python app.py
```

Abrir no navegador: **http://localhost:5001**

---

## Como funciona

1. O browser captura a webcam e envia cada frame como JPEG base64 via WebSocket.
2. O backend decodifica a imagem e passa pelo MediaPipe, que extrai 21 coordenadas `(x, y, z)` por mao.
3. Os 64 valores (handedness + 63 coordenadas) alimentam o Random Forest, que retorna o gesto e a confianca.
4. O servidor responde com os labels, landmarks e o frame processado.
5. O frontend desenha os landmarks no Canvas e verifica a logica de Perfect Match.

---

<div align="center">
  <sub>Feito por <strong>Wagner Sobreira</strong></sub>
</div>
