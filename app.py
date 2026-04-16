from flask import Flask, render_template, request, jsonify
import pandas as pd
import joblib

app = Flask(__name__)

model = joblib.load("models/best_salary_model.pkl")
model_features = joblib.load("models/model_features.pkl")


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()

        experience_years = float(data["experience_years"])
        skills_count = float(data["skills_count"])
        certifications = float(data["certifications"])

        input_df = pd.DataFrame([{
            "job_title": str(data["job_title"]).strip(),
            "experience_years": experience_years,
            "education_level": str(data["education_level"]).strip(),
            "skills_count": skills_count,
            "industry": str(data["industry"]).strip(),
            "company_size": str(data["company_size"]).strip(),
            "location": str(data["location"]).strip(),
            "remote_work": str(data["remote_work"]).strip(),
            "certifications": certifications,
            "profile_strength": skills_count + certifications,
            "exp_per_skill": experience_years / (skills_count + 1),
            "cert_per_exp": certifications / (experience_years + 1)
        }])

        input_df = input_df[model_features]

        prediction = model.predict(input_df)[0]

        return jsonify({
            "success": True,
            "predicted_salary": round(float(prediction), 2)
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        })


if __name__ == "__main__":
    app.run(debug=True)