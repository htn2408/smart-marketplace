import Header from '../components/layout/Header'
import ChatWorkspace from '../components/messages/ChatWorkspace'

/**
 * Message Page Component (Client & Public route)
 * Wraps reusable ChatWorkspace with TaskMate global standard Header
 * Complies with rule.md: Modular components, zero duplicate logic
 */
export default function Message({ onNavigate }) {
  return (
    <div className="h-screen bg-surface flex flex-col overflow-hidden text-on-surface antialiased select-none pt-20">
      {/* 1. Global Standard Header */}
      <Header activePath="messages" onNavigate={onNavigate} />

      {/* 2. Main Desktop / Mobile Chat Workspace */}
      <main className="flex-1 min-h-0 w-full max-w-[1720px] mx-auto p-2 sm:p-4 lg:p-5 flex flex-col">
        <ChatWorkspace onNavigate={onNavigate} role="client" />
      </main>
    </div>
  )
}