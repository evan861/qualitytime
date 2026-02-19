import { useState } from 'react'
import { loadStore, saveStore } from './store'
import CoreLayer from './components/CoreLayer'
import InspirationNetwork from './components/InspirationNetwork'
import MintToken from './components/MintToken'

const NAV = [
  { id: 'core',    icon: '◈', label: 'Core Layer' },
  { id: 'network', icon: '⬡', label: 'Network' },
  { id: 'mint',    icon: '+', label: 'Mint Token' },
]

export default function App() {
  const [view, setView] = useState('core')
  const [store, setStore] = useState(() => loadStore())

  function updateStore(next) {
    setStore(next)
    saveStore(next)
  }

  const me = store.users[store.currentUserId]
  const myTokens = store.tokens.filter(t => t.creatorId === store.currentUserId)
  const totalRemixes = myTokens.reduce((s, t) => s + t.remixCount, 0)

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>Quality Time</h1>
          <p>Knowledge ecosystem</p>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(item => (
            <button
              key={item.id}
              className={`nav-btn ${view === item.id ? 'active' : ''}`}
              onClick={() => setView(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-user">
          <span className="user-avatar">{me.avatar}</span>
          <div>
            <div className="user-name">{me.name}</div>
            <div className="user-sub">{myTokens.length} tokens · {totalRemixes} remixes</div>
          </div>
        </div>
      </aside>

      <main className="main">
        {view === 'core'    && <CoreLayer store={store} />}
        {view === 'network' && <InspirationNetwork store={store} />}
        {view === 'mint'    && <MintToken store={store} onMint={updateStore} onNav={setView} />}
      </main>
    </div>
  )
}
