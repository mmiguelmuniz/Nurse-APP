
import 'bootstrap/dist/css/bootstrap.min.css'
import '../styles/Dashboard.css'
import logoImg from '../assets/EAR.png'
import React from 'react'
import { Container, Row, Col, Card, Button } from 'react-bootstrap'
import { LogOut, FileText, FolderOpen, BarChart3 } from 'lucide-react'


const Dashboard: React.FC = () => {
  const userName = "Virginia" // substituir por autenticação futuramente

  return (
    <div className="d-flex flex-column flex-md-row min-vh-100">
      {/* Sidebar */}
      <div className="sidebar d-flex flex-column">
        <div className="mb-4 text-center">
      <img src={logoImg} alt="Logo" style={{ width: 80 }} />
          <h5 className="mt-2">Nursing App</h5>
        </div>
        <ul className="nav flex-column gap-2">
          <li className="nav-item">
          <a className="nav-link" href="/novo-atendimento">
              <FileText size={18} className="me-2" /> Novo Atendimento
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="#">
              <FolderOpen size={18} className="me-2" /> Histórico
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="#">
              <BarChart3 size={18} className="me-2" /> Relatórios
            </a>
          </li>
        </ul>
      </div>
<div className="main-content">
      {/* Conteúdo */}
<div className="flex-grow-1 d-flex flex-column dashboard-content">
        {/* Topbar */}
        <div className="topbar w-100 d-flex justify-content-between align-items-center px-3 px-md-4 py-2">
          <h5 className="m-0">Olá, {userName}</h5>
          <Button variant="outline-danger" size="sm">
            <LogOut size={16} className="me-1" /> Sair
          </Button>
        </div>

        {/* Conteúdo principal */}
        <Container className="my-4">
          <h3 className="mb-4 text-center text-md-start">Painel da Enfermaria</h3>
          <Row className="g-4">
            <Col xs={12} md={6} lg={4}>
              <Card className="shadow-sm border-0 hover-card h-100">
                <Card.Body>
                  <Card.Title className="d-flex align-items-center gap-2">
                    📝 <span>Novo Atendimento</span>
                  </Card.Title>
                  <Card.Text>Registre um atendimento de forma rápida</Card.Text>
                  <Button variant="primary" href="/novo-atendimento">Abrir</Button>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} md={6} lg={4}>
              <Card className="shadow-sm border-0 hover-card h-100">
                <Card.Body>
                  <Card.Title className="d-flex align-items-center gap-2">
                    📂 <span>Histórico</span>
                  </Card.Title>
                  <Card.Text>Visualize atendimentos anteriores</Card.Text>
                  <Button variant="primary">Visualizar</Button>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} md={6} lg={4}>
              <Card className="shadow-sm border-0 hover-card h-100">
                <Card.Body>
                  <Card.Title className="d-flex align-items-center gap-2">
                    📊 <span>Relatórios</span>
                  </Card.Title>
                  <Card.Text>Gere gráficos e relatórios personalizados</Card.Text>
                  <Button variant="primary">Acessar</Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
    </div>
  )
}

export default Dashboard
