<img width="1514" height="912" alt="image" src="https://github.com/user-attachments/assets/4f8d8da5-f797-41da-a759-24c9aaa4479a" />link of deployment: ubermltest-production-846c.up.railway.app
# 🚗 Car Price Predictor

An AI-powered web app that predicts the resale price of a used car based on its specifications, using a trained **ExtraTreesRegressor** model. Built with a Flask backend and a vanilla HTML/CSS/JS frontend, with automatic car image lookup for a richer result view.

## ✨ Features

- **Instant price prediction** based on 13 car attributes (manufacturer, model, category, fuel type, engine volume, mileage, cylinders, age, and more)
- **Dynamic dropdowns** — selecting a manufacturer automatically loads its available models
- **Automatic car image** — fetches a matching photo from Wikimedia Commons (with an Unsplash fallback) and displays it next to the prediction
- **Responsive UI** with loading states and error handling
- Trained on a real-world dataset of ~19,000 used car listings

## 🛠️ Tech Stack

**Frontend:** HTML5, CSS3, vanilla JavaScript
**Backend:** Python, Flask
**Machine Learning:** scikit-learn (`ExtraTreesRegressor`), pandas, NumPy

## 📂 Project Structure

```
car-price-predictor/
├── app.py                  # Flask app (routes: /, /options, /models-by-manufacturer/<mfg>, /predict)
├── model.pkl                # Trained ExtraTreesRegressor model
├── car_price_prediction.csv # Training dataset
├── static/
│   ├── style.css
│   └── script.js
└── templates/
    └── index.html
```

> Adjust the structure above to match your actual repo layout before publishing.

## ⚙️ Installation

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/car-price-predictor.git
cd car-price-predictor

# 2. Create a virtual environment
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the app
python app.py
```

The app will be available at `http://localhost:5000`.

## 🧠 Model

- **Algorithm:** ExtraTreesRegressor (scikit-learn)
- **Dataset:** ~19,000 used car listings with 18 columns (price, manufacturer, model, year, category, fuel type, engine volume, mileage, cylinders, gearbox, drive wheels, etc.)
- **Preprocessing:** missing-value handling, categorical encoding, outlier treatment on price and mileage

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/options` | Returns all dropdown options (manufacturers, categories, fuel types, colors, etc.) |
| `GET` | `/models-by-manufacturer/<manufacturer>` | Returns available models for a given manufacturer |
| `POST` | `/predict` | Accepts car specs as JSON and returns the predicted price |

**Example request to `/predict`:**
```json
{
  "Manufacturer": "BMW",
  "Model": "328 i",
  "Category": "Cabriolet",
  "Fuel type": "CNG",
  "Color": "Black",
  "Engine volume": 2.0,
  "Mileage": 50000,
  "Cylinders": 4,
  "age": 8,
  "Leather interior": "Yes",
  "Wheel": "Left wheel",
  "Gear box type": "Automatic",
  "Drive wheels": "Front"
}
```

## 📸 Screenshots


<img width="1514" height="912" alt="Screenshot 2026-08-01 212046" src="https://github.com/user-attachments/assets/5b26c2ab-67ab-4715-a397-c07e192bfdb2" />


## 🚀 Future Improvements

- Add model confidence intervals alongside the point prediction
- Cache Wikimedia image lookups to reduce repeated API calls
- Deploy live demo (Render / Railway / Vercel)


