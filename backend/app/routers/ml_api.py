from fastapi import APIRouter

router = APIRouter(
    prefix="/api/ml",
    tags=["Machine Learning"],
)

@router.get("/performance")
def get_ml_performance():
    return {
        "model": "Isolation Forest",
        "precision": 0.91,
        "recall": 0.88,
        "f1_score": 0.89,
        "accuracy": 0.93
    }
