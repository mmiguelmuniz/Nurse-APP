import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/Dashboard.css';
import logoImg from '../assets/EAR.png';
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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
  atendimentosHoje: number;
  atendimentosSemana: number;
  estoqueMedicamentos: number;
  emergenciasHoje: number;
};

type ItemCritico = {
  id: string;
  nome: string;
  estoqueAtual: number;
};

type AtendimentoDia = {
  hora: string;
  nome: string;
  motivo: string;
  emergencia?: boolean;
};

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function hojeRange() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 1);

  return { start: isoDate(start), end: isoDate(end) };
}

function horaBR(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

const Dashboard: React.FC = () => {
  const userName = 'Usuário';

  const [periodo, setPeriodo] = useState<Periodo>('hoje');
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<Stats>({
    atendimentosHoje: 0,
    atendimentosSemana: 0,
    estoqueMedicamentos: 0,
    emergenciasHoje: 0,
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

        const kpiPeriodoPromise = api.get('/metrics/kpis', { params: { period: periodo } });
        const kpiSemanaPromise = api.get('/metrics/kpis', { params: { period: 'semana' } });
        const criticosPromise = api.get<ItemCritico[]>('/items/criticos');
        const medsPromise = api.get<any[]>('/items', {
          params: { categoria: 'MEDICAMENTO', ativos: true },
        });

        const { start, end } = hojeRange();
        const atendsPromise = api.get<any[]>('/attendances', {
          params: { start, end, pageSize: 10 },
        });

        const [kpiPeriodoRes, kpiSemanaRes, criticosRes, medsRes, atendsRes] =
          await Promise.all([
            kpiPeriodoPromise,
            kpiSemanaPromise,
            criticosPromise,
            medsPromise,
            atendsPromise,
          ]);

        if (canceled) return;

        const kpiPeriodo = kpiPeriodoRes.data;
        const kpiSemana = Number(kpiSemanaRes.data?.atendimentos || 0);

        const itensCriticosData: ItemCritico[] = (criticosRes.data || []).map((i: any) => ({
          id: i.id,
          nome: i.nome,
          estoqueAtual: Number(i.estoqueAtual) || 0,
        }));

        const estoqueMedicamentosSoma: number = (medsRes.data || []).reduce(
          (sum: number, it: any) => sum + (Number(it.estoqueAtual) || 0),
          0
        );

        const atendimentosHojeData: AtendimentoDia[] = (atendsRes.data || []).map((a: any) => ({
          hora: horaBR(a.createdAt),
          nome: a.nome,
          motivo: a.motivo?.name || '—',
          emergencia:
            typeof a.destino === 'string' &&
            a.destino.toUpperCase().includes('HOSPITAL'),
        }));

        setStats({
          atendimentosHoje: Number(kpiPeriodo?.atendimentos || 0),
          atendimentosSemana: kpiSemana,
          estoqueMedicamentos: estoqueMedicamentosSoma,
          emergenciasHoje: Number(kpiPeriodo?.emergencias || 0),
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

  return (
    <div className="d-flex flex-column min-vh-100">
      <div className="main-content">
        <div className="flex-grow-1 d-flex flex-column dashboard-content">

          <div className="topbar w-100 d-flex justify-content-between align-items-center px-4 py-2">
            <h5 className="m-0">Olá, {userName}</h5>
            <Button variant="outline-danger" size="sm">
              <LogOut size={16} className="me-1" /> Sair
            </Button>
          </div>

          <div className="filter-chips px-4 mt-3">
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

          <Container className="mt-3">
            <Row className="g-3">

              <Col lg={3}>
                <Card className="stat-card shadow-sm border-0">
                  <Card.Body>
                    <Activity size={22} />
                    <div>{labelAtendimentos}</div>
                    <strong>{stats.atendimentosHoje}</strong>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={3}>
                <Card className="stat-card shadow-sm border-0">
                  <Card.Body>
                    <FolderOpen size={22} />
                    <div>Atendimentos (semana)</div>
                    <strong>{stats.atendimentosSemana}</strong>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={3}>
                <Card className="stat-card shadow-sm border-0">
                  <Card.Body>
                    <Package size={22} />
                    <div>Medicamentos em estoque</div>
                    <strong>{stats.estoqueMedicamentos}</strong>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={3}>
                <Card className="stat-card shadow-sm border-0">
                  <Card.Body>
                    <AlertTriangle size={22} />
                    <div>{labelEmergencias}</div>
                    <strong>{stats.emergenciasHoje}</strong>
                  </Card.Body>
                </Card>
              </Col>

            </Row>
          </Container>

          <Container className="my-4">
            <Row className="g-4">

              <Col md={4}>
                <Card className="shadow-sm border-0">
                  <Card.Body>
                    <Card.Title>Novo Atendimento</Card.Title>
                    <Card.Text>Registrar novo atendimento</Card.Text>

                    <Link to="/novo-atendimento" className="text-decoration-none">
                      <Button variant="primary">Abrir</Button>
                    </Link>

                  </Card.Body>
                </Card>
              </Col>

              <Col md={4}>
                <Card className="shadow-sm border-0">
                  <Card.Body>
                    <Card.Title>Histórico</Card.Title>
                    <Card.Text>Visualizar atendimentos</Card.Text>

                    <Link to="/historico" className="text-decoration-none">
                      <Button variant="primary">Visualizar</Button>
                    </Link>

                  </Card.Body>
                </Card>
              </Col>

              <Col md={4}>
                <Card className="shadow-sm border-0">
                  <Card.Body>
                    <Card.Title>Relatórios</Card.Title>
                    <Card.Text>Gerar relatórios</Card.Text>

                    <Link to="/relatorios" className="text-decoration-none">
                      <Button variant="primary">Acessar</Button>
                    </Link>

                  </Card.Body>
                </Card>
              </Col>

            </Row>
          </Container>

          <Container>
            <Row>

              <Col lg={6}>
                <Card className="shadow-sm border-0">
                  <Card.Header>Estoque: itens críticos</Card.Header>

                  <Card.Body>

                    {itensCriticos.length === 0 ? (
                      <div className="text-success">Sem itens críticos</div>
                    ) : (
                      <ul className="list-unstyled">

                        {itensCriticos.map((item) => (
                          <li key={item.id} className="d-flex justify-content-between">
                            <span>{item.nome}</span>
                            <span className="text-danger">↓ {item.estoqueAtual}</span>
                          </li>
                        ))}

                      </ul>
                    )}

                  </Card.Body>

                  <Card.Footer>

                    <Link to="/medicamentos" className="text-decoration-none me-2">
                      <Button variant="outline-secondary" size="sm">
                        Ver estoque
                      </Button>
                    </Link>

                    <Link to="/medicamentos" className="text-decoration-none">
                      <Button variant="outline-primary" size="sm">
                        Registrar saída
                      </Button>
                    </Link>

                  </Card.Footer>

                </Card>
              </Col>

            </Row>
          </Container>

        </div>
      </div>

      <div className="sidebar d-flex flex-column">

        <div className="text-center mb-4">
          <img src={logoImg} alt="logo" style={{ width: 80 }} />
          <h5>Nursing App</h5>
        </div>

        <ul className="nav flex-column gap-2">

          <li>
            <Link className="nav-link" to="/novo-atendimento">
              <FileText size={18} className="me-2" /> Novo Atendimento
            </Link>
          </li>

          <li>
            <Link className="nav-link" to="/historico">
              <FolderOpen size={18} className="me-2" /> Histórico
            </Link>
          </li>

          <li>
            <Link className="nav-link" to="/relatorios">
              <BarChart3 size={18} className="me-2" /> Relatórios
            </Link>
          </li>

          <li>
            <Link className="nav-link" to="/medicamentos">
              <Package size={18} className="me-2" /> Medicamentos
            </Link>
          </li>

        </ul>

        <div className="mt-auto">
          <Button variant="outline-light" size="sm" className="w-100">
            <LogOut size={16} className="me-1" /> Sair
          </Button>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;