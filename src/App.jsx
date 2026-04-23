import { useState, useEffect } from 'react'
import { loadStore } from './store'
import { fetchStore, persistStore } from './api'
import Dashboard      from './components/Dashboard'
import TerrainMap     from './components/TerrainMap'
import Capture        from './components/Capture'
import QueryPanel     from './components/QueryPanel'
import ProtocolRunner from './components/ProtocolRunner'
import ClaudeAdvisor  from './components/ClaudeAdvisor'

const NAV = [
  { id: 'dashboard', icon: '◈', label: 'Dashboard'  },
  { id: 'terrain',   icon: '⬡', label: 'Terrain'    },
  { id: 'capture',   icon: '◎', label: 'Capture'    },
  { id: 'query',     icon: '◐', label: 'Query'      },
  { id: 'protocols', icon: '⚡', label: 'Protocols'  },
  { id: 'advisor',   icon: '◉', label: 'Advisor'    },
]

export default function App() {
  const [view,        setView]        = useState('dashboard')
  const [store,       setStore]       = useState(() => loadStore())
  const [queryNodeId, setQueryNodeId] = useState(null)
  const [backendUp,   setBackendUp]   = useState(false)

  // Try to load from backend; fall back to localStorage silently
  useEffect(() => {
    fetchStore()
      .then(data => { setStore(data); setBackendUp(true) })
      .catch(() => {/* stay on localStorage store */})
  }, [])

  function updateStore(next) {
    setStore(next)
    if (backendUp) {
      persistStore(next).catch(() => {/* best-effort */})
    } else {
      // fallback: write to localStorage via the old saveStore logic
      try { localStorage.setItem('workbench-store', JSON.stringify(next)) } catch {}
    }
  }

  function navTo(viewId, nodeId = null) {
    if (viewId === 'query' && nodeId) setQueryNodeId(nodeId)
    setView(viewId)
  }

  function handleTerrainNodeSelect(node) {
    if (node) {
      setQueryNodeId(node.id)
      setView('query')
    }
  }

  const nodeCount = store.nodes.length
  const edgeCount = store.edges.length

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>Workbench</h1>
          <p>Coherence environment</p>
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

        <div className="sidebar-footer">
          <div className="sidebar-stat">{nodeCount} nodes</div>
          <div className="sidebar-stat">{edgeCount} edges</div>
          <div className="sidebar-hint">{backendUp ? 'v1 · backend' : 'v1 · local'}</div>
        </div>
      </aside>

      <main className="main">
        {view === 'dashboard' && (
          <Dashboard store={store} onNav={navTo} />
        )}
        {view === 'terrain' && (
          <TerrainMap store={store} onNodeSelect={handleTerrainNodeSelect} />
        )}
        {view === 'capture' && (
          <Capture store={store} onCapture={updateStore} onNav={setView} />
        )}
        {view === 'query' && (
          <QueryPanel
            store={store}
            initialNodeId={queryNodeId}
            key={queryNodeId}
          />
        )}
        {view === 'protocols' && (
          <ProtocolRunner store={store} onProtocolComplete={updateStore} />
        )}
        {view === 'advisor' && (
          <ClaudeAdvisor store={store} />
        )}
      </main>
    </div>
  )
}
