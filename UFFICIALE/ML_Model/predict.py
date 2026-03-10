import joblib
import numpy as np
import spacy


nlp = spacy.load("it_core_news_sm")
stopwords_it = nlp.Defaults.stop_words

"""
print("### START DEBUG ###")
print("PRINT DELLA LISTA STOP WORD:\n")
print(True if "eliminare" in stopwords_it else False)
print("### END DEBUG ###")
"""

MODEL_PRIORITA_PATH = r"C:\Users\c.porpora\Desktop\ML\PW-18\pw-18\UFFICIALE\modelli_allenati\model_priorita.pkl"
MODEL_GRUPPO_PATH = r"C:\Users\c.porpora\Desktop\ML\PW-18\pw-18\UFFICIALE\modelli_allenati\model_gruppo.pkl"
MODEL_PRIORITA = joblib.load(MODEL_PRIORITA_PATH)
MODEL_GRUPPO = joblib.load(MODEL_GRUPPO_PATH)

KEEP_FOR_EXPLAIN = {
    "attesa", "tempo", "ore", "minuti", "secondi", "giorni",
    "blocco", "errore", "mancanza", "ritardo","attualmente"
}

EXTRA_STOPWORDS = {
    "gentilmente", "saluti", "potreste", "buongiorno", "procedere" , "potete"
}

def explain_top5_filtered_for_class(ticket: str, pipe, pred: str, *,
                                    top_k=5, overfetch=50, min_len=3,
                                    only_positive=True):

    STOPWORDS_EXPLAIN = {w for w in stopwords_it if w not in KEEP_FOR_EXPLAIN}
    STOPWORDS_EXPLAIN.update(EXTRA_STOPWORDS)

    tfidf = pipe.named_steps["tfidf"]
    svm = pipe.named_steps["svm"]

    # indice classe (senza predict)
    class_idx = list(svm.classes_).index(pred)

    # vettore tf-idf del ticket
    x = tfidf.transform([ticket])

    features = tfidf.get_feature_names_out()
    w = svm.coef_[class_idx]

    idx = x.nonzero()[1]
    if idx.size == 0:
        return []

    contrib = x[0, idx].toarray().ravel() * w[idx]

    order = np.argsort(contrib)[::-1]
    cand_idx = idx[order][:min(overfetch, idx.size)]
    cand_contrib = contrib[order][:min(overfetch, idx.size)]

    top_filtered = []
    for i, c in zip(cand_idx, cand_contrib):
        if only_positive and c <= 0:
            continue

        f = features[i].strip()
        f_norm = f.lower()

        is_bigram = " " in f_norm
        is_too_short = len(f_norm) < min_len
        is_stopword = f_norm in STOPWORDS_EXPLAIN

        if is_bigram or is_too_short or is_stopword:
            continue

        top_filtered.append(f)
        if len(top_filtered) == top_k:
            break

    return top_filtered


def predict_ticket(descrizione: str) -> tuple[str, str]:
    priorita = MODEL_PRIORITA.predict([descrizione])[0]
    gruppo = MODEL_GRUPPO.predict([descrizione])[0]

    top5 = explain_top5_filtered_for_class(
        descrizione, MODEL_GRUPPO, gruppo
    )
    
    return priorita, gruppo, top5
