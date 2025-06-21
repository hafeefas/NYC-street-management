import requests
import json

def fetch_pothole_reports():
    """
    Fetches the 100 most recent pothole service requests from the NYC 311 API
    and saves them to a JSON file.
    """
    # The Socrata API endpoint for NYC 311 Service Requests
    api_url = "https://data.cityofnewyork.us/resource/7dn9-uvry.json"
    
    # Socrata Query (SoQL) to filter for potholes and get the most recent ones
    # - complaint_type = 'Pothole'
    # - location IS NOT NULL to ensure we have coordinates
    # - $limit=100 to get 100 results
    # - $order=created_date DESC to get the most recent
    # - $select to get only the fields we need
    params = {
        "$limit": 100,
        "$order": "created_date DESC", # will always get the most recent data in descending order
        "$where": "complaint_type = 'Street Condition' AND descriptor = 'Pothole'  AND latitude IS NOT NULL AND longitude IS NOT NULL",
        "$select": "created_date, unique_key, complaint_type, descriptor, street_name, latitude, longitude"
    }
    
    output_file = "pothole_reports.json"
    
    try:
        print(f"Fetching pothole reports from NYC Open Data...")
        response = requests.get(api_url, params=params)
        response.raise_for_status()  # Raise an exception for bad status codes

        reports = response.json()
        
        if not reports:
            print("No pothole reports found with the specified criteria.")
            return

        # Save the data to a JSON file
        with open(output_file, 'w') as f:
            json.dump(reports, f, indent=2)
        
        print(f"Successfully saved {len(reports)} street condition reports to {output_file}")
        
        # Optional: Filter for potholes specifically if needed
        pothole_reports = [r for r in reports if 'pothole' in r.get('descriptor', '').lower()]
        print(f"Found {len(pothole_reports)} reports specifically mentioning potholes.")

    except requests.exceptions.RequestException as e:
        print(f"Error fetching data: {e}")
    except json.JSONDecodeError:
        print("Error: Failed to decode JSON from the response.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    fetch_pothole_reports() 