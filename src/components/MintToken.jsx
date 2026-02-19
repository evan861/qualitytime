import { useState } from 'react'
import { mintToken } from '../store'

const TYPES = ['problem', 'insight', 'metaphor', 'solution']

export default function MintToken({ store, onMint, onNav }) {
  const [title,        setTitle]        = useState('')
  const [content,      setContent]      = useState('')
  const [type,         setType]         = useState('insight')
  const [tags,         setTags]         = useState('')
  const [openness,     setOpenness]     = useState('open')
  const [inspirations, setInspirations] = useState([])
  const [minted,       setMinted]       = useState(null)

  function toggleInspiration(id) {
    setInspirations(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function handleMint() {
    const next = mintToken({
      title, content, type,
      tags: tags.split(','),
      openness, inspirations, store,
    })
    onMint(next)
    setMinted(next.tokens[next.tokens.length - 1].title)
    // Reset form
    setTitle(''); setContent(''); setTags(''); setInspirations([])
  }

  const ready = title.trim().length > 0 && content.trim().length > 0

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">+ Mint Knowledge Token</h2>
        <p className="page-sub">Tokenize a problem, insight, metaphor, or solution</p>
      </div>

      <div className="mint-form">
        {minted && (
          <div className="alert-success">
            ✓ &ldquo;{minted}&rdquo; is now live in the ecosystem.{' '}
            <button
              onClick={() => onNav('network')}
              style={{ background:'none', border:'none', color:'inherit', cursor:'pointer', textDecoration:'underline', font:'inherit' }}
            >
              View in Network →
            </button>
          </div>
        )}

        <div className="field">
          <label className="field-label">Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="A clear, memorable name for your idea"
          />
        </div>

        <div className="field">
          <label className="field-label">Content</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Describe the idea, its context, and why it matters"
          />
        </div>

        <div className="field-row">
          <div>
            <label className="field-label">Type</label>
            <select value={type} onChange={e => setType(e.target.value)}>
              {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Openness</label>
            <select value={openness} onChange={e => setOpenness(e.target.value)}>
              <option value="open">Open — free use + attribution</option>
              <option value="restricted">Restricted — permission required</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label className="field-label">Tags</label>
          <input
            type="text"
            value={tags}
            onChange={e => setTags(e.target.value)}
            placeholder="sustainability, ai, urban  (comma-separated)"
          />
        </div>

        {store.tokens.length > 0 && (
          <div className="field">
            <label className="field-label">Inspired by</label>
            <p className="field-hint" style={{ marginBottom: 8 }}>
              Select tokens that sparked this one — they'll appear as edges in the Network.
            </p>
            <div className="inspiration-list">
              {store.tokens.map(t => (
                <label key={t.id} className="inspiration-item">
                  <input
                    type="checkbox"
                    checked={inspirations.includes(t.id)}
                    onChange={() => toggleInspiration(t.id)}
                  />
                  <span className={`badge badge-${t.type}`}>{t.type}</span>
                  {t.title}
                </label>
              ))}
            </div>
          </div>
        )}

        <button className="btn btn-primary" disabled={!ready} onClick={handleMint}>
          Mint Token
        </button>
      </div>
    </div>
  )
}
