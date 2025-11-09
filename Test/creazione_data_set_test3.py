import random
import uuid
import pandas as pd
from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS

CATEGORY_LIST = ["Administration", "Technical", "Commercial"]
PRIORITY_LIST = ["High", "Medium", "Low"]

#CATEGORY_LIST = ["Amministrazione", "Tecnico", "Commerciale"]
#PRIORITY_LIST = ["Alta", "Media", "Bassa"]

# Frammenti per costruire descrizioni realistiche

actions = {
    "Administration": [
        "Verify correct document registration",
        "Check accounting amounts",
        "Align supplier deadlines",
        "Update spending plan",
        "Calculate periodic adjustment",
        "Validate expense report",
        "Request duplicate fiscal document",
        "Verify payment reconciliation"
    ],
    "Technical": [
        "Analyze system logs",
        "Restore previous configuration",
        "Update software version",
        "Post-intervention functionality testing",
        "Monitor server performance",
        "Check disk space",
        "Internal network diagnostics",
        "Verify user permissions"
    ],
    "Commercial": [
        "Prepare dedicated quote",
        "Align ongoing offers",
        "Update customer record",
        "Prepare commercial proposal",
        "Follow-up on previous contact",
        "Validate contractual agreement",
        "Update sales pipeline",
        "Plan client call"
    ]
}

items = {
    "Administration": [
        "customer invoicing",
        "quarterly report",
        "historical document archive",
        "employee attendance register",
        "supply contract",
        "expense reports"
    ],
    "Technical": [
        "company server",
        "internal network",
        "main database",
        "VoIP switchboard",
        "internal application",
        "error tracking"
    ],
    "Commercial": [
        "potential client list",
        "promotional material",
        "sales strategy",
        "customized quote",
        "active contracts",
        "seasonal offers"
    ]
}

impacts = {
    "High": [
        "requires discussion with the manager",
        "urgent resolution requested",
        "to be resolved shortly",
        "blocking activity for the department",
        "cannot proceed with activities",
        "urgent resolution requested",
        "immediate intervention required",
        "critical impact on the service occurred",
        "response requested by end of day",
        "maximum priority to avoid service disruption",
        "activity is currently halted",
        "problem with immediate effect on operations",
        "priority support requested",
        "immediate handling requested",
        "prevents normal daily operations",
        "timely intervention required",
        "criticality reported by the involved department"
    ],
    "Medium": [
        "resolution ASAP",
        "awaiting feedback",
        "could you verify",
        "alignment with internal standards requested",
        "documentation update requested",
        "awaiting clarifications",
        "evaluation requested",
        "awaiting feedback to proceed",
        "resolution to be planned within the week",
        "discussion with the contact person recommended",
        "no immediate impact on operations",
        "to be discussed in the next meeting",
        "check requested without urgency",
        "proceed when possible",
        "confirmation requested to proceed",
        "issue does not prevent current operations",
        "status update requested as soon as available"
    ],
    "Low": [
        "response requested by end of week",
        "no urgency required",
        "request for preventive purpose",
        "can be scheduled in the coming days",
        "immediate action not necessary",
        "to be included in regular workflow",
        "can be addressed when available",
        "non-urgent intervention",
        "low operational impact activity",
        "to be evaluated in one of the next updates",
        "does not block ongoing work",
        "request to be monitored without priority",
        "to be handled as workload permits",
        "recommended to manage within the month",
        "consider only if time permits from main activities"
    ]
}

def generate_ticket(n=10):
    ticket = []
    for _ in range(n):
        category = random.choice(CATEGORY_LIST)
        priority = random.choice(PRIORITY_LIST) 
        sel_dett = random.choice(impacts[priority])
        action = random.choice(actions[category])
        item = random.choice(items[category])
        id = str(uuid.uuid4())[:8]
        title =  f"{action}"
        description =  f"{action} on {item}, {sel_dett}."
        
        ticket.append([id, title, description, category, priority])
    
    return pd.DataFrame(ticket, columns=["id","title","description","category","priority"])

def data_modeling(ds):
    dataset = pd.DataFrame(ds)
    dataset.set_index('id', inplace=True)
    dataset = dataset.applymap(lambda x: x.lower() if  isinstance(x, str) else x)
    
    for tlt, prt in dataset:
        print(tlt, prt)
    #print(dataset.head(5)) 
    #return 


dataset = generate_ticket(500)
data_modeling(dataset)
#dataset.to_csv(r"C:\Users\User\OneDrive\Desktop\Python_git\tesi\dataset_ticket_controllato_eng.csv", index=False)
