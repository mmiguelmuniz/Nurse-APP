import 'bootstrap/dist/css/bootstrap.min.css'
import '../styles/Dashboard.css'
import logoImg from '../assets/EAR.png'
import React from 'react'
import { useEffect, useState } from 'react'
import { Container, Row, Col, Card, Button } from 'react-bootstrap'
import {
  LogOut,
  FileText,
  FolderOpen,
  BarChart3,
  Package,
  Activity,
  AlertTriangle
} from 'lucide-react'

type Stats = {
  atendimentosHoje: number
  atendimentosSemana: number
  estoqueMedicamentos: number
  emergenciasHoje: number
}

const Dashboard: React.FC = () => {
  const userName = 'Virginia' // TODO: substituir por autenticação Google futuramente
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({
    atendimentosHoje: 0,
    atendimentosSemana: 0,
    estoqueMedicamentos: 0,
    emergenciasHoje: 0
  })

  // Simula busca de dados (mock). Depois conectamos à API/DB.
  useEffect(() => {
    const t = setTimeout(() => {
      setStats({
        atendimentosHoje: 7,
        atendimentosSemana: 32,
        estoqueMedicamentos: 148,
        emergenciasHoje: 1
      })
      setLoading(false)
    }, 600)
    return () => clearTimeout(t)
  }, [])

  const StatCard = ({
    icon,
    label,
    value,
    loading
  }: {
    icon: React.ReactNode
    label: string
    value: number
    loading: boolean
  }) => (
    <Card className="stat-card h-100 shadow-sm border-0">
      <Card.Body className="d-flex align-items-center gap-3">
        <div className="stat-icon">{icon}</div>
        <div className="d-flex flex-column">
          <span className="stat-label">{label}</span>
          <span className="stat-value">
            {loading ? '—' : value.toLocaleString('pt-BR')}
          </span>
        </div>
      </Card.Body>
    </Card>
  )

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Conteúdo principal */}
      <div className="main-content">
        <div className="flex-grow-1 d-flex flex-column dashboard-content">
          {/* Topbar */}
          <div className="topbar w-100 d-flex justify-content-between align-items-center px-3 px-md-4 py-2">
            <h5 className="m-0">Olá, {userName}</h5>
            <Button variant="outline-danger" size="sm">
              <LogOut size={16} className="me-1" /> Sair
            </Button>
          </div>

          {/* KPIs */}
          <Container className="mt-3">
            <Row className="g-3">
              <Col xs={12} md={6} lg={3}>
                <StatCard
                  icon={<Activity size={22} aria-label="Atendimentos hoje" />}
                  label="Atendimentos (hoje)"
                  value={stats.atendimentosHoje}
                  loading={loading}
                />
              </Col>
              <Col xs={12} md={6} lg={3}>
                <StatCard
                  icon={<FolderOpen size={22} aria-label="Atendimentos semana" />}
                  label="Atendimentos (semana)"
                  value={stats.atendimentosSemana}
                  loading={loading}
                />
              </Col>
              <Col xs={12} md={6} lg={3}>
                <StatCard
                  icon={<Package size={22} aria-label="Medicamentos em estoque" />}
                  label="Medicamentos em estoque"
                  value={stats.estoqueMedicamentos}
                  loading={loading}
                />
              </Col>
              <Col xs={12} md={6} lg={3}>
                <StatCard
                  icon={<AlertTriangle size={22} aria-label="Emergências hoje" />}
                  label="Emergências (hoje)"
                  value={stats.emergenciasHoje}
                  loading={loading}
                />
              </Col>
            </Row>
          </Container>

          {/* Atalhos principais */}
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

      {/* Sidebar fixa à ESQUERDA (controlada via CSS) */}
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
          <li className="nav-item">
            <a className="nav-link" href="#">
              <Package size={18} className="me-2" /> Medicamentos
            </a>
          </li>
        </ul>

        <div className="sidebar-footer mt-auto">
          <Button variant="outline-light" size="sm" className="w-100">
            <LogOut size={16} className="me-1" /> Sair
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
