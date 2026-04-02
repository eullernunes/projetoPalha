import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Receipt } from 'lucide-react'
import { expensesApi, employeesApi } from '../api'
import type { FixedExpense, VariableExpense, Employee } from '../types'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'

const today = new Date()
const todayStr = today.toISOString().split('T')[0]

const MONTH_NAMES = [
  '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}
function fmtDate(d: string) {
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

// ─── Fixed Expenses Tab ───────────────────────────────────────────────────────

function FixedTab() {
  const [expenses, setExpenses] = useState<FixedExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [filterMonth, setFilterMonth] = useState(today.getMonth() + 1)
  const [filterYear, setFilterYear] = useState(today.getFullYear())

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<FixedExpense | null>(null)
  const [form, setForm] = useState({
    description: '',
    amount: '',
    month: today.getMonth() + 1,
    year: today.getFullYear(),
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = () => {
    setLoading(true)
    expensesApi.listFixed({ month: filterMonth, year: filterYear })
      .then(setExpenses)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filterMonth, filterYear])

  const openCreate = () => {
    setEditing(null)
    setForm({ description: '', amount: '', month: filterMonth, year: filterYear })
    setError('')
    setModalOpen(true)
  }

  const openEdit = (exp: FixedExpense) => {
    setEditing(exp)
    setForm({ description: exp.description, amount: String(exp.amount), month: exp.month, year: exp.year })
    setError('')
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.description.trim()) { setError('Descrição é obrigatória.'); return }
    const amt = parseFloat(form.amount)
    if (isNaN(amt) || amt <= 0) { setError('Valor deve ser maior que zero.'); return }

    setSaving(true)
    setError('')
    try {
      const payload = { description: form.description.trim(), amount: amt, month: form.month, year: form.year }
      if (editing) {
        await expensesApi.updateFixed(editing.id, payload)
      } else {
        await expensesApi.createFixed(payload)
      }
      setModalOpen(false)
      load()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await expensesApi.deleteFixed(deleteId)
      setDeleteId(null)
      load()
    } finally {
      setDeleting(false)
    }
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <select
          className="input w-auto"
          value={filterMonth}
          onChange={e => setFilterMonth(Number(e.target.value))}
        >
          {MONTH_NAMES.slice(1).map((name, i) => (
            <option key={i + 1} value={i + 1}>{name}</option>
          ))}
        </select>
        <select
          className="input w-auto"
          value={filterYear}
          onChange={e => setFilterYear(Number(e.target.value))}
        >
          {[today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <span className="text-sm text-gray-500 ml-auto">
          Total: <strong className="text-red-600">{fmt(total)}</strong>
        </span>
        <button className="btn-primary" onClick={openCreate}>
          <Plus size={16} /> Nova Despesa Fixa
        </button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : expenses.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="Nenhuma despesa fixa"
            description={`Nenhuma despesa registrada para ${MONTH_NAMES[filterMonth]} ${filterYear}.`}
            action={<button className="btn-primary" onClick={openCreate}><Plus size={16} />Nova Despesa</button>}
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Descrição</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Mês/Ano</th>
                <th className="text-right px-5 py-3 font-medium text-gray-600">Valor</th>
                <th className="text-right px-5 py-3 font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expenses.map(exp => (
                <tr key={exp.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{exp.description}</td>
                  <td className="px-5 py-3 text-gray-500">{MONTH_NAMES[exp.month]}/{exp.year}</td>
                  <td className="px-5 py-3 text-right font-semibold text-red-600">{fmt(exp.amount)}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="btn-ghost p-1.5" onClick={() => openEdit(exp)}>
                        <Pencil size={15} />
                      </button>
                      <button
                        className="btn-ghost p-1.5 text-red-500 hover:bg-red-50"
                        onClick={() => setDeleteId(exp.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2 border-gray-200">
              <tr>
                <td colSpan={2} className="px-5 py-3 font-semibold text-gray-700">Total</td>
                <td className="px-5 py-3 text-right font-bold text-red-600">{fmt(total)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Despesa Fixa' : 'Nova Despesa Fixa'} size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Descrição *</label>
            <input className="input" placeholder="Ex: Aluguel, Energia..." autoFocus
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="label">Valor (R$) *</label>
            <input className="input" type="number" step="0.01" min="0" placeholder="0,00"
              value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Mês</label>
              <select className="input" value={form.month} onChange={e => setForm({ ...form, month: Number(e.target.value) })}>
                {MONTH_NAMES.slice(1).map((name, i) => <option key={i + 1} value={i + 1}>{name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Ano</label>
              <select className="input" value={form.year} onChange={e => setForm({ ...form, year: Number(e.target.value) })}>
                {[today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={deleteId !== null} onClose={() => setDeleteId(null)}
        onConfirm={handleDelete} message="Deseja excluir esta despesa fixa?" loading={deleting} />
    </div>
  )
}

// ─── Variable Expenses Tab ────────────────────────────────────────────────────

function VariableTab() {
  const [expenses, setExpenses] = useState<VariableExpense[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStart, setFilterStart] = useState('')
  const [filterEnd, setFilterEnd] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<VariableExpense | null>(null)
  const [form, setForm] = useState({ description: '', amount: '', date: todayStr, employee_id: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = () => {
    setLoading(true)
    expensesApi.listVariable({
      start_date: filterStart || undefined,
      end_date: filterEnd || undefined,
    }).then(setExpenses).finally(() => setLoading(false))
  }

  useEffect(() => {
    employeesApi.list().then(setEmployees)
    load()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ description: '', amount: '', date: todayStr, employee_id: '', notes: '' })
    setError('')
    setModalOpen(true)
  }

  const openEdit = (exp: VariableExpense) => {
    setEditing(exp)
    setForm({
      description: exp.description,
      amount: String(exp.amount),
      date: exp.date,
      employee_id: exp.employee_id ? String(exp.employee_id) : '',
      notes: exp.notes ?? '',
    })
    setError('')
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.description.trim()) { setError('Descrição é obrigatória.'); return }
    const amt = parseFloat(form.amount)
    if (isNaN(amt) || amt <= 0) { setError('Valor deve ser maior que zero.'); return }
    if (!form.date) { setError('Data é obrigatória.'); return }

    setSaving(true)
    setError('')
    try {
      const payload = {
        description: form.description.trim(),
        amount: amt,
        date: form.date,
        employee_id: form.employee_id ? parseInt(form.employee_id) : undefined,
        notes: form.notes.trim() || undefined,
      }
      if (editing) {
        await expensesApi.updateVariable(editing.id, payload)
      } else {
        await expensesApi.createVariable(payload)
      }
      setModalOpen(false)
      load()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await expensesApi.deleteVariable(deleteId)
      setDeleteId(null)
      load()
    } finally {
      setDeleting(false)
    }
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <input type="date" className="input w-auto text-sm" value={filterStart}
          onChange={e => setFilterStart(e.target.value)} />
        <span className="text-sm text-gray-400">até</span>
        <input type="date" className="input w-auto text-sm" value={filterEnd}
          onChange={e => setFilterEnd(e.target.value)} />
        <button className="btn-secondary text-sm" onClick={load}>Filtrar</button>
        <span className="text-sm text-gray-500 ml-auto">
          Total: <strong className="text-red-600">{fmt(total)}</strong>
        </span>
        <button className="btn-primary" onClick={openCreate}>
          <Plus size={16} /> Nova Despesa Variável
        </button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : expenses.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="Nenhuma despesa variável"
            description="Registre despesas variáveis como materiais, combustível, etc."
            action={<button className="btn-primary" onClick={openCreate}><Plus size={16} />Nova Despesa</button>}
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Data</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Descrição</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Funcionário</th>
                <th className="text-right px-5 py-3 font-medium text-gray-600">Valor</th>
                <th className="text-right px-5 py-3 font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expenses.map(exp => (
                <tr key={exp.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-500">{fmtDate(exp.date)}</td>
                  <td className="px-5 py-3 font-medium text-gray-900">
                    {exp.description}
                    {exp.notes && <span className="text-gray-400 font-normal ml-1">— {exp.notes}</span>}
                  </td>
                  <td className="px-5 py-3 text-gray-500">{exp.employee?.name ?? '—'}</td>
                  <td className="px-5 py-3 text-right font-semibold text-red-600">{fmt(exp.amount)}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="btn-ghost p-1.5" onClick={() => openEdit(exp)}><Pencil size={15} /></button>
                      <button className="btn-ghost p-1.5 text-red-500 hover:bg-red-50" onClick={() => setDeleteId(exp.id)}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2 border-gray-200">
              <tr>
                <td colSpan={3} className="px-5 py-3 font-semibold text-gray-700">Total</td>
                <td className="px-5 py-3 text-right font-bold text-red-600">{fmt(total)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Despesa Variável' : 'Nova Despesa Variável'}>
        <div className="space-y-4">
          <div>
            <label className="label">Descrição *</label>
            <input className="input" placeholder="Ex: Compra de materiais..." autoFocus
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Valor (R$) *</label>
              <input className="input" type="number" step="0.01" min="0" placeholder="0,00"
                value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div>
              <label className="label">Data *</label>
              <input className="input" type="date" value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Funcionário (opcional)</label>
            <select className="input" value={form.employee_id}
              onChange={e => setForm({ ...form, employee_id: e.target.value })}>
              <option value="">Nenhum</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Observações</label>
            <input className="input" placeholder="Opcional" value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={deleteId !== null} onClose={() => setDeleteId(null)}
        onConfirm={handleDelete} message="Deseja excluir esta despesa variável?" loading={deleting} />
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Expenses() {
  const [tab, setTab] = useState<'fixed' | 'variable'>('fixed')

  return (
    <div className="space-y-5">
      <div className="flex border-b border-gray-200">
        {(['fixed', 'variable'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'fixed' ? 'Despesas Fixas' : 'Despesas Variáveis'}
          </button>
        ))}
      </div>
      {tab === 'fixed' ? <FixedTab /> : <VariableTab />}
    </div>
  )
}
