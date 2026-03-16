# Aula 03 — Rockit Vision

Esta pasta contém o **projeto da Aula 03**: aplicação web **Rockit Vision** (Gesture Match) para reconhecimento de gestos manuais em tempo real. O frontend captura a webcam no navegador, envia os frames via WebSocket para um backend Python que usa MediaPipe e o Random Forest treinado na Aula 02, e exibe o gesto detectado em cada mão e um “Perfect Match” quando as duas mãos fazem o mesmo gesto.

---

## Conteúdo

| Arquivo / Pasta | Descrição |
|-----------------|-----------|
| `app.py` | Servidor **FastHTML** que serve a página e o endpoint WebSocket `/ws` |
| `core/processor.py` | **GestureProcessor**: MediaPipe (landmarks) + modelo treinado (classificação do gesto) |
| `core/utils.py` | Encode/decode de imagens em base64 para envio pelo WebSocket |
| `models/` | Modelo MediaPipe (`gesture_recognizer.task`), Random Forest e encoder (`gesture_model.joblib`, `label_encoder.joblib`) |
| `assets/script.js` | Frontend: captura de vídeo, envio de frames, desenho de landmarks no canvas, exibição de badges e overlay “Perfect Match” |
| `assets/style.css` | Estilos da interface |
| `assets/images/gestures/` | Imagens PNG exibidas no overlay quando há match (paz, coração, olá, rock, hangloose, spock, joinha) |

---

## Pipeline (fluxo principal)

O fluxo da aplicação é: **webcam no navegador → frames via WebSocket → backend (MediaPipe + Random Forest) → resposta com labels e landmarks → frontend desenha e exibe “Perfect Match”**.

1. **Frontend (JavaScript)**  
   Captura o vídeo da webcam com `getUserMedia`, desenha no canvas e envia os frames (em base64, com qualidade configurável) para o backend via WebSocket. Recebe de volta FPS, lista de gestos por mão (com confiança) e, quando as duas mãos fazem o mesmo gesto, o nome da imagem para o overlay “Perfect Match”.

2. **Backend (FastHTML)**  
   Servidor que serve a página e a rota WebSocket `/ws`. Para cada frame recebido, decodifica a imagem, chama o `GestureProcessor` e devolve JSON com imagem (opcional), labels, `matched_gesture_image` e FPS.

3. **GestureProcessor (Python)**  
   Usa **MediaPipe Gesture Recognizer** para obter os 21 landmarks 3D de cada mão no frame; monta o vetor de features (handedness + x,y,z dos landmarks) e passa para o **Random Forest** treinado na Aula 02. Retorna a lista de gestos por mão (com confiança) e os landmarks 2D para o frontend desenhar. Se as duas mãos tiverem o mesmo gesto reconhecido no mapeamento interno, retorna o nome do arquivo PNG do overlay.

4. **Interface**  
   Exibe contador de FPS, badges por mão (E/D, nome do gesto, confiança), slider de qualidade e checkbox para ligar/desligar o desenho dos landmarks. Quando há match duplo, mostra o overlay “Perfect Match” com a imagem em `assets/images/gestures/`.

### Modelos (obrigatórios)

Os arquivos em `models/` **não** vêm no repositório (ou só parte deles). É preciso ter na pasta `models/`:

- **MediaPipe Gesture Recognizer** (Google): usado apenas para extrair os **21 landmarks 3D** da mão por frame.  
  **Link:** [MediaPipe Gesture Recognizer](https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer) — baixe o modelo (arquivo `.task`) e salve como `models/gesture_recognizer.task`.

- **Random Forest + encoder**: modelo e encoder treinados na **Aula 02** (`gesture_model.joblib`, `label_encoder.joblib`). Copie da pasta `aula-02` após rodar `train_model.py` e coloque em `aula-03/models/`.

---

## Gestos reconhecidos

Os gestos dependem do modelo e do encoder treinados na Aula 02. No código atual estão mapeados:

| Gesto   | Label      | Imagem no match |
|---------|------------|------------------|
| Paz     | `paz`      | `paz.png`        |
| Coração | `coracao`  | `coracao.png`    |
| Olá     | `ola`      | `ola.png`        |
| Rock    | `rock`     | `rock.png`       |
| Hangloose | `hangloose` | `hangloose.png` |
| Spock   | `spock`    | `spock.png`      |
| Joinha  | `joinha`   | `joinha.png`     |

Quando **as duas mãos** fazem o **mesmo gesto**, a interface mostra o overlay **“Perfect Match”** com a imagem correspondente em `assets/images/gestures/`.

---

## Requisitos

- Python 3.12+
- Webcam (para uso real); navegador com suporte a WebSocket e `getUserMedia`
- **Backend:** python-fasthtml, opencv-python, mediapipe, scikit-learn, joblib, numpy, websockets

O `uv sync` cria o ambiente virtual na pasta `.venv` (não versionada). Instalação (na pasta `aula-03`):

```bash
uv sync
```

Ou com `pip`:

```bash
pip install -r requirements.txt
```

---

## Como rodar

### 1. Colocar os modelos em `models/`

Certifique-se de ter `gesture_recognizer.task` (MediaPipe) e `gesture_model.joblib` + `label_encoder.joblib` (Aula 02) dentro de `aula-03/models/` (ver links na seção **Modelos (obrigatórios)**).

### 2. Instalar dependências

Use `uv sync` ou `pip install -r requirements.txt` conforme **Requisitos**.

### 3. Subir o servidor

```bash
uv run python app.py
```

Ou:

```bash
python app.py
```

O servidor sobe em **http://localhost:5001** (ou na porta definida pela variável de ambiente `PORT`).

### 4. Abrir no navegador

Acesse a URL exibida no terminal, permita o acesso à câmera e posicione as mãos na frente da webcam. A interface mostra o contador de FPS, os badges de gesto por mão (E/D e confiança), a opção de desenhar landmarks e de ajustar a qualidade do envio, e o overlay “Perfect Match” quando as duas mãos fazem o mesmo gesto.

