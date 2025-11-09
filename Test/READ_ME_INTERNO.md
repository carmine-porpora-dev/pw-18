**MODULI DA UTILIZZARE IN TUTTO IL PROGETTO**

|MODULO                                   | Import                                                                       |scopo                                                   
| -------------------------------------   | -----------------------------------------------------------------------------|------------------------------------------------------------------------------------------|
| **pandas**                              | `import pandas as pd`                                                        | Creazione e gestione del dataset (lettura/scrittura, tabelle, pulizia dati)              |
| **numpy**                               | `import numpy as np`                                                         | Operazioni numeriche di base, utile per array e manipolazione vettori                    |
| **scikit-learn (sklearn)**              |                                                                              | Libreria principale per il Machine Learning                                              |
| **Preprocessing testo**                 | `from sklearn.feature_extraction.text import TfidfVectorizer`                | Converte i testi dei ticket in vettori numerici TF-IDF.                                  |
| **Split Train/Test**                    | `from sklearn.model_selection import train_test_split`                       | Suddivide il dataset in dati di addestramento e test                                     |
| **Classificatore Categoria / Priorità** | `from sklearn.linear_model import LogisticRegression`                        | Modello per predire Categoria e Priorità. (Semplice e molto efficace per testo.)         |
| **(alternativa classificatore)**        | `from sklearn.naive_bayes import MultinomialNB`                              | Modello alternativo, più semplice e veloce, funziona bene con TF-IDF.                    |
| **(alternativa più forte)**             | `from sklearn.svm import LinearSVC`                                          | Classificatore più potente, ottimo per testo.                                            |
| **Metriche**                            | `from sklearn.metrics import accuracy_score, f1_score, classification_report`| Valutazione modello: Accuracy, F1 Macro, Report e Matrice di confusione                  |
                                            `confusion_matrix` 
| **Similarità per suggerire soluzione**  | `from sklearn.metrics.pairwise import cosine_similarity`                     | Trova ticket storici simili per proporre una soluzione                                   |
| **matplotlib**                          | `import matplotlib.pyplot as plt`                                            | Creazione grafici (es. matrice di confusione visualizzata).                              |
| **seaborn**                             | `import seaborn as sns`                                                      | Visualizzazioni più eleganti (es. heatmap confusione).                                   |


**FASI SALIENTI DEL MODELLO ML**
| Fase                       | Moduli coinvolti                       | Output                                                    |
| -------------------------- | ---------------------------------------| --------------------------------------------------------- |
| **Creazione dataset**      | `pandas`                               | tabella ticket (testo + categoria + priorità + soluzione) |
| **Pre-processing testo**   | `pandas`                               | testo pulito                                              |
| **Vettorizzazione**        | `TfidfVectorizer`                      | matrice TF-IDF                                            |
| **Training modelli**       | `LogisticRegression o MultinomialNB`   | modello classificazione categoria e priorità              |
| **Valutazione**            | `accuracy, f1_score, confusion_matrix` | metriche di qualità                                       |
| **Suggerimento soluzione** | `cosine_similarity`                    | soluzione storica più simile                              |

**STRUTTURA DEI MODULI PYTHON**
import pandas as pd
import numpy as np

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, confusion_matrix, classification_report
from sklearn.metrics.pairwise import cosine_similarity

import matplotlib.pyplot as plt
import seaborn as sns