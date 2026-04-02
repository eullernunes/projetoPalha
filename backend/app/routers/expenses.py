from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date
from app.database import get_db
from app.models.models import FixedExpense, VariableExpense
from app.schemas.schemas import (
    FixedExpenseCreate, FixedExpenseUpdate, FixedExpenseOut,
    VariableExpenseCreate, VariableExpenseUpdate, VariableExpenseOut,
)

router = APIRouter(prefix="/expenses", tags=["Despesas"])


# ─── Fixed Expenses ───────────────────────────────────────────────────────────

@router.get("/fixed", response_model=List[FixedExpenseOut])
def list_fixed_expenses(
    month: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(FixedExpense)
    if month:
        q = q.filter(FixedExpense.month == month)
    if year:
        q = q.filter(FixedExpense.year == year)
    return q.order_by(FixedExpense.year.desc(), FixedExpense.month.desc()).all()


@router.post("/fixed", response_model=FixedExpenseOut, status_code=201)
def create_fixed_expense(data: FixedExpenseCreate, db: Session = Depends(get_db)):
    expense = FixedExpense(**data.model_dump())
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@router.put("/fixed/{expense_id}", response_model=FixedExpenseOut)
def update_fixed_expense(expense_id: int, data: FixedExpenseUpdate, db: Session = Depends(get_db)):
    expense = db.query(FixedExpense).filter(FixedExpense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Despesa fixa não encontrada")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(expense, field, value)
    db.commit()
    db.refresh(expense)
    return expense


@router.delete("/fixed/{expense_id}", status_code=204)
def delete_fixed_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = db.query(FixedExpense).filter(FixedExpense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Despesa fixa não encontrada")
    db.delete(expense)
    db.commit()


# ─── Variable Expenses ────────────────────────────────────────────────────────

@router.get("/variable", response_model=List[VariableExpenseOut])
def list_variable_expenses(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    employee_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(VariableExpense).options(joinedload(VariableExpense.employee))
    if start_date:
        q = q.filter(VariableExpense.date >= start_date)
    if end_date:
        q = q.filter(VariableExpense.date <= end_date)
    if employee_id:
        q = q.filter(VariableExpense.employee_id == employee_id)
    return q.order_by(VariableExpense.date.desc()).all()


@router.post("/variable", response_model=VariableExpenseOut, status_code=201)
def create_variable_expense(data: VariableExpenseCreate, db: Session = Depends(get_db)):
    expense = VariableExpense(**data.model_dump())
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return db.query(VariableExpense).options(
        joinedload(VariableExpense.employee)
    ).filter(VariableExpense.id == expense.id).first()


@router.put("/variable/{expense_id}", response_model=VariableExpenseOut)
def update_variable_expense(expense_id: int, data: VariableExpenseUpdate, db: Session = Depends(get_db)):
    expense = db.query(VariableExpense).filter(VariableExpense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Despesa variável não encontrada")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(expense, field, value)
    db.commit()
    return db.query(VariableExpense).options(
        joinedload(VariableExpense.employee)
    ).filter(VariableExpense.id == expense_id).first()


@router.delete("/variable/{expense_id}", status_code=204)
def delete_variable_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = db.query(VariableExpense).filter(VariableExpense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Despesa variável não encontrada")
    db.delete(expense)
    db.commit()
