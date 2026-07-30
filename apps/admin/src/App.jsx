import React from 'react'
import AdminPortal from './AdminPortal'
import ErrorBoundary from './ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <AdminPortal />
    </ErrorBoundary>
  )
}

export default App
