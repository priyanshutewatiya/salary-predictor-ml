import os
import joblib
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from catboost import CatBoostRegressor

# 1. LOAD DATA
# ---------------------------------------------------
df = pd.read_csv("job_salary_prediction_dataset.csv")
df.columns = df.columns.str.strip().str.lower()

print("Shape:", df.shape)
print("Columns:", df.columns.tolist())
print("\nDtypes:\n", df.dtypes)
print("\nMissing values:\n", df.isnull().sum())

# ---------------------------------------------------
# 2. CLEAN DATA
# ---------------------------------------------------
numeric_cols_force = ["experience_years", "skills_count", "certifications", "salary"]

for col in numeric_cols_force:
    df[col] = pd.to_numeric(df[col], errors="coerce")

# Standardize text columns
text_cols = ["job_title", "education_level", "industry", "company_size", "location", "remote_work"]
for col in text_cols:
    df[col] = df[col].astype(str).str.strip()

# Normalize remote_work
df["remote_work"] = (
    df["remote_work"]
    .str.lower()
    .replace({
        "yes": "Yes",
        "no": "No",
        "true": "Yes",
        "false": "No",
        "1": "Yes",
        "0": "No",
        "remote": "Yes",
        "onsite": "No",
        "hybrid": "Hybrid"
    })
)

# Drop rows with essential nulls
required_cols = [
    "job_title", "experience_years", "education_level", "skills_count",
    "industry", "company_size", "location", "remote_work",
    "certifications", "salary"
]
df = df.dropna(subset=required_cols).copy()

# ---------------------------------------------------
# 3. FEATURE ENGINEERING
# ---------------------------------------------------
df["profile_strength"] = df["skills_count"] + df["certifications"]
df["exp_per_skill"] = df["experience_years"] / (df["skills_count"] + 1)
df["cert_per_exp"] = df["certifications"] / (df["experience_years"] + 1)

# ---------------------------------------------------
# 4. FEATURES / TARGET
# ---------------------------------------------------
target = "salary"

features = [
    "job_title",
    "experience_years",
    "education_level",
    "skills_count",
    "industry",
    "company_size",
    "location",
    "remote_work",
    "certifications",
    "profile_strength",
    "exp_per_skill",
    "cert_per_exp"
]

X = df[features].copy()
y = df[target].copy()

categorical_features = [
    "job_title",
    "education_level",
    "industry",
    "company_size",
    "location",
    "remote_work"
]

# CatBoost needs categorical column indices
cat_feature_indices = [X.columns.get_loc(col) for col in categorical_features]

# ---------------------------------------------------
# 5. TRAIN / TEST SPLIT
# ---------------------------------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42
)

# ---------------------------------------------------
# 6. MODEL
# ---------------------------------------------------
model = CatBoostRegressor(
    iterations=2500,
    learning_rate=0.03,
    depth=8,
    l2_leaf_reg=3,
    loss_function="RMSE",
    eval_metric="R2",
    random_seed=42,
    verbose=200
)

model.fit(
    X_train,
    y_train,
    cat_features=cat_feature_indices,
    eval_set=(X_test, y_test),
    use_best_model=True
)

# ---------------------------------------------------
# 7. EVALUATION
# ---------------------------------------------------
preds = model.predict(X_test)

mae = mean_absolute_error(y_test, preds)
rmse = np.sqrt(mean_squared_error(y_test, preds))
r2 = r2_score(y_test, preds)

print("\n===== FINAL MODEL PERFORMANCE =====")
print(f"MAE  : {mae:.2f}")
print(f"RMSE : {rmse:.2f}")
print(f"R2   : {r2:.6f}")

# ---------------------------------------------------
# 8. SAVE MODEL
# ---------------------------------------------------
os.makedirs("models", exist_ok=True)

joblib.dump(model, "models/best_salary_model.pkl")
joblib.dump(features, "models/model_features.pkl")

print("Model saved to models/best_salary_model.pkl")
print("Features saved to models/model_features.pkl")
