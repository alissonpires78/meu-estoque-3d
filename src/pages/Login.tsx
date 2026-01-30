import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const approveUid = searchParams.get('uid')
  const approveRole = searchParams.get('role')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setLoading(true)
    try {
      if (isSignUp) {
        await signUp(email, password, displayName || undefined)
        setMessage('Cadastro realizado. Aguarde a aprovação do administrador ou use o link enviado por e-mail.')
      } else {
        await signIn(email, password)
        navigate('/')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setMessage(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">
          {approveUid ? 'Link de autorização' : isSignUp ? 'Cadastro' : 'Entrar'}
        </h1>
        {approveUid && (
          <p className="text-slate-300 text-sm mb-4">
            Este link autoriza seu acesso. Faça login após a autorização.
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-slate-300 text-sm mb-1">Nome</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white"
                placeholder="Seu nome"
              />
            </div>
          )}
          <div>
            <label className="block text-slate-300 text-sm mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white"
              placeholder="email@exemplo.com"
            />
          </div>
          <div>
            <label className="block text-slate-300 text-sm mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white"
              placeholder="••••••••"
            />
          </div>
          {message && (
            <p className="text-amber-400 text-sm">{message}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Aguarde...' : isSignUp ? 'Cadastrar' : 'Entrar'}
          </Button>
        </form>
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="mt-4 w-full text-slate-400 hover:text-white text-sm"
        >
          {isSignUp ? 'Já tenho conta' : 'Criar conta'}
        </button>
      </div>
    </div>
  )
}
