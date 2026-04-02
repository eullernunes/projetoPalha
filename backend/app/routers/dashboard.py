from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List, Optional
from datetime import date, timedelta
import calendar
from app.database import get_db
from app.models.models import Production, Employee, FixedExpense, VariableExpense, Role, Sale
from app.schemas.schemas import (
    DashboardSummary, ProductionTimePoint,
    EmployeeProductionStat, RoleProductionStat, MonthlyFinancial,
    SaleOut,
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_summary(
    month: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    today = date.today()
    m = month or today.month
    y = year or today.year

    first_day = date(y, m, 1)
    last_day = date(y, m, calendar.monthrange(y, m)[1])

    prod_stats = db.query(
        func.coalesce(func.sum(Production.quantity), 0),
        func.coalesce(func.sum(Production.earnings), 0.0),
    ).filter(Production.date >= first_day, Production.date <= last_day).first()

    total_production = int(prod_stats[0])
    total_labor_cost = float(prod_stats[1])

    total_fixed = db.query(func.coalesce(func.sum(FixedExpense.amount), 0.0)).filter(
        FixedExpense.month == m, FixedExpense.year == y
    ).scalar() or 0.0

    total_variable = db.query(func.coalesce(func.sum(VariableExpense.amount), 0.0)).filter(
        VariableExpense.date >= first_day, VariableExpense.date <= last_day
    ).scalar() or 0.0

    total_revenue = db.query(func.coalesce(func.sum(Sale.total), 0.0)).filter(
        Sale.date >= first_day, Sale.date <= last_day
    ).scalar() or 0.0

    active_employees = db.query(func.count(Employee.id)).filter(Employee.active == True).scalar() or 0

    total_expenses = total_labor_cost + float(total_fixed) + float(total_variable)

    return DashboardSummary(
        total_production=total_production,
        total_labor_cost=total_labor_cost,
        total_fixed_expenses=float(total_fixed),
        total_variable_expenses=float(total_variable),
        total_expenses=total_expenses,
        total_revenue=float(total_revenue),
        net_result=float(total_revenue) - total_expenses,
        active_employees=active_employees,
        month=m,
        year=y,
    )


@router.get("/production-over-time", response_model=List[ProductionTimePoint])
def production_over_time(
    days: int = Query(30, ge=7, le=365),
    db: Session = Depends(get_db),
):
    end = date.today()
    start = end - timedelta(days=days - 1)

    rows = db.query(
        Production.date,
        func.sum(Production.quantity).label("quantity"),
        func.sum(Production.earnings).label("earnings"),
    ).filter(
        Production.date >= start, Production.date <= end
    ).group_by(Production.date).order_by(Production.date).all()

    return [
        ProductionTimePoint(
            date=str(row.date),
            quantity=int(row.quantity),
            earnings=float(row.earnings),
        )
        for row in rows
    ]


@router.get("/production-by-employee", response_model=List[EmployeeProductionStat])
def production_by_employee(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
    today = date.today()
    s = start_date or date(today.year, today.month, 1)
    e = end_date or today

    rows = db.query(
        Employee.id,
        Employee.name,
        func.sum(Production.quantity).label("quantity"),
        func.sum(Production.earnings).label("earnings"),
    ).join(Production, Employee.id == Production.employee_id).filter(
        Production.date >= s, Production.date <= e
    ).group_by(Employee.id, Employee.name).order_by(
        func.sum(Production.quantity).desc()
    ).all()

    return [
        EmployeeProductionStat(
            employee_id=row.id,
            employee_name=row.name,
            quantity=int(row.quantity),
            earnings=float(row.earnings),
        )
        for row in rows
    ]


@router.get("/production-by-role", response_model=List[RoleProductionStat])
def production_by_role(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
    today = date.today()
    s = start_date or date(today.year, today.month, 1)
    e = end_date or today

    rows = db.query(
        Role.id,
        Role.name,
        func.sum(Production.quantity).label("quantity"),
        func.sum(Production.earnings).label("earnings"),
    ).join(Production, Role.id == Production.role_id).filter(
        Production.date >= s, Production.date <= e
    ).group_by(Role.id, Role.name).order_by(
        func.sum(Production.quantity).desc()
    ).all()

    return [
        RoleProductionStat(
            role_id=row.id,
            role_name=row.name,
            quantity=int(row.quantity),
            earnings=float(row.earnings),
        )
        for row in rows
    ]


@router.get("/monthly-financial", response_model=List[MonthlyFinancial])
def monthly_financial(
    months: int = Query(6, ge=1, le=12),
    db: Session = Depends(get_db),
):
    today = date.today()
    result = []

    for i in range(months - 1, -1, -1):
        m = today.month - i
        y = today.year
        while m <= 0:
            m += 12
            y -= 1

        first_day = date(y, m, 1)
        last_day = date(y, m, calendar.monthrange(y, m)[1])

        revenue = db.query(func.coalesce(func.sum(Sale.total), 0.0)).filter(
            Sale.date >= first_day, Sale.date <= last_day
        ).scalar() or 0.0

        labor = db.query(func.coalesce(func.sum(Production.earnings), 0.0)).filter(
            Production.date >= first_day, Production.date <= last_day
        ).scalar() or 0.0

        fixed = db.query(func.coalesce(func.sum(FixedExpense.amount), 0.0)).filter(
            FixedExpense.month == m, FixedExpense.year == y
        ).scalar() or 0.0

        variable = db.query(func.coalesce(func.sum(VariableExpense.amount), 0.0)).filter(
            VariableExpense.date >= first_day, VariableExpense.date <= last_day
        ).scalar() or 0.0

        expenses = float(labor) + float(fixed) + float(variable)

        month_names = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
                       "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

        result.append(MonthlyFinancial(
            label=f"{month_names[m - 1]}/{str(y)[2:]}",
            earnings=float(revenue),
            expenses=expenses,
            net=float(revenue) - expenses,
        ))

    return result
