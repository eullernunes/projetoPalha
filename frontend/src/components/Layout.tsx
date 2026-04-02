import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { LogOut, KeyRound, User } from 'lucide-react'
import Sidebar from './Sidebar'
import { useAuth } from '../contexts/AuthContext'
import Modal from './ui/Modal'
import { authApi } from '../api'

const titles: Record<string, string> = {
  '/':             'Dashboard',
  '/funcionarios': 'Funcionários',
  '/funcoes':      'Funções',
  '/producao':     'Produção',
  '/despesas':     'Despesas',
  '/relatorios':   'Relatórios',
}

function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const reset = () => { setForm({ current: '', next: '', confirm: '' }); setError(''); setSuccess(false) }

  const handleClose = () => { reset(); onClose() }

  const handleSave = async () => {
    if (!form.current || !form.next || !form.confirm) { setError('Preencha todos os campos.'); return }
    if (form.next !== form.confirm) { setError('A nova senha e a confirmação não coincidem.'); return }
    if (form.next.length < 6) { setError('A nova senha deve ter pelo menos 6 caracteres.'); return }
    setSaving(true); setError('')
    try {
      await authApi.changePassword(form.current, form.next)
      setSuccess(true)
      setTimeout(handleClose, 1500)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Alterar Senha" size="sm">
      {success ? (
        <div className="py-6 text-center">
          <p className="text-green-600 font-medium">Senha alterada com sucesso!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {[
            { id: 'current', label: 'Senha atual', key: 'current' as const },
            { id: 'next',    label: 'Nova senha',   key: 'next' as const },
            { id: 'confirm', label: 'Confirmar nova senha', key: 'confirm' as const },
          ].map(f => (
            <div key={f.id}>
              <label className="label">{f.label}</label>
              <input
                type="password"
                className="input"
                value={form[f.key]}
                onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))}
                autoFocus={f.key === 'current'}
              />
            </div>
          ))}
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={handleClose}>Cancelar</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Alterar Senha'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default function Layout() {
  const location = useLocation()
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [changePwOpen, setChangePwOpen] = useState(false)

  const title = titles[location.pathname] ?? 'Sistema Palha'

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-60 min-h-screen flex flex-col">
        <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-20 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>

          {/* User menu */}
          <div className="relative">
            <button
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setMenuOpen(v => !v)}
            >
              <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center">
                <User size={14} className="text-primary-700" />
              </div>
              <span className="font-medium">{user?.username}</span>
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-40 py-1 overflow-hidden">
                  <button
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => { setMenuOpen(false); setChangePwOpen(true) }}
                  >
                    <KeyRound size={15} className="text-gray-400" />
                    Alterar Senha
                  </button>
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    onClick={() => { setMenuOpen(false); logout() }}
                  >
                    <LogOut size={15} />
                    Sair
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <div className="flex-1 p-8">
          <Outlet />
        </div>
      </main>

      <ChangePasswordModal open={changePwOpen} onClose={() => setChangePwOpen(false)} />
    </div>
  )
}
