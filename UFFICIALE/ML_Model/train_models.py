import argparse
import os
from pathlib import Path

import joblib
import pandas as pd

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import (
    ConfusionMatrixDisplay,
    accuracy_score,
    classification_report,
    roc_auc_score,
    roc_curve,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import label_binarize
from sklearn.svm import LinearSVC
import matplotlib.pyplot as plt

DATA_PATH = Path(r"C:\Users\c.porpora\Desktop\ML\PW-18\incident_categorizzati_chat.xlsx")
MODEL_PRIORITA_PATH = Path(r"C:\Users\c.porpora\Desktop\ML\PW-18\pw-18\UFFICIALE\modelli_allenati\model_priorita.pkl")
MODEL_GRUPPO_PATH = Path(r"C:\Users\c.porpora\Desktop\ML\PW-18\pw-18\UFFICIALE\modelli_allenati\model_gruppo.pkl")
REPORTS_DIR = Path(r"C:\Users\c.porpora\Desktop\ML\PW-18\pw-18\UFFICIALE\ML_Model\reports")
MPL_CONFIG_DIR = REPORTS_DIR / ".matplotlib"

MPL_CONFIG_DIR.mkdir(parents=True, exist_ok=True)
os.environ["MPLCONFIGDIR"] = str(MPL_CONFIG_DIR)


TEST_SIZE = 0.2
RANDOM_STATE = 42


def make_pipeline() -> Pipeline:
    return Pipeline([
        (
            "tfidf",
            TfidfVectorizer(
                lowercase=True,
                ngram_range=(1, 2),
                min_df=3,
                max_df=0.9,
                sublinear_tf=True,
            ),
        ),
        (
            "svm",
            LinearSVC(
                C=1.0,
                class_weight="balanced",
                random_state=RANDOM_STATE,
            ),
        ),
    ])


def load_dataset() -> pd.DataFrame:
    df = pd.read_excel(DATA_PATH)
    return df.dropna(subset=["Descrizione", "Priorita", "GruppoAssegnazione"]).copy()


def split_dataset(df: pd.DataFrame):
    X = df["Descrizione"].astype(str)
    y_priorita = df["Priorita"].astype(str)
    y_gruppo = df["GruppoAssegnazione"].astype(str)

    return train_test_split(
        X,
        y_priorita,
        y_gruppo,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE,
        stratify=y_priorita,
    )


def train_and_save_models(X_train, y_pr_train, y_gr_train) -> None:
    pipeline_priorita = make_pipeline()
    pipeline_priorita.fit(X_train, y_pr_train)
    joblib.dump(pipeline_priorita, MODEL_PRIORITA_PATH)

    pipeline_gruppo = make_pipeline()
    pipeline_gruppo.fit(X_train, y_gr_train)
    joblib.dump(pipeline_gruppo, MODEL_GRUPPO_PATH)

    print("Modelli salvati:")
    print(" -", MODEL_PRIORITA_PATH)
    print(" -", MODEL_GRUPPO_PATH)


def load_models() -> dict[str, Pipeline]:
    if not MODEL_PRIORITA_PATH.exists() or not MODEL_GRUPPO_PATH.exists():
        raise FileNotFoundError(
            "Modelli non trovati. Esegui prima: python train_models.py --train"
        )

    return {
        "priorita": joblib.load(MODEL_PRIORITA_PATH),
        "gruppo_assegnazione": joblib.load(MODEL_GRUPPO_PATH),
    }


def ensure_output_dir(task_name: str) -> Path:
    output_dir = REPORTS_DIR / task_name
    output_dir.mkdir(parents=True, exist_ok=True)
    return output_dir


def save_figure(output_path: Path) -> None:
    plt.tight_layout()
    plt.savefig(output_path, dpi=150, bbox_inches="tight")
    plt.close()


def plot_class_distribution(y_full: pd.Series, output_dir: Path, task_label: str) -> None:
    counts = y_full.value_counts().sort_values(ascending=False)

    plt.figure(figsize=(12, max(4, len(counts) * 0.4)))
    counts.sort_values().plot(kind="barh", color="#4C78A8")
    plt.title(f"Distribution classi - {task_label}")
    plt.xlabel("Numero campioni")
    plt.ylabel("Classe")
    save_figure(output_dir / "distribution_classi.png")


def plot_confusion_matrix(model, X_test, y_test, output_dir: Path, task_label: str) -> None:
    fig, ax = plt.subplots(figsize=(12, 10))
    ConfusionMatrixDisplay.from_estimator(
        model,
        X_test,
        y_test,
        xticks_rotation=45,
        cmap="Blues",
        ax=ax,
        colorbar=False,
    )
    ax.set_title(f"Confusion matrix - {task_label}")
    save_figure(output_dir / "confusion_matrix.png")


def plot_accuracy(y_train, y_train_pred, y_test, y_test_pred, output_dir: Path, task_label: str) -> None:
    train_accuracy = accuracy_score(y_train, y_train_pred)
    test_accuracy = accuracy_score(y_test, y_test_pred)

    plt.figure(figsize=(6, 4))
    bars = plt.bar(["Train", "Test"], [train_accuracy, test_accuracy], color=["#59A14F", "#E15759"])
    plt.ylim(0, 1)
    plt.ylabel("Accuracy")
    plt.title(f"Accuracy train/test - {task_label}")
    for bar, value in zip(bars, [train_accuracy, test_accuracy]):
        plt.text(bar.get_x() + bar.get_width() / 2, value + 0.02, f"{value:.3f}", ha="center")
    save_figure(output_dir / "accuracy_train_test.png")


def plot_f1_per_class(report_df: pd.DataFrame, output_dir: Path, task_label: str) -> None:
    f1_scores = report_df["f1-score"].sort_values()

    plt.figure(figsize=(12, max(4, len(f1_scores) * 0.4)))
    plt.barh(f1_scores.index, f1_scores.values, color="#F28E2B")
    plt.xlim(0, 1)
    plt.xlabel("F1-score")
    plt.ylabel("Classe")
    plt.title(f"F1-score per classe - {task_label}")
    save_figure(output_dir / "f1_per_classe.png")


def plot_f1_summary(report_df: pd.DataFrame, output_dir: Path, task_label: str) -> None:
    macro_f1 = report_df.loc["macro avg", "f1-score"]
    weighted_f1 = report_df.loc["weighted avg", "f1-score"]

    plt.figure(figsize=(6, 4))
    bars = plt.bar(
        ["F1 macro", "F1 weighted"],
        [macro_f1, weighted_f1],
        color=["#B07AA1", "#FF9DA7"],
    )
    plt.ylim(0, 1)
    plt.ylabel("F1-score")
    plt.title(f"F1 macro / weighted - {task_label}")
    for bar, value in zip(bars, [macro_f1, weighted_f1]):
        plt.text(bar.get_x() + bar.get_width() / 2, value + 0.02, f"{value:.3f}", ha="center")
    save_figure(output_dir / "f1_macro_weighted.png")


def plot_precision_recall(report_df: pd.DataFrame, output_dir: Path, task_label: str) -> None:
    pr_df = report_df[["precision", "recall"]].sort_index()
    positions = range(len(pr_df))

    plt.figure(figsize=(12, max(4, len(pr_df) * 0.45)))
    plt.barh([p + 0.2 for p in positions], pr_df["precision"], height=0.4, label="Precision", color="#76B7B2")
    plt.barh([p - 0.2 for p in positions], pr_df["recall"], height=0.4, label="Recall", color="#EDC948")
    plt.xlim(0, 1)
    plt.yticks(list(positions), pr_df.index)
    plt.xlabel("Score")
    plt.ylabel("Classe")
    plt.title(f"Precision / Recall - {task_label}")
    plt.legend()
    save_figure(output_dir / "precision_recall.png")


def plot_feature_importance(model, output_dir: Path, task_label: str, top_n: int = 15) -> None:
    tfidf = model.named_steps["tfidf"]
    svm = model.named_steps["svm"]

    feature_names = tfidf.get_feature_names_out()
    coefficients = svm.coef_

    if len(coefficients.shape) == 1:
        importance = abs(coefficients)
    else:
        importance = abs(coefficients).mean(axis=0)

    top_indices = importance.argsort()[-top_n:]
    top_features = feature_names[top_indices]
    top_scores = importance[top_indices]

    order = top_scores.argsort()
    ordered_features = top_features[order]
    ordered_scores = top_scores[order]

    plt.figure(figsize=(12, max(4, top_n * 0.35)))
    plt.barh(ordered_features, ordered_scores, color="#9C755F")
    plt.xlabel("Importanza media assoluta")
    plt.ylabel("Feature")
    plt.title(f"Feature importance - {task_label}")
    save_figure(output_dir / "feature_importance.png")


def plot_roc_auc(model, X_test, y_test, output_dir: Path, task_label: str) -> None:
    classifier = model.named_steps["svm"]
    classes = list(classifier.classes_)
    y_score = model.decision_function(X_test)

    if len(classes) < 2:
        return

    y_test_bin = label_binarize(y_test, classes=classes)
    if len(classes) == 2:
        y_test_bin = y_test_bin[:, 0]

    plt.figure(figsize=(9, 7))

    if len(classes) == 2:
        if len(set(y_test_bin)) < 2:
            plt.close()
            return
        fpr, tpr, _ = roc_curve(y_test_bin, y_score)
        auc_value = roc_auc_score(y_test_bin, y_score)
        plt.plot(fpr, tpr, label=f"AUC = {auc_value:.3f}", color="#4E79A7")
    else:
        plotted = False
        for class_name, class_index in zip(classes, range(len(classes))):
            class_truth = y_test_bin[:, class_index]
            if len(set(class_truth)) < 2:
                continue

            class_auc = roc_auc_score(class_truth, y_score[:, class_index])
            fpr, tpr, _ = roc_curve(class_truth, y_score[:, class_index])
            plt.plot(fpr, tpr, label=f"{class_name} (AUC = {class_auc:.3f})")
            plotted = True

        if not plotted:
            plt.close()
            return

    plt.plot([0, 1], [0, 1], linestyle="--", color="gray", linewidth=1)
    plt.xlabel("False Positive Rate")
    plt.ylabel("True Positive Rate")
    plt.title(f"ROC / AUC - {task_label}")
    plt.legend(loc="lower right", fontsize=8)
    save_figure(output_dir / "roc_auc.png")


def save_metrics_table(report_df: pd.DataFrame, output_dir: Path) -> None:
    report_df.to_csv(output_dir / "metriche_per_classe.csv", index_label="classe")


def evaluate_task(task_key: str, task_label: str, model, X_train, X_test, y_train, y_test, y_full) -> None:
    output_dir = ensure_output_dir(task_key)

    y_train_pred = model.predict(X_train)
    y_test_pred = model.predict(X_test)

    full_report = classification_report(y_test, y_test_pred, zero_division=0, output_dict=True)
    report_df = pd.DataFrame(full_report).transpose()
    class_report_df = report_df.reindex(model.named_steps["svm"].classes_, fill_value=0.0)

    print(f"\n=== {task_label.upper()} ===")
    print(classification_report(y_test, y_test_pred, zero_division=0))

    plot_class_distribution(y_full, output_dir, task_label)
    plot_confusion_matrix(model, X_test, y_test, output_dir, task_label)
    plot_accuracy(y_train, y_train_pred, y_test, y_test_pred, output_dir, task_label)
    plot_f1_per_class(class_report_df, output_dir, task_label)
    plot_f1_summary(report_df, output_dir, task_label)
    plot_precision_recall(class_report_df, output_dir, task_label)
    plot_feature_importance(model, output_dir, task_label)
    plot_roc_auc(model, X_test, y_test, output_dir, task_label)
    save_metrics_table(class_report_df, output_dir)

    print(f"Grafici salvati in: {output_dir}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Allena i modelli oppure genera i grafici di valutazione usando i modelli salvati."
    )
    parser.add_argument(
        "--train",
        action="store_true",
        help="Allena i modelli e li salva su disco.",
    )
    parser.add_argument(
        "--skip-reports",
        action="store_true",
        help="Se usato con --train, evita la generazione dei grafici.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    df = load_dataset()

    X_train, X_test, y_pr_train, y_pr_test, y_gr_train, y_gr_test = split_dataset(df)

    if args.train:
        train_and_save_models(X_train, y_pr_train, y_gr_train)

    if args.train and args.skip_reports:
        return

    models = load_models()

    evaluate_task(
        "priorita",
        "Priorita",
        models["priorita"],
        X_train,
        X_test,
        y_pr_train,
        y_pr_test,
        df["Priorita"].astype(str),
    )
    evaluate_task(
        "gruppo_assegnazione",
        "Gruppo assegnazione",
        models["gruppo_assegnazione"],
        X_train,
        X_test,
        y_gr_train,
        y_gr_test,
        df["GruppoAssegnazione"].astype(str),
    )


if __name__ == "__main__":
    main()
