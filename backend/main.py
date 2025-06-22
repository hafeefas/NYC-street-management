from dotenv import load_dotenv
load_dotenv()
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import json
import os
from PIL import Image
import moondream as md
from map_service import street_view_url, download_image, annotate_point

app = FastAPI()

# Mount static files directory to make images in 'temp' accessible via URL
app.mount("/images", StaticFiles(directory="temp"), name="images")

# For Moondream Cloud, use your API key:
model = md.vl(api_key=os.getenv("MD_API_KEY"))

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

@app.get("/api/potholes/analyzer")
def analyze_pothole(lat: float, lng: float):
    try:
        # Create temp directory if it doesn't exist
        os.makedirs('./temp', exist_ok=True)
        
        # Get Street View image URL and download
        street_view_image_url = street_view_url(lat=lat, lng=lng)
        image_path = f'./temp/{lat}-{lng}.jpg'
        download_image(street_view_image_url, image_path)
        
        # Load and analyze image with Moondream
        image = Image.open(image_path)
        # Using a more descriptive prompt to improve accuracy
        prompt = "a pothole in the pavement or asphalt road surface"
        detection_result = model.detect(image=image, object=prompt)
        
        # Initialize response data
        analysis_data = {
            "location": {
                "latitude": lat,
                "longitude": lng
            },
            "street_view_url": street_view_image_url,
            "analysis": {
                "potholes_detected": len(detection_result.get('objects', [])),
                "detection_details": detection_result.get('objects', []),
                "status": "completed"
            }
        }
        
        # If potholes were detected, annotate the image and get additional analysis
        if detection_result.get('objects'):
            obj = detection_result['objects'][0]  # Get first detected pothole
            
            # Calculate center point of detected pothole
            w, h = image.size
            cx = int(((obj["x_min"] + obj["x_max"]) / 2) * w)
            cy = int(((obj["y_min"] + obj["y_max"]) / 2) * h)
            
            # Create annotated image
            src = Path(image_path)
            # Use a unique name for the annotated file to prevent browser caching issues
            annotated_filename = f"{lat}-{lng}-annotated.png"
            dst = Path(f'./temp/{annotated_filename}')
            annotate_point(src, (cx, cy), dst=dst, radius=6, color=(255, 0, 0))
            
            # Get additional analysis from Moondream
            annotated_image = Image.open(dst)
            # Using the same descriptive prompt for consistency
            point_analysis = model.point(annotated_image, prompt)
            
            # Add additional analysis data with a full URL
            analysis_data["analysis"]["center_point"] = {"x": cx, "y": cy}
            analysis_data["analysis"]["point_analysis"] = point_analysis
            analysis_data["analysis"]["annotated_image_path"] = f"http://localhost:8000/images/{annotated_filename}"
        
        return analysis_data
        
    except Exception as e:
        return {
            "error": f"Analysis failed: {str(e)}",
            "location": {
                "latitude": lat,
                "longitude": lng
            },
            "status": "failed"
        }