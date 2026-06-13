import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider as NextThemesProvider } from "next-themes"
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Dejamos solo este, que es el que controla la clase .dark */}
    <NextThemesProvider attribute="class" defaultTheme="dark">
      <App />
    </NextThemesProvider>
  </StrictMode>,
)