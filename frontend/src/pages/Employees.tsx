import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Users, Search } from 'lucide-react'
import { employeesApi } from '../api'
import type { Employee } from '../types'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'

const EMPTY: Omit<Employee, 'id' | 'created_at'> = {
  name: '', cpf: '', phone: '', active: true,
}

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filtered, setFiltered] = useState<Employee[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = () => {
    setLoading(true)
    employeesApi.list().then(data => {
      setEmployees(data)
      setFiltered(data)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    const s = search.toLowerCase()
    setFiltered(employees.filter(e =>
      e.name.toLowerCase().includes(s) ||
      (e.cpf ?? '').includes(s) ||
      (e.phone ?? '').includes(s)
    ))
  }, [search, employees])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY)
    setError('')
    setModalOpen(true)
  }

  const openEdit = (emp: Employee) => {
    setEditing(emp)
    setForm({ name: emp.name, cpf: emp.cpf ?? '', phone: emp.phone ?? '', active: emp.active })
    setError('')
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Nome é obrigatório.'); return }
    setSaving(true)
    setError('')
    try {
      if (editing) {
        await employeesApi.update(editing.id, form)
      } else {
        await employeesApi.create(form)
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
      await employeesApi.delete(deleteId)
      setDeleteId(null)
      load()
    } finally {
      setDeleting(false)
    }
  }

  const activeCount = employees.filter(e => e.active).length

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Buscar funcionário..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <span className="text-sm text-gray-500">{activeCount} ativo(s) · {employees.length} total</span>
        <button className="btn-primary" onClick={openCreate}>
          <Plus size={16} /> Novo Funcionário
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nenhum funcionário encontrado"
            description="Cadastre o primeiro funcionário para começar."
            action={<button className="btn-primary" onClick={openCreate}><Plus size={16} />Novo Funcionário</button>}
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Nome</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">CPF</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Telefone</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Status</th>
                <th className="text-right px-5 py-3 font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(emp => (
                <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-900">{emp.name}</td>
                  <td className="px-5 py-3 text-gray-500">{emp.cpf || '—'}</td>
                  <td className="px-5 py-3 text-gray-500">{emp.phone || '—'}</td>
                  <td className="px-5 py-3">
                    <Badge variant={emp.active ? 'green' : 'gray'}>
                      {emp.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="btn-ghost p-1.5" onClick={() => openEdit(emp)} title="Editar">
                        <Pencil size={15} />
                      </button>
                      <button className="btn-ghost p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => setDeleteId(emp.id)} title="Excluir">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Form Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Funcionário' : 'Novo Funcionário'}
      >
        <div className="space-y-4">
          <div>
            <label className="label">Nome *</label>
            <input
              className="input"
              placeholder="Nome completo"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              autoFocus
            />
          </div>
          <div>
            <label className="label">CPF</label>
            <input
              className="input"
              placeholder="000.000.000-00"
              value={form.cpf ?? ''}
              onChange={e => setForm({ ...form, cpf: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Telefone</label>
            <input
              className="input"
              placeholder="(00) 00000-0000"
              value={form.phone ?? ''}
              onChange={e => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="active"
              checked={form.active}
              onChange={e => setForm({ ...form, active: e.target.checked })}
              className="w-4 h-4 text-primary-600 rounded"
            />
            <label htmlFor="active" className="text-sm text-gray-700">Funcionário ativo</label>
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
        message="Deseja realmente excluir este funcionário? Esta ação não pode ser desfeita."
        loading={deleting}
      />
    </div>
  )
}
