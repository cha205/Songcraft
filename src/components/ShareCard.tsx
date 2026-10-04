import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Icon } from './Icon'

/** Share a song: a QR code to scan with a phone, plus copy and share buttons. The link holds the whole song. */
export function ShareCard({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const [qr, setQr] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    QRCode.toDataURL(url, { errorCorrectionLevel: 'L', margin: 1, width: 720, color: { dark: '#1d1a4dff', light: '#ffffffff' } })
      .then(setQr)
      .catch(() => setQr(''))
  }, [url])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }
  const canShare = typeof navigator.share === 'function'

  return (
    <div className="modal-back" role="dialog" aria-modal="true" aria-label="Share your song" onClick={onClose}>
      <div className="card modal share-modal" onClick={(e) => e.stopPropagation()}>
        <button className="btn white modal-x" onClick={onClose}>
          Close
        </button>
        <h2 className="modal-title">Share your song</h2>
        <p className="modal-lead">Scan with a phone camera to play {title ? `"${title}"` : 'it'} there. The whole song is inside the link, so nothing is uploaded.</p>
        <div className="share-qr">{qr ? <img src={qr} alt="QR code that opens your song" /> : <span className="fine">Making the code</span>}</div>
        <div className="share-actions">
          <button className="btn violet lg" onClick={copy}>
            <Icon name={copied ? 'check' : 'notes'} size={26} /> {copied ? 'Link copied' : 'Copy link'}
          </button>
          {canShare && (
            <button className="btn white lg" onClick={() => navigator.share({ title: title || 'My song', text: 'Listen to the song I made with Songmaker', url }).catch(() => {})}>
              <Icon name="speaker" size={26} /> Share
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
