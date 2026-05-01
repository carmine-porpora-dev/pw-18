import pandas as pd
import joblib
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer

UFFICIALE_ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = UFFICIALE_ROOT / "dati" / "incident_categorizzati_chat.xlsx"
MODELS_DIR = UFFICIALE_ROOT / "modelli_allenati"

df = pd.read_excel(DATA_PATH)
df = df.dropna(subset=["Descrizione", "AzioneFattaInPassato"])

vectorizer = TfidfVectorizer(
    analyzer="char_wb",
    ngram_range=(3, 5),
    min_df=3,
    sublinear_tf=True
)


X = vectorizer.fit_transform(df["Descrizione"])

joblib.dump(vectorizer, MODELS_DIR / "tfidf_similarity.pkl")
joblib.dump(X, MODELS_DIR / "matrix_similarity.pkl")
joblib.dump(df, MODELS_DIR / "similarity_dataset.pkl")

print("Indice di similarità salvato")
