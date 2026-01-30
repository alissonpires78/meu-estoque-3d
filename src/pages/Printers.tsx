import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'

const COLLECTION = 'printers'

export function Printers() {
  const { canWrite } = useAuth()
  const navigate = useNavigate()
  const [printers, setPrinters] = useState<Array<{ id: string; name: string; qrCode?: string }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(collection(db, COLLECTION))
      setPrinters(
        snap.docs.map((d) => ({
          id: d.id,
          name: d.data().name ?? '',
          qrCode: d.data().qrCode,
        }))
      )
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="p-6 text-slate-400">Carregando...</div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Impressoras 3D</h1>
          <p className="text-slate-400">{printers.length} impressoras cadastradas</p>
        </div>
        {canWrite && (
          <Button onClick={() => navigate('/printers/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Impressora
          </Button>
        )}
      </div>
      <ul className="space-y-2">
        {printers.map((p) => (
          <li
            key={p.id}
            className="bg-slate-800 rounded-lg p-4 border border-slate-700 flex justify-between items-center"
          >
            <div>
              <span className="text-white font-medium">{p.name}</span>
              {p.qrCode && <span className="text-slate-400 text-sm ml-2">QR: {p.qrCode}</span>}
            </div>
            {canWrite && (
              <Button variant="outline" size="sm" onClick={() => navigate(`/printers/${p.id}`)} className="border-slate-600">
                Editar
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
