import React from 'react'
import Layout from '../components/layout'
import '../styles/Relatorios.css'

export default function Prontuario() {
  return (
    <Layout title="Prontuário" subtitle="Fichário dos alunos">
      <div className="rel-coming-soon">
        <div className="rel-card">
          <span className="rel-emoji">📋</span>
          <h2>Prontuário</h2>
          <p>Esta seção permitirá acessar o fichário completo de cada aluno — histórico de atendimentos, alergias, contatos dos responsáveis e documentos anexados.</p>
          <span className="rel-badge">Em breve</span>
        </div>
      </div>
    </Layout>
  )
}