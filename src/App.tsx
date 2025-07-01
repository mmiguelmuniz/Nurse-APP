import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import FormularioAtendimento from './pages/FormularioAtendimento'

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/dashboard" element={<Navigate to="/" />} />
      <Route path="/novo-atendimento" element={<FormularioAtendimento />} />
    </Routes>
  )
}

export default App
