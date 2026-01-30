import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import type { UserRole } from '../types'
import { UserPlus, Trash2, Mail, Shield, ShieldCheck, Eye } from 'lucide-react'

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  user: 'Usuário padrão',
  readOnly: 'Somente leitura',
}

export function Users() {
  const {
    isAdmin,
    pendingUsers,
    allUsers,
    approveUser,
    rejectUser,
    setUserRole,
    deleteUser,
    sendApprovalLink,
  } = useAuth()
  const [selectedRole, setSelectedRole] = useState<UserRole>('user')
  const [linkCopied, setLinkCopied] = useState<string | null>(null)

  if (!isAdmin) {
    return (
      <div className="p-6 text-slate-400">
        Você não tem permissão para gerenciar usuários.
      </div>
    )
  }

  const handleCopyLink = async (uid: string, role: UserRole) => {
    const link = await sendApprovalLink(uid, role)
    await navigator.clipboard.writeText(link)
    setLinkCopied(uid)
    setTimeout(() => setLinkCopied(null), 2000)
  }

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold text-white">Gerenciar usuários</h1>

      {pendingUsers.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-slate-200 mb-3 flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Aguardando autorização ({pendingUsers.length})
          </h2>
          <ul className="space-y-2">
            {pendingUsers.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 bg-slate-800 rounded-lg p-3 border border-slate-700"
              >
                <div>
                  <span className="text-white font-medium">{p.email}</span>
                  {p.displayName && (
                    <span className="text-slate-400 text-sm ml-2">({p.displayName})</span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                    className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                  >
                    {(['admin', 'user', 'readOnly'] as const).map((r) => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                  <Button size="sm" onClick={() => approveUser(p.id, selectedRole)}>
                    Autorizar no app
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-600"
                    onClick={() => handleCopyLink(p.id, selectedRole)}
                  >
                    <Mail className="w-4 h-4 mr-1" />
                    {linkCopied === p.id ? 'Link copiado!' : 'Enviar link por e-mail'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => rejectUser(p.id)} className="border-rose-600 text-rose-400">
                    Rejeitar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold text-slate-200 mb-3 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Usuários autorizados
        </h2>
        <ul className="space-y-2">
          {allUsers.map((u) => (
            <li
              key={u.uid}
              className="flex flex-wrap items-center justify-between gap-2 bg-slate-800 rounded-lg p-3 border border-slate-700"
            >
              <div className="flex items-center gap-2">
                <span className="text-white font-medium">{u.email ?? u.uid}</span>
                {u.displayName && (
                  <span className="text-slate-400 text-sm">({u.displayName})</span>
                )}
                <span className="text-slate-500 text-xs flex items-center gap-1">
                  {u.role === 'admin' && <ShieldCheck className="w-4 h-4" />}
                  {u.role === 'readOnly' && <Eye className="w-4 h-4" />}
                  {ROLE_LABELS[u.role]}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={u.role}
                  onChange={(e) => setUserRole(u.uid, e.target.value as UserRole)}
                  className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                >
                  {(['admin', 'user', 'readOnly'] as const).map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deleteUser(u.uid)}
                  className="border-rose-600 text-rose-400"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
