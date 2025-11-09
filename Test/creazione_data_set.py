import random
import pandas as pd

random.seed(42)

admin_keywords = ["fattura", "bonifico", "pagamento", "scadenza", "nota di credito", "IBAN", "rimborso"]
tech_keywords = ["server", "connessione", "autenticazione", "rete", "password", "utenza", "modem", "stampante"]
comm_keywords = ["ordine", "preventivo", "offerta", "contratto", "spedizione", "disponibilità", "prodotto"]

starts = [
    "Gentile assistenza,",
    "Buongiorno,",
    "Salve,",
    ""
]

problems = [
    "sto riscontrando un problema con",
    "non riesco a procedere con",
    "ho bisogno di supporto per",
    "si verifica un malfunzionamento relativo a"
]

impacts = [
    "e non posso completare il lavoro.",
    "ed è urgente risolverlo.",
    "potete verificare?",
    "mi potete aiutare?"
]

def generate_ticket(n=200):
    rows = []
    
    for _ in range(n):
        categoria = random.choice(["Amministrazione", "Tecnico", "Commerciale"])
        
        if categoria == "Amministrazione":
            kw = random.choice(admin_keywords)
        elif categoria == "Tecnico":
            kw = random.choice(tech_keywords)
        else:
            kw = random.choice(comm_keywords)

        oggetto = f"Problema relativo a {kw}"
        
        # qui gestiamo articoli e naturalezza frase
        descrizione = (
            f"{random.choice(starts)} "
            f"{random.choice(problems)} la {kw}, "
            f"{random.choice(impacts)}"
        )

        priorita = random.choices(["Bassa", "Media", "Alta"], weights=[0.3, 0.5, 0.2])[0]
        
        rows.append([oggetto, descrizione, categoria, priorita])
    
    ds = pd.DataFrame(rows, columns=["oggetto", "descrizione", "categoria", "priorita"])
    return ds

dataset = generate_ticket(500)
dataset.to_csv(r"C:\Users\User\OneDrive\Desktop\Python_git\tesi\dataset_ticket.csv", index=False)

print(dataset.sample(5))
