import joblib
from sklearn.metrics.pairwise import cosine_similarity

#vectorizer = joblib.load(r"C:\Users\c.porpora\Desktop\ML\PW-18\pw-18\UFFICIALE\modelli_allenati\tfidf_similarity.pkl")
#X = joblib.load(r"C:\Users\c.porpora\Desktop\ML\PW-18\pw-18\UFFICIALE\modelli_allenati\matrix_similarity.pkl")
#df = joblib.load(r"C:\Users\c.porpora\Desktop\ML\PW-18\pw-18\UFFICIALE\modelli_allenati\similarity_dataset.pkl")

vectorizer = joblib.load(r"C:\Users\c.porpora\Desktop\ML\PW-18\tfidf_similarity.pkl")
X = joblib.load(r"C:\Users\c.porpora\Desktop\ML\PW-18\matrix_similarity.pkl")
df = joblib.load(r"C:\Users\c.porpora\Desktop\ML\PW-18\similarity_dataset.pkl")

def suggerisci_azione(descrizione, gruppo_predetto, soglia=0.25):
    df_g = df[df["GruppoAssegnazione"] == gruppo_predetto]
    if df_g.empty:
        return "Nessuna azione: gruppo senza storico"

    pos = df.index.get_indexer(df_g.index)   # label -> posizione
    pos = pos[pos >= 0]
    if len(pos) == 0:
        return "Nessuna azione: indici non allineati"

    X_g = X[pos]

    q = vectorizer.transform([descrizione])
    sims = cosine_similarity(q, X_g)[0]

    best_local = sims.argmax()
    best_score = sims[best_local]

    if best_score < soglia:
        return "Nessuna azione consigliata"

    best_pos = pos[best_local]
    return df.iloc[best_pos]["AzioneFattaInPassato"]