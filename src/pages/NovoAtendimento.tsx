import 'bootstrap/dist/css/bootstrap.min.css'
import '../styles/NovoAtendimento.css'
import React, { useMemo, useState } from 'react'
import { Container, Row, Col, Card, Button, Form, Alert, Badge } from 'react-bootstrap'
import color from '../assets/color.png'

type Viculo = string

type FormValues = {
  nome: string
  vinculo: string
  horaChegada: string
  funcao: string
  turma: string
  motivo: string
  descricao: string
  responsavel: string
  comunicacao: string
  hgt?: string
  temperatura?: string
  fc?: string
  pa?: string
  spo2?: string
  medicamentos: string[]
  curativos: string[]
  outros: string
  destino: string
}

const funcoes = [
  'Aluno','Funcionário','Parents/Relatives','ADM','Maint','Nurse','Office','Psi','Teacher','TA',
  'Terceirizado','TI','RH','Storage','Special','Portaria/Segurança'
]

const turmas = [
  'TURMA','NURSERY A','NURSERY B','NURSERY C','PK 3 A','PK 3 B','PK 4 A','PK 4 B','KINDER A','KINDER B',
  '1st A','1st B','2nd A','2nd B','3rd A','3rd B','4th A','4th B','5th A','5th B','6th','7th','8th',
  '9th','10th','11th','12th'
]

const motivos = [
  'Afta','Arranhão','Alergia','Azia','Calo','Cólica','Congestão nasal','Coriza','Corte superficial','Corte profundo',
  'Dente','Desconforto abd','Diarreia','Dor','Dor de garganta','Dor de cabeça','Dor de ouvido','Dor muscular',
  'Enjoo / Êmese / Nausea','Equimose','Epistaxe','Edema','Emocional','Febre','Galo','Mal estar','Moleza',
  'Hiperemia','Hiperglicemia','Hipoglicemia','Tontura','Torcicolo','Tosse','Olhos','Picada de inseto','Queimadura','Outros'
]

const comunicacoes = ['JUPITER','CALL','WHATSAPP','PRESENCIAL']

const medicamentos = [
  'Acido mefenamico cp','Aerolin spray','Alivium gts','Allegra 60mg','Allegra Sol','Buscopan simples','Buscopan composto',
  'Desalex','Dipirona 500mg','Dipirona 1g','Dorflex','Enterogermina','Gastrogel','Ibuprofeno 400mg','Ibuprofeno 600mg',
  'Loratadina','Luftal 125mg cp','Luftal gts','Neosaldina','Novalgina','Paracetamol 750mg','Predsim cp','Predsim sol',
  'Strepsils','Tylenol 500mg','Tylenol sol','Vonau 4mg','Vonau 8mg'
]

const curativos = [
  'ABS','ATADURA','ABAIXADOR DE LINGUA','BANDAID','BEPANTOL','BRONQUIVITA','COLÍRIO','CRIOTERAPIA','ESPARADRAPO','GAZE',
  'HIDROCORTISONA','HIPOGLOS','LENÇO UMEDECIDO','MASK','MASSAGEOL SPRAY','MASSAGEOL POMADA','MERTHIOLATE','MICROPORE',
  'NEBACETIN','OLEO DE GIRASSOL','OMCILON','QUEIMADOL','REPARIL','REPELENTE','SF REFIL','SF','SPRAY DE PRÓPOLIS',
  'TERMOTERAPIA','VICK'
]

const destinos = ['DESTINO','DISMISS','HOME','HOSPITAL','OFFICE/ Special']

const defaultValues: FormValues = {
  nome: '',
  vinculo: '',
  horaChegada: '',
  funcao: '',
  turma: '',
  motivo: '',
  descricao: '',
  responsavel: '',
  comunicacao: '',
  hgt: '',
  temperatura: '',
  fc: '',
  pa: '',
  spo2: '',
  medicamentos: [],
  curativos: [],
  outros: '',
  destino: ''
}

export default function NovoAtendimento() {
  const [values, setValues] = useState<FormValues>(defaultValues)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const obrigatorios = useMemo(() => ['nome','vinculo','funcao','horaChegada','motivo','destino'], [])
  const isRequiredMissing = (v: FormValues) =>
    obrigatorios.some((k) => !(v as any)[k] || String((v as any)[k]).trim() === '')

  const handleChange =
    (field: keyof FormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const val = e.target.value
      setValues((prev) => ({ ...prev, [field]: val }))
      setSuccess(false)
      setError(null)
    }

  const toggleFromList =
    (field: 'medicamentos' | 'curativos', item: string) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const checked = e.target.checked
      setValues((prev) => {
        const list = new Set(prev[field])
        checked ? list.add(item) : list.delete(item)
        return { ...prev, [field]: Array.from(list) }
      })
      setSuccess(false)
      setError(null)
    }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    // Validações básicas
    if (isRequiredMissing(values)) {
      setError('Preencha todos os campos obrigatórios.')
      return
    }

    // Validações simples de faixa numérica (se preenchidos)
    const toNum = (s?: string) => (s && s.trim() !== '' ? Number(s.replace(',', '.')) : undefined)
    const temp = toNum(values.temperatura)
    if (temp !== undefined && (temp < 35 || temp > 42)) {
      setError('Temperatura fora de faixa aceitável (35–42 °C).')
      return
    }
    const fc = toNum(values.fc)
    if (fc !== undefined && (fc < 40 || fc > 200)) {
      setError('Frequência cardíaca fora de faixa (40–200 bpm).')
      return
    }
    const spo2 = toNum(values.spo2)
    if (spo2 !== undefined && (spo2 < 70 || spo2 > 100)) {
      setError('SpO₂ fora de faixa (70–100%).')
      return
    }
    const hgt = toNum(values.hgt)
    if (hgt !== undefined && (hgt < 40 || hgt > 500)) {
      setError('HGT fora de faixa (40–500 mg/dl).')
      return
    }

    // Mock de envio
    try {
      setSubmitting(true)
      await new Promise((r) => setTimeout(r, 600)) // simula request
      console.log('[Novo Atendimento] payload', values)
      setSuccess(true)
      // Opcional: limpar só alguns campos
      // setValues(defaultValues)
    } catch (err) {
      setError('Não foi possível salvar. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
        <div className="form-page"><div className="novoat-topbar d-flex align-items-center p-2">
        <img src={color} alt="Logo EAR" className="novoat-logo me-2" />
        <Button
        variant="outline-secondary"
        size="sm"
        href="/dashboard"
        >
            ← Voltar
        </Button>
        </div>
        <Container className="py-4">
        <h2 className="mb-3">Novo Atendimento</h2>
        <p className="text-muted mb-4">
          Preencha os campos abaixo. Os campos com <span className="req">*</span> são obrigatórios.
        </p>
        {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
        {success && (
       <div className="overlay-confirm">
  <div className="confirm-card">
    <button
      type="button"
      className="confirm-close"
      onClick={() => setSuccess(false)}
      aria-label="Fechar"
    />
    <div className="confirm-header">
      <div className="success-icon" aria-hidden="true">✓</div>
      <h5>Atendimento salvo com sucesso!</h5>
      <p className="confirm-subtitle">Escolha uma opção para continuar</p>
    </div>

    <div className="confirm-actions">
      <button
        className="btn-cta"
        onClick={() => { setValues(defaultValues); setSuccess(false); }}
      >
        Realizar novo atendimento
      </button>
      <a className="btn-secondary" href="/dashboard">
        Voltar ao início
      </a>
    </div>
  </div>
</div>
        )}
        <Form onSubmit={handleSubmit}>
          {/* Identificação */}
          <Card className="mb-4 shadow-sm border-0">
            <Card.Header className="bg-white"><strong>Identificação</strong></Card.Header>
            <Card.Body>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Label>Nome <span className="req">*</span></Form.Label>
                  <Form.Control value={values.nome} onChange={handleChange('nome')} placeholder="Nome completo" />
                </Col>
                <Col md={3}>
                  <Form.Label>Vínculo <span className="req">*</span></Form.Label>
                  <Form.Control value={values.vinculo} onChange={handleChange('vinculo')} placeholder="Ex.: aluno" />
                </Col>
                <Col md={3}>
                  <Form.Label>Hora da chegada <span className="req">*</span></Form.Label>
                  <Form.Control type="time" value={values.horaChegada} onChange={handleChange('horaChegada')} />
                </Col>
                <Col md={4}>
                  <Form.Label>Função <span className="req">*</span></Form.Label>
                  <Form.Select value={values.funcao} onChange={handleChange('funcao')}>
                    <option value="">Selecione...</option>
                    {funcoes.map((f) => <option key={f} value={f}>{f}</option>)}
                  </Form.Select>
                </Col>
                <Col md={4}>
                  <Form.Label>Turma</Form.Label>
                  <Form.Select value={values.turma} onChange={handleChange('turma')}>
                    <option value="">Selecione...</option>
                    {turmas.map((t) => <option key={t} value={t}>{t}</option>)}
                  </Form.Select>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Atendimento */}
          <Card className="mb-4 shadow-sm border-0">
            <Card.Header className="bg-white"><strong>Atendimento</strong></Card.Header>
            <Card.Body>
              <Row className="g-3">
                <Col md={4}>
                  <Form.Label>Motivo <span className="req">*</span></Form.Label>
                  <Form.Select value={values.motivo} onChange={handleChange('motivo')}>
                    <option value="">Selecione...</option>
                    {motivos.map((m) => <option key={m} value={m}>{m}</option>)}
                  </Form.Select>
                </Col>
                <Col md={4}>
                  <Form.Label>Responsável</Form.Label>
                  <Form.Control value={values.responsavel} onChange={handleChange('responsavel')} placeholder="Nome do responsável" />
                </Col>
                <Col md={4}>
                  <Form.Label>Comunicação</Form.Label>
                  <Form.Select value={values.comunicacao} onChange={handleChange('comunicacao')}>
                    <option value="">Selecione...</option>
                    {comunicacoes.map((c) => <option key={c} value={c}>{c}</option>)}
                  </Form.Select>
                </Col>
                <Col xs={12}>
                  <Form.Label>Descrição</Form.Label>
                  <Form.Control
                    as="textarea" rows={3}
                    value={values.descricao}
                    onChange={handleChange('descricao')}
                    placeholder="Descreva sinais, queixas ou observações relevantes"
                  />
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Sinais vitais */}
          <Card className="mb-4 shadow-sm border-0">
            <Card.Header className="bg-white">
              <strong>Sinais vitais</strong>{' '}
              <Badge bg="secondary" pill className="ms-2">opcional</Badge>
            </Card.Header>
            <Card.Body>
              <Row className="g-3">
                <Col md={2}>
                  <Form.Label>HGT (mg/dl)</Form.Label>
                  <Form.Control value={values.hgt} onChange={handleChange('hgt')} inputMode="numeric" />
                </Col>
                <Col md={2}>
                  <Form.Label>T (°C)</Form.Label>
                  <Form.Control value={values.temperatura} onChange={handleChange('temperatura')} inputMode="decimal" />
                </Col>
                <Col md={2}>
                  <Form.Label>FC (bpm)</Form.Label>
                  <Form.Control value={values.fc} onChange={handleChange('fc')} inputMode="numeric" />
                </Col>
                <Col md={3}>
                  <Form.Label>PA (mmHg)</Form.Label>
                  <Form.Control value={values.pa} onChange={handleChange('pa')} placeholder="ex.: 110/70" />
                </Col>
                <Col md={3}>
                  <Form.Label>SpO₂ (%)</Form.Label>
                  <Form.Control value={values.spo2} onChange={handleChange('spo2')} inputMode="numeric" />
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Medicamentos */}
          <Card className="mb-4 shadow-sm border-0">
            <Card.Header className="bg-white"><strong>Medicamentos</strong> <span className="text-muted">(se administrados)</span></Card.Header>
            <Card.Body>
              <div className="grid-cols">
                {medicamentos.map((m) => (
                  <Form.Check
                    key={m}
                    type="checkbox"
                    id={`med_${m}`}
                    label={m}
                    checked={values.medicamentos.includes(m)}
                    onChange={toggleFromList('medicamentos', m)}
                  />
                ))}
              </div>
            </Card.Body>
          </Card>

          {/* Curativos */}
          <Card className="mb-4 shadow-sm border-0">
            <Card.Header className="bg-white"><strong>Curativos</strong> <span className="text-muted">(se utilizados)</span></Card.Header>
            <Card.Body>
              <div className="grid-cols">
                {curativos.map((c) => (
                  <Form.Check
                    key={c}
                    type="checkbox"
                    id={`cur_${c}`}
                    label={c}
                    checked={values.curativos.includes(c)}
                    onChange={toggleFromList('curativos', c)}
                  />
                ))}
              </div>
              <Row className="mt-3">
                <Col md={12}>
                  <Form.Label>Outros</Form.Label>
                  <Form.Control value={values.outros} onChange={handleChange('outros')} placeholder="Descreva materiais/medicamentos não listados" />
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Encaminhamento */}
          <Card className="mb-4 shadow-sm border-0">
            <Card.Header className="bg-white"><strong>Encaminhamento</strong></Card.Header>
            <Card.Body>
              <Row className="g-3">
                <Col md={4}>
                  <Form.Label>Destino <span className="req">*</span></Form.Label>
                  <Form.Select value={values.destino} onChange={handleChange('destino')}>
                    <option value="">Selecione...</option>
                    {destinos.map((d) => <option key={d} value={d}>{d}</option>)}
                  </Form.Select>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <div className="d-flex gap-2 justify-content-end">
            <Button variant="secondary" type="button" onClick={() => setValues(defaultValues)} disabled={submitting}>
              Limpar
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Salvando...' : 'Salvar atendimento'}
            </Button>
          </div>
        </Form>
      </Container>
    </div>
  )
}
