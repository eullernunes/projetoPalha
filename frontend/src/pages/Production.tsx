import { useEffect, useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, ClipboardList, Filter } from 'lucide-react'
import { productionApi, employeesApi, rolesApi } from '../api'
import type { Production, Employee, Role } from '../types'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'

const today = new Date().toISOString().split('T')[0]

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function fmtDate(d: string) {
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

export default function ProductionPage() {
  const [records, setRecords] = useState<Production[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [filterEmployee, setFilterEmployee] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterStart, setFilterStart] = useState('')
  const [filterEnd, setFilterEnd] = useState('')

  // Form
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Production | null>(null)
  const [form, setForm] = useState({
    employee_id: '',
    role_id: '',
    date: today,
    quantity: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadRecords = (params?: object) => {
    setLoading(true)
    productionApi.list(params as any).then(setRecords).finally(() => setLoading(false))
  }

  useEffect(() => {
    Promise.all([
      employeesApi.list(),
      rolesApi.list(),
    ]).then(([emps, rls]) => {
      setEmployees(emps)
      setRoles(rls)
    })
    loadRecords()
  }, [])

  const handleFilter = () => {
    loadRecords({
      employee_id: filterEmployee || undefined,
      role_id: filterRole || undefined,
      start_date: filterStart || undefined,
      end_date: filterEnd || undefined,
    })
  }

  const clearFilters = () => {
    setFilterEmployee('')
    setFilterRole('')
    setFilterStart('')
    setFilterEnd('')
    loadRecords()
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ employee_id: '', role_id: '', date: today, quantity: '', notes: '' })
    setError('')
    setModalOpen(true)
  }

  const openEdit = (rec: Production) => {
    setEditing(rec)
    setForm({
      employee_id: String(rec.employee_id),
      role_id: String(rec.role_id),
      date: rec.date,
      quantity: String(rec.quantity),
      notes: rec.notes ?? '',
    })
    setError('')
    setModalOpen(true)
  }

  const selectedRole = useMemo(
    () => roles.find(r => r.id === parseInt(form.role_id)),
    [form.role_id, roles]
  )

  const previewEarnings = useMemo(() => {
    const qty = parseInt(form.quantity)
    if (!selectedRole || isNaN(qty) || qty <= 0) return null
    return qty * selectedRole.value_per_unit
  }, [form.quantity, selectedRole])

  const handleSave = async () => {
    if (!form.employee_id) { setError('Selecione um funcionário.'); return }
    if (!form.role_id) { setError('Selecione uma função.'); return }
    if (!form.date) { setError('Data é obrigatória.'); return }
    const qty = parseInt(form.quantity)
    if (isNaN(qty) || qty <= 0) { setError('Quantidade deve ser maior que zero.'); return }

    setSaving(true)
    setError('')
    try {
      const payload = {
        employee_id: parseInt(form.employee_id),
        role_id: parseInt(form.role_id),
        date: form.date,
        quantity: qty,
        notes: form.notes.trim() || undefined,
      }
      if (editing) {
        await productionApi.update(editing.id, payload)
      } else {
        await productionApi.create(payload)
      }
      setModalOpen(false)
      handleFilter()
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
      await productionApi.delete(deleteId)
      setDeleteId(null)
      handleFilter()
    } finally {
      setDeleting(false)
    }
  }

  const totalQty = records.reduce((s, r) => s + r.quantity, 0)
  const totalEarnings = records.reduce((s, r) => s + r.earnings, 0)

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filtros</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <select
            className="input text-sm"
            value={filterEmployee}
            onChange={e => setFilterEmployee(e.target.value)}
          >
            <option value="">Todos os funcionários</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <select
            className="input text-sm"
            value={filterRole}
            onChange={e => setFilterRole(e.target.value)}
          >
            <option value="">Todas as funções</option>
            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <input
            type="date"
            className="input text-sm"
            value={filterStart}
            onChange={e => setFilterStart(e.target.value)}
            placeholder="Data início"
          />
          <input
            type="date"
            className="input text-sm"
            value={filterEnd}
            onChange={e => setFilterEnd(e.target.value)}
            placeholder="Data fim"
          />
        </div>
        <div className="flex gap-2 mt-3">
          <button className="btn-primary text-sm py-1.5" onClick={handleFilter}>Filtrar</button>
          <button className="btn-secondary text-sm py-1.5" onClick={clearFilters}>Limpar</button>
          <div className="ml-auto flex items-center gap-4 text-sm text-gray-500">
            <span>{records.length} registro(s)</span>
            <span className="font-medium text-gray-700">Total: {fmt(totalEarnings)}</span>
            <span className="font-medium text-gray-700">{new Intl.NumberFormat('pt-BR').format(totalQty)} unidades</span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex justify-end">
        <button className="btn-primary" onClick={openCreate}>
          <Plus size={16} /> Registrar Produção
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : records.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Nenhum registro encontrado"
            description="Registre a produção diária dos funcionários."
            action={<button className="btn-primary" onClick={openCreate}><Plus size={16} />Registrar Produção</button>}
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Data</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Funcionário</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Função</th>
                <th className="text-right px-5 py-3 font-medium text-gray-600">Qtd</th>
                <th className="text-right px-5 py-3 font-medium text-gray-600">Valor/Un</th>
                <th className="text-right px-5 py-3 font-medium text-gray-600">Ganho</th>
                <th className="text-right px-5 py-3 font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map(rec => (
                <tr key={rec.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-gray-600">{fmtDate(rec.date)}</td>
                  <td className="px-5 py-3 font-medium text-gray-900">{rec.employee.name}</td>
                  <td className="px-5 py-3 text-gray-600">{rec.role.name}</td>
                  <td className="px-5 py-3 text-right font-medium">
                    {new Intl.NumberFormat('pt-BR').format(rec.quantity)}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-500">
                    {fmt(rec.role.value_per_unit)}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-primary-700">
                    {fmt(rec.earnings)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="btn-ghost p-1.5" onClick={() => openEdit(rec)}>
                        <Pencil size={15} />
                      </button>
                      <button
                        className="btn-ghost p-1.5 text-red-500 hover:bg-red-50"
                        onClick={() => setDeleteId(rec.id)}
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
                <td colSpan={3} className="px-5 py-3 text-sm font-semibold text-gray-700">Totais</td>
                <td className="px-5 py-3 text-right font-bold text-gray-900">
                  {new Intl.NumberFormat('pt-BR').format(totalQty)}
                </td>
                <td />
                <td className="px-5 py-3 text-right font-bold text-primary-700">{fmt(totalEarnings)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Form Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Registro' : 'Registrar Produção'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Funcionário *</label>
              <select
                className="input"
                value={form.employee_id}
                onChange={e => setForm({ ...form, employee_id: e.target.value })}
                autoFocus
              >
                <option value="">Selecione...</option>
                {employees.filter(e => e.active).map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Função *</label>
              <select
                className="input"
                value={form.role_id}
                onChange={e => setForm({ ...form, role_id: e.target.value })}
              >
                <option value="">Selecione...</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Data *</label>
              <input
                type="date"
                className="input"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Quantidade *</label>
              <input
                type="number"
                className="input"
                min="1"
                placeholder="0"
                value={form.quantity}
                onChange={e => setForm({ ...form, quantity: e.target.value })}
              />
            </div>
          </div>

          {/* Earnings Preview */}
          {previewEarnings !== null && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-primary-700">Ganho calculado:</span>
                <span className="text-xl font-bold text-primary-700">
                  {fmt(previewEarnings)}
                </span>
              </div>
              <p className="text-xs text-primary-500 mt-1">
                {form.quantity} un × {selectedRole && fmt(selectedRole.value_per_unit)}/un
              </p>
            </div>
          )}

          <div>
            <label className="label">Observações</label>
            <input
              className="input"
              placeholder="Opcional"
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
            />
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

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        message="Deseja excluir este registro de produção?"
        loading={deleting}
      />
    </div>
  )
}
