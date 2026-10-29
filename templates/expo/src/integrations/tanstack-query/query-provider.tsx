import { QueryClientProvider, focusManager } from '@tanstack/react-query'
import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { AppState, Platform } from 'react-native'
import { queryClient } from '#/integrations/tanstack-query/query-client'

// The only QueryClientProvider in the app; it wraps the root navigator in app/_layout.tsx.
export function QueryProvider({ children }: { children: ReactNode }) {
  // Native apps have no window focus event, so refetch stale queries when the app comes back to the foreground.
  useEffect(() => {
    if (Platform.OS === 'web') return
    const subscription = AppState.addEventListener('change', (status) => focusManager.setFocused(status === 'active'))
    return () => subscription.remove()
  }, [])

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
