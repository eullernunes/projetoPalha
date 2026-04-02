from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date, datetime


# ─── Role ────────────────────────────────────────────────────────────────────

class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None
    value_per_unit: float


class RoleCreate(RoleBase):
    pass


class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    value_per_unit: Optional[float] = None


class RoleOut(RoleBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime


# ─── Employee ─────────────────────────────────────────────────────────────────

class EmployeeBase(BaseModel):
    name: str
    cpf: Optional[str] = None
    phone: Optional[str] = None
    active: bool = True


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    cpf: Optional[str] = None
    phone: Optional[str] = None
    active: Optional[bool] = None


class EmployeeOut(EmployeeBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime


class EmployeeBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    active: bool


# ─── Production ───────────────────────────────────────────────────────────────

class ProductionBase(BaseModel):
    employee_id: int
    role_id: int
    date: date
    quantity: int
    notes: Optional[str] = None


class ProductionCreate(ProductionBase):
    pass


class ProductionUpdate(BaseModel):
    employee_id: Optional[int] = None
    role_id: Optional[int] = None
    date: Optional[date] = None
    quantity: Optional[int] = None
    notes: Optional[str] = None


class RoleBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    value_per_unit: float


class ProductionOut(ProductionBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    earnings: float
    created_at: datetime
    employee: EmployeeBrief
    role: RoleBrief


# ─── Fixed Expense ────────────────────────────────────────────────────────────

class FixedExpenseBase(BaseModel):
    description: str
    amount: float
    month: int
    year: int


class FixedExpenseCreate(FixedExpenseBase):
    pass


class FixedExpenseUpdate(BaseModel):
    description: Optional[str] = None
    amount: Optional[float] = None
    month: Optional[int] = None
    year: Optional[int] = None


class FixedExpenseOut(FixedExpenseBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime


# ─── Variable Expense ─────────────────────────────────────────────────────────

class VariableExpenseBase(BaseModel):
    description: str
    amount: float
    date: date
    employee_id: Optional[int] = None
    notes: Optional[str] = None


class VariableExpenseCreate(VariableExpenseBase):
    pass


class VariableExpenseUpdate(BaseModel):
    description: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[date] = None
    employee_id: Optional[int] = None
    notes: Optional[str] = None


class VariableExpenseOut(VariableExpenseBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    employee: Optional[EmployeeBrief] = None


# ─── Dashboard ────────────────────────────────────────────────────────────────

class DashboardSummary(BaseModel):
    total_production: int
    total_earnings: float
    total_fixed_expenses: float
    total_variable_expenses: float
    total_expenses: float
    net_result: float
    active_employees: int
    month: int
    year: int


class ProductionTimePoint(BaseModel):
    date: str
    quantity: int
    earnings: float


class EmployeeProductionStat(BaseModel):
    employee_id: int
    employee_name: str
    quantity: int
    earnings: float


class RoleProductionStat(BaseModel):
    role_id: int
    role_name: str
    quantity: int
    earnings: float


class MonthlyFinancial(BaseModel):
    label: str
    earnings: float
    expenses: float
    net: float
