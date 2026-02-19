function timeAgo(ts) {
  const d = Math.floor((Date.now() - ts) / 86_400_000)
  if (d === 0) return 'today'
  if (d === 1) return '1d ago'
  return `${d}d ago`
}

export default function TokenCard({ token, users }) {
  const creator = users[token.creatorId] || { name: 'Unknown', avatar: '❓' }
  const remixes = token.remixCount + token.inspirations.length

  return (
    <div className="token-card">
      <div className="token-header">
        <div className="token-title">{token.title}</div>
        <span className={`badge badge-${token.type}`}>{token.type}</span>
      </div>
      <p className="token-body">{token.content}</p>
      <div className="token-footer">
        <div className="token-tags">
          {token.tags.slice(0, 3).map(tag => (
            <span key={tag} className="tag">#{tag}</span>
          ))}
        </div>
        <div className="token-meta">
          <span>{creator.avatar} {creator.name}</span>
          <span className="remix-count">↺ {remixes}</span>
          <span>{timeAgo(token.createdAt)}</span>
        </div>
      </div>
    </div>
  )
}
