import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/Estoque.css';
import React, { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Button, Form, Table, Badge, Tabs, Tab, Card } from 'react-bootstrap';
import { Plus, Download, Upload, Pencil } from 'lucide-react';
import api from '../lib/api';

type Categoria = 'MEDICAMENTO' | 'CURATIVO';

type ItemApi = {
  id: string;
  nome: string;
  categoria: Categoria;
  unidade: string;
  minimo: number;
  estoqueAtual: number;
  active: boolean;
  createdAt: string;
};

export default function Estoque() {
  const [aba, setAba] = useState<'med' | 'cur'>('med');
  const [busca, setBusca] = useState('');
  const [items, setItems] = useState<ItemApi[]>([]);
  const [loading, setLoading] = useState(false);
  const [onlyCriticos, setOnlyCriticos] = useState(false);

  const categoriaAtual: Categoria = aba === 'med' ? 'MEDICAMENTO' : 'CURATIVO';

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get<ItemApi[]>('/items', {
        params: { categoria: categoriaAtual, ativos: true },
      });
      setItems(data || []);
    } catch (e) {
      console.error('Falha ao carregar itens:', e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aba]);

  const listaFiltrada = useMemo(() => {
    const term = busca.trim().toLowerCase();
    let base = items;
    if (term) base = base.filter((i) => i.nome.toLowerCase().includes(term));
    if (onlyCriticos) base = base.filter((i) => typeof i.minimo === 'number' && i.estoqueAtual < i.minimo);
    return base;
  }, [items, busca, onlyCriticos]);

  const qtdCriticos = useMemo(
    () => items.filter((i) => typeof i.minimo === 'number' && i.estoqueAtual < i.minimo).length,
    [items]
  );

  async function handleNovoItem() {
    const nome = prompt('Nome do item:');
    if (!nome) return;
    const unidade = prompt('Unidade (ex.: cp, ml, un):') || 'un';
    const minimoStr = prompt('Estoque mínimo (número):') || '0';
    const minimo = Number(minimoStr) || 0;
    try {
      await api.post('/items', {
        nome,
        categoria: categoriaAtual,
        unidade,
        minimo,
        active: true,
      });
      await load();
    } catch (e) {
      alert('Falha ao criar item. Veja o console.');
      console.error(e);
    }
  }

  async function handleEntrada(it: ItemApi) {
    const qtdStr = prompt(`Quantidade de ENTRADA para "${it.nome}":`, '10');
    const quantidade = Number(qtdStr);
    if (!quantidade || quantidade <= 0) return;
    const motivo = prompt('Motivo (opcional):', 'Reposição');
    try {
      await api.post(`/items/${it.id}/entrada`, { quantidade, motivo });
      await load();
    } catch (e) {
      alert('Falha ao registrar entrada.');
      console.error(e);
    }
  }

  async function handleSaida(it: ItemApi) {
    const qtdStr = prompt(`Quantidade de SAÍDA para "${it.nome}":`, '1');
    const quantidade = Number(qtdStr);
    if (!quantidade || quantidade <= 0) return;
    const motivo = prompt('Motivo (opcional):', 'Consumo manual');
    try {
      await api.post(`/items/${it.id}/saida`, { quantidade, motivo });
      await load();
    } catch (e) {
      alert('Falha ao registrar saída.');
      console.error(e);
    }
  }

  async function handleEditar(it: ItemApi) {
    const unidade = prompt('Unidade:', it.unidade || 'un') || it.unidade || 'un';
    const minimoStr = prompt('Estoque mínimo:', String(it.minimo ?? 0)) || String(it.minimo ?? 0);
    const minimo = Number(minimoStr) || 0;
    try {
      await api.patch(`/items/${it.id}`, { unidade, minimo });
      await load();
    } catch (e) {
      alert('Falha ao editar item.');
      console.error(e);
    }
  }

  return (
    <div className="estoque-page">
      <Container fluid className="py-3">
        {/* Top tools */}
        <Row className="align-items-center g-2 mb-2">
          <Col xs={12} md>
            <h2 className="m-0">Estoque</h2>
            <div className="text-muted small">Medicamentos & Insumos (curativos)</div>
          </Col>
          <Col xs={12} md="auto">
            <div className="d-flex gap-2 estoque-actions">
              <Form.Control
                size="sm"
                type="search"
                placeholder="Buscar item…"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                disabled={loading}
              />
              <Button size="sm" variant="primary" onClick={handleNovoItem} disabled={loading}>
                <Plus size={16} className="me-1" /> Novo item
              </Button>
            </div>
          </Col>
        </Row>

        {/* Abas */}
        <Tabs
          id="tabs-estoque"
          activeKey={aba}
          onSelect={(k) => setAba((k as 'med' | 'cur') ?? 'med')}
          className="mb-3 estoque-tabs"
          justify
        >
          <Tab eventKey="med" title="Medicamentos" />
          <Tab eventKey="cur" title="Curativos" />
        </Tabs>

        {/* Banner de alerta */}
        <Card className="border-0 shadow-xs mb-3">
          <Card.Body className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <Badge bg="warning" text="dark">Atenção</Badge>
              <span className="text-muted">
                Itens abaixo do mínimo:{' '}
                <strong>{loading ? '...' : qtdCriticos}</strong>
              </span>
            </div>
            <Button
              size="sm"
              variant="outline-secondary"
              onClick={() => setOnlyCriticos((v) => !v)}
              disabled={loading || items.length === 0}
            >
              {onlyCriticos ? 'Ver todos' : 'Ver itens críticos'}
            </Button>
          </Card.Body>
        </Card>

        {/* Tabela */}
        <div className="table-container">
          <Table responsive bordered hover className="align-middle">
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Item</th>
                <th style={{ width: 120 }}>Unidade</th>
                <th style={{ width: 120 }}>Em estoque</th>
                <th style={{ width: 120 }}>Mínimo</th>
                <th style={{ width: 180 }}>Última mov.</th>
                <th style={{ width: 220 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">Carregando…</td>
                </tr>
              ) : listaFiltrada.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">Nenhum item encontrado.</td>
                </tr>
              ) : (
                listaFiltrada.map((it) => (
                  <tr key={it.id}>
                    <td className="fw-semibold">{it.nome}</td>
                    <td>{it.unidade || '—'}</td>
                    <td>{typeof it.estoqueAtual === 'number' ? it.estoqueAtual : '—'}</td>
                    <td>{typeof it.minimo === 'number' ? it.minimo : '—'}</td>
                    <td className="text-muted">—{/* Poderemos exibir a última movimentação quando a API expor */}</td>
                    <td>
                      <div className="d-flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline-success"
                          onClick={() => handleEntrada(it)}
                          disabled={loading}
                        >
                          <Upload size={16} className="me-1" />
                          Entrada
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => handleSaida(it)}
                          disabled={loading}
                        >
                          <Download size={16} className="me-1" />
                          Saída
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          onClick={() => handleEditar(it)}
                          disabled={loading}
                        >
                          <Pencil size={16} className="me-1" />
                          Editar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>

        {/* Paginação (opcional, a API suporta mas aqui carregamos tudo por categoria) */}
        <div className="d-flex justify-content-between align-items-center mt-3">
          <div className="text-muted small">
            Mostrando {loading ? '...' : listaFiltrada.length} itens
          </div>
          <div className="d-flex gap-2">
            <Button size="sm" variant="outline-secondary" disabled>Anterior</Button>
            <Button size="sm" variant="outline-secondary" disabled>Próximo</Button>
          </div>
        </div>
      </Container>
    </div>
  );
}
