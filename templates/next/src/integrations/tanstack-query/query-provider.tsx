'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { getQueryClient } from '#/integrations/tanstack-query/get-query-client'

// The only QueryClientProvider in the app; it wraps {children} in the root layout.
export function QueryProvider({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={getQueryClient()}>{children}</QueryClientProvider>
}
