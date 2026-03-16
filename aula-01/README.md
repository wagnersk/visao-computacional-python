# Aula 01 — Modelo de algoritmo

Esta pasta contém o material da **Aula 01**, focada no **modelo de algoritmo**: implementação e visualização de uma arquitetura clássica de rede neural convolucional (LeNet-5) em PyTorch, com ênfase em camadas, filtros e na ideia de como a visão computacional processa imagens.

---

## Conteúdo

| Arquivo | Descrição |
|---------|-----------|
| `lenet5.ipynb` | Implementação da arquitetura **LeNet-5** em PyTorch e visualização dos filtros da primeira camada |

---

## LeNet-5 (fluxo principal)

O fluxo da aula é: **arquitetura clássica (LeNet-5) → implementação em PyTorch → visualização dos filtros**.

1. **Arquitetura LeNet-5**  
   Rede neural convolucional histórica: entrada 32×32 (1 canal), camadas convolucionais e de pooling, depois camadas totalmente conectadas até 10 classes (ex.: dígitos MNIST). Serve de base para entender como modelos de visão computacional são estruturados (neurônios, filtros, extração de features).

2. **Extrator de features (convolucional)**  
   No notebook: `Conv2d(1 → 6, 5×5)` → ReLU → MaxPool(2); `Conv2d(6 → 16, 5×5)` → ReLU → MaxPool(2); `Conv2d(16 → 120, 5×5)` → ReLU. A importância do padding para manter dimensões também é discutida no curso.

3. **Classificador (totalmente conectado)**  
   `Linear(120 → 84)` → ReLU; `Linear(84 → 10)` (logits para 10 classes).

4. **O que o notebook faz**  
   Define a classe `LeNet5` com `feature_extractor` e `classifier` em PyTorch; instancia o modelo e plota os pesos (filtros) da primeira camada convolucional após a inicialização, antes de qualquer treinamento (padrões aleatórios). Opcionalmente, treino com MNIST e análise de performance/erros podem ser abordados no curso.

### Referência da arquitetura

A **LeNet-5** é de Yann LeCun et al.; a documentação e os detalhes da arquitetura estão em:

- **Link:** [LeNet-5 – LeCun et al.](https://yann.lecun.com/exdb/lenet/)

---

## Requisitos

- Python 3.x (o projeto pode usar `pyproject.toml` ou ambiente próprio)
- **Notebook:** PyTorch (`torch`, `torchvision`), NumPy, Matplotlib

Instalação com `uv` (se houver `pyproject.toml` na pasta):

```bash
uv sync
```

Ou com `pip`:

```bash
pip install torch torchvision numpy matplotlib
```

---

## Como rodar

### 1. Instalar dependências

Use `uv sync` ou `pip install` conforme a seção **Requisitos** acima.

### 2. Abrir e executar o notebook

```bash
jupyter notebook lenet5.ipynb
```

Ou use Jupyter Lab / VS Code com suporte a notebooks. Execute as células na ordem para carregar o modelo, (opcionalmente) treinar com MNIST e visualizar os filtros da primeira camada.

---

## Relação com o curso

- **Aula 01** (esta pasta): fundamentos do **modelo de algoritmo** — arquitetura LeNet-5, camadas convolucionais e de pooling, padding, visualização de filtros; opcionalmente treino com MNIST e análise de erros.
- **Aula 02:** treinamento do modelo de gestos (coleta de landmarks com MediaPipe, dataset próprio, Random Forest) e notebooks com modelos pré-treinados (CLIPSeg, YOLO, timm, Gemini).
- **Aula 03:** projeto **Rockit Vision** — aplicação web que usa o pipeline de gestos (MediaPipe + modelo treinado na Aula 02) em tempo real via WebSocket.
