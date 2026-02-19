import TokenCard from './TokenCard'

export default function CoreLayer({ store }) {
  const me = store.users[store.currentUserId]
  const myTokens  = store.tokens.filter(t => t.creatorId === store.currentUserId)
  const allOthers = store.tokens.filter(t => t.creatorId !== store.currentUserId)
  const totalRemixes = myTokens.reduce((s, t) => s + t.remixCount, 0)

  // tokens in the network that cite at least one of my tokens
  const downstreamCount = allOthers.filter(t =>
    t.inspirations.some(id => myTokens.find(mt => mt.id === id))
  ).length

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">{me.avatar} Core Layer</h2>
        <p className="page-sub">Your digital anchor — contributions, tokens, and impact map</p>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Knowledge Tokens</div>
          <div className="stat-value">{myTokens.length}</div>
          <div className="stat-detail">minted by you</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Downstream Builds</div>
          <div className="stat-value">{downstreamCount}</div>
          <div className="stat-detail">tokens built on yours</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Remixes</div>
          <div className="stat-value">{totalRemixes}</div>
          <div className="stat-detail">across the network</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Ecosystem Size</div>
          <div className="stat-value">{store.tokens.length}</div>
          <div className="stat-detail">tokens in circulation</div>
        </div>
      </div>

      <div className="section-title">Your Tokens</div>
      {myTokens.length === 0
        ? <p className="empty-state">No tokens yet — mint your first idea!</p>
        : <div className="token-grid">
            {myTokens.map(t => <TokenCard key={t.id} token={t} users={store.users} />)}
          </div>
      }

      {allOthers.length > 0 && (
        <>
          <div className="section-title" style={{ marginTop: 36 }}>Ecosystem Activity</div>
          <div className="token-grid">
            {allOthers.map(t => <TokenCard key={t.id} token={t} users={store.users} />)}
          </div>
        </>
      )}
    </div>
  )
}
