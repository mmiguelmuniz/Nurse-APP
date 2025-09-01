import 'bootstrap/dist/css/bootstrap.min.css'
import '../styles/Relatorios.css'
import React, { useMemo, useState } from 'react'
import { Container, Row, Col, Card, Button, ButtonGroup, Form, Badge } from 'react-bootstrap'
import logoImg from '../assets/EAR.png'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts'

type Periodo = 'hoje' | 'semana' | 'mes'

// ===== MOCKS (trocar por SQL depois) =====
const COLORS = ['#328bab', '#34d399', '#fbbf24', '#ef4444', '#8b5cf6', '#10b981']

// Série diária (últimos 14 dias): atendimentos
const serieDiariaMock = [
  { d: '15/08', atend: 6 }, { d: '16/08', atend: 7 }, { d: '17/08', atend: 4 },
  { d: '18/08', atend: 9 }, { d: '19/08', atend: 5 }, { d: '20/08', atend: 8 },
  { d: '21/08', atend: 7 }, { d: '22/08', atend: 6 }, { d: '23/08', atend: 10 },
  { d: '24/08', atend: 9 }, { d: '25/08', atend: 3 }, { d: '26/08', atend: 5 },
  { d: '27/08', atend: 7 }, { d: '28/08', atend: 6 },
]

// Série semanal (últimas 8 semanas)
const serieSemanalMock = [
  { w: 'Sem 27', atend: 38 }, { w: 'Sem 28', atend: 41 }, { w: 'Sem 29', atend: 36 },
  { w: 'Sem 30', atend: 44 }, { w: 'Sem 31', atend: 32 }, { w: 'Sem 32', atend: 45 },
  { w: 'Sem 33', atend: 42 }, { w: 'Sem 34', atend: 39 },
]

// Emergências x Rotina (no período)
const emergenciasMock = { emergencias: 4, rotina: 56 }

// Motivos mais frequentes
const motivosMock = [
  { name: 'Cefaleia', value: 18 },
  { name: 'Febre', value: 12 },
  { name: 'Corte sup.', value: 9 },
  { name: 'Náusea', value: 7 },
  { name: 'Alergia', value: 5 },
  { name: 'Outros', value: 9 },
]

// KPI agregados por período (placeholders)
function getKPIs(periodo: Periodo) {
  if (periodo === 'hoje') return { total: 7, mediaDia: 7, emergencias: 1, medicamentos: 148 }
  if (periodo === 'semana') return { total: 42, mediaDia: 6, emergencias: 4, medicamentos: 148 }
  return { total: 170, mediaDia: 6, emergencias: 17, medicamentos: 148 } // mês
}

export default function Relatorios() {
  const [periodo, setPeriodo] = useState<Periodo>('semana')

  // Dados derivados (aqui apenas escolhemos “recortes” dos mocks)
  const kpis = useMemo(() => getKPIs(periodo), [periodo])

  const serieLinha = useMemo(() => {
    if (periodo === 'hoje') return serieDiariaMock.slice(-3) // só 3 pontos p/ ilustrar
    if (periodo === 'semana') return serieDiariaMock.slice(-7)
    return serieDiariaMock // mês: últimos 14 dias (placeholder)
  }, [periodo])

  const serieBarra = useMemo(() => {
    if (periodo === 'hoje') return serieSemanalMock.slice(-1)
    if (periodo === 'semana') return serieSemanalMock.slice(-4)
    return serieSemanalMock
  }, [periodo])

  const pieEmer = useMemo(() => ([
    { name: 'Emergências', value: kpis.emergencias },
    { name: 'Rotina', value: Math.max(0, kpis.total - kpis.emergencias) },
  ]), [kpis])

  return (
    <div className="relatorios-page">
      {/* NAVBAR mínima com logo + voltar */}
      <div className="rel-topbar d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-2">
          <img src={logoImg} alt="Logo EAR" className="rel-logo" />
          <span className="rel-title">Relatórios</span>
        </div>
        <Button variant="outline-secondary" size="sm" href="/dashboard">← Voltar</Button>
      </div>

      <Container fluid className="py-3">
        {/* Filtros rápidos */}
        <Row className="g-2 mb-3 align-items-center">
          <Col xs="auto">
            <div className="text-muted small">Período:</div>
            <ButtonGroup>
              <Button
                size="sm"
                variant={periodo === 'hoje' ? 'primary' : 'outline-secondary'}
                onClick={() => setPeriodo('hoje')}
              >Hoje</Button>
              <Button
                size="sm"
                variant={periodo === 'semana' ? 'primary' : 'outline-secondary'}
                onClick={() => setPeriodo('semana')}
              >Semana</Button>
              <Button
                size="sm"
                variant={periodo === 'mes' ? 'primary' : 'outline-secondary'}
                onClick={() => setPeriodo('mes')}
              >Mês</Button>
            </ButtonGroup>
          </Col>
          <Col xs="auto" className="text-muted small">
            (dados mock — ligar ao SQL depois)
          </Col>
        </Row>

        {/* KPIs */}
        <Row className="g-3">
          <Col xs={12} md={6} lg={3}>
            <Card className="kpi-card shadow-sm border-0">
              <Card.Body>
                <div className="kpi-label">Total de atendimentos</div>
                <div className="kpi-value">{kpis.total}</div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} md={6} lg={3}>
            <Card className="kpi-card shadow-sm border-0">
              <Card.Body>
                <div className="kpi-label">Média diária</div>
                <div className="kpi-value">{kpis.mediaDia}</div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} md={6} lg={3}>
            <Card className="kpi-card shadow-sm border-0">
              <Card.Body>
                <div className="kpi-label">Emergências</div>
                <div className="kpi-value">
                  {kpis.emergencias}
                  <Badge bg="danger" className="ms-2">ALERTA</Badge>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} md={6} lg={3}>
            <Card className="kpi-card shadow-sm border-0">
              <Card.Body>
                <div className="kpi-label">Medicamentos em estoque</div>
                <div className="kpi-value">{kpis.medicamentos}</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Gráficos */}
        <Row className="g-4 mt-1">
          <Col xs={12} lg={7}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Header className="bg-white"><strong>Atendimentos por dia</strong></Card.Header>
              <Card.Body style={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={serieLinha} margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="d" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="atend" stroke="#328bab" strokeWidth={3} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} lg={5}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Header className="bg-white"><strong>Emergências vs Rotina</strong></Card.Header>
              <Card.Body className="d-flex align-items-center justify-content-center" style={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieEmer}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={2}
                    >
                      {pieEmer.map((_, i) => (
                        <Cell key={i} fill={i === 0 ? '#ef4444' : '#34d399'} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="g-4 mt-1">
          <Col xs={12} lg={6}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Header className="bg-white"><strong>Atendimentos por semana</strong></Card.Header>
              <Card.Body style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={serieBarra} margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="w" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="atend" radius={[6,6,0,0]} fill="#328bab" />
                  </BarChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} lg={6}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Header className="bg-white"><strong>Motivos mais frequentes</strong></Card.Header>
              <Card.Body style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={motivosMock} margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[6,6,0,0]}>
                      {motivosMock.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  )
}
