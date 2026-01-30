import { useState, useEffect } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, QrCode } from 'lucide-react'

const COLLECTION = 'filaments'

export function Filaments() {
  const { canWrite } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const qrFromUrl = searchParams.get('qr')
  const [filaments, setFilaments] = useState<Array<{ id: string; name?: string; qrCode?: string; weightRemaining?: number }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(collection(db, COLLECTION))
      setFilaments(
        snap.docs.map((d) => {
          const data = d.data()
          return {
            id: d.id,
            name: data.name,
            qrCode: data.qrCode,
            weightRemaining: data.weightRemaining,
          }
        })
      )
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (qrFromUrl && filaments.length > 0) {
      const match = filaments.find((f) => f.qrCode === qrFromUrl)
      if (match) {
        navigate(`/filaments/${match.id}`)
      }
    }
  }, [qrFromUrl, filaments, navigate])

  if (loading) return <div className="p-6 text-slate-400">Carregando...</div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Estoque de Filamentos</h1>
          <p className="text-slate-400">{filaments.length} filamentos cadastrados</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/filaments/scan')} className="border-slate-600">
            <QrCode className="w-4 h-4 mr-2" />
            Scan
          </Button>
          {canWrite && (
            <Button onClick={() => navigate('/filaments/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Filamento
            </Button>
          )}
        </div>
      </div>
      <ul className="space-y-2">
        {filaments.map((f) => (
          <li
            key={f.id}
            className="bg-slate-800 rounded-lg p-4 border border-slate-700 flex justify-between items-center"
          >
            <div>
              <span className="text-white font-medium">{f.name ?? f.id}</span>
              {f.qrCode && <span className="text-slate-400 text-sm ml-2">QR: {f.qrCode}</span>}
              {f.weightRemaining != null && (
                <span className="text-slate-400 text-sm ml-2">{f.weightRemaining}g restante</span>
              )}
            </div>
            {canWrite && (
              <Button variant="outline" size="sm" onClick={() => navigate(`/filaments/${f.id}`)} className="border-slate-600">
                Editar
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
