from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.auth import get_current_user
import app.models as models
import app.schemas as schemas

router = APIRouter(prefix="/courses", tags=["Learning & Quizzes"])

@router.get("/", response_model=List[schemas.CourseOut])
def get_all_courses(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Course).all()

@router.get("/{course_id}/quizzes", response_model=List[schemas.QuizOut])
def get_course_quizzes(course_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    course = db.query(models.Course).filter(models.Course.course_id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")
    return db.query(models.Quiz).filter(models.Quiz.course_id == course_id).all()

@router.post("/quiz-results", response_model=schemas.QuizResultOut, status_code=status.HTTP_201_CREATED)
def submit_quiz_result(result_in: schemas.QuizResultCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    result = models.QuizResult(
        user_id=current_user.user_id,
        quiz_id=result_in.quiz_id,
        score=result_in.score
    )
    db.add(result)
    db.commit()
    db.refresh(result)
    return result

@router.get("/my-progress", response_model=List[schemas.QuizResultOut])
def get_my_quiz_progress(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.QuizResult).filter(
        models.QuizResult.user_id == current_user.user_id
    ).order_by(models.QuizResult.evaluated_at.desc()).all()