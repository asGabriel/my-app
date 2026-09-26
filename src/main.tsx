import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import './index.css'
import App from './App.tsx'

// Locale do dayjs setado uma vez, no entrypoint, para que toda página
// (independente de qual carregar primeiro) formate datas em pt-BR.
dayjs.locale('pt-br')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
