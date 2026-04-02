from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app.database import get_db
from app.models.models import Sale
from app.schemas.schemas import SaleCreate, SaleUpdate, SaleOut

router = APIRouter(prefix="/sales", tags=["Vendas"])


@router.get("/", response_model=List[SaleOut])
def list_sales(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Sale)
    if start_date:
        q = q.filter(Sale.date >= start_date)
    if end_date:
        q = q.filter(Sale.date <= end_date)
    return q.order_by(Sale.date.desc(), Sale.id.desc()).all()


@router.post("/", response_model=SaleOut, status_code=201)
def create_sale(data: SaleCreate, db: Session = Depends(get_db)):
    total = data.quantity * data.price_per_unit
    sale = Sale(**data.model_dump(), total=total)
    db.add(sale)
    db.commit()
    db.refresh(sale)
    return sale


@router.get("/{sale_id}", response_model=SaleOut)
def get_sale(sale_id: int, db: Session = Depends(get_db)):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Venda não encontrada")
    return sale


@router.put("/{sale_id}", response_model=SaleOut)
def update_sale(sale_id: int, data: SaleUpdate, db: Session = Depends(get_db)):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Venda não encontrada")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(sale, field, value)
    sale.total = sale.quantity * sale.price_per_unit
    db.commit()
    db.refresh(sale)
    return sale


@router.delete("/{sale_id}", status_code=204)
def delete_sale(sale_id: int, db: Session = Depends(get_db)):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Venda não encontrada")
    db.delete(sale)
    db.commit()
