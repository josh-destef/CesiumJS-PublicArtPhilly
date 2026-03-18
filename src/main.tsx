// src/main.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Application entry point — the very first file that runs.
//
// RESPONSIBILITIES:
//  1. Configure the Cesium Ion access token (needed for 3D tiles + assets)
//  2. Set up React Query with a QueryClient
//  3. Mount the <App> component into the #root div in index.html
//
// TEACHING NOTE: The provider pattern in React:
//   <QueryClientProvider> wraps <App> so that EVERY component inside App can
//   call useQuery() and access the shared data cache — without passing props.
//   Zustand doesn't need a provider; its store is a module-level singleton.
// ─────────────────────────────────────────────────────────────────────────────

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Cesium from 'cesium';

import App from './App';
import './index.css';

// ── Cesium Ion Token ──────────────────────────────────────────────────────────
// The token is loaded from the .env file.
// A free Cesium Ion account gives you access to Google Photorealistic 3D Tiles.
Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN || 'YOUR_CESIUM_ION_TOKEN_HERE';

// ── React Query Client ────────────────────────────────────────────────────────
// The QueryClient stores all fetched data in memory for the app lifetime.
// staleTime is set globally here but can be overridden per query.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Data is "fresh" for 5 minutes — no refetch
      retry: 1,                  // Retry failed fetches once before showing an error
    },
  },
});

// ── Mount React ────────────────────────────────────────────────────────────────
// 'root' matches the id="root" in index.html
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Could not find #root element in index.html');

createRoot(rootElement).render(
  <StrictMode>
    {/*
      QueryClientProvider makes the queryClient accessible to all child
      components via the useQuery hook.
    */}
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
