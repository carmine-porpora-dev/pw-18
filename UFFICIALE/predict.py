import joblib


MODEL_PRIORITA_PATH = "model_priorita.pkl"
MODEL_GRUPPO_PATH = "model_gruppo.pkl"


def predict_ticket(descrizione: str) -> tuple[str, str]:
    model_priorita = joblib.load(MODEL_PRIORITA_PATH)
    model_gruppo = joblib.load(MODEL_GRUPPO_PATH)

    priorita = model_priorita.predict([descrizione])[0]
    gruppo = model_gruppo.predict([descrizione])[0]
    return priorita, gruppo


def main() -> None:
    ticket = (
        "Salve, potreste gentilmente eliminare i file CORE1.202601202000 e "
        "CORE1.202601202000_000 presenti al path /data/dw/landing/am/CORE1/daily . "
        "Grazie Saluti"
    )

    print("Incident da analizzare:\n", ticket, "\n")

    priorita, gruppo = predict_ticket(ticket)
    print("Priorità:", priorita)
    print("Gruppo:", gruppo)


if __name__ == "__main__":
    main()
