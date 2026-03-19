# SafeWalk AI

SafeWalk AI is an AI-based safe route navigation prototype that helps users choose safer walking routes using route risk indicators such as crime level, lighting, crowd density, police presence, and travel time context.
## Quick Start (How to Run)

1. Clone the repository

git clone https://github.com/saanvisanil/SafeWalk-AI.git  
cd SafeWalk-AI


2. Run backend

cd backend  
python -m venv venv  
venv\Scripts\activate  
python -m pip install -r requirements.txt  
python app.py  


Backend runs at:
http://127.0.0.1:5000


3. Run frontend

Open frontend folder in VS Code  
Right click index.html → Open with Live Server  


App will open in browser.


IMPORTANT:
Backend must be running before clicking "Find Safe Routes".

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
