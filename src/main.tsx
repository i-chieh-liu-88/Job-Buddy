import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import { AuthGate } from './components/organisms/AuthGate/AuthGate'
import { queryClient } from './lib/queryClient'
import { ToastProvider } from './components/atoms/AnimatedToastStack/AnimatedToastStack'

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!clerkPublishableKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY environment variable.')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthGate>
            <App />
          </AuthGate>
        </ToastProvider>
      </QueryClientProvider>
    </ClerkProvider>
  </StrictMode>,
)
