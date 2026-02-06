/**
 * Root application component for Design Duck UI.
 * Renders the main layout shell for viewing and managing requirements.
 */
export function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight">Design Duck</h1>
        <p className="mt-1 text-sm text-gray-500">
          Requirements gathering and management
        </p>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <p className="text-gray-500">
          Requirements will appear here once the store is connected.
        </p>
      </main>
    </div>
  );
}
