import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)  # Stored as hashed strings
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships mapping bidirectional object cascading handles
    portfolio = relationship("Portfolio", back_populates="user", uselist=False, cascade="all, delete-orphan")
    trades = relationship("Trade", back_populates="user", cascade="all, delete-orphan")
    journals = relationship("TradingJournal", back_populates="user", cascade="all, delete-orphan")
    quiz_results = relationship("QuizResult", back_populates="user", cascade="all, delete-orphan")


class Course(Base):
    __tablename__ = "courses"

    course_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)

    # Relationship linking course context to specific evaluations
    quizzes = relationship("Quiz", back_populates="course", cascade="all, delete-orphan")


class Quiz(Base):
    __tablename__ = "quizzes"

    quiz_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    course_id = Column(Integer, ForeignKey("courses.course_id", ondelete="CASCADE"), nullable=False)
    question = Column(Text, nullable=False)
    answer = Column(String(255), nullable=False)  # Corresponds to correct indexing tag

    course = relationship("Course", back_populates="quizzes")
    results = relationship("QuizResult", back_populates="quiz", cascade="all, delete-orphan")


class QuizResult(Base):
    __tablename__ = "quiz_results"

    result_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    quiz_id = Column(Integer, ForeignKey("quizzes.quiz_id", ondelete="CASCADE"), nullable=False)
    score = Column(Integer, nullable=False)
    evaluated_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="quiz_results")
    quiz = relationship("Quiz", back_populates="results")


class Portfolio(Base):
    __tablename__ = "portfolios"

    portfolio_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), unique=True, nullable=False)
    balance = Column(Float, default=100000.00, nullable=False)  # Customisable virtual startup cash
    profit_loss = Column(Float, default=0.00, nullable=False)

    user = relationship("User", back_populates="portfolio")


class Trade(Base):
    __tablename__ = "trades"

    trade_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    stock_symbol = Column(String(20), index=True, nullable=False)
    action_type = Column(Enum("BUY", "SELL", name="action_types"), nullable=False)
    execution_price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    status = Column(Enum("OPEN", "CLOSED", name="position_statuses"), default="OPEN", nullable=False)
    trade_date = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="trades")


class TradingJournal(Base):
    __tablename__ = "trading_journal"

    journal_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    mistake_tag = Column(String(100), default="NONE", nullable=False)  # Maps behavioral flags like FOMO
    notes = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="journals")