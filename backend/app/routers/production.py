from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date
from app.database import get_db
from app.models.models import Production, Role
from app.schemas.schemas import ProductionCreate, ProductionUpdate, ProductionOut

router = APIRouter(prefix="/production", tags=["Produção"])


@router.get("/", response_model=List[ProductionOut])
def list_production(
    employee_id: Optional[int] = Query(None),
    role_id: Optional[int] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Production).options(
        joinedload(Production.employee),
        joinedload(Production.role),
    )
    if employee_id:
        q = q.filter(Production.employee_id == employee_id)
    if role_id:
        q = q.filter(Production.role_id == role_id)
    if start_date:
        q = q.filter(Production.date >= start_date)
    if end_date:
        q = q.filter(Production.date <= end_date)
    return q.order_by(Production.date.desc(), Production.id.desc()).all()


@router.post("/", response_model=ProductionOut, status_code=201)
def create_production(data: ProductionCreate, db: Session = Depends(get_db)):
    role = db.query(Role).filter(Role.id == data.role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Função não encontrada")
    earnings = data.quantity * role.value_per_unit
    production = Production(**data.model_dump(), earnings=earnings)
    db.add(production)
    db.commit()
    db.refresh(production)
    # reload with relationships
    db.refresh(production)
    return db.query(Production).options(
        joinedload(Production.employee),
        joinedload(Production.role),
    ).filter(Production.id == production.id).first()


@router.get("/{production_id}", response_model=ProductionOut)
def get_production(production_id: int, db: Session = Depends(get_db)):
    production = db.query(Production).options(
        joinedload(Production.employee),
        joinedload(Production.role),
    ).filter(Production.id == production_id).first()
    if not production:
        raise HTTPException(status_code=404, detail="Registro de produção não encontrado")
    return production


@router.put("/{production_id}", response_model=ProductionOut)
def update_production(production_id: int, data: ProductionUpdate, db: Session = Depends(get_db)):
    production = db.query(Production).filter(Production.id == production_id).first()
    if not production:
        raise HTTPException(status_code=404, detail="Registro de produção não encontrado")

    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(production, field, value)

    # recalculate earnings
    role = db.query(Role).filter(Role.id == production.role_id).first()
    production.earnings = production.quantity * role.value_per_unit

    db.commit()
    return db.query(Production).options(
        joinedload(Production.employee),
        joinedload(Production.role),
    ).filter(Production.id == production_id).first()


@router.delete("/{production_id}", status_code=204)
def delete_production(production_id: int, db: Session = Depends(get_db)):
    production = db.query(Production).filter(Production.id == production_id).first()
    if not production:
        raise HTTPException(status_code=404, detail="Registro de produção não encontrado")
    db.delete(production)
    db.commit()
