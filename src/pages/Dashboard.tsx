import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/Dashboard.css';
import logoImg from '../assets/EAR.png';
import React, { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Card, Button, Table } from 'react-bootstrap';
import {
  LogOut,
  FileText,
  FolderOpen,
  BarChart3,
  Package,
  Activity,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';
import api from '../lib/api';

type Periodo = 'hoje' | 'semana' | 'mes';

type Stats = {
  atendimentosHoje: number;     // valor do período selecionado quando 'hoje'
  atendimentosSemana: number;   // sempre o KPI da semana
  estoqueMedicamentos: number;  // soma do estoqueAtual (categoria MEDICAMENTO)
  emergenciasHoje: number;      // emergências do período selecionado
  // deltas por enquanto ficam em 0 (podemos calcular depois com séries)
  deltaAtendimentos?: number;
  deltaEmergencias?: number;
};

type ItemCritico = { id: string; nome: string; estoqueAtual: number };
type AtendimentoDia = { hora: string; nome: string; motivo: string; emergencia?: boolean };

// helpers
function isoDate(d: Date) {
  // YYYY-MM-DD
  return d.toISOString().slice(0, 10);
}
function hojeRange() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 1); // amanhã (exclusive)
  return { start: isoDate(start), end: isoDate(end) };
}
function horaBR(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

const Dashboard: React.FC = () => {
  const userName = 'Usuário'; // TODO: trocar por /users/me quando quiser

  const [periodo, setPeriodo] = useState<Periodo>('hoje');

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    atendimentosHoje: 0,
    atendimentosSemana: 0,
    estoqueMedicamentos: 0,
    emergenciasHoje: 0,
    deltaAtendimentos: 0,
    deltaEmergencias: 0,
  });

  const [itensCriticos, setItensCriticos] = useState<ItemCritico[]>([]);
  const [atendimentosHoje, setAtendimentosHoje] = useState<AtendimentoDia[]>([]);

  const labelAtendimentos = useMemo(
    () => (periodo === 'hoje' ? 'Atendimentos (hoje)' : 'Atendimentos'),
    [periodo]
  );
  const labelEmergencias = useMemo(
    () => (periodo === 'hoje' ? 'Emergências (hoje)' : 'Emergências'),
    [periodo]
  );

  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        setLoading(true);

        // 1) KPIs do período selecionado
        const kpiPeriodoPromise = api.get('/metrics/kpis', { params: { period: periodo } });

        // 2) KPI fixo para "Atendimentos (semana)"
        const kpiSemanaPromise = api.get('/metrics/kpis', { params: { period: 'semana' } });

        // 3) Itens críticos (lista)
        const criticosPromise = api.get<ItemCritico[]>('/items/criticos');

        // 4) Soma de estoque de medicamentos
        const medsPromise = api.get<any[]>('/items', {
          params: { categoria: 'MEDICAMENTO', ativos: true },
        });

        // 5) Últimos atendimentos de hoje
        const { start, end } = hojeRange();
        const atendsPromise = api.get<any[]>('/attendances', {
          params: { start, end, pageSize: 10 },
        });

        const [kpiPeriodoRes, kpiSemanaRes, criticosRes, medsRes, atendsRes] = await Promise.all([
          kpiPeriodoPromise,
          kpiSemanaPromise,
          criticosPromise,
          medsPromise,
          atendsPromise,
        ]);

        if (canceled) return;

        const kpiPeriodo = kpiPeriodoRes.data as {
          atendimentos: number;
          emergencias: number;
          itensCriticos: number;
        };
        const kpiSemana = (kpiSemanaRes.data as any).atendimentos as number;

        const itensCriticosData: ItemCritico[] = (criticosRes.data || []).map((i: any) => ({
          id: i.id,
          nome: i.nome,
          estoqueAtual: i.estoqueAtual,
        }));

        const estoqueMedicamentosSoma: number = (medsRes.data || []).reduce(
          (sum: number, it: any) => sum + (Number(it.estoqueAtual) || 0),
          0
        );

        const atendimentosHojeData: AtendimentoDia[] = (atendsRes.data || []).map((a: any) => ({
          hora: horaBR(a.createdAt),
          nome: a.nome,
          motivo: a.motivo?.name || '—',
          emergencia: typeof a.destino === 'string' && a.destino.toLowerCase().includes('emerg'),
        }));

        setStats({
          atendimentosHoje: kpiPeriodo.atendimentos,
          atendimentosSemana: kpiSemana,
          estoqueMedicamentos: estoqueMedicamentosSoma,
          emergenciasHoje: kpiPeriodo.emergencias,
          deltaAtendimentos: 0, // TODO: calcular com séries, se quiser
          deltaEmergencias: 0,  // TODO: calcular com séries, se quiser
        });
        setItensCriticos(itensCriticosData);
        setAtendimentosHoje(atendimentosHojeData);
      } catch (e) {
        console.error('Falha ao carregar dashboard:', e);
      } finally {
        if (!canceled) setLoading(false);
      }
    })();
    return () => {
      canceled = true;
    };
  }, [periodo]);

  const StatCard = ({
    icon,
    label,
    value,
    delta,
    showDelta = false,
  }: {
    icon: React.ReactNode;
    label: string;
    value: number;
    delta?: number;
    showDelta?: boolean;
  }) => (
    <Card className={`stat-card h-100 shadow-sm border-0 ${loading ? 'skeleton' : ''}`}>
      <Card.Body className="d-flex align-items-center gap-3">
        <div className="stat-icon">{icon}</div>
        <div className="d-flex flex-column">
          <span className="stat-label">{label}</span>
          {loading ? (
            <span className="stat-value skeleton-line"></span>
          ) : (
            <span className="stat-value">{Number(value || 0).toLocaleString('pt-BR')}</span>
          )}
          {showDelta && (
            loading ? (
              <span className="stat-meta skeleton-line small"></span>
            ) : (
              <span className="stat-meta">
                <span className={`delta-badge ${Number(delta) >= 0 ? 'up' : 'down'}`}>
                  {Number(delta) >= 0 ? '↑' : '↓'} {Math.abs(Number(delta) || 0)}%
                </span>
              </span>
            )
          )}
        </div>
      </Card.Body>
    </Card>
  );

  return (
    <div className="d-flex flex-column min-vh-100">
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
                  label={labelAtendimentos}
                  value={periodo === 'hoje' ? stats.atendimentosHoje : stats.atendimentosHoje} // mostra o do período
                  delta={stats.deltaAtendimentos}
                  showDelta={false} // ativaremos quando calcularmos séries
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
                  label={labelEmergencias}
                  value={stats.emergenciasHoje}
                  delta={stats.deltaEmergencias}
                  showDelta={false} // idem
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
                    <Button variant="primary" href="/historico">Visualizar</Button>
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
                    <Button variant="primary" href="/relatorios">Acessar</Button>
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
                    <AlertCircle size={18} className="text-warning" />
                  </Card.Header>
                  <Card.Body>
                    {loading ? (
                      <ul className="list-unstyled m-0">
                        {[...Array(4)].map((_, i) => (
                          <li key={i} className="widget-skeleton-line mb-2" />
                        ))}
                      </ul>
                    ) : itensCriticos.length === 0 ? (
                      <div className="text-success">Sem itens críticos 🎉</div>
                    ) : (
                      <ul className="list-unstyled m-0">
                        {itensCriticos.map((item) => (
                          <li key={item.id} className="d-flex justify-content-between py-2 border-bottom">
                            <span>{item.nome}</span>
                            <span className="badge bg-danger-subtle text-danger fw-bold">↓ {item.estoqueAtual}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Card.Body>
                  <Card.Footer className="bg-white d-flex gap-2">
                    <Button variant="outline-secondary" size="sm" href="/medicamentos">Ver estoque</Button>
                    <Button variant="outline-primary" size="sm" href="/medicamentos">Registrar saída</Button>
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
                    ) : atendimentosHoje.length === 0 ? (
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
                          {atendimentosHoje.map((a, idx) => (
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
                    <Button variant="outline-primary" size="sm" href="/historico">Ver histórico</Button>
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
            <a className="nav-link" href="/historico">
              <FolderOpen size={18} className="me-2" /> Histórico
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="/relatorios">
              <BarChart3 size={18} className="me-2" /> Relatórios
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="/medicamentos">
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
  );
};

export default Dashboard;
