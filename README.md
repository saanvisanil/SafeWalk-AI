# SafeWalk AI

SafeWalk AI is an AI-based safe route navigation prototype that helps users choose safer walking routes using route risk indicators such as crime level, lighting, crowd density, police presence, and travel time context.

## Features

- AI-based route safety scoring
- Multiple route comparison
- Recommended safest route
- Women Safety Mode
- Student Commute Mode
- Night Travel Mode
- Crime heatmap
- SOS simulation
- Police assistance simulation
- Emergency contact saving
- Share trip feature
- Guest mode with limited access
- Recent searches stored per logged-in user

## Tech Stack

### Frontend
- HTML
- CSS
- JavaScript
- Leaflet.js
- OpenStreetMap

### Backend
- Python
- Flask
- Flask-CORS

### AI / ML
- Scikit-learn
- Joblib
- Pandas
- NumPy

## Project Structure

```text
SafeWalk-AI/
│
├── backend/
│   ├── app.py
│   ├── train_model.py
│   ├── model.pkl
│   └── requirements.txt
│
├── frontend/
│   ├── index.html
│   ├── pro.html
│   ├── basic.html
│   ├── script.js
│   ├── script-pro.js
│   └── style.css
│
└── README.md
