import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { Button } from '../components/ui/button'
import { ArrowLeft, Camera } from 'lucide-react'

export function FilamentScan() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {})
      }
      scannerRef.current?.clear().catch(() => {})
      scannerRef.current = null
    }
  }, [])

  const startScan = async () => {
    setError(null)
    try {
      const isHttps = window.location.protocol === 'https:'
      const isLocalhost = /localhost|127\.0\.0\.1/.test(window.location.hostname)
      if (!isHttps && !isLocalhost) {
        setError('A câmera só funciona em HTTPS ou em localhost. Use o app em um endereço seguro.')
        return
      }
      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner
      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          scanner.stop().then(() => {
            setScanning(false)
            scannerRef.current = null
            navigate(`/filaments?qr=${encodeURIComponent(decodedText)}`)
          })
        },
        () => {}
      )
      setScanning(true)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
        setError('Permissão da câmera negada. Autorize no navegador e recarregue.')
      } else if (msg.includes('NotFoundError')) {
        setError('Nenhuma câmera encontrada.')
      } else {
        setError('Erro ao acessar câmera: ' + msg)
      }
      setScanning(false)
      scannerRef.current = null
    }
  }

  const stopScan = () => {
    if (scannerRef.current?.isScanning) {
      scannerRef.current.stop().catch(() => {})
      scannerRef.current.clear().catch(() => {})
      scannerRef.current = null
    }
    setScanning(false)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/filaments')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Escanear QR Code</h1>
        </div>
        {error && (
          <div className="bg-rose-500/20 border border-rose-500/50 rounded-lg p-3 text-rose-200 text-sm">
            {error}
          </div>
        )}
        <div id="qr-reader" ref={containerRef} className="rounded-lg overflow-hidden bg-black min-h-[280px] w-full" />
        <div className="flex gap-2">
          {!scanning ? (
            <Button onClick={startScan} className="flex-1">
              <Camera className="w-4 h-4 mr-2" />
              Abrir câmera
            </Button>
          ) : (
            <Button variant="outline" onClick={stopScan} className="flex-1 border-slate-600">
              Parar
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate('/filaments')} className="border-slate-600">
            Voltar
          </Button>
        </div>
      </div>
    </div>
  )
}
