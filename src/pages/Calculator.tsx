import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { PdfPrintButtons } from '../components/PdfPrintButtons'
import { useRef } from 'react'

const ORCAMENTOS_COLLECTION = 'orcamentos'

export function Calculator() {
  const { canWrite } = useAuth()
  const [hours, setHours] = useState('')
  const [costPerHour, setCostPerHour] = useState('')
  const [materialCost, setMaterialCost] = useState('')
  const [extraCost, setExtraCost] = useState('')
  const [clientName, setClientName] = useState('')
  const [saved, setSaved] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  const h = parseFloat(hours) || 0
  const cph = parseFloat(costPerHour) || 0
  const mat = parseFloat(materialCost) || 0
  const extra = parseFloat(extraCost) || 0
  const laborTotal = h * cph
  const total = laborTotal + mat + extra

  const handleCreateOrcamento = async () => {
    if (!canWrite) {
      alert('Você não tem permissão para criar orçamentos.')
      return
    }
    try {
      await addDoc(collection(db, ORCAMENTOS_COLLECTION), {
        hours: h,
        costPerHour: cph,
        materialCost: mat,
        extraCost: extra,
        laborTotal,
        total,
        clientName: clientName || null,
        createdAt: serverTimestamp(),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      console.error(e)
      alert('Erro ao salvar orçamento. Tente novamente.')
    }
  }

  const summaryContent = (
    <div ref={printRef} className="bg-slate-800 rounded-lg p-4 border border-slate-700 space-y-2">
      <h2 className="text-lg font-bold text-white">Orçamento</h2>
      {clientName && <p className="text-slate-300">Cliente: {clientName}</p>}
      <p className="text-slate-300">Horas: {h} × R$ {cph} = R$ {laborTotal.toFixed(2)}</p>
      <p className="text-slate-300">Material: R$ {mat.toFixed(2)}</p>
      <p className="text-slate-300">Extras: R$ {extra.toFixed(2)}</p>
      <p className="text-white font-bold text-xl">Total: R$ {total.toFixed(2)}</p>
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Calculadora / Orçamento</h1>

      <div className="grid gap-4 max-w-md">
        <div>
          <label className="block text-slate-300 text-sm mb-1">Cliente (opcional)</label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white"
            placeholder="Nome do cliente"
          />
        </div>
        <div>
          <label className="block text-slate-300 text-sm mb-1">Horas</label>
          <input
            type="number"
            step="0.1"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white"
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-slate-300 text-sm mb-1">Custo/hora (R$)</label>
          <input
            type="number"
            step="0.01"
            value={costPerHour}
            onChange={(e) => setCostPerHour(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white"
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-slate-300 text-sm mb-1">Custo material (R$)</label>
          <input
            type="number"
            step="0.01"
            value={materialCost}
            onChange={(e) => setMaterialCost(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white"
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-slate-300 text-sm mb-1">Extras (R$)</label>
          <input
            type="number"
            step="0.01"
            value={extraCost}
            onChange={(e) => setExtraCost(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white"
            placeholder="0"
          />
        </div>
        <p className="text-xl font-bold text-white">Total: R$ {total.toFixed(2)}</p>
        <div className="flex gap-2 flex-wrap">
          {canWrite && (
            <Button onClick={handleCreateOrcamento} disabled={saved}>
              {saved ? 'Salvo em orçamentos!' : 'Criar orçamento'}
            </Button>
          )}
          <PdfPrintButtons elementRef={printRef} filename="orcamento.pdf" />
        </div>
      </div>

      <div className="max-w-md">
        <h3 className="text-slate-300 text-sm mb-2">Resumo (para PDF / impressão)</h3>
        {summaryContent}
      </div>
    </div>
  )
}
