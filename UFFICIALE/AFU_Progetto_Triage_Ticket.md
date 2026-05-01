# AFU - Triage Automatico Ticket con Machine Learning

## 1. Scopo del documento

Questo documento descrive in modo funzionale e tecnico il progetto presente nel repository, con l'obiettivo di chiarire:

- finalita del sistema
- logica applicativa end-to-end
- architettura software
- componenti Machine Learning
- struttura dati e persistenza
- regole di accesso e visibilita
- limiti attuali della soluzione

Il progetto realizza un sistema di **ticket triage automatico** che, a partire dalla descrizione testuale di un ticket, stima:

- la **priorita**
- il **gruppo di assegnazione**
- una **azione suggerita** basata su casi simili gia trattati
- una lista di **termini rilevanti** che hanno influenzato la classificazione

Oltre al motore ML, il repository include una **web application** per autenticazione, apertura ticket, consultazione elenco ticket, dettaglio ticket e dashboard di monitoraggio.

## 2. Visione funzionale del progetto

### 2.1 Obiettivo di business

L'obiettivo e ridurre il tempo di triage manuale dei ticket, uniformare la classificazione e facilitare l'instradamento verso il gruppo corretto.

Il sistema supporta i seguenti bisogni:

- categorizzazione piu rapida dei ticket in ingresso
- supporto alla prioritizzazione iniziale
- suggerimento di una possibile azione operativa
- tracciamento storico delle predizioni ML
- monitoraggio sintetico dei ticket tramite dashboard

### 2.2 Ambito funzionale coperto

Il sistema copre:

- login utente
- apertura ticket con descrizione libera
- inferenza ML automatica al momento della creazione
- salvataggio del ticket con metadati ML
- consultazione lista e dettaglio ticket
- dashboard con KPI ultimi 30 giorni
- visibilita differenziata tra super admin e utenti di gruppo
- esportazione CSV dei ticket di gruppo

Non risultano invece implementati:

- workflow avanzato di gestione stati lato UI/API
- riassegnazione ticket
- gestione password sicura
- audit trail completo delle modifiche operative
- orchestrazione enterprise o code di messaggistica

## 3. Attori e profili utente

Dal codice emergono due profili principali.

### 3.1 Super Admin

Il super admin:

- vede tutti i ticket
- vede la dashboard globale
- puo creare ticket senza vincolo iniziale di gruppo
- puo consultare tutte le informazioni ML associate ai ticket

Nel seed iniziale e previsto un utente:

- `super_admin / super_admin`

### 3.2 Utente di gruppo

L'utente standard:

- appartiene a un gruppo
- vede i ticket assegnati al proprio gruppo
- vede anche i ticket creati da lui ma assegnati ad altri gruppi
- nel caso di ticket creati da lui ma assegnati ad altro gruppo, non vede l'azione consigliata e il `Top5`
- puo esportare in CSV i ticket del proprio gruppo
- accede a una dashboard filtrata sul proprio gruppo

Nel seed iniziale e previsto anche:

- `admin@local / admin`

associato al gruppo di default `DEFAULT_GROUP`.

## 4. Flusso funzionale end-to-end

### 4.1 Login

1. L'utente invia email e password.
2. L'API verifica le credenziali sul database SQLite.
3. In caso di successo viene impostato il cookie `helpdesk_session`.
4. Il middleware protegge tutte le pagine applicative, lasciando pubblica la sola `/login`.

### 4.2 Apertura ticket

1. L'utente compila una descrizione libera del problema.
2. La UI valida soltanto che la descrizione abbia almeno 10 caratteri.
3. L'API `POST /api/tickets` chiama la logica server `createTicket(...)`.
4. Il backend invoca il motore ML Python.
5. Il motore produce:
   - priorita predetta
   - gruppo predetto
   - azione fatta in passato suggerita
   - top 5 termini rilevanti
6. Il backend prova a risolvere il nome del gruppo predetto nel database.
7. Se il gruppo esiste, il ticket viene assegnato a quel gruppo; altrimenti resta sul gruppo dell'utente creatore o nullo per il super admin.
8. Il ticket viene salvato nella tabella `tickets`.
9. La stessa predizione viene storicizzata nella tabella `ml_predictions`.

### 4.3 Consultazione ticket

La lista ticket cambia in base al ruolo:

- super admin: tutti i ticket
- utente standard: ticket del gruppo + ticket creati da lui

Nel dettaglio ticket:

- vengono mostrati sempre id, stato, descrizione, priorita e categoria
- l'azione storica suggerita e il `Top5` vengono nascosti se l'utente vede un ticket creato da lui ma assegnato a un gruppo diverso dal proprio

### 4.4 Dashboard

La dashboard espone indicatori sugli ultimi 30 giorni:

- ticket aperti
- ticket attualmente aperti
- ticket risolti
- ticket chiusi
- trend aperture giornaliere
- trend chiusure giornaliere
- distribuzione per priorita
- distribuzione per categoria

La distribuzione per categoria e visibile solo al super admin.

## 5. Architettura logica

L'architettura e composta da tre blocchi principali.

### 5.1 Frontend / Web Application

Tecnologie:

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Recharts per i grafici
- Zod per validazione input lato client

Responsabilita:

- login e gestione sessione via cookie
- UI per creazione ticket
- elenco e dettaglio ticket
- dashboard operativa
- invocazione delle API applicative

### 5.2 Application Layer

Responsabilita:

- espone API Route Next.js
- applica le regole di autorizzazione
- invoca il gateway Python per il database
- invoca il worker Python per il Machine Learning
- normalizza il risultato ML in un formato coerente con la UI

### 5.3 Motore Python

Il layer Python e diviso in due parti:

- **motore ML** per classificazione e similarita
- **gateway DB** per accesso SQLite e migrazioni leggere

Questo approccio evita di riscrivere in TypeScript la logica gia sviluppata in Python e consente di riutilizzare i modelli `.pkl`.

## 6. Architettura tecnica dettagliata

## 6.1 Frontend Next.js

Percorso principale:

- `PW-18/pw-18/UFFICIALE/ticket-triage-frontend`

Pagine principali:

- `/login`
- `/tickets`
- `/tickets/new`
- `/tickets/[id]`
- `/dashboard`

Componenti principali:

- `TicketForm`: inserimento ticket
- `TicketTable`: elenco ticket
- `StatCard`: KPI dashboard
- `charts.tsx`: grafici trend e distribuzioni
- `AppShell`: layout applicativo

Il frontend usa un client API interno (`lib/api.ts`) che tenta sia i path `/api/...` sia eventuali path alternativi con `NEXT_PUBLIC_API_BASE_URL`.

## 6.2 API applicative

Endpoint individuati:

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/tickets`
- `POST /api/tickets`
- `GET /api/tickets/[id]`
- `GET /api/dashboard/summary`

Caratteristiche:

- runtime `nodejs`
- autenticazione via cookie
- autorizzazione per ruolo e gruppo
- validazione basilare del payload JSON

## 6.3 Persistenza dati

La persistenza applicativa usa SQLite, con database creato in:

- `.data/tickets.db`

Il gateway Python:

- crea automaticamente la cartella `.data`
- inizializza o migra lo schema
- applica alcuni seed minimi
- puo migrare ticket da un legacy JSON se presente

Scelte tecniche rilevanti:

- `journal_mode = WAL`
- `synchronous = NORMAL`
- `busy_timeout = 5000`
- foreign keys attive

## 6.4 Schema dati

Tabelle principali:

### `groups`

Contiene i gruppi applicativi a cui assegnare i ticket.

Campi chiave:

- `id`
- `name`
- `description`
- `d_at`

### `users`

Contiene gli utenti applicativi.

Campi chiave:

- `email`
- `display_name`
- `password`
- `group_id`
- `is_super_admin`
- `is_active`

### `tickets`

Rappresenta il ticket operativo arricchito con i risultati ML.

Campi chiave:

- `id`
- `description`
- `status`
- `d_at`
- `created_by_user_id`
- `assigned_group_id`
- `priority`
- `category`
- `AzioniFatteInPassato`
- `Top5`

### `ml_predictions`

Storico della predizione generata al momento della creazione ticket.

Campi chiave:

- `ticket_id`
- `model_name`
- `model_version`
- `priority`
- `category`
- `AzioniFatteInPassato`
- `Top5`
- `d_at`

### `dashboard_snapshots`

Prevista per snapshot di sintesi dashboard, anche se nel codice letto la dashboard viene calcolata con query live.

## 6.5 Integrazione Next.js <-> Python

Sono presenti due canali distinti:

### Accesso DB

`lib/server/db.ts` usa `execFile(...)` per eseguire:

- `lib/server/db_gateway.py`

Il comando Python riceve:

- nome comando
- payload JSON serializzato

e restituisce JSON su stdout.

### Accesso ML

`lib/server/ml.ts` mantiene un **worker Python persistente**:

- script: `ML_Model/worker.py`

Flusso:

1. Next.js avvia il processo Python una sola volta.
2. Ogni richiesta invia una riga JSON su stdin.
3. Il worker risponde su stdout con JSON.
4. Se il worker fallisce, e previsto un fallback con esecuzione puntuale `python -c ...`.

Questa scelta riduce il costo di startup del modello ad ogni inferenza.

## 7. Logica Machine Learning

## 7.1 Dataset di training

I file Excel presenti nel repository mostrano che il training si basa su ticket storici categorizzati, in particolare:

- `incident_categorizzati_chat.xlsx`
- varianti di backup e working dataset

Per il training classificativo vengono usate le colonne:

- `Descrizione`
- `Priorita`
- `GruppoAssegnazione`

Per la parte similarity viene usata anche:

- `AzioneFattaInPassato`

## 7.2 Modelli supervisionati

Il progetto addestra due modelli distinti:

- modello di classificazione della **priorita**
- modello di classificazione del **gruppo di assegnazione**

Entrambi sono pipeline `scikit-learn` composte da:

- `TfidfVectorizer`
- `LinearSVC`

Configurazione principale del vettorizzatore:

- `lowercase=True`
- `ngram_range=(1, 2)`
- `min_df=3`
- `max_df=0.9`
- `sublinear_tf=True`

Configurazione principale del classificatore:

- `LinearSVC`
- `C=1.0`
- `class_weight="balanced"`
- `random_state=42`

La suddivisione train/test usa:

- `test_size = 0.2`
- `random_state = 42`
- stratificazione sulla priorita

## 7.3 Explainability semplificata

Il metodo `predict_ticket(...)` non restituisce solo la classe predetta, ma anche un `Top5` di termini rilevanti.

La logica:

- estrae il vettore TF-IDF del ticket
- usa i coefficienti del `LinearSVC` della classe predetta
- calcola il contributo delle feature presenti nel ticket
- filtra bigrammi, stopword e termini troppo corti
- restituisce i 5 termini piu influenti

Questa explainability e locale, semplice e utile a fini interpretativi, ma non equivale a una spiegazione causale completa.

## 7.4 Suggerimento azione da casi simili

La funzione `suggerisci_azione(...)` implementa un motore di similarita testuale.

Flusso:

1. filtra il dataset storico sul gruppo predetto
2. vettorizza la nuova descrizione
3. calcola la similarita coseno con i ticket storici di quel gruppo
4. sceglie il caso piu simile
5. se la similarita supera una soglia (`0.25`), restituisce `AzioneFattaInPassato`

Per questa parte viene usato:

- `TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5), min_df=3, sublinear_tf=True)`

La scelta di n-grammi a livello carattere rende il matching piu robusto rispetto a:

- errori ortografici
- abbreviazioni
- differenze minori di scrittura

## 7.5 Artefatti ML

Artefatti presenti:

- `model_priorita.pkl`
- `model_gruppo.pkl`
- `tfidf_similarity.pkl`
- `matrix_similarity.pkl`
- `similarity_dataset.pkl`

Sono presenti sia copie nella root di `PW-18` sia nella cartella:

- `PW-18/pw-18/UFFICIALE/modelli_allenati`

## 8. Metriche di qualita disponibili

Il repository contiene report di valutazione gia generati.

### 8.1 Priorita

Dalle metriche per classe emerge:

- `Moderata`: F1 circa `0.968`
- `Pianificazione`: F1 circa `0.923`
- `Bassa`: F1 circa `0.791`
- `Media`: F1 circa `0.750`
- `Alta`: F1 circa `0.429`
- `Critica`: F1 `1.000`, ma con supporto `1`

Interpretazione:

- il modello di priorita sembra performare bene sulle classi piu rappresentate
- le classi rare hanno affidabilita inferiore o statisticamente poco stabile

### 8.2 Gruppo di assegnazione

Classi con buoni risultati:

- `OPS_SPECIALIST`: F1 `1.000`
- `MIDDLEWARE_OPERATIONS`: F1 circa `0.977`
- `ETL_OPERATIONS_TEAM`: F1 circa `0.967`
- `DATABASE_APPLIANCE_OPS`: F1 circa `0.966`
- `AM_LIVELLO_1`: F1 circa `0.936`
- `DATA_SERVICES`: F1 circa `0.851`

Sono presenti anche classi con supporto nullo o metrica nulla nel report test:

- `AM_CARTE_DI_CREDITO`
- `AM_CONTI_CORRENTI`
- `CORE_DATA_SERVICES`

Interpretazione:

- il modello funziona bene dove il dataset storico e adeguato
- per gruppi poco rappresentati non e possibile considerare il risultato robusto

## 9. Regole applicative rilevanti

### 9.1 Assegnazione del gruppo

Il gruppo assegnato al ticket non deriva direttamente da un id ML, ma dal nome categoria restituito dal modello.

Il backend:

1. cerca in `groups` un record con `name = categoria_predetta`
2. se lo trova, usa il relativo `id`
3. se non lo trova, mantiene il gruppo dell'utente o `null`

Ne consegue che la qualita dell'assegnazione dipende anche dalla coerenza tra:

- etichette del dataset ML
- valori presenti nella tabella `groups`

### 9.2 Normalizzazione priorita

La priorita restituita dal modello viene normalizzata in TypeScript in quattro livelli applicativi:

- `low`
- `medium`
- `high`
- `critical`

Ad esempio:

- `Alta` e `Planning/Pianificazione` confluiscono in `high`
- `Moderata` e `Media` confluiscono in `medium`

Questa scelta semplifica la UI ma riduce il dettaglio semantico originario del dataset.

### 9.3 Gestione errori ML

Se il worker ML fallisce:

- il sistema tenta un fallback tramite esecuzione Python puntuale

Se anche il fallback fallisce:

- il ticket viene comunque creato, ma senza campi ML valorizzati

Questo rende il processo resiliente dal punto di vista operativo.

## 10. Sicurezza e controllo accessi

## 10.1 Misure presenti

- autenticazione applicativa via cookie `httpOnly`
- middleware di protezione delle pagine
- filtro dei ticket per gruppo e creatore
- oscuramento di parte dei metadati ML in alcuni casi di visibilita trasversale

## 10.2 Limiti attuali

Dal codice emergono diversi limiti:

- password memorizzate in chiaro nel database
- sessione basata solo su user id nel cookie
- assenza di hashing password
- assenza di CSRF protection esplicita
- assenza di RBAC evoluto

La soluzione e quindi adatta come prototipo o progetto accademico/dimostrativo, ma richiede hardening prima di un uso enterprise.

## 11. Criticita tecniche e limiti implementativi

### 11.1 Path di progetto

Gli script Python risolvono i file a partire dalla cartella del progetto, per esempio:

- `UFFICIALE/modelli_allenati/...`
- `UFFICIALE/dati/incident_categorizzati_chat.xlsx`

Impatto:

- portabilita su altre macchine
- deploy indipendente dai path locali dello sviluppatore

### 11.2 Incoerenza path similarity

Nel training del motore di similarita gli artefatti vengono salvati in:

- `UFFICIALE/modelli_allenati/...`

ma in `similarity_engine.py` il caricamento attuale punta a file nella root `PW-18`.

Questo indica una possibile divergenza tra percorso di training e percorso di runtime.

### 11.3 Qualita dataset e sbilanciamento classi

Le metriche mostrano che alcune classi sono poco o per nulla rappresentate.

Impatto:

- rischio di predizioni poco affidabili sulle classi rare
- bassa copertura statistica per alcuni gruppi o priorita

### 11.4 Dashboard basata su data creazione

Le query dashboard considerano `d_at`, che coincide con la creazione del ticket. Non emerge una storicizzazione degli eventi di cambio stato.

Effetto:

- i conteggi di risolto/chiuso negli ultimi 30 giorni sembrano riferiti a ticket creati in quel periodo con quello stato, non a ticket effettivamente chiusi in quel periodo tramite evento dedicato

### 11.5 Stato ticket poco evoluto

Nel codice letto esistono gli stati:

- `open`
- `in_progress`
- `resolved`
- `closed`

ma non risultano endpoint completi per aggiornamento workflow o presa in carico operativa.

## 12. Valutazione complessiva della soluzione

Il progetto risulta strutturato come una soluzione full-stack con tre livelli ben distinguibili:

- interfaccia utente
- orchestrazione applicativa
- servizi Python per ML e persistenza

Punti di forza:

- triage automatizzato integrato nel processo di apertura ticket
- explainability semplice e leggibile
- suggerimento di azione da storico casi simili
- separazione chiara tra frontend e logica Python
- dashboard e visibilita per ruolo gia presenti

Punti da consolidare:

- sicurezza
- portabilita
- allineamento tra etichette ML e gruppi DB
- robustezza dei dataset meno rappresentati
- completamento del ciclo di vita ticket

## 13. Conclusione

Il repository implementa una piattaforma di **gestione ticket con triage automatico assistito da Machine Learning**. La componente ML non e isolata come esperimento, ma e gia integrata nel flusso applicativo reale di creazione ticket, con salvataggio su database e presentazione dei risultati in UI.

Dal punto di vista funzionale, il sistema supporta il processo di classificazione iniziale e instradamento. Dal punto di vista tecnico, il progetto combina Next.js, Python, SQLite e scikit-learn in una soluzione coerente e gia dimostrabile, pur mantenendo alcuni tratti da prototipo evoluto.

## 14. Riferimenti ai componenti principali

Sezioni del repository usate come base per questa analisi:

- `UFFICIALE/ticket-triage-frontend/app/...`
- `UFFICIALE/ticket-triage-frontend/lib/server/...`
- `UFFICIALE/ML_Model/predict.py`
- `UFFICIALE/ML_Model/motore_ml.py`
- `UFFICIALE/ML_Model/worker.py`
- `UFFICIALE/ML_Model/similarity_engine.py`
- `UFFICIALE/ML_Model/train_models.py`
- `UFFICIALE/ML_Model/train_similarity.py`
- `UFFICIALE/ticket-triage-frontend/db/schema.sql`

