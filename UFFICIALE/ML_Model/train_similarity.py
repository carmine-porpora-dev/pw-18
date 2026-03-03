import pandas as pd
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer

DATA_PATH = r"C:\Users\c.porpora\Desktop\ML\PW-18\incident_categorizzati_chat.xlsx"

df = pd.read_excel(DATA_PATH)
df = df.dropna(subset=["Descrizione", "AzioneFattaInPassato"])

vectorizer = TfidfVectorizer(
    analyzer="char_wb",
    ngram_range=(3, 5),
    min_df=3,
    sublinear_tf=True
)


X = vectorizer.fit_transform(df["Descrizione"])

joblib.dump(vectorizer, "tfidf_similarity.pkl")
joblib.dump(X, "matrix_similarity.pkl")
joblib.dump(df, "similarity_dataset.pkl")

print("Indice di similarità salvato")