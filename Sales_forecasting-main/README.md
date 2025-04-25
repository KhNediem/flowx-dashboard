# Sales Forecasting Using Random Forest & XGBoost

This project develops a machine learning pipeline to predict **daily sales (in units)** for each product at each store using a Random Forest Regressor. The goal is to enable **accurate demand forecasting**, supporting better inventory planning and business growth.

---

## Dataset

- **Source**: [Kaggle - Toy Sales Dataset](https://www.kaggle.com/datasets/mysarahmadbhat/toy-sales?select=inventory.csv)
- The dataset includes:
  - Daily sales per product and store
  - Product and store metadata
  - Cost and price info
  - Inventory records

---

## Objective

Predict the **number of units sold** on a daily basis for each product-store combination using historical trends and behavioral patterns.

---

## Features Used

| Feature                    | Description |
|---------------------------|-------------|
| `Day_of_Week`, `Month`    | Temporal information |
| `Is_Weekend`              | Binary flag for weekends |
| `Lag_1_Day`, `Lag_7_Day`  | Past sales (1 and 7 days ago) |
| `Rolling_Avg_7`           | 7-day average sales |
| `Sales_Drop_Flag`         | Flag for recent sales drop |
| `Consecutive_Zero_Sales`  | Number of consecutive days with zero sales |
| `Category_Avg_Sales`      | Avg. sales for the product's category |
| `Store_Percentile`        | Store sales percentile (relative ranking) |

---

## Model

### Random Forest Regressor
- **Library**: `scikit-learn`
- **Parameters**:
  - `n_estimators=200`
  - `max_depth=10`
  - `random_state=42`

### Evaluation Metrics
- **MAE**: Mean Absolute Error
- **RMSE**: Root Mean Squared Error
- **R² Score**: Proportion of variance explained
- **Naive Baseline**: Compared to using `Lag_1_Day` as prediction

---

## Model Performance

| Metric       | Value      |
|--------------|------------|
| MAE          | 0.06 units |
| RMSE         | 0.24 units |
| R² Score     |0.8948      |
| Naive MAE    | 0.13 units |
| Improvement  | 54% over naive baseline |

### Cross-Validation Results (5 Folds)

- **Avg MAE**: 0.0631 ± 0.0098
- **Avg RMSE**: 0.2522 ± 0.0342
- **Avg R² Score**: 0.9095 ± 0.0183

## How to Run

1. Clone this repo.
2. Install dependencies:

   ```bash
   pip install -r requirements.txt
