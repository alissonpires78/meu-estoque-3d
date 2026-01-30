import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LayoutDashboard, Printer, Package, Calculator, Users, LogOut } from 'lucide-react'
import { Button } from '../components/ui/button'

export function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signOut, isAdmin, canRead } = useAuth()

  const nav = [
    { path: '/', label: 'Início', icon: LayoutDashboard },
    { path: '/printers', label: 'Impressoras', icon: Printer },
    { path: '/filaments', label: 'Filamentos', icon: Package },
    { path: '/calculator', label: 'Calculadora', icon: Calculator },
  ]
  if (isAdmin) nav.push({ path: '/users', label: 'Usuários', icon: Users })

  return (
    <div className="min-h-screen bg-slate-900 text-white flex">
      <aside className="w-56 bg-slate-800 border-r border-slate-700 flex flex-col">
        <nav className="p-2 flex-1">
          {nav.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                location.pathname === item.path
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-2 border-t border-slate-700">
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-400 hover:text-white"
            onClick={() => signOut()}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Sair
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
