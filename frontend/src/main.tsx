import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
// Self-hosted fonts: Archivo with its width axis, for condensed figures and titles
import '@fontsource-variable/archivo/wdth.css'
import './index.css'
import App from './App.tsx'
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <App/>
        </QueryClientProvider>
    </StrictMode>,
)
