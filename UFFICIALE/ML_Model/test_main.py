from predict import predict_ticket
from similarity_engine import suggerisci_azione

def processa_ticket(descrizione):
    priorita, gruppo, top5 = predict_ticket(descrizione)
    azione = suggerisci_azione(descrizione,gruppo )
 
    return {
        "priorita": priorita,
        "gruppo": gruppo,
        "azioni_consigliate": azione,
        "top5" : top5
    }

if __name__ == "__main__":

    #ticket = "Salve,\npotreste procedere alla cancellazione del file FRDMOV01.202507282000_000 presente nel path /data/dw/landing/am/fraud/daily. La presenza di questo file ci blocca l'esecuzione di un elaborazione su acronimo FRAUD \nGrazie,\nSaluti"
    #INTERNAL ANNOTATION 
    # AL MOMENTO LA PREDIZIONE PER IL TICKET IN BASSO NON FUNZIONA 
    ticket = "Buongiorno, durante i controlli di allineamento dati è stata riscontrata una discrepanza di consistenza sul flusso relativo alla tabella B0XCC.TA_TITOLI. L'anomalia è evidenziata sulla struttura di controllo TA_CONSISTENZA_DATI_CC per la data di riferimento 28/02, con esito negativo del controllo di quadratura. Potete effettuare le opportune verifiche ed eseguire le attività di ripristino della consistenza? Grazie."
    risultato = processa_ticket(ticket)

    print("\nINCIDENT ANALIZZATO:" , ticket)
    print("PRIORITA:", risultato["priorita"])
    print("GRUPPO:", risultato["gruppo"])
    print("\nTOP 5 : ", risultato["top5"] )
    print("\nAZIONE CONSIGLIATA:")
    print(risultato["azioni_consigliate"])