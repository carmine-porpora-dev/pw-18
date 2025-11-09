#MODIFICARE L ASSEGNAZIONE DELLA PRIORITA, QUESTO CASO NON VIENE ASSEGNATA CON CRITERIO MA RANDOM, RENDENDO starts problems impacts DEI DIZIONARI 
#AGGIUNGERE NUOVE CATEGORIE E AMPLIARE IL CONTENUTO

import random
import pandas as pd

random.seed(42)

# elementi chiave da ampliare per una diversità ampia di tkt, in contenuto non in categorie 
admin_keywords = ['la fattura', 'il bonifico', 'il pagamento', 'ls scadenza', 'la nota di credito', 'l\'iban', 'il rimborso', 'la documentazione', 'il cedolino', 'il permesso']
tech_keywords = ['server', 'la connessione', 'l\'autenticazione', 'la rete', 'la password', 'l\'utenza', 'il computer', 'il modem', 'la stampante' , 'la batteria']
comm_keywords = ['ordine', 'preventivo', 'offerta', 'contratto', 'spedizione', 'disponibilità', 'prodotto' ]

# Templates variabili, da ampliare per una diversità ampia di tkt, in contenuto non in categorie
starts = [
    'Gentile assistenza,',
    'Buongiorno,',
    'Salve,',
    ''
]

problems = [
    'sto riscontrando un problema con',
    'non riesco a procedere con',
    'ho bisogno di supporto per',
    'si verifica un malfunzionamento relativo a'
]

impacts = [
    'e non posso completare il lavoro.',
    'ed è urgente risolverlo.',
    'potete verificare?',
    'mi potete aiutare?'
]

def generate_ticket(n=200):
    rows = []
    
    for _ in range(n):
        categoria = random.choice(['Amministrazione', 'Tecnico', 'Commerciale'])
        
        if categoria == 'Amministrazione':
            kw = random.choice(admin_keywords)
        elif categoria == 'Tecnico':
            kw = random.choice(tech_keywords)
        else:
            kw = random.choice(comm_keywords)
        
        oggetto = f'Problema relativo a {kw}'
        
        descrizione = (
            f'{random.choice(starts)} '
            f'{random.choice(problems)} {kw}, '
            f'{random.choice(impacts)}'
        )
        
        priorita = random.choices(['Bassa', 'Media', 'Alta'], weights=[0.3, 0.5, 0.2])[0]
        rows.append([oggetto, descrizione, categoria, priorita])
    return pd.DataFrame(rows, columns=['oggetto', 'descrizione', 'categoria', 'priorita'])

dataset = generate_ticket(30)
print(dataset.loc[0, 'oggetto'])
print(dataset.loc[0, 'descrizione'])
print(dataset.loc[0, 'categoria'])
print(dataset.loc[0, 'priorita'])
