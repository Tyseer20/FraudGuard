# Implementation plan

1. Finish frontend and route it to the API.
2. Acquire and validate the public fraud dataset.
3. Implement preprocessing and class-imbalance strategy.
4. Train Logistic Regression, Random Forest, and XGBoost.
5. Train soft-voting ensemble and evaluate using accuracy, precision, recall, F1, ROC-AUC and confusion matrix.
6. Persist model + preprocessing artifacts.
7. Implement Kafka producer/consumer.
8. Persist transaction decisions to PostgreSQL.
9. Connect live stream to the React dashboard.
10. Freeze actual results and write the research paper from the reproducible experiments.
