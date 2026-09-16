import 'core-js/actual/array/at'
import 'core-js/actual/array/flat'
import 'core-js/actual/array/flat-map'
import 'core-js/actual/array/includes'
import 'core-js/actual/object/from-entries'
import 'core-js/actual/string/replace-all'
import 'core-js/actual/promise/all-settled'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './main.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
