# pw-18
This repository contains my project work - PW 18 : Triage automatico dei ticket con Machine Learning. 

# Prerequisiti tecnici per eseguire modello e web app

La soluzione e composta da due parti:

- modello ML Python, contenuto in `UFFICIALE/ML_Model`
- web app Next.js, contenuta in `UFFICIALE/ticket-triage-frontend`

Per usare la web app con la predizione automatica e necessario installare entrambe le parti.

### 1 Requisiti di sistema

Installare sulla macchina:

- Python 3.12
- Node.js 20 LTS o superiore
- npm, incluso con Node.js
- Git, se si vuole clonare il repository

### 2 Librerie Python necessarie

Il modello usa queste librerie Python:

`pandas` 
`numpy` 
`scikit-learn` 
`joblib` 
`spacy` 
`matplotlib` 
`openpyxl` 

Serve anche il modello linguistico italiano di spaCy:

```powershell
python -m spacy download it_core_news_sm
```

Installazione consigliata delle dipendenze Python:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install pandas numpy scikit-learn joblib spacy matplotlib openpyxl
python -m spacy download it_core_news_sm
```


# APPROFONDIMENTO GRUPPI OPERATIVI

## 1. ETL_OPERATIONS_TEAM

### Cosa gestisce

Il gruppo `ETL_OPERATIONS_TEAM` gestisce incident legati a processi ETL, DataStage, sequence, job schedulati, client Yarn, run applicativi, ritardi o blocchi di elaborazione.

### Attivita tipiche

- verificare lo stato di job e sequence
- analizzare job in errore, running, aborted o finished anomalo
- riavviare client Yarn
- riavviare macchine o componenti legati all'esecuzione ETL
- sbloccare job rimasti in stato non coerente
- verificare timeout infrastrutturali durante l'esecuzione
- supportare rilanci o ripartenze di elaborazioni DataStage

### Quando aprire verso questo gruppo

Aprire un ticket compatibile con `ETL_OPERATIONS_TEAM` quando:

- una sequence DataStage e in errore o bloccata
- un job `.jpl` o `.jsq` non parte, resta running o va in aborted
- un client Yarn non risponde o va riavviato
- una TWS non innesca correttamente una sequence
- un'elaborazione e in forte ritardo rispetto al comportamento ordinario
- serve verificare o riavviare una componente di esecuzione ETL

### Cosa scrivere nel ticket

Inserire sempre:

- nome sequence o job
- acronimo applicativo
- data riferimento o data messa a piano
- stato rilevato: running, aborted, finished, bloccato, timeout
- log o errore tecnico
- eventuale rilancio gia effettuato
- impatto: blocco segnalazione, blocco flusso, ritardo batch, impossibilita di completare il run

Esempio:

```
La sequence RTNG_FEEDING_JSQ risulta in errore in produzione. Il job interno risulta ancora running e non consente il rilancio per istanza duplicata.
Si richiede verifica dello stato DataStage e sblocco/riavvio della sequence per consentire il completamento del run.
```

## 2. AM_LIVELLO_1

### Cosa gestisce

Il gruppo `AM_LIVELLO_1` gestisce anomalie applicative di primo livello: controlli, quadrature, consistenze dati, duplicati, bonifiche funzionali, censimenti e verifiche su regole applicative.

### Attivita tipiche

- correggere o bonificare controlli applicativi
- analizzare chiavi duplicate
- verificare consistenze o mancato pervenimento flussi
- censire controlli da documentazione Excel
- impostare codici errore per controlli di quadratura o trasporto
- verificare spedizioni e popolamento timestamp
- analizzare file CSV o file di sintesi/esito

### Quando aprire verso questo gruppo

Aprire un ticket compatibile con `AM_LIVELLO_1` quando:

- ci sono duplicati su viste o tabelle applicative
- un controllo di quadratura o trasporto non e censito o non torna
- mancano consistenze giornaliere
- un file CSV o di sintesi presenta scarti funzionali
- serve una bonifica applicativa guidata da regole note
- serve controllare documentazione o censimento controlli

### Cosa scrivere nel ticket

Inserire sempre:

- nome controllo o codice controllo
- tabella, vista o struttura interessata
- data riferimento
- chiavi coinvolte, se note
- flussi mancanti o non consistenti
- file di sintesi, file esiti o CSV coinvolti
- descrizione della regola attesa

Esempio:

```
Per data riferimento 20250311 risulta una chiave duplicata sulla vista VW_AM_C1_ANAGRAFICA_SNDG.
La chiave coinvolta e SNDG 0102938475 con FLG_PREVALEN valorizzato in modo non coerente.
Si richiede analisi e bonifica applicativa del duplicato.
```

## 3. DATABASE_APPLIANCE_OPS

### Cosa gestisce

Il gruppo `DATABASE_APPLIANCE_OPS` gestisce problemi di database e appliance: tabelle lockate, query lente, grant, spool, spazio, backup, host, Teradata e anomalie SQL.

### Attivita tipiche

- sbloccare tabelle lockate o in stato `is being loaded` / `is being archived`
- verificare lock non risolti da procedure automatiche
- analizzare query lente o bloccanti
- concedere grant su tabelle
- verificare errori Teradata o RDBMS
- liberare spazio occupato da dati superflui
- ottimizzare query per ridurre spool
- controllare host o appliance database
- eseguire o verificare backup

### Quando aprire verso questo gruppo

Aprire un ticket compatibile con `DATABASE_APPLIANCE_OPS` quando:

- una tabella risulta lockata
- una procedura automatica di sblocco non risolve
- una query e molto lenta o consuma troppo spool
- un processo fallisce per errore SQL/RDBMS
- servono grant su oggetti database
- una tabella risulta `being archived`, `being loaded` o non disponibile
- c'e un problema di spazio, host o appliance

### Cosa scrivere nel ticket

Inserire sempre:

- DBMS coinvolto, per esempio Teradata
- schema e tabella completa
- query o estratto SQL, se disponibile
- errore tecnico completo
- procedura automatica gia tentata
- utenza o ruolo per eventuali grant
- impatto sul job o sulla catena applicativa

Esempio:

```
La tabella RTNG.T_RTG_SCORE_CLIENTE risulta lockata su Teradata.
La procedura automatica di sblocco ha restituito exit code 2 e la tabella resta non disponibile.
Si richiede verifica lock e sblocco manuale per consentire il completamento del job RTNG_RSK_SCORES.
```

## 4. MIDDLEWARE_OPERATIONS

### Cosa gestisce

Il gruppo `MIDDLEWARE_OPERATIONS` gestisce problemi di interscambio, tratte, canali, workstation, invii file, web service e comunicazioni tra sistemi.

### Attivita tipiche

- analizzare log di interscambio
- verificare invii file non ricevuti dal destinatario
- richiedere reinvio file quando il log evidenzia errori
- attivare tratte in ambiente richiesto
- verificare canali o sistemi destinatari
- riavviare workstation offline
- analizzare errori web service o timeout di comunicazione

### Quando aprire verso questo gruppo

Aprire un ticket compatibile con `MIDDLEWARE_OPERATIONS` quando:

- un file risulta inviato lato sorgente ma non ricevuto lato destinatario
- una tratta deve essere attivata o verificata
- un interscambio e in errore
- un canale non processa correttamente il flusso
- una workstation risulta offline
- una chiamata web service fallisce con errore tecnico o timeout

### Cosa scrivere nel ticket

Inserire sempre:

- nome tratta o interscambio
- sistema sorgente e sistema destinatario
- nome file o flusso
- timestamp invio
- esito lato sorgente e lato destinatario
- errore del web service, se presente
- ambiente in cui serve attivazione o verifica

Esempio:

```
Il file AMMISSIBILITA risulta inviato correttamente dal sistema sorgente, ma l'interscambio LN2AML01 segnala errore lato destinatario.
Si richiede analisi dei log middleware e, se necessario, indicazione per reinvio del file.
```

## 5. DATA_SERVICES

### Cosa gestisce

Il gruppo `DATA_SERVICES` gestisce file, directory, alimentazioni dati, Data Quality, cataloghi, cancellazioni o bonifiche su aree landing/HDFS e verifiche di pervenimento controlli.

### Attivita tipiche

- cancellare file da path HDFS o landing
- rinominare o bonificare file
- verificare portale Data Quality
- controllare pervenimento controlli
- rilanciare invii o alimentazioni
- riavviare cataloghi tramite procedura
- analizzare file corrotti con eventuale coinvolgimento Middleware
- verificare consistenza tra file di sintesi e file esiti

### Quando aprire verso questo gruppo

Aprire un ticket compatibile con `DATA_SERVICES` quando:

- un file blocca una elaborazione e va cancellato
- un file in landing/HDFS va rimosso o rinominato
- un controllo non risulta pervenuto su Data Quality
- una alimentazione dati non e completa
- un file risulta corrotto o non leggibile
- serve verificare catalogo o portale dati

### Cosa scrivere nel ticket

Inserire sempre:

- path completo della directory o area dati
- nome file completo
- operazione richiesta: remove, rename, reinvio, verifica, alimentazione
- flusso o acronimo coinvolto
- data riferimento
- motivo del blocco
- eventuale output del portale Data Quality

Esempio:

```
Il file FRDMOV01.202507282000_000 e presente nel path /data/dw/landing/am/fraud/daily e blocca l'elaborazione dell'acronimo FRAUD.
Si richiede cancellazione del file indicato e conferma dell'avvenuta rimozione.
```

## 6. OPS_SPECIALIST

### Cosa gestisce

Il gruppo `OPS_SPECIALIST` gestisce richieste operative specialistiche: rilasci, comandi automatici, log applicativi di rilascio, script da bloccare, richieste da forzare o sbloccare su portali.

### Attivita tipiche

- analizzare log di rilascio
- comunicare errore e soluzione all'utenza
- completare manualmente richieste forzandole in stato OK
- sbloccare richieste operative
- bloccare script tramite portale
- verificare conflitti o violazioni di integrita
- validare l'esito di rilasci gia eseguiti

### Quando aprire verso questo gruppo

Aprire un ticket compatibile con `OPS_SPECIALIST` quando:

- un comando operativo di rilascio va in errore
- una richiesta di rilascio resta bloccata
- serve forzare manualmente lo stato di una richiesta
- uno script deve essere bloccato o gestito da portale
- il log segnala violazioni di integrita o conflitti
- occorre dare riscontro tecnico all'utenza che ha aperto la segnalazione

### Cosa scrivere nel ticket

Inserire sempre:

- numero comando
- numero richiesta o rilascio
- acronimo applicativo
- utenza che ha aperto la segnalazione
- errore completo da log
- ambiente
- azione richiesta: analisi log, completamento manuale, sblocco, blocco script

Esempio:

```
Il comando 27309794 relativo al rilascio O0000539139, richiesta 00003, acronimo CORE1, e andato in errore.
Si richiede analisi del log e indicazione della causa con eventuale completamento manuale della richiesta se il rilascio risulta effettivamente eseguito.
```
# DATASET

Il dataset utilizzato per allenare il modello è presente nella folder UFFICIALE/dati  
