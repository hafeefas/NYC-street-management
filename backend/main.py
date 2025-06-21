from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json
import os

app = FastAPI()

# Allow all origins for development purposes.
# In a production environment, you would restrict this to your frontend's domain.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_FILE = "pothole_reports.json"

@app.get("/")
def read_root():
    return {"message": "Welcome to the Pothole Detection API"}

@app.get("/api/potholes")
def get_pothole_reports():
    """
    Reads and returns pothole report data from the local JSON file.
    """    
    if not os.path.exists(DATA_FILE):
        return {"error": "Pothole data file not found. Please run get_pothole_reports.py first."}
    
    with open(DATA_FILE, 'r') as f:
        data = json.load(f)
    
    return data 