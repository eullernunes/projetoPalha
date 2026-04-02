import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, Briefcase, ClipboardList,
  Receipt, TrendingUp,
} from 'lucide-react'

const links = [
  { to: '/',             icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/funcionarios', icon: Users,            label: 'Funcionários' },
  { to: '/funcoes',      icon: Briefcase,        label: 'Funções' },
  { to: '/producao',     icon: ClipboardList,    label: 'Produção' },
  { to: '/despesas',     icon: Receipt,          label: 'Despesas' },
  { to: '/relatorios',   icon: TrendingUp,       label: 'Relatórios' },
]

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-gray-900 flex flex-col z-30">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-700">
        <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
          P
        </div>
        <div>
          <p className="text-white font-semibold text-sm leading-tight">Palha LSA</p>
          <p className="text-gray-400 text-xs">Gestão de Produção</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-gray-700">
        <p className="text-gray-500 text-xs">v1.0.0</p>
      </div>
    </aside>
  )
}
