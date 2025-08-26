import 'bootstrap/dist/css/bootstrap.min.css'
import '../styles/Estoque.css'
import React, { useMemo, useState } from 'react'
import { Container, Row, Col, Button, Form, Table, Badge, Tabs, Tab, Card } from 'react-bootstrap'
import { Plus, Download, Upload, Pencil } from 'lucide-react'

type Item = {
  nome: string
  unidade?: string     // ex.: cp, spray, gts…
  estoque?: number     // mostraremos “—” enquanto não houver CRUD
  minimo?: number
  ultimaMov?: string
}

const MEDICAMENTOS_SEMENTE: Item[] = [
  { nome: 'Acido mefenamico cp', unidade: 'cp' },
  { nome: 'Aerolin spray', unidade: 'spray' },
  { nome: 'Alivium gts', unidade: 'gts' },
  { nome: 'Allegra 60mg' },
  { nome: 'Allegra Sol' },
  { nome: 'Buscopan simples' },
  { nome: 'Buscopan composto' },
  { nome: 'Desalex' },
  { nome: 'Dipirona 500mg' },
  { nome: 'Dipirona 1g' },
  { nome: 'Dorflex' },
  { nome: 'Enterogermina' },
  { nome: 'Gastrogel' },
  { nome: 'Ibuprofeno 400mg' },
  { nome: 'Ibuprofeno 600mg' },
  { nome: 'Loratadina' },
  { nome: 'Luftal 125mg cp', unidade: 'cp' },
  { nome: 'Luftal gts', unidade: 'gts' },
  { nome: 'Neosaldina' },
  { nome: 'Novalgina' },
  { nome: 'Paracetamol 750mg' },
  { nome: 'Predsim cp', unidade: 'cp' },
  { nome: 'Predsim sol' },
  { nome: 'Strepsils' },
  { nome: 'Tylenol 500mg' },
  { nome: 'Tylenol sol' },
  { nome: 'Vonau 4mg' },
  { nome: 'Vonau 8mg' },
]

const CURATIVOS_SEMENTE: Item[] = [
  { nome: 'ABS' },
  { nome: 'ATADURA' },
  { nome: 'ABAIXADOR DE LINGUA' },
  { nome: 'BANDAID' },
  { nome: 'BEPANTOL' },
  { nome: 'BRONQUIVITA' },
  { nome: 'COLÍRIO' },
  { nome: 'CRIOTERAPIA' },
  { nome: 'ESPARADRAPO' },
  { nome: 'GAZE' },
  { nome: 'HIDROCORTISONA' },
  { nome: 'HIPOGLOS' },
  { nome: 'LENÇO UMEDECIDO' },
  { nome: 'MASK' },
  { nome: 'MASSAGEOL SPRAY' },
  { nome: 'MASSAGEOL POMADA' },
  { nome: 'MERTHIOLATE' },
  { nome: 'MICROPORE' },
  { nome: 'NEBACETIN' },
  { nome: 'OLEO DE GIRASSOL' },
  { nome: 'OMCILON' },
  { nome: 'QUEIMADOL' },
  { nome: 'REPARIL' },
  { nome: 'REPELENTE' },
  { nome: 'SF REFIL' },
  { nome: 'SF' },
  { nome: 'SPRAY DE PRÓPOLIS' },
  { nome: 'TERMOTERAPIA' },
  { nome: 'VICK' },
]

export default function Estoque() {
  const [aba, setAba] = useState<'med' | 'cur'>('med')
  const [busca, setBusca] = useState('')

  const listaBruta = aba === 'med' ? MEDICAMENTOS_SEMENTE : CURATIVOS_SEMENTE
  const lista = useMemo(
    () =>
      listaBruta.filter((i) =>
        i.nome.toLowerCase().includes(busca.trim().toLowerCase()),
      ),
    [listaBruta, busca],
  )

  const handleNovoItem = () => alert('Novo item (UI) – CRUD entra depois.')
  const handleEntrada = (nome: string) => alert(`Entrada de estoque: ${nome}`)
  const handleSaida = (nome: string) => alert(`Saída/dispensa: ${nome}`)
  const handleEditar = (nome: string) => alert(`Editar: ${nome}`)

  return (
    <div className="estoque-page">
      <Container fluid className="py-3">
        {/* Top tools */}
        <Row className="align-items-center g-2 mb-2">
          <Col xs={12} md>
            <h2 className="m-0">Estoque</h2>
            <div className="text-muted small">
              Medicamentos & Insumos (curativos)
            </div>
          </Col>
          <Col xs={12} md="auto">
            <div className="d-flex gap-2 estoque-actions">
              <Form.Control
                size="sm"
                type="search"
                placeholder="Buscar item…"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
              <Button size="sm" variant="primary" onClick={handleNovoItem}>
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

        {/* Banner de alerta (placeholder) */}
        <Card className="border-0 shadow-xs mb-3">
          <Card.Body className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <Badge bg="warning" text="dark">Atenção</Badge>
              <span className="text-muted">
                Itens abaixo do mínimo: <strong>—</strong> 
              </span>
            </div>
            <Button size="sm" variant="outline-secondary" disabled>
              Ver itens críticos
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
              {lista.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">
                    Nenhum item encontrado.
                  </td>
                </tr>
              ) : (
                lista.map((it) => (
                  <tr key={it.nome}>
                    <td className="fw-semibold">{it.nome}</td>
                    <td>{it.unidade || '—'}</td>
                    <td>
                      {/* Placeholder até ligar CRUD */}
                      <span className="text-muted">—</span>
                    </td>
                    <td>
                      <span className="text-muted">—</span>
                    </td>
                    <td className="text-muted">{it.ultimaMov || '—'}</td>
                    <td>
                      <div className="d-flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline-success"
                          onClick={() => handleEntrada(it.nome)}
                        >
                          <Upload size={16} className="me-1" />
                          Entrada
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => handleSaida(it.nome)}
                        >
                          <Download size={16} className="me-1" />
                          Saída
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          onClick={() => handleEditar(it.nome)}
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

        {/* Paginação (placeholder) */}
        <div className="d-flex justify-content-between align-items-center mt-3">
          <div className="text-muted small">
            Mostrando {lista.length} itens
          </div>
          <div className="d-flex gap-2">
            <Button size="sm" variant="outline-secondary" disabled>
              Anterior
            </Button>
            <Button size="sm" variant="outline-secondary" disabled>
              Próximo
            </Button>
          </div>
        </div>
      </Container>
    </div>
  )
}
