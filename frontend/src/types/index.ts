export interface Role {
  id: number
  name: string
  description?: string
  value_per_unit: number
  created_at: string
}

export interface Employee {
  id: number
  name: string
  cpf?: string
  phone?: string
  active: boolean
  created_at: string
}

export interface EmployeeBrief {
  id: number
  name: string
  active: boolean
}

export interface RoleBrief {
  id: number
  name: string
  value_per_unit: number
}

export interface Production {
  id: number
  employee_id: number
  role_id: number
  date: string
  quantity: number
  earnings: number
  notes?: string
  created_at: string
  employee: EmployeeBrief
  role: RoleBrief
}

export interface FixedExpense {
  id: number
  description: string
  amount: number
  month: number
  year: number
  created_at: string
}

export interface VariableExpense {
  id: number
  description: string
  amount: number
  date: string
  employee_id?: number
  notes?: string
  created_at: string
  employee?: EmployeeBrief
}

export interface DashboardSummary {
  total_production: number
  total_earnings: number
  total_fixed_expenses: number
  total_variable_expenses: number
  total_expenses: number
  net_result: number
  active_employees: number
  month: number
  year: number
}

export interface ProductionTimePoint {
  date: string
  quantity: number
  earnings: number
}

export interface EmployeeProductionStat {
  employee_id: number
  employee_name: string
  quantity: number
  earnings: number
}

export interface RoleProductionStat {
  role_id: number
  role_name: string
  quantity: number
  earnings: number
}

export interface MonthlyFinancial {
  label: string
  earnings: number
  expenses: number
  net: number
}
