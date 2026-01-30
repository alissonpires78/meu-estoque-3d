import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LayoutDashboard, Printer, Package, Calculator, Users } from 'lucide-react'

export function Dashboard() {
  const navigate = useNavigate()
  const { appUser, isAdmin, canRead } = useAuth()

  if (!canRead) {
    return (
      <div className="p-6 text-slate-400">
        <p>Seu acesso ainda não foi autorizado. Aguarde a aprovação do administrador.</p>
      </div>
    )
  }

  const cards = [
    { title: 'Impressoras 3D', desc: 'Gerenciar impressoras', path: '/printers', icon: Printer },
    { title: 'Filamentos', desc: 'Estoque de filamentos', path: '/filaments', icon: Package },
    { title: 'Calculadora / Orçamento', desc: 'Custos e orçamentos', path: '/calculator', icon: Calculator },
  ]
  if (isAdmin) {
    cards.push({ title: 'Usuários', desc: 'Gerenciar usuários', path: '/users', icon: Users })
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">
        Olá, {appUser?.displayName || appUser?.email || 'Usuário'}
      </h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <button
            key={c.path}
            onClick={() => navigate(c.path)}
            className="bg-slate-800/50 border border-slate-700 hover:border-slate-600 rounded-lg p-4 text-left transition-colors"
          >
            <c.icon className="w-8 h-8 text-indigo-400 mb-2" />
            <h2 className="text-lg font-semibold text-white">{c.title}</h2>
            <p className="text-slate-400 text-sm">{c.desc}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
