# Aula 02 — Treinamento do modelo de gestos

Esta pasta contém o material da **Aula 02**, focada no **treinamento de um classificador de gestos**: coleta de landmarks da mão com MediaPipe, treinamento de um modelo customizado (Random Forest) e reconhecimento em tempo real pela webcam. Inclui também notebooks com modelos pré-treinados (segmentação, detecção, classificação).

---

## Conteúdo

| Arquivo | Descrição |
|---------|-----------|
| `collect_landmarks.py` | Coleta de **landmarks** da mão via webcam usando MediaPipe; salva em CSV por gesto (label) |
| `train_model.py` | Treina um **Random Forest** a partir do CSV de landmarks e salva o modelo (.joblib) e o encoder de labels |
| `webcam_recog.py` | Reconhecimento em tempo real: usa MediaPipe para landmarks + modelo treinado para classificar o gesto |
| `hand_landmarks_data.csv` | Dataset de landmarks (label, handedness, x/y/z dos 21 pontos); gerado pelo script de coleta |
| `segmentation_clipseg.ipynb` | Segmentação de imagens com **CLIPSeg** (Hugging Face) |
| `detection_yolos.ipynb` | Detecção de objetos com **YOLO** |
| `classifier_timm.ipynb` | Classificação de imagens com modelos **timm** (ex.: MobileNet) |
| `gemini_vision.ipynb` | Uso de **Gemini Vision** para análise de imagens |

---

## Modelo de gestos (fluxo principal)

O fluxo da aula é: **MediaPipe (landmarks) → seus dados → Random Forest (gestos customizados)**.

1. **MediaPipe Gesture Recognizer** (Google)  
   Fornece os **21 landmarks 3D** da mão por frame. O arquivo `gesture_recognizer.task` é usado apenas para extrair esses pontos; a classificação de gestos é feita pelo modelo que você treina.

2. **Coleta**  
   Para cada gesto (ex.: `peace`, `rock`, `hangloose`), rode o coletor com um `--label` e grave amostras (uma por vez com `s` ou contínuo com `r`). Os dados vão para um CSV com colunas: `label`, `handedness`, `x0`–`z20`.

3. **Treino**  
   O script lê o CSV, codifica as labels, treina um **Random Forest** (Scikit-Learn) e salva `gesture_model.joblib` e `label_encoder.joblib`.

4. **Reconhecimento**  
   O script de webcam usa MediaPipe para obter os landmarks de cada frame e o modelo treinado para prever o gesto e exibir na tela.

### Modelo MediaPipe (obrigatório)

O arquivo `gesture_recognizer.task` **não** vem no repositório. É preciso baixar o modelo do MediaPipe e colocar na pasta `aula-02`:

- **Link:** [MediaPipe Gesture Recognizer](https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer)  
- Na documentação, baixe o modelo **Gesture Recognizer** (arquivo `.task`) e salve como `gesture_recognizer.task` nesta pasta.

---

## Requisitos

- Python 3.x (o projeto usa `pyproject.toml` e pode ser executado com `uv`)
- **Scripts de gestos:** OpenCV, MediaPipe, Pandas, Scikit-Learn, Joblib
- **Notebooks:** além dos acima, podem usar PyTorch, Transformers, timm, Google GenAI (conforme cada notebook)

O `uv sync` cria o ambiente virtual na pasta `.venv` (não versionada). Instalação (na pasta `aula-02`):

```bash
uv sync
```

Ou com `pip`:

```bash
pip install opencv-python mediapipe pandas scikit-learn joblib
```

---

## Como rodar

### 1. Baixar o modelo MediaPipe

Coloque `gesture_recognizer.task` na pasta `aula-02` (ver link acima).

### 2. Coletar dados para cada gesto

Para um gesto por vez (ex.: `peace`, `rock`, `hangloose`):

```bash
python collect_landmarks.py --label peace
python collect_landmarks.py --label rock --output hand_landmarks_data.csv
```

- **`s`** — salva uma amostra  
- **`r`** — inicia/para gravação contínua  
- **`q`** — sair  

O CSV padrão é `hand_landmarks_data.csv`; pode usar `--output` para outro arquivo.

### 3. Treinar o modelo

```bash
python train_model.py
```

Por padrão lê `hand_landmarks_data.csv` e gera `gesture_model.joblib` e `label_encoder.joblib`.

### 4. Reconhecimento em tempo real

```bash
python webcam_recog.py
```

Pressione **`q`** para sair.

### Notebooks

Abra no Jupyter ou no VS Code:

```bash
jupyter notebook
```

Execute os notebooks desejados (`segmentation_clipseg.ipynb`, `detection_yolos.ipynb`, `classifier_timm.ipynb`, `gemini_vision.ipynb`). Alguns podem precisar de chave de API (ex.: Gemini) ou modelos adicionais; veja as células iniciais de cada um.

---

## Relação com o curso

- **Aula 01:** modelo de algoritmo (LeNet-5, filtros, visão computacional).
- **Aula 02** (esta pasta): treino do **modelo de gestos** — landmarks com MediaPipe, dataset próprio, Random Forest; mais notebooks com modelos pré-treinados (CLIPSeg, YOLO, timm, Gemini).
- **Aula 03:** projeto **Rockit Vision** — uso do fluxo de gestos (MediaPipe + modelo treinado ou reconhecedor integrado) na aplicação web.
