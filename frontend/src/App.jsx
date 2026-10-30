import AppRoutes from './routes/AppRoutes'
import ScrollToTop from './components/common/ScrollToTop'
import { AuthProvider } from './context/AuthContext'
import { ChatWebSocketProvider } from './context/ChatWebSocketContext'

function App() {
  return (
    <AuthProvider>
      <ChatWebSocketProvider>
        <div className="relative min-h-screen bg-surface">
          <ScrollToTop />
          <AppRoutes />
        </div>
      </ChatWebSocketProvider>
    </AuthProvider>
  )
}

export default App
