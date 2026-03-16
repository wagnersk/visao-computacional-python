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

## O que tem no repositório (3 aulas)

| Pasta | Conteúdo |
|-------|----------|
| **aula-01/** | Modelo de algoritmo: implementação da **LeNet-5** em PyTorch, treino com MNIST e visualização dos filtros. Ver [aula-01/README.md](aula-01/README.md). |
| **aula-02/** | Treino do classificador de gestos: coleta de landmarks com **MediaPipe**, dataset em CSV, **Random Forest** (Scikit-Learn) e reconhecimento pela webcam; mais notebooks (CLIPSeg, YOLO, timm, Gemini). Ver [aula-02/README.md](aula-02/README.md). |
| **aula-03/** | **Rockit Vision** (este projeto): app web com FastHTML + WebSocket que usa o pipeline da aula-02 em tempo real. Ver [aula-03/README.md](aula-03/README.md). |

---

## Sobre (projeto Aula 03 — Rockit Vision)

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

## Estrutura (projeto Aula 03 — Rockit Vision)

```
visao-computacional-python/
├── aula-01/                # LeNet-5, PyTorch, MNIST (ver README da pasta)
├── aula-02/                # Coleta + treino de gestos, MediaPipe, Random Forest (ver README da pasta)
└── aula-03/                # Rockit Vision — app web
    ├── app.py              # Servidor FastHTML + WebSocket
    ├── core/
    │   ├── processor.py    # GestureProcessor (MediaPipe + sklearn)
    │   └── utils.py        # Encode/decode de imagens base64
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

O comando `uv sync` cria um ambiente virtual na pasta **`.venv`** (não versionada; está no `.gitignore`). Quem clonar o repositório deve rodar `uv sync` para recriar o ambiente.

```bash
git clone https://github.com/wagnersk/visao-computacional-python.git
cd visao-computacional-python/aula-03
```

Instalar dependencias e subir o servidor (o app Rockit Vision fica em `aula-03/`):

```bash
uv sync
uv run python app.py
```


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
