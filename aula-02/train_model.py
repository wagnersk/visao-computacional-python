import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, confusion_matrix
import joblib
import os

def train_gesture_model(csv_path='hand_landmarks_data.csv', model_path='gesture_model.joblib', encoder_path='label_encoder.joblib'):
    if not os.path.exists(csv_path):
        print(f"Erro: O arquivo {csv_path} não foi encontrado.")
        return

    print(f"--- Carregando dados de {csv_path} ---")
    df = pd.read_csv(csv_path)
    
    # Converter handedness para numerico (Left=0, Right=1)
    if 'handedness' not in df.columns:
        print("Erro: O dataset não possui a coluna 'handedness'. Por favor, colete novos dados com o script atualizado.")
        return
    
    df['handedness'] = df['handedness'].map({'Left': 0, 'Right': 1})
    
    # Separar features (handedness + x, y, z de 0 a 20) e o label
    X = df.drop('label', axis=1)
    y = df['label']
    
    print(f"Total de amostras: {len(df)}")
    print(f"Gestos detectados: {y.unique()}")

    # Codificar as labels (ex: 'hangloose' -> 0, 'okay' -> 1)
    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)
    
    # Dividir em treino e teste (80/20)
    X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded)

    print("\n--- Treinando o Modelo (Random Forest) ---")
    # Usamos RandomForest por ser robusto e eficiente para esse tipo de dado tabular
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    # Avaliação
    y_pred = model.predict(X_test)
    
    print("\n--- Relatório de Classificação ---")
    print(classification_report(y_test, y_pred, target_names=label_encoder.classes_))

    # Salvar o modelo e o encoder
    print(f"\n--- Salvando modelo em {model_path} ---")
    joblib.dump(model, model_path)
    joblib.dump(label_encoder, encoder_path)
    
    print("Sucesso! O modelo está pronto para uso.")

if __name__ == "__main__":
    train_gesture_model()
