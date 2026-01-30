import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

/**
 * Converte um elemento HTML em canvas e gera PDF.
 * Funciona com elementos visíveis na tela.
 */
export async function exportToPdf(
  element: HTMLElement,
  filename: string = 'documento.pdf',
  options?: { scale?: number; useCORS?: boolean }
): Promise<void> {
  const scale = options?.scale ?? 2
  const canvas = await html2canvas(element, {
    scale,
    useCORS: options?.useCORS ?? true,
    allowTaint: true,
    logging: false,
    backgroundColor: '#ffffff',
  })
  const imgData = canvas.toDataURL('image/png', 1.0)
  const pdf = new jsPDF({
    orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const imgWidth = pageWidth
  const imgHeight = (canvas.height * pageWidth) / canvas.width
  let heightLeft = imgHeight
  let position = 0
  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
  heightLeft -= pageHeight
  while (heightLeft > 0) {
    position = heightLeft - imgHeight
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
  }
  pdf.save(filename)
}

/**
 * Abre a janela de impressão do navegador para o conteúdo indicado.
 * Cria uma janela temporária com o conteúdo e chama window.print().
 */
export function printElement(element: HTMLElement): void {
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Permita pop-ups para imprimir.')
    return
  }
  const clone = element.cloneNode(true) as HTMLElement
  clone.style.backgroundColor = '#fff'
  clone.style.color = '#000'
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Impressão</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 16px; }
          * { box-sizing: border-box; }
        </style>
      </head>
      <body>${clone.outerHTML}</body>
    </html>
  `)
  printWindow.document.close()
  printWindow.focus()
  printWindow.onload = () => {
    printWindow.print()
    printWindow.onafterprint = () => printWindow.close()
  }
}

/**
 * Opções: salvar PDF e/ou imprimir.
 */
export async function exportOrPrint(
  element: HTMLElement,
  options: { pdf?: boolean; print?: boolean; filename?: string }
): Promise<void> {
  if (options.pdf) {
    await exportToPdf(element, options.filename ?? 'documento.pdf')
  }
  if (options.print) {
    printElement(element)
  }
}
