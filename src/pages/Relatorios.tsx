import React from 'react'
import Layout from '../components/layout'
import '../styles/Relatorios.css'

export default function Relatorios() {
  return (
    <Layout title="Relatórios" subtitle="Indicadores e análises">
      <div className="rel-coming-soon">
        <div className="rel-card">
          <span className="rel-emoji">📊</span>
          <h2>Relatórios</h2>
          <p>Esta seção está sendo desenvolvida e estará disponível em breve com gráficos, indicadores por período, motivos mais frequentes e muito mais.</p>
          <span className="rel-badge">Em breve</span>
        </div>
      </div>
    </Layout>
  )
}