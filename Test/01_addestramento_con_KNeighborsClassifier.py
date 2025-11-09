# Import del modulo classificatore da scikit-learn
from sklearn.neighbors import KNeighborsClassifier 

# Assegnazione dei soli valori target presi dal df già etichettato
y = churn_df["churn"].values

# Assegnazione delle colonne account_length e customer_service_calls alla variabile
# X è la variabile contenente i dati con i quali creare il modello
X = churn_df[["account_length", "customer_service_calls"]].values

# Creazione del classificatore passando 6 punti come valore k
# ovvero il numero di "vicini" da considerare
knn = KNeighborsClassifier(n_neighbors=6)

# Creazione del modello predittivo (addestramento)
knn.fit(X, y)

# Predizione basata sul fit precedente
#la variabile X_new np_array contiene valori ex novo (stessa struttura di X fittata) non classificati 
y_pred = knn.predict(X_new)

# Stampa della predizione in formato array
print("Predictions: {}".format(y_pred)) 
