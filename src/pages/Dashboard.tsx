import 'bootstrap/dist/css/bootstrap.min.css'
import '../styles/Dashboard.css'
import logoImg from '../assets/EAR.png'
import React, { useEffect, useState } from 'react'
import { Container, Row, Col, Card, Button, Table } from 'react-bootstrap'
import {
  LogOut,
  FileText,
  FolderOpen,
  BarChart3,
  Package,
  Activity,
  AlertTriangle,
  AlertCircle
} from 'lucide-react'

type Periodo = 'hoje' | 'semana' | 'mes'

type Stats = {
  atendimentosHoje: number
  atendimentosSemana: number
  estoqueMedicamentos: number
  emergenciasHoje: number
  deltaAtendimentos: number // variação % vs período anterior
  deltaEmergencias: number  // variação % vs período anterior
}

type ItemCritico = { nome: string; saldo: number }
type AtendimentoDia = { hora: string; nome: string; motivo: string; emergencia?: boolean }

// MOCK: números por período (trocar por API depois)
const STATS_BY_PERIOD: Record<Periodo, Stats> = {
  hoje:   { atendimentosHoje: 7,  atendimentosSemana: 32, estoqueMedicamentos: 148, emergenciasHoje: 1,  deltaAtendimentos: +8,  deltaEmergencias: -50 },
  semana: { atendimentosHoje: 0,  atendimentosSemana: 32, estoqueMedicamentos: 148, emergenciasHoje: 4,  deltaAtendimentos: +12, deltaEmergencias: -20 },
  mes:    { atendimentosHoje: 0,  atendimentosSemana: 0,  estoqueMedicamentos: 148, emergenciasHoje: 17, deltaAtendimentos: +5,  deltaEmergencias: +10 },
}

// MOCK: widgets (trocar por API depois)
const ITENS_CRITICOS: ItemCritico[] = [
  { nome: 'Dipirona 500 mg', saldo: 8 },
  { nome: 'Soro Fisiológico 0,9%', saldo: 3 },
  { nome: 'Gaze estéril', saldo: 0 },
  { nome: 'Paracetamol 750 mg', saldo: 5 },
]

const ATENDIMENTOS_HOJE: AtendimentoDia[] = [
  { hora: '08:15', nome: 'Ana S.', motivo: 'Febre' },
  { hora: '09:40', nome: 'João P.', motivo: 'Corte' },
  { hora: '10:05', nome: 'Maria V.', motivo: 'Cefaleia' },
  { hora: '11:20', nome: 'Lucas R.', motivo: 'Náusea', emergencia: true },
]

const Dashboard: React.FC = () => {
  const userName = 'Virginia' // TODO: substituir por autenticação Google futuramente

  // Filtro de período
  const [periodo, setPeriodo] = useState<Periodo>('hoje')

  // Estados de KPI
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>(STATS_BY_PERIOD['hoje'])

  // Loading simulado ao trocar período
  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => {
      setStats(STATS_BY_PERIOD[periodo])
      setLoading(false)
    }, 300)
    return () => clearTimeout(t)
  }, [periodo])

  // Componente de KPI
  const StatCard = ({
    icon,
    label,
    value,
    delta,
    showDelta = false,
  }: {
    icon: React.ReactNode
    label: string
    value: number
    delta?: number
    showDelta?: boolean
  }) => (
    <Card className={`stat-card h-100 shadow-sm border-0 ${loading ? 'skeleton' : ''}`}>
      <Card.Body className="d-flex align-items-center gap-3">
        <div className="stat-icon">{icon}</div>
        <div className="d-flex flex-column">
          <span className="stat-label">{label}</span>
          {loading ? (
          <span className="stat-value skeleton-line"></span>
          ) : (
          <span className="stat-value">{value.toLocaleString('pt-BR')}</span>
          )}
        {showDelta && (
  loading ? (
    <span className="stat-meta skeleton-line small"></span>
  ) : (
    <span className="stat-meta">
      <span className={`delta-badge ${delta! >= 0 ? 'up' : 'down'}`}>
        {delta! >= 0 ? '↑' : '↓'} {Math.abs(delta!)}%
      </span>
    </span>
  ))}
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

          {/* Filtros de período */}
          <div className="filter-chips px-3 px-md-4 mt-3">
            <button className={`chip ${periodo === 'hoje' ? 'active' : ''}`} onClick={() => setPeriodo('hoje')}>
              Hoje
            </button>
            <button className={`chip ${periodo === 'semana' ? 'active' : ''}`} onClick={() => setPeriodo('semana')}>
              Semana
            </button>
            <button className={`chip ${periodo === 'mes' ? 'active' : ''}`} onClick={() => setPeriodo('mes')}>
              Mês
            </button>
          </div>

          {/* KPIs */}
          <Container className="mt-3">
            <Row className="g-3">
              <Col xs={12} md={6} lg={3}>
                <StatCard
                  icon={<Activity size={22} aria-label="Atendimentos" />}
                  label={periodo === 'hoje' ? 'Atendimentos (hoje)' : 'Atendimentos'}
                  value={periodo === 'hoje' ? stats.atendimentosHoje : stats.atendimentosSemana}
                  delta={stats.deltaAtendimentos}
                  showDelta
                />
              </Col>
              <Col xs={12} md={6} lg={3}>
                <StatCard
                  icon={<FolderOpen size={22} aria-label="Atendimentos (semana)" />}
                  label="Atendimentos (semana)"
                  value={stats.atendimentosSemana}
                />
              </Col>
              <Col xs={12} md={6} lg={3}>
                <StatCard
                  icon={<Package size={22} aria-label="Medicamentos em estoque" />}
                  label="Medicamentos em estoque"
                  value={stats.estoqueMedicamentos}
                />
              </Col>
              <Col xs={12} md={6} lg={3}>
                <StatCard
                  icon={<AlertTriangle size={22} aria-label="Emergências" />}
                  label={periodo === 'hoje' ? 'Emergências (hoje)' : 'Emergências'}
                  value={stats.emergenciasHoje}
                  delta={stats.deltaEmergencias}
                  showDelta
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

          {/* Widgets */}
          <Container className="mb-4">
            <Row className="g-4">
              {/* Estoque: itens críticos */}
              <Col xs={12} lg={6}>
                <Card className="shadow-sm border-0 h-100">
                  <Card.Header className="bg-white d-flex align-items-center justify-content-between">
                    <strong>Estoque: itens críticos</strong>
                    <AlertCircle size={18} className="text-warning" title="Abaixo do nível mínimo" />
                  </Card.Header>
                  <Card.Body>
                    {loading ? (
                      <ul className="list-unstyled m-0">
                        {[...Array(4)].map((_, i) => (
                          <li key={i} className="widget-skeleton-line mb-2" />
                        ))}
                      </ul>
                    ) : ITENS_CRITICOS.length === 0 ? (
                      <div className="text-success">Sem itens críticos 🎉</div>
                    ) : (
                      <ul className="list-unstyled m-0">
                        {ITENS_CRITICOS.map((item) => (
                          <li key={item.nome} className="d-flex justify-content-between py-2 border-bottom">
                            <span>{item.nome}</span>
                            <span className="badge bg-danger-subtle text-danger fw-bold">↓ {item.saldo}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Card.Body>
                  <Card.Footer className="bg-white d-flex gap-2">
                    <Button variant="outline-secondary" size="sm">Ver estoque</Button>
                    <Button variant="outline-primary" size="sm">Registrar saída</Button>
                  </Card.Footer>
                </Card>
              </Col>

              {/* Últimos atendimentos (Hoje) */}
              <Col xs={12} lg={6}>
                <Card className="shadow-sm border-0 h-100">
                  <Card.Header className="bg-white d-flex align-items-center justify-content-between">
                    <strong>Últimos atendimentos (Hoje)</strong>
                  </Card.Header>
                  <Card.Body className="p-0">
                    {loading ? (
                      <div className="p-3">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="widget-skeleton-line mb-2" />
                        ))}
                      </div>
                    ) : ATENDIMENTOS_HOJE.length === 0 ? (
                      <div className="p-3 text-muted">Sem registros hoje.</div>
                    ) : (
                      <Table responsive hover className="m-0">
                        <thead>
                          <tr>
                            <th style={{ width: 80 }}>Hora</th>
                            <th>Nome</th>
                            <th>Motivo</th>
                            <th style={{ width: 110 }}>Emergência</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ATENDIMENTOS_HOJE.map((a, idx) => (
                            <tr key={`${a.hora}-${idx}`}>
                              <td>{a.hora}</td>
                              <td>{a.nome}</td>
                              <td>{a.motivo}</td>
                              <td>{a.emergencia ? '✓' : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    )}
                  </Card.Body>
                  <Card.Footer className="bg-white">
                    <Button variant="outline-primary" size="sm">Ver histórico</Button>
                  </Card.Footer>
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
