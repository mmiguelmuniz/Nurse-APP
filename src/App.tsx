import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import NovoAtendimento from './pages/NovoAtendimento'
import Estoque from './pages/Estoque'


const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/dashboard" element={<Navigate to="/" />} />
      <Route path="/novo-atendimento" element={<NovoAtendimento />} />
      <Route path="/medicamentos" element={<Estoque />} />
    </Routes>
  )
}

export default App
