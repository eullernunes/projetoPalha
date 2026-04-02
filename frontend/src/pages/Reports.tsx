import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, LineChart, Line,
} from 'recharts'
import { dashboardApi, employeesApi, rolesApi, productionApi } from '../api'
import type { Employee, Role, Production } from '../types'
import Spinner from '../components/ui/Spinner'

const today = new Date()

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}
function fmtDate(d: string) {
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

export default function Reports() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [roles, setRoles] = useState<Role[]>([])

  const [filterEmployee, setFilterEmployee] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(today.getFullYear(), today.getMonth(), 1)
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0])

  const [records, setRecords] = useState<Production[]>([])
  const [loading, setLoading] = useState(false)
  const [monthlyData, setMonthlyData] = useState<any[]>([])

  useEffect(() => {
    Promise.all([employeesApi.list(), rolesApi.list()]).then(([emps, rls]) => {
      setEmployees(emps)
      setRoles(rls)
    })
    dashboardApi.monthlyFinancial(12).then(setMonthlyData)
    runReport()
  }, [])

  const runReport = () => {
    setLoading(true)
    productionApi.list({
      employee_id: filterEmployee ? parseInt(filterEmployee) : undefined,
      role_id: filterRole ? parseInt(filterRole) : undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    }).then(setRecords).finally(() => setLoading(false))
  }

  // Group by employee
  const byEmployee = Object.values(
    records.reduce((acc, r) => {
      const key = r.employee.id
      if (!acc[key]) acc[key] = { name: r.employee.name, quantity: 0, earnings: 0 }
      acc[key].quantity += r.quantity
      acc[key].earnings += r.earnings
      return acc
    }, {} as Record<number, { name: string; quantity: number; earnings: number }>)
  ).sort((a, b) => b.quantity - a.quantity)

  // Group by role
  const byRole = Object.values(
    records.reduce((acc, r) => {
      const key = r.role.id
      if (!acc[key]) acc[key] = { name: r.role.name, quantity: 0, earnings: 0 }
      acc[key].quantity += r.quantity
      acc[key].earnings += r.earnings
      return acc
    }, {} as Record<number, { name: string; quantity: number; earnings: number }>)
  ).sort((a, b) => b.quantity - a.quantity)

  const totalQty = records.reduce((s, r) => s + r.quantity, 0)
  const totalEarnings = records.reduce((s, r) => s + r.earnings, 0)

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Filtrar Relatório</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <select className="input text-sm" value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)}>
            <option value="">Todos funcionários</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <select className="input text-sm" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
            <option value="">Todas funções</option>
            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <input type="date" className="input text-sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <input type="date" className="input text-sm" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <button className="btn-primary mt-3" onClick={runReport}>Gerar Relatório</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total de Registros', value: String(records.length) },
              { label: 'Total Produzido', value: new Intl.NumberFormat('pt-BR').format(totalQty) + ' un' },
              { label: 'Total em Ganhos', value: fmt(totalEarnings) },
            ].map(card => (
              <div key={card.label} className="card p-5 text-center">
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
            ))}
          </div>

          {/* By Employee Chart */}
          {byEmployee.length > 0 && (
            <div className="card p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Produção por Funcionário</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={byEmployee}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number, name) => [
                    name === 'earnings' ? fmt(v) : new Intl.NumberFormat('pt-BR').format(v), name
                  ]} />
                  <Legend />
                  <Bar dataKey="quantity" name="Unidades" fill="#16a34a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              {/* Table */}
              <table className="w-full text-sm mt-4">
                <thead><tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-gray-600 font-medium">Funcionário</th>
                  <th className="text-right py-2 text-gray-600 font-medium">Unidades</th>
                  <th className="text-right py-2 text-gray-600 font-medium">Ganhos</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {byEmployee.map(r => (
                    <tr key={r.name} className="hover:bg-gray-50">
                      <td className="py-2 font-medium text-gray-900">{r.name}</td>
                      <td className="py-2 text-right">{new Intl.NumberFormat('pt-BR').format(r.quantity)}</td>
                      <td className="py-2 text-right font-semibold text-primary-700">{fmt(r.earnings)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* By Role Chart */}
          {byRole.length > 0 && (
            <div className="card p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Produção por Função</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={byRole}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="quantity" name="Unidades" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="earnings" name="Ganhos (R$)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 12 Month Trend */}
          {monthlyData.length > 0 && (
            <div className="card p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Tendência Anual — Ganhos vs Despesas</h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend />
                  <Line type="monotone" dataKey="earnings" name="Ganhos" stroke="#16a34a" strokeWidth={2} dot />
                  <Line type="monotone" dataKey="expenses" name="Despesas" stroke="#f87171" strokeWidth={2} dot />
                  <Line type="monotone" dataKey="net" name="Resultado" stroke="#3b82f6" strokeWidth={2} dot strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Detailed Records */}
          {records.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200">
                <h3 className="text-base font-semibold text-gray-900">Registros Detalhados</h3>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-5 py-3 font-medium text-gray-600">Data</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-600">Funcionário</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-600">Função</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-600">Qtd</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-600">Ganho</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {records.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-5 py-2.5 text-gray-500">{fmtDate(r.date)}</td>
                      <td className="px-5 py-2.5 font-medium text-gray-900">{r.employee.name}</td>
                      <td className="px-5 py-2.5 text-gray-500">{r.role.name}</td>
                      <td className="px-5 py-2.5 text-right">{new Intl.NumberFormat('pt-BR').format(r.quantity)}</td>
                      <td className="px-5 py-2.5 text-right font-semibold text-primary-700">{fmt(r.earnings)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
