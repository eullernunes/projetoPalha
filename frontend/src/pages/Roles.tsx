import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Briefcase } from 'lucide-react'
import { rolesApi } from '../api'
import type { Role } from '../types'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'

const EMPTY = { name: '', description: '', value_per_unit: '' }

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

export default function Roles() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Role | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = () => {
    setLoading(true)
    rolesApi.list().then(setRoles).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY)
    setError('')
    setModalOpen(true)
  }

  const openEdit = (role: Role) => {
    setEditing(role)
    setForm({
      name: role.name,
      description: role.description ?? '',
      value_per_unit: String(role.value_per_unit),
    })
    setError('')
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Nome é obrigatório.'); return }
    const val = parseFloat(form.value_per_unit)
    if (isNaN(val) || val <= 0) { setError('Valor por unidade deve ser maior que zero.'); return }

    setSaving(true)
    setError('')
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        value_per_unit: val,
      }
      if (editing) {
        await rolesApi.update(editing.id, payload)
      } else {
        await rolesApi.create(payload)
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
      await rolesApi.delete(deleteId)
      setDeleteId(null)
      load()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{roles.length} função(ões) cadastrada(s)</p>
        <button className="btn-primary" onClick={openCreate}>
          <Plus size={16} /> Nova Função
        </button>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : roles.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Briefcase}
            title="Nenhuma função cadastrada"
            description="Cadastre as funções e seus valores por unidade produzida."
            action={<button className="btn-primary" onClick={openCreate}><Plus size={16} />Nova Função</button>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {roles.map(role => (
            <div key={role.id} className="card p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Briefcase size={18} className="text-primary-700" />
                </div>
                <div className="flex gap-1">
                  <button className="btn-ghost p-1.5" onClick={() => openEdit(role)}>
                    <Pencil size={14} />
                  </button>
                  <button
                    className="btn-ghost p-1.5 text-red-500 hover:bg-red-50"
                    onClick={() => setDeleteId(role.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{role.name}</h3>
                {role.description && (
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{role.description}</p>
                )}
              </div>
              <div className="mt-auto pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">Valor por unidade</p>
                <p className="text-lg font-bold text-primary-700">{fmt(role.value_per_unit)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Função' : 'Nova Função'}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="label">Nome da Função *</label>
            <input
              className="input"
              placeholder="Ex: Cortador, Triturador..."
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              autoFocus
            />
          </div>
          <div>
            <label className="label">Descrição</label>
            <input
              className="input"
              placeholder="Descrição opcional"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Valor por Unidade Produzida (R$) *</label>
            <input
              className="input"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={form.value_per_unit}
              onChange={e => setForm({ ...form, value_per_unit: e.target.value })}
            />
            <p className="text-xs text-gray-400 mt-1">
              Valor pago ao funcionário por unidade produzida.
            </p>
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
        message="Deseja excluir esta função? Registros de produção vinculados a ela também podem ser afetados."
        loading={deleting}
      />
    </div>
  )
}
