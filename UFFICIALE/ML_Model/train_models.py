import pandas as pd
import joblib

from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report



DATA_PATH = r"C:\Users\c.porpora\Desktop\ML\PW-18\incident_categorizzati_chat.xlsx"

MODEL_PRIORITA_PATH = "model_priorita.pkl"
MODEL_GRUPPO_PATH = "model_gruppo.pkl"


def make_pipeline() -> Pipeline:
    return Pipeline([
        (
            "tfidf",
            TfidfVectorizer(
                lowercase=True,
                ngram_range=(1, 2),
                min_df=3,
                max_df=0.9,
                sublinear_tf=True
            )
        ),
        (
            "svm",
            LinearSVC(
                C=1.0,
                class_weight="balanced",
                random_state=42
            )
        )
    ])


def main() -> None:
    df = pd.read_excel(DATA_PATH)

    # pulizia per evitare crash su NaN
    df = df.dropna(subset=["Descrizione", "Priorita", "GruppoAssegnazione"])
    X = df["Descrizione"].astype(str)

    y_priorita = df["Priorita"].astype(str)
    y_gruppo = df["GruppoAssegnazione"].astype(str)

    # === TRAIN TEST SPLIT === 
    X_train, X_test, y_pr_train, y_pr_test, y_gr_train, y_gr_test = train_test_split(
        X,
        y_priorita,
        y_gruppo,
        test_size=0.2,
        random_state=42,
        stratify=y_priorita
    )

    # === PRIORITÀ ===
    pipeline_priorita = make_pipeline()
    pipeline_priorita.fit(X_train, y_pr_train)

    y_pr_pred = pipeline_priorita.predict(X_test)
    print("=== PRIORITÀ ===")
    print(classification_report(y_pr_test, y_pr_pred, zero_division=0))

    # === GRUPPO ASSEGNAZIONE ===
    pipeline_gruppo = make_pipeline()
    pipeline_gruppo.fit(X_train, y_gr_train)

    y_gr_pred = pipeline_gruppo.predict(X_test)
    print("=== GRUPPO ASSEGNAZIONE ===")
    print(classification_report(y_gr_test, y_gr_pred, zero_division=0))

    # === SALVATAGGIO MODELLI ===
    joblib.dump(pipeline_priorita, MODEL_PRIORITA_PATH)
    joblib.dump(pipeline_gruppo, MODEL_GRUPPO_PATH)

    print("\nModelli salvati:")
    print(" -", MODEL_PRIORITA_PATH)
    print(" -", MODEL_GRUPPO_PATH)


if __name__ == "__main__":
    main()