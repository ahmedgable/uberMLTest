from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import pandas as pd
import joblib
import os
import traceback

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(BASE_DIR, "models", "best_etr_model.pkl")
SCALER_PATH = os.path.join(BASE_DIR, "scaling", "power_transformer_scaler.pkl")
OHE_PATH = os.path.join(BASE_DIR, "encoding", "onehot_encoder.pkl")
LABEL_ENCODERS_PATH = os.path.join(BASE_DIR, "encoding", "label_encoders.pkl")
DATASET_PATH = os.path.join(BASE_DIR, "car_price_prediction.csv")

try:
    model = joblib.load(MODEL_PATH)
    yeo = joblib.load(SCALER_PATH)
    ohe = joblib.load(OHE_PATH)
    label_encoders = joblib.load(LABEL_ENCODERS_PATH)
    print("\n====================================")
    print("✅ ML MODEL LOADED SUCCESSFULLY")
    print("====================================\n")
except Exception as e:
    print("\n❌ ERROR LOADING MODEL FILES:", e)

# تحميل ملف Dataset لتصفية الموديلات ديناميكياً
df_raw = None
if os.path.exists(DATASET_PATH):
    try:
        df_raw = pd.read_csv(DATASET_PATH)
        print("✅ Dataset loaded for dynamic filtering")
    except Exception as e:
        print("⚠️ Could not load dataset for dynamic filtering:", e)

LABEL_COLUMNS = ["Color", "Category", "Fuel type", "Model", "Manufacturer"]
OHE_COLUMNS = ["Leather interior", "Wheel", "Gear box type", "Drive wheels"]
NUMERICAL_COLUMNS = ["Engine volume", "Mileage", "Cylinders", "age"]
REQUIRED_COLUMNS = LABEL_COLUMNS + OHE_COLUMNS + NUMERICAL_COLUMNS

@app.route("/", methods=["GET"])
def home():
    return render_template("index.html")

@app.route("/favicon.ico", methods=["GET"])
def favicon():
    favicon_path = os.path.join(app.root_path, "static", "favicon.ico")
    if os.path.exists(favicon_path):
        return send_from_directory(os.path.join(app.root_path, "static"), "favicon.ico", mimetype="image/vnd.microsoft.icon")
    return "", 204

@app.route("/api", methods=["GET"])
def api_status():
    return jsonify({"status": "success", "message": "Car Price Prediction API is running", "model": "ExtraTreesRegressor", "version": "1.0.0"})

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy", "model_loaded": True, "message": "API is ready for predictions"})

@app.route("/model-info", methods=["GET"])
def model_info():
    return jsonify({"model": "ExtraTreesRegressor", "preprocessing": ["LabelEncoder", "OneHotEncoder", "PowerTransformer Yeo-Johnson"], "target": "Price"})

@app.route("/options", methods=["GET"])
def get_options():
    try:
        options = {
            "Manufacturer": label_encoders["Manufacturer"].classes_.tolist(),
            "Model": label_encoders["Model"].classes_.tolist(),
            "Category": label_encoders["Category"].classes_.tolist(),
            "Fuel type": label_encoders["Fuel type"].classes_.tolist(),
            "Color": label_encoders["Color"].classes_.tolist(),
            "Leather interior": ohe.categories_[0].tolist(),
            "Wheel": ohe.categories_[1].tolist(),
            "Gear box type": ohe.categories_[2].tolist(),
            "Drive wheels": ohe.categories_[3].tolist()
        }
        return jsonify({"status": "success", "options": options})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500

# Endpoint جديد لتصفية الموديلات حسب الشركة المصنعة
@app.route("/models-by-manufacturer/<manufacturer>", methods=["GET"])
def get_models_by_manufacturer(manufacturer):
    try:
        if df_raw is not None and "Manufacturer" in df_raw.columns and "Model" in df_raw.columns:
            filtered = df_raw[df_raw["Manufacturer"].astype(str).str.upper() == manufacturer.upper()]["Model"].astype(str).unique().tolist()
            filtered = sorted(filtered)
            return jsonify({"status": "success", "models": filtered})
        
        all_models = label_encoders["Model"].classes_.tolist()
        return jsonify({"status": "success", "models": all_models})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "Request body is empty"}), 400

        input_df = pd.DataFrame([data])

        missing_columns = [col for col in REQUIRED_COLUMNS if col not in input_df.columns]
        if missing_columns:
            return jsonify({"status": "error", "message": "Missing required features", "missing_features": missing_columns}), 400

        input_df = input_df[REQUIRED_COLUMNS]

        for col in LABEL_COLUMNS:
            encoder = label_encoders[col]
            value = input_df[col].iloc[0]
            try:
                input_df[col] = encoder.transform(input_df[col].astype(str))
            except ValueError:
                return jsonify({
                    "status": "error",
                    "message": f"Unknown value '{value}' for column '{col}'",
                    "available_values": encoder.classes_.tolist()
                }), 400

        try:
            encoded_features = ohe.transform(input_df[OHE_COLUMNS])
        except ValueError as e:
            return jsonify({"status": "error", "message": "Invalid categorical value", "details": str(e)}), 400

        encoded_df = pd.DataFrame(encoded_features, columns=ohe.get_feature_names_out(OHE_COLUMNS), index=input_df.index)
        input_df = input_df.drop(columns=OHE_COLUMNS)
        input_df = pd.concat([input_df, encoded_df], axis=1)

        if hasattr(yeo, "feature_names_in_"):
            expected_features = list(yeo.feature_names_in_)
        elif hasattr(model, "feature_names_in_"):
            expected_features = list(model.feature_names_in_)
        else:
            expected_features = list(input_df.columns)

        missing_features = [col for col in expected_features if col not in input_df.columns]
        if missing_features:
            return jsonify({"status": "error", "message": "Feature mismatch between API and model", "missing_features": missing_features}), 400

        input_df = input_df[expected_features]
        transformed_data = yeo.transform(input_df)
        prediction = model.predict(transformed_data)
        
        raw_price = float(prediction[0])
        # حماية وضبط الحد الأدنى للأسعار لمنع الأسعار السالبة أو غير المنطقية
        predicted_price = max(500.0, raw_price)

        return jsonify({"status": "success", "prediction": {"price": round(predicted_price, 2)}})

    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({"status": "error", "message": "Endpoint not found"}), 404

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)