import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.auth import get_current_user
import app.models as models
import app.schemas as schemas

router = APIRouter(prefix="/courses", tags=["Learning & Quizzes"])


@router.get("/", response_model=List[schemas.CourseOut])
def get_all_courses(db: Session = Depends(get_db),
                    current_user: models.User = Depends(get_current_user)):
    return db.query(models.Course).order_by(models.Course.order_index).all()


@router.get("/{course_id}/quizzes")
def get_course_quizzes(course_id: int, db: Session = Depends(get_db),
                       current_user: models.User = Depends(get_current_user)):
    course = db.query(models.Course).filter_by(course_id=course_id).first()
    if not course:
        raise HTTPException(404, "Course not found.")
    quizzes = db.query(models.Quiz).filter_by(course_id=course_id).all()
    return [schemas.QuizOut.from_orm_quiz(q) for q in quizzes]


@router.post("/quiz-results", response_model=schemas.QuizResultOut, status_code=201)
def submit_quiz_result(result_in: schemas.QuizResultCreate, db: Session = Depends(get_db),
                       current_user: models.User = Depends(get_current_user)):
    # Get the first quiz of this course to store a result row (course-level result)
    first_quiz = db.query(models.Quiz).filter_by(course_id=result_in.course_id).first()
    if not first_quiz:
        raise HTTPException(404, "No quizzes found for this course.")

    result = models.QuizResult(
        user_id=current_user.user_id,
        quiz_id=first_quiz.quiz_id,
        course_id=result_in.course_id,
        score=result_in.score,
        total=result_in.total,
        passed=(result_in.score >= result_in.total),  # 100% pass threshold
    )
    db.add(result)

    # Also mark learning progress as reading done when quiz submitted
    prog = db.query(models.LearningProgress).filter_by(
        user_id=current_user.user_id, course_id=result_in.course_id).first()
    if prog:
        prog.completion_percentage = 100 if result_in.score >= result_in.total else \
            max(prog.completion_percentage, round((result_in.score / result_in.total) * 100))
    db.commit()
    db.refresh(result)
    return result


@router.post("/progress/{course_id}", response_model=schemas.LearningProgressOut)
def update_learning_progress(course_id: int, update: schemas.LearningProgressUpdate,
                              db: Session = Depends(get_db),
                              current_user: models.User = Depends(get_current_user)):
    prog = db.query(models.LearningProgress).filter_by(
        user_id=current_user.user_id, course_id=course_id).first()
    if prog:
        prog.completion_percentage = update.completion_percentage
        prog.reading_done = update.reading_done
    else:
        prog = models.LearningProgress(
            user_id=current_user.user_id, course_id=course_id,
            completion_percentage=update.completion_percentage,
            reading_done=update.reading_done)
        db.add(prog)
    db.commit()
    db.refresh(prog)
    return prog


@router.get("/my-progress", response_model=List[schemas.QuizResultOut])
def get_my_quiz_progress(db: Session = Depends(get_db),
                          current_user: models.User = Depends(get_current_user)):
    return db.query(models.QuizResult).filter_by(user_id=current_user.user_id)\
             .order_by(models.QuizResult.evaluated_at.desc()).all()