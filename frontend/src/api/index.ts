import api from './client'

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (username: string, password: string) =>
    api.post<{ access_token: string; token_type: string; username: string }>(
      '/auth/login', { username, password }
    ).then(r => r.data),
  me: () =>
    api.get<{ id: number; username: string; active: boolean }>('/auth/me').then(r => r.data),
  changePassword: (current_password: string, new_password: string) =>
    api.post('/auth/change-password', { current_password, new_password }).then(r => r.data),
}

import type {
  Employee, Role, Production, FixedExpense, VariableExpense,
  DashboardSummary, ProductionTimePoint, EmployeeProductionStat,
  RoleProductionStat, MonthlyFinancial,
} from '../types'

// ─── Employees ────────────────────────────────────────────────────────────────

export const employeesApi = {
  list: (activeOnly = false) =>
    api.get<Employee[]>('/employees', { params: { active_only: activeOnly } }).then(r => r.data),
  get: (id: number) =>
    api.get<Employee>(`/employees/${id}`).then(r => r.data),
  create: (data: Omit<Employee, 'id' | 'created_at'>) =>
    api.post<Employee>('/employees', data).then(r => r.data),
  update: (id: number, data: Partial<Employee>) =>
    api.put<Employee>(`/employees/${id}`, data).then(r => r.data),
  delete: (id: number) =>
    api.delete(`/employees/${id}`),
}

// ─── Roles ────────────────────────────────────────────────────────────────────

export const rolesApi = {
  list: () =>
    api.get<Role[]>('/roles').then(r => r.data),
  get: (id: number) =>
    api.get<Role>(`/roles/${id}`).then(r => r.data),
  create: (data: Omit<Role, 'id' | 'created_at'>) =>
    api.post<Role>('/roles', data).then(r => r.data),
  update: (id: number, data: Partial<Role>) =>
    api.put<Role>(`/roles/${id}`, data).then(r => r.data),
  delete: (id: number) =>
    api.delete(`/roles/${id}`),
}

// ─── Production ───────────────────────────────────────────────────────────────

export const productionApi = {
  list: (params?: { employee_id?: number; role_id?: number; start_date?: string; end_date?: string }) =>
    api.get<Production[]>('/production', { params }).then(r => r.data),
  get: (id: number) =>
    api.get<Production>(`/production/${id}`).then(r => r.data),
  create: (data: { employee_id: number; role_id: number; date: string; quantity: number; notes?: string }) =>
    api.post<Production>('/production', data).then(r => r.data),
  update: (id: number, data: Partial<Production>) =>
    api.put<Production>(`/production/${id}`, data).then(r => r.data),
  delete: (id: number) =>
    api.delete(`/production/${id}`),
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

export const expensesApi = {
  listFixed: (params?: { month?: number; year?: number }) =>
    api.get<FixedExpense[]>('/expenses/fixed', { params }).then(r => r.data),
  createFixed: (data: Omit<FixedExpense, 'id' | 'created_at'>) =>
    api.post<FixedExpense>('/expenses/fixed', data).then(r => r.data),
  updateFixed: (id: number, data: Partial<FixedExpense>) =>
    api.put<FixedExpense>(`/expenses/fixed/${id}`, data).then(r => r.data),
  deleteFixed: (id: number) =>
    api.delete(`/expenses/fixed/${id}`),

  listVariable: (params?: { start_date?: string; end_date?: string; employee_id?: number }) =>
    api.get<VariableExpense[]>('/expenses/variable', { params }).then(r => r.data),
  createVariable: (data: Omit<VariableExpense, 'id' | 'created_at' | 'employee'>) =>
    api.post<VariableExpense>('/expenses/variable', data).then(r => r.data),
  updateVariable: (id: number, data: Partial<VariableExpense>) =>
    api.put<VariableExpense>(`/expenses/variable/${id}`, data).then(r => r.data),
  deleteVariable: (id: number) =>
    api.delete(`/expenses/variable/${id}`),
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const dashboardApi = {
  summary: (params?: { month?: number; year?: number }) =>
    api.get<DashboardSummary>('/dashboard/summary', { params }).then(r => r.data),
  productionOverTime: (days = 30) =>
    api.get<ProductionTimePoint[]>('/dashboard/production-over-time', { params: { days } }).then(r => r.data),
  productionByEmployee: (params?: { start_date?: string; end_date?: string }) =>
    api.get<EmployeeProductionStat[]>('/dashboard/production-by-employee', { params }).then(r => r.data),
  productionByRole: (params?: { start_date?: string; end_date?: string }) =>
    api.get<RoleProductionStat[]>('/dashboard/production-by-role', { params }).then(r => r.data),
  monthlyFinancial: (months = 6) =>
    api.get<MonthlyFinancial[]>('/dashboard/monthly-financial', { params: { months } }).then(r => r.data),
}
