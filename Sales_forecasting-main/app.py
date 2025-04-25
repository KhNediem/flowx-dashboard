from flask import Flask, request, jsonify
import pandas as pd
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Path to the CSV file
CSV_PATH = 'all_stores_products_predicted_units.csv'

# Load the data once when the server starts
def load_forecast_data():
    if os.path.exists(CSV_PATH):
        return pd.read_csv(CSV_PATH)
    else:
        print(f"Warning: CSV file not found at {CSV_PATH}")
        return pd.DataFrame(columns=['id', 'store_id', 'product_id', 'date', 'units'])

# Load the data
forecast_df = load_forecast_data()

@app.route('/forecast', methods=['POST'])
def get_forecast():
    try:
        # Get request data
        data = request.json
        
        # Extract store_id and product_id from the request
        # The Next.js component sends features but we'll extract the needed values
        store_id = request.args.get('store_id')
        product_id = request.args.get('product_id')
        
        # If they're not in the URL parameters, check in the request body
        if not store_id or not product_id:
            if 'store_id' in data and 'product_id' in data:
                store_id = data['store_id']
                product_id = data['product_id']
            else:
                return jsonify({"error": "Missing store_id or product_id"}), 400
        
        # Convert to integers
        store_id = int(store_id)
        product_id = int(product_id)
        
        # Filter the data
        filtered_data = forecast_df[
            (forecast_df['store_id'] == store_id) & 
            (forecast_df['product_id'] == product_id)
        ]
        
        # Check if we have any data
        if filtered_data.empty:
            return jsonify({
                "forecast": [],
                "message": f"No data found for store_id={store_id} and product_id={product_id}"
            })
        
        # Sort by date to ensure proper order
        filtered_data = filtered_data.sort_values('date')
        
        # Convert to the format expected by the front-end
        forecast_data = filtered_data[['date', 'units']].to_dict('records')
        
        return jsonify({
            "forecast": forecast_data,
            "count": len(forecast_data)
        })
        
    except Exception as e:
        print(f"Error processing request: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "message": "Server is running"})

if __name__ == '__main__':
    # Check if the CSV file exists
    if not os.path.exists(CSV_PATH):
        print(f"Warning: CSV file not found at {CSV_PATH}")
        print(f"Expected location: {os.path.abspath(CSV_PATH)}")
        
    # Print the data structure
    print(f"Loaded {len(forecast_df)} records from CSV")
    if not forecast_df.empty:
        print("CSV structure:")
        print(forecast_df.head())
        
    app.run(debug=True, host='0.0.0.0', port=5000)