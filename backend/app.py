from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import random
import pandas as pd

app = Flask(__name__)
CORS(app)

model = joblib.load("model.pkl")

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json
    time = data.get("time", 0)
    mode = data.get("mode", "standard")

    routes = []

    for i in range(3):
        crime = random.randint(1, 10)
        crowd = random.randint(1, 10)
        lighting = random.randint(1, 10)
        police = random.randint(1, 10)

        if mode == "women":
            lighting = min(10, lighting + 2)
            police = min(10, police + 1)
        elif mode == "student":
            crowd = min(10, crowd + 2)
            lighting = min(10, lighting + 1)
        elif mode == "night":
            lighting = min(10, lighting + 2)
            crime = max(1, crime - 1)

        sample = pd.DataFrame([{
            "time": time,
            "crime": crime,
            "crowd": crowd,
            "lighting": lighting,
            "police": police
        }])

        prediction = model.predict(sample)[0]

        eta = random.randint(8, 22)
        distance = round(random.uniform(0.8, 3.5), 1)

        routes.append({
            "route": f"Route {i+1}",
            "crime": crime,
            "crowd": crowd,
            "lighting": lighting,
            "police": police,
            "eta": eta,
            "distance": distance,
            "model_prediction": int(prediction)
        })

    return jsonify(routes)

if __name__ == "__main__":
    app.run(debug=True)