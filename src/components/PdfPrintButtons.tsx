import { useRef } from 'react'
import { Button } from './ui/button'
import { exportToPdf, printElement } from '../utils/pdf'
import { FileDown, Printer } from 'lucide-react'

interface PdfPrintButtonsProps {
  elementRef: React.RefObject<HTMLElement | null>
  filename?: string
  className?: string
}

export function PdfPrintButtons({ elementRef, filename = 'documento.pdf', className }: PdfPrintButtonsProps) {
  const handlePdf = async () => {
    const el = elementRef.current
    if (!el) {
      alert('Nenhum conteúdo para exportar.')
      return
    }
    try {
      await exportToPdf(el, filename)
    } catch (e) {
      console.error(e)
      alert('Erro ao gerar PDF. Tente novamente.')
    }
  }

  const handlePrint = () => {
    const el = elementRef.current
    if (!el) {
      alert('Nenhum conteúdo para imprimir.')
      return
    }
    printElement(el)
  }

  return (
    <div className={className ?? 'flex gap-2'}>
      <Button type="button" variant="outline" onClick={handlePdf} className="border-slate-600">
        <FileDown className="w-4 h-4 mr-2" />
        Salvar PDF
      </Button>
      <Button type="button" variant="outline" onClick={handlePrint} className="border-slate-600">
        <Printer className="w-4 h-4 mr-2" />
        Imprimir
      </Button>
    </div>
  )
}
