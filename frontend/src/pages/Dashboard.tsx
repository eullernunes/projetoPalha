import { useEffect, useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp, Users, Package, DollarSign,
  TrendingDown, Minus,
} from 'lucide-react'
import { dashboardApi } from '../api'
import type {
  DashboardSummary, ProductionTimePoint,
  EmployeeProductionStat, RoleProductionStat, MonthlyFinancial,
} from '../types'
import Spinner from '../components/ui/Spinner'

const MONTH_NAMES = [
  '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

// Paleta principal — cada série tem cor distinta e semântica
const C = {
  indigo:  '#6366f1',  // produção / unidades
  emerald: '#10b981',  // receita / ganhos
  rose:    '#f43f5e',  // despesas / custos
  amber:   '#f59e0b',  // resultado / equilíbrio
  sky:     '#0ea5e9',  // série secundária
  violet:  '#a855f7',  // destaque adicional
}

// Cores do pie chart — diversas e contrastantes
const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#0ea5e9', '#f43f5e', '#a855f7', '#14b8a6', '#f97316']

const GRID = '#e5e7eb'

function fmt(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function fmtNum(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

function KPICard({
  title, value, subtitle, icon: Icon, color, trend,
}: {
  title: string
  value: string
  subtitle?: string
  icon: React.ElementType
  color: string
  trend?: 'up' | 'down' | 'neutral'
}) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-400'

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
        {trend && <TrendIcon size={16} className={trendColor} />}
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium text-gray-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' && p.name.toLowerCase().includes('ganho')
            ? fmt(p.value)
            : fmtNum(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [year] = useState(today.getFullYear())

  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [timeSeries, setTimeSeries] = useState<ProductionTimePoint[]>([])
  const [byEmployee, setByEmployee] = useState<EmployeeProductionStat[]>([])
  const [byRole, setByRole] = useState<RoleProductionStat[]>([])
  const [monthly, setMonthly] = useState<MonthlyFinancial[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      dashboardApi.summary({ month, year }),
      dashboardApi.productionOverTime(30),
      dashboardApi.productionByEmployee(),
      dashboardApi.productionByRole(),
      dashboardApi.monthlyFinancial(6),
    ]).then(([s, ts, emp, role, mon]) => {
      setSummary(s)
      setTimeSeries(ts)
      setByEmployee(emp.slice(0, 8))
      setByRole(role)
      setMonthly(mon)
    }).finally(() => setLoading(false))
  }, [month, year])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size={32} />
      </div>
    )
  }

  const netColor = (summary?.net_result ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'

  return (
    <div className="space-y-6">
      {/* Month Selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">Visualizando:</span>
        <select
          className="input w-auto py-1.5 text-sm"
          value={month}
          onChange={e => setMonth(Number(e.target.value))}
        >
          {MONTH_NAMES.slice(1).map((name, i) => (
            <option key={i + 1} value={i + 1}>{name} {year}</option>
          ))}
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title="Produção Total"
          value={fmtNum(summary?.total_production ?? 0)}
          subtitle="unidades produzidas"
          icon={Package}
          color="bg-primary-600"
          trend="up"
        />
        <KPICard
          title="Receita de Vendas"
          value={fmt(summary?.total_revenue ?? 0)}
          subtitle="produtos vendidos"
          icon={TrendingUp}
          color="bg-green-600"
          trend="up"
        />
        <KPICard
          title="Custo Mão de Obra"
          value={fmt(summary?.total_labor_cost ?? 0)}
          subtitle="pagamento funcionários"
          icon={TrendingDown}
          color="bg-orange-500"
          trend="down"
        />
        <KPICard
          title="Total Despesas"
          value={fmt(summary?.total_expenses ?? 0)}
          subtitle={`Fixas: ${fmt(summary?.total_fixed_expenses ?? 0)}`}
          icon={TrendingDown}
          color="bg-red-500"
        />
        <KPICard
          title="Funcionários Ativos"
          value={String(summary?.active_employees ?? 0)}
          subtitle="na produção"
          icon={Users}
          color="bg-purple-500"
        />
      </div>

      {/* Net Result Banner */}
      <div className={`card p-4 flex items-center gap-4 ${
        (summary?.net_result ?? 0) >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
      }`}>
        <DollarSign size={20} className={netColor} />
        <div>
          <span className="text-sm text-gray-600">Resultado do mês ({MONTH_NAMES[month]}): </span>
          <span className={`text-lg font-bold ${netColor}`}>
            {fmt(summary?.net_result ?? 0)}
          </span>
        </div>
        <span className="ml-auto text-xs text-gray-400">
          Receita − Mão de Obra − Despesas Fixas − Despesas Variáveis
        </span>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Production Over Time */}
        <div className="card p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Produção nos Últimos 30 Dias</h3>
          {timeSeries.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              Nenhum dado de produção registrado.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={timeSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={false} tickLine={false}
                  tickFormatter={v => {
                    const d = new Date(v + 'T00:00:00')
                    return `${d.getDate()}/${d.getMonth() + 1}`
                  }}
                />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="quantity"
                  name="Unidades"
                  stroke={C.indigo}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: C.indigo }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Monthly Financial */}
        <div className="card p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Receita vs Despesas (6 Meses)</h3>
          {monthly.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              Nenhum dado financeiro disponível.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthly} barCategoryGap="35%" barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={52} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                  formatter={(value: number) => [fmt(value)]}
                  labelFormatter={l => `Mês: ${l}`}
                  cursor={{ fill: '#f3f4f6' }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="earnings" name="Receita" fill={C.emerald} radius={[6, 6, 0, 0]} />
                <Bar dataKey="expenses" name="Despesas" fill={C.rose} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* By Employee */}
        <div className="card p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Produção por Funcionário (Mês)</h3>
          {byEmployee.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              Nenhuma produção registrada este mês.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byEmployee} layout="vertical" barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="employee_name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={90} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                  formatter={(v: number) => [fmtNum(v), 'Unidades']}
                  cursor={{ fill: '#f3f4f6' }}
                />
                <Bar dataKey="quantity" name="Unidades" fill={C.indigo} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* By Role */}
        <div className="card p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Produção por Função (Mês)</h3>
          {byRole.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              Nenhuma produção registrada este mês.
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="60%" height={200}>
                <PieChart>
                  <Pie
                    data={byRole}
                    dataKey="quantity"
                    nameKey="role_name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={3}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {byRole.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="white" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                    formatter={(v: number) => [fmtNum(v), 'Unidades']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {byRole.map((r, i) => (
                  <div key={r.role_id} className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    <span className="text-xs text-gray-600 truncate">{r.role_name}</span>
                    <span className="ml-auto text-xs font-medium text-gray-900">{fmtNum(r.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
