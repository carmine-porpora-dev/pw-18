import random
import pandas as pd
import re
from collections import defaultdict

random.seed(42)

# --- 1) Vocabolario strutturato: (keyword, articolo, category_suggest, typical_priority_signal)
KEYWORDS = {
    "fattura":      {"art":"la", "cat":"Amministrazione", "prio":"Media"},
    "bonifico":     {"art":"il", "cat":"Amministrazione", "prio":"Media"},
    "pagamento":    {"art":"il", "cat":"Amministrazione", "prio":"Alta"},
    "scadenza":     {"art":"la", "cat":"Amministrazione", "prio":"Alta"},
    "nota di credito":{"art":"la","cat":"Amministrazione","prio":"Media"},
    "IBAN":         {"art":"l'", "cat":"Amministrazione", "prio":"Media"},
    "server":       {"art":"il", "cat":"Tecnico", "prio":"Alta"},
    "connessione":  {"art":"la", "cat":"Tecnico", "prio":"Alta"},
    "autenticazione":{"art":"l'","cat":"Tecnico","prio":"Alta"},
    "rete":         {"art":"la", "cat":"Tecnico", "prio":"Alta"},
    "password":     {"art":"la", "cat":"Tecnico", "prio":"Media"},
    "modem":        {"art":"il", "cat":"Tecnico", "prio":"Media"},
    "ordine":       {"art":"l'", "cat":"Commerciale", "prio":"Media"},
    "preventivo":   {"art":"il", "cat":"Commerciale", "prio":"Bassa"},
    "offerta":      {"art":"l'", "cat":"Commerciale", "prio":"Bassa"},
    "spedizione":   {"art":"la", "cat":"Commerciale", "prio":"Media"},
    "disponibilità":{"art":"la", "cat":"Commerciale", "prio":"Bassa"},
}

# --- 2) Liste di template variabili (più varianti = più naturalezza)
starts = ["Gentile assistenza,", "Buongiorno,", "Salve,", ""]
problems = [
    "sto riscontrando un problema con",
    "non riesco a procedere con",
    "ho bisogno di supporto per",
    "si verifica un malfunzionamento relativo a",
    "c'è un'anomalia su"
]
impacts = [
    "e non posso completare il lavoro.",
    "ed è urgente risolverlo.",
    "potete verificare?",
    "mi potete aiutare?",
    "chiedo intervento urgente."
]
extra_sentences = [
    "",
    "Il ticket è aperto da questa mattina.",
    "Ho provato a riavviare senza successo.",
    "Allego screenshot se necessario."
]

# indicatori di urgenza che forzano priorità alta
urgency_tokens = ["urgente", "bloccante", "non posso", "immediato", "critico"]

# --- 3) Helper functions
def choose_keyword_for_category(cat):
    # ritorna (kw, metadata)
    cands = [ (k,v) for k,v in KEYWORDS.items() if v["cat"]==cat ]
    return random.choice(cands) if cands else random.choice(list(KEYWORDS.items()))

def neutralize_spaces(s):
    # rimuove doppie spazi, sistemi apostrofi
    s = re.sub(r"\s+", " ", s).strip()
    s = s.replace("  ", " ")
    s = s.replace("la l'", "l'")  # edge-fix
    return s

def build_description(article, kw, force_article=True):
    # costruisce descrizione coerente; articoli gestiti qui
    start = random.choice(starts)
    prob = random.choice(problems)
    impact = random.choice(impacts)
    extra = random.choice(extra_sentences)
    if force_article:
        # se articolo termina con apostrofo (l') non mettere spazio dopo
        if article.endswith("'"):
            target = f"{article}{kw}"
        else:
            target = f"{article} {kw}"
    else:
        target = kw
    descr = f"{start} {prob} {target}, {impact}"
    if extra:
        descr = f"{descr} {extra}"
    return neutralize_spaces(descr)

def assign_priority_by_rules(description, kw_meta):
    # priorità di base dalla keyword, ma se compaiono urgency_tokens => alta
    base = kw_meta.get("prio", "Media")
    text = description.lower()
    for t in urgency_tokens:
        if t in text:
            return "Alta"
    return base

def ensure_keyword_in_description(keyword, description):
    return re.search(r"\b" + re.escape(keyword) + r"\b", description, flags=re.IGNORECASE) is not None

def jaccard_sim(a_tokens, b_tokens):
    seta, setb = set(a_tokens), set(b_tokens)
    if not seta and not setb:
        return 0.0
    return len(seta & setb) / len(seta | setb)

# --- 4) Generatore controllato con validazione e dedup
def generate_controlled_tickets(n=200, dedup_threshold=0.8, max_attempts=10):
    rows = []
    seen_token_sets = []
    attempts = 0
    while len(rows) < n and attempts < n * max_attempts:
        attempts += 1
        # scegli categoria con distribuzione personalizzabile
        categoria = random.choices(["Amministrazione","Tecnico","Commerciale"], weights=[0.35,0.45,0.20])[0]
        kw, meta = choose_keyword_for_category(categoria)
        article = meta["art"]
        
        oggetto = f"Problema relativo a {kw}"
        descrizione = build_description(article, kw, force_article=True)
        
        # controllo: garantire che la descrizione contenga la keyword
        if not ensure_keyword_in_description(kw, descrizione):
            # rigenero descrizione in forma più semplice
            descrizione = f"{random.choice(starts)} {random.choice(problems)} {article}{kw}, {random.choice(impacts)}"
            descrizione = neutralize_spaces(descrizione)
            if not ensure_keyword_in_description(kw, descrizione):
                # skip se ancora non coerente (molto raro)
                continue
        
        priorita = assign_priority_by_rules(descrizione, meta)
        
        # controllo deduplicazione via Jaccard su token
        tokens = re.findall(r"\w+", (oggetto + " " + descrizione).lower())
        is_dup = False
        for seen in seen_token_sets:
            if jaccard_sim(tokens, seen) >= dedup_threshold:
                is_dup = True
                break
        if is_dup:
            continue  # scarta e prova altro
        
        # lunghezza minima/sana
        if len(descrizione.split()) < 4:
            continue
        
        rows.append([oggetto, descrizione, categoria, priorita])
        seen_token_sets.append(tokens)
    
    df = pd.DataFrame(rows, columns=["oggetto","descrizione","categoria","priorita"])
    return df

# --- 5) Genera e salva
dataset = generate_controlled_tickets(300)
dataset.to_csv(r"C:\Users\User\OneDrive\Desktop\Python_git\tesi\dataset_ticket_controllato.csv", index=False)
print(dataset.sample(8))
