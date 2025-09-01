import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import NovoAtendimento from './pages/NovoAtendimento'
import Estoque from './pages/Estoque'
import Historico from './pages/Historico'
import Relatorios from './pages/Relatorios'
import Login from './pages/Login'



const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/dashboard" element={<Navigate to="/" />} />
      <Route path="/novo-atendimento" element={<NovoAtendimento />} />
      <Route path="/medicamentos" element={<Estoque />} />
      <Route path="/historico" element={<Historico />} />
      <Route path="/relatorios" element={<Relatorios />} />
      <Route path="/login" element={<Login />} />

    </Routes>
  )
}

export default App
