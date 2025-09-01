import 'bootstrap/dist/css/bootstrap.min.css'
import '../styles/Historico.css'
import React, { useMemo, useState } from 'react'
import {
  Container, Row, Col, Card, Button, Form, Table, Badge, Modal
} from 'react-bootstrap'
import { Search, Filter, Download, Info, Printer } from 'lucide-react'
import logoImg from '../assets/EAR.png'

type Registro = {
  id: string
  dataISO: string         // ex.: 2025-03-10T10:15:00Z
  hora: string            // HH:mm para exibir
  nome: string
  vinculo: string
  funcao: string
  turma: string
  motivo: string
  destino: string         // HOSPITAL => emergência
  comunicacao?: string
  observacao?: string
}

/* ===== MOCK – trocar por API/SQL quando o CRUD estiver pronto ===== */
const MOCK: Registro[] = [
  { id: '1', dataISO: new Date().toISOString(), hora: '08:15', nome: 'Ana S.',  vinculo:'Aluno', funcao:'Aluno', turma:'5th A', motivo:'Febre', destino:'HOME', comunicacao:'WHATSAPP' },
  { id: '2', dataISO: new Date().toISOString(), hora: '09:40', nome: 'João P.', vinculo:'Aluno', funcao:'Aluno', turma:'7th',   motivo:'Corte superficial', destino:'DISMISS' },
  { id: '3', dataISO: new Date().toISOString(), hora: '10:05', nome: 'Maria V.',vinculo:'Aluno', funcao:'Aluno', turma:'9th',   motivo:'Cefaleia', destino:'OFFICE/ Special' },
  { id: '4', dataISO: new Date().toISOString(), hora: '11:20', nome: 'Lucas R.',vinculo:'Aluno', funcao:'Aluno', turma:'6th',   motivo:'Náusea', destino:'HOSPITAL', comunicacao:'CALL' },
]

const funcoes = ['Todos','Aluno','Funcionário','Teacher','TA','ADM','Nurse','Office','Psi','TI','RH','Special']
const turmas  = ['Todas','NURSERY A','NURSERY B','PK 3 A','PK 4 A','KINDER A','1st A','1st B','2nd A','3rd A','4th A','5th A','6th','7th','8th','9th','10th','11th','12th','—']
const motivos = ['Todos','Febre','Cefaleia','Corte superficial','Dor de cabeça','Dor de ouvido','Náusea','Alergia','Outros']

export default function Historico() {
  // Busca & filtros
  const [q, setQ] = useState('')
  const [funcao, setFuncao] = useState('Todos')
  const [turma, setTurma] = useState('Todas')
  const [motivo, setMotivo] = useState('Todos')
  const [soEmergencia, setSoEmergencia] = useState(false)
  const [dtIni, setDtIni] = useState<string>('') // yyyy-mm-dd
  const [dtFim, setDtFim] = useState<string>('') // yyyy-mm-dd

  // Modal de detalhes
  const [detalhe, setDetalhe] = useState<Registro | null>(null)

  // Lista filtrada
  const lista = useMemo(() => {
    const inicio = dtIni ? new Date(dtIni + 'T00:00:00') : null
    const fim    = dtFim ? new Date(dtFim + 'T23:59:59') : null

    return MOCK.filter((r) => {
      const txt = (r.nome + ' ' + r.motivo + ' ' + r.turma + ' ' + r.funcao).toLowerCase()
      const passTxt = q.trim() === '' || txt.includes(q.toLowerCase())

      const passFunc = funcao === 'Todos' || r.funcao === funcao
      const passTur  = turma === 'Todas' || r.turma === turma
      const passMot  = motivo === 'Todos' || r.motivo === motivo

      const isEmerg = r.destino?.toUpperCase() === 'HOSPITAL'
      const passEmerg = !soEmergencia || isEmerg

      const t = new Date(r.dataISO).getTime()
      const passIni = !inicio || t >= +inicio
      const passFim = !fim || t <= +fim

      return passTxt && passFunc && passTur && passMot && passEmerg && passIni && passFim
    }).sort((a,b) => +new Date(b.dataISO) - +new Date(a.dataISO))
  }, [q, funcao, turma, motivo, soEmergencia, dtIni, dtFim])

  const badgeDestino = (d: string) => {
    const up = d?.toUpperCase() || ''
    if (up === 'HOSPITAL') return <Badge bg="danger">Emergência</Badge>
    if (up === 'HOME')     return <Badge bg="secondary">Casa</Badge>
    if (up.startsWith('OFFICE')) return <Badge bg="info">Office/Special</Badge>
    if (up === 'DISMISS')  return <Badge bg="warning" text="dark">Dismiss</Badge>
    return <Badge bg="light" text="dark">{d || '—'}</Badge>
  }

  /* ==== Export CSV real dos registros filtrados ==== */
  const exportarCSV = () => {
    const headers = ['Data','Hora','Nome','Vínculo','Função','Turma','Motivo','Destino','Comunicação','Observação']
    const rows = lista.map(r => ([
      new Date(r.dataISO).toLocaleDateString('pt-BR'),
      r.hora || new Date(r.dataISO).toTimeString().slice(0,5),
      r.nome, r.vinculo, r.funcao, r.turma || '',
      r.motivo, r.destino, r.comunicacao || '', r.observacao || ''
    ]))

    const encode = (s: any) => {
      const v = String(s ?? '')
      return /[",;\n]/.test(v) ? `"${v.replace(/"/g,'""')}"` : v
    }

    const csv = [headers, ...rows].map(cols => cols.map(encode).join(';')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `historico_${new Date().toISOString().slice(0,10)}.csv`
    document.body.appendChild(a); a.click(); a.remove()
    URL.revokeObjectURL(url)
  }

  /* ==== Imprimir / PDF de um registro ==== */
  const imprimirRegistro = (reg: Registro) => {
    const w = window.open('', '_blank', 'width=800,height=900')
    if (!w) return
    const ds = new Date(reg.dataISO).toLocaleString('pt-BR')
    w.document.write(`
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Atendimento - ${reg.nome}</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; margin: 24px; color: #0f172a; }
            .head { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
            .head img { height: 40px; }
            h1 { font-size: 18px; margin: 0; }
            h2 { font-size: 14px; margin: 4px 0 0; color:#334155; font-weight: 600; }
            .card { border:1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 12px; }
            .row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; }
            .label { font-weight: 700; color:#334155; }
            .value { color:#0f172a; }
            @media print { @page { margin: 16mm; } .noprint { display: none; } }
            .actions { margin-top: 8px; }
            .btn { display:inline-block; padding:8px 12px; border-radius:8px; border:1px solid #cbd5e1; text-decoration:none; color:#0f172a; }
          </style>
        </head>
        <body>
          <div class="head">
            <img src="${window.location.origin + logoImg.replace('..','')}" alt="Logo" onerror="this.style.display='none'"/>
            <div>
              <h1>Registro de Atendimento</h1>
              <h2>${reg.nome}</h2>
            </div>
          </div>

          <div class="card">
            <div class="row">
              <div><span class="label">Data/Hora:</span> <span class="value">${ds}</span></div>
              <div><span class="label">Hora (informada):</span> <span class="value">${reg.hora || '-'}</span></div>
              <div><span class="label">Vínculo:</span> <span class="value">${reg.vinculo}</span></div>
              <div><span class="label">Função:</span> <span class="value">${reg.funcao}</span></div>
              <div><span class="label">Turma:</span> <span class="value">${reg.turma || '-'}</span></div>
              <div><span class="label">Motivo:</span> <span class="value">${reg.motivo}</span></div>
              <div><span class="label">Destino:</span> <span className="value">${reg.destino}</span></div>
              <div><span class="label">Comunicação:</span> <span class="value">${reg.comunicacao || '-'}</span></div>
            </div>
          </div>

          ${reg.observacao ? `<div class="card"><div><span class="label">Observação:</span> <span class="value">${reg.observacao}</span></div></div>` : ''}

          <div class="actions noprint">
            <a href="javascript:window.print()" class="btn">Imprimir / PDF</a>
            <a href="javascript:window.close()" class="btn">Fechar</a>
          </div>

          <script>window.onload = () => setTimeout(() => window.print(), 50)</script>
        </body>
      </html>
    `)
    w.document.close()
  }

  return (
    <div className="historico-page">
      {/* NAVBAR mínima com logo + voltar */}
      <div className="historico-topbar d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-2">
          <img src={logoImg} alt="Logo EAR" className="historico-logo" />
          <span className="topbar-title">Histórico</span>
        </div>
        <Button variant="outline-secondary" size="sm" href="/dashboard">
          ← Voltar
        </Button>
      </div>

      <Container fluid className="py-3">
        {/* Cabeçalho com export */}
        <Row className="align-items-center g-2 mb-2">
          <Col xs={12} md>
            <div className="text-muted small">Registros de atendimentos</div>
          </Col>
          <Col xs={12} md="auto">
            <div className="d-flex gap-2 flex-wrap">
              <Button size="sm" variant="outline-secondary" onClick={exportarCSV}>
                <Download size={16} className="me-1" /> Exportar CSV
              </Button>
            </div>
          </Col>
        </Row>

        {/* Filtros */}
        <Card className="border-0 shadow-xs mb-3">
          <Card.Body>
            <Row className="g-2 align-items-end">
              <Col lg={4}>
                <Form.Label>Busca</Form.Label>
                <div className="d-flex">
                  <Form.Control
                    placeholder="Nome, motivo, turma…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                  <span className="btn-search"><Search size={18} /></span>
                </div>
              </Col>
              <Col sm={6} lg={2}>
                <Form.Label>Função</Form.Label>
                <Form.Select value={funcao} onChange={(e)=>setFuncao(e.target.value)}>
                  {funcoes.map(f => <option key={f}>{f}</option>)}
                </Form.Select>
              </Col>
              <Col sm={6} lg={2}>
                <Form.Label>Turma</Form.Label>
                <Form.Select value={turma} onChange={(e)=>setTurma(e.target.value)}>
                  {turmas.map(t => <option key={t}>{t}</option>)}
                </Form.Select>
              </Col>
              <Col sm={6} lg={2}>
                <Form.Label>Motivo</Form.Label>
                <Form.Select value={motivo} onChange={(e)=>setMotivo(e.target.value)}>
                  {motivos.map(m => <option key={m}>{m}</option>)}
                </Form.Select>
              </Col>
              <Col sm={6} lg={2}>
                <Form.Check
                  className="mt-4"
                  type="switch"
                  id="switch-emergencia"
                  label="Só emergências"
                  checked={soEmergencia}
                  onChange={(e)=>setSoEmergencia(e.target.checked)}
                />
              </Col>
            </Row>

            <Row className="g-2 mt-1">
              <Col sm={6} md={3}>
                <Form.Label>De</Form.Label>
                <Form.Control type="date" value={dtIni} onChange={(e)=>setDtIni(e.target.value)} />
              </Col>
              <Col sm={6} md={3}>
                <Form.Label>Até</Form.Label>
                <Form.Control type="date" value={dtFim} onChange={(e)=>setDtFim(e.target.value)} />
              </Col>
              <Col md="auto" className="align-self-end">
                <Button size="sm" variant="outline-secondary" onClick={()=>{
                  setQ(''); setFuncao('Todos'); setTurma('Todas'); setMotivo('Todos'); setSoEmergencia(false); setDtIni(''); setDtFim('');
                }}>
                  <Filter size={16} className="me-1" /> Limpar filtros
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Tabela */}
        <div className="table-wrapper">
          <Table responsive hover className="align-middle">
            <thead>
              <tr>
                <th style={{width: 90}}>Data</th>
                <th style={{width: 70}}>Hora</th>
                <th>Nome</th>
                <th style={{width: 120}}>Função</th>
                <th style={{width: 110}}>Turma</th>
                <th>Motivo</th>
                <th style={{width: 140}}>Destino</th>
                <th style={{width: 170}}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {lista.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-muted py-4">
                    Nenhum registro encontrado.
                  </td>
                </tr>
              ) : (
                lista.map((r) => {
                  const d = new Date(r.dataISO)
                  const ds = d.toLocaleDateString('pt-BR')
                  return (
                    <tr key={r.id}>
                      <td>{ds}</td>
                      <td>{r.hora || new Date(r.dataISO).toTimeString().slice(0,5)}</td>
                      <td className="fw-semibold">{r.nome}</td>
                      <td>{r.funcao}</td>
                      <td>{r.turma || '—'}</td>
                      <td>{r.motivo}</td>
                      <td>{badgeDestino(r.destino)}</td>
                      <td>
                        <div className="d-flex gap-2 flex-wrap">
                          <Button size="sm" variant="outline-primary" onClick={()=>setDetalhe(r)}>
                            <Info size={16} className="me-1" /> Detalhes
                          </Button>
                          <Button size="sm" variant="outline-secondary" onClick={()=>imprimirRegistro(r)}>
                            <Printer size={16} className="me-1" /> Imprimir
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </Table>
        </div>

        {/* Paginação (placeholder) */}
        <div className="d-flex justify-content-between align-items-center mt-3">
          <div className="text-muted small">Mostrando {lista.length} registros</div>
          <div className="d-flex gap-2">
            <Button size="sm" variant="outline-secondary" disabled>Anterior</Button>
            <Button size="sm" variant="outline-secondary" disabled>Próximo</Button>
          </div>
        </div>
      </Container>

      {/* Modal Detalhes */}
      <Modal show={!!detalhe} onHide={()=>setDetalhe(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Detalhes do atendimento</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detalhe && (
            <div className="small">
              <div><strong>Nome:</strong> {detalhe.nome}</div>
              <div><strong>Vínculo:</strong> {detalhe.vinculo}</div>
              <div><strong>Função:</strong> {detalhe.funcao}</div>
              <div><strong>Turma:</strong> {detalhe.turma || '—'}</div>
              <div><strong>Motivo:</strong> {detalhe.motivo}</div>
              <div><strong>Destino:</strong> {detalhe.destino}</div>
              <div><strong>Comunicação:</strong> {detalhe.comunicacao || '—'}</div>
              <div><strong>Data/Hora:</strong> {new Date(detalhe.dataISO).toLocaleString('pt-BR')}</div>
              {detalhe.observacao && <div className="mt-2"><strong>Obs.:</strong> {detalhe.observacao}</div>}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={()=>setDetalhe(null)}>Fechar</Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
