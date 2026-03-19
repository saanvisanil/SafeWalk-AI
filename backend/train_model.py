import pandas as pd
from sklearn.linear_model import LogisticRegression
import joblib

# Dummy dataset
data = {
    "time": [0, 1, 2, 0, 1, 2, 2, 1, 0],
    "crime": [2, 8, 9, 1, 6, 7, 10, 5, 2],
    "crowd": [8, 5, 2, 9, 6, 3, 1, 4, 7],
    "lighting": [9, 6, 2, 8, 5, 3, 1, 4, 8],
    "police": [8, 6, 2, 7, 5, 3, 1, 4, 9],
    "safe": [1, 0, 0, 1, 1, 0, 0, 1, 1]
}

df = pd.DataFrame(data)

X = df[["time", "crime", "crowd", "lighting", "police"]]
y = df["safe"]

model = LogisticRegression()
model.fit(X, y)

joblib.dump(model, "model.pkl")

print("Model trained and saved!")