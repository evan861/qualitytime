import { useState } from 'react'
import { loadStore, saveStore } from './store'
import Dashboard      from './components/CoreLayer'
import TerrainMap     from './components/InspirationNetwork'
import Capture        from './components/MintToken'
import QueryPanel     from './components/QueryPanel'
import ProtocolRunner from './components/ProtocolRunner'

const NAV = [
  { id: 'dashboard', icon: '◈', label: 'Dashboard'  },
  { id: 'terrain',   icon: '⬡', label: 'Terrain'    },
  { id: 'capture',   icon: '◎', label: 'Capture'    },
  { id: 'query',     icon: '◐', label: 'Query'      },
  { id: 'protocols', icon: '⚡', label: 'Protocols'  },
]

export default function App() {
  const [view,          setView]          = useState('dashboard')
  const [store,         setStore]         = useState(() => loadStore())
  const [queryNodeId,   setQueryNodeId]   = useState(null)

  function updateStore(next) {
    setStore(next)
    saveStore(next)
  }

  // Navigate to a view, optionally with a node pre-selected in the query panel
  function navTo(viewId, nodeId = null) {
    if (viewId === 'query' && nodeId) setQueryNodeId(nodeId)
    setView(viewId)
  }

  // When terrain node is clicked, open query panel pre-loaded
  function handleTerrainNodeSelect(node) {
    if (node) {
      setQueryNodeId(node.id)
      setView('query')
    }
  }

  const nodeCount  = store.nodes.length
  const edgeCount  = store.edges.length

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
          <div className="sidebar-hint">v1 · local graph</div>
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
            key={queryNodeId} // re-mount when node changes from terrain click
          />
        )}
        {view === 'protocols' && (
          <ProtocolRunner store={store} onProtocolComplete={updateStore} />
        )}
      </main>
    </div>
  )
}
