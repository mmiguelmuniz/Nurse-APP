import 'bootstrap/dist/css/bootstrap.min.css'
import '../styles/NovoAtendimento.css'
import React, { useMemo, useState, useEffect } from 'react'
import { Container, Row, Col, Card, Button, Form, Alert, Badge } from 'react-bootstrap'
import color from '../assets/color.png'
import api from '../lib/api'

/** ===== DTOs vindos do BACK ===== */
type ClassDTO = { id: string; name: string }
type ReasonDTO = { id: string; name: string; active?: boolean }
type CommunicationDTO = { id: string; name: string }

type ItemDTO = {
  id: string
  nome: string
  categoria: 'MEDICAMENTO' | 'CURATIVO'
  unidade: string
  minimo: number
  estoqueAtual: number
  active: boolean
  createdAt: string
  descontaEstoque?: boolean // ✅ NOVO
}

/** ===== Form ===== */
type FormValues = {
  nome: string
  vinculo: string
  horaChegada: string
  funcao: string
  classId: string
  motivoId: string
  descricao: string
  responsavel: string
  comunicacaoId: string
  hgt?: string
  temperatura?: string
  fc?: string
  pa?: string
  spo2?: string
  outros: string
  destino: string
}

const funcoes = [
  'Aluno','Funcionário','Parents/Relatives','ADM','Maint','Nurse','Office','Psi','Teacher','TA',
  'Terceirizado','TI','RH','Storage','Special','Portaria/Segurança'
]

// ✅ destino com “Selecione...”
const destinos = ['DISMISS','HOME','HOSPITAL','OFFICE/ Special']

const defaultValues: FormValues = {
  nome: '',
  vinculo: '',
  horaChegada: '',
  funcao: '',
  classId: '',
  motivoId: '',
  descricao: '',
  responsavel: '',
  comunicacaoId: '',
  hgt: '',
  temperatura: '',
  fc: '',
  pa: '',
  spo2: '',
  outros: '',
  destino: ''
}

export default function NovoAtendimento() {
  const [values, setValues] = useState<FormValues>(defaultValues)
  const [submitting, setSubmitting] = useState(false)
  const [loadingLookups, setLoadingLookups] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  /** ===== Lookups do banco ===== */
  const [classes, setClasses] = useState<ClassDTO[]>([])
  const [reasons, setReasons] = useState<ReasonDTO[]>([])
  const [communications, setCommunications] = useState<CommunicationDTO[]>([])
  const [medItems, setMedItems] = useState<ItemDTO[]>([])
  const [curItems, setCurItems] = useState<ItemDTO[]>([])

  /** itemId -> quantidade */
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({})

  /** ===== Carregamento inicial ===== */
  useEffect(() => {
    let canceled = false

    ;(async () => {
      try {
        setLoadingLookups(true)
        setError(null)

        const [cls, rea, com, med, cur] = await Promise.all([
          api.get<ClassDTO[]>('/classes'),
          api.get<ReasonDTO[]>('/reasons'),
          api.get<CommunicationDTO[]>('/communications'),
          api.get<ItemDTO[]>('/items', { params: { categoria: 'MEDICAMENTO', ativos: 'true' } }),
          api.get<ItemDTO[]>('/items', { params: { categoria: 'CURATIVO', ativos: 'true' } }),
        ])

        if (canceled) return

        const sortedClasses = (cls.data ?? []).slice().sort((a, b) => a.name.localeCompare(b.name))
        const rsRaw = (rea.data ?? []).filter((r: any) => (r.active === undefined ? true : !!r.active))
        const sortedReasons = rsRaw.slice().sort((a, b) => a.name.localeCompare(b.name))
        const sortedComms = (com.data ?? []).slice().sort((a, b) => a.name.localeCompare(b.name))

        const sortedMed = (med.data ?? []).slice().sort((a, b) => a.nome.localeCompare(b.nome))
        const sortedCur = (cur.data ?? []).slice().sort((a, b) => a.nome.localeCompare(b.nome))

        setClasses(sortedClasses)
        setReasons(sortedReasons)
        setCommunications(sortedComms)
        setMedItems(sortedMed)
        setCurItems(sortedCur)
      } catch (e) {
        console.error(e)
        if (!canceled) setError('Não foi possível carregar dados do formulário (turmas/motivos/comunicação/itens).')
      } finally {
        if (!canceled) setLoadingLookups(false)
      }
    })()

    return () => { canceled = true }
  }, [])

  /** ===== validações ===== */
  const obrigatorios = useMemo(() => ['nome','vinculo','funcao','horaChegada','motivoId','destino'], [])
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

  /** ===== itens ===== */
  const toggleItem = (itemId: string, checked: boolean) => {
    setSelectedItems((prev) => {
      const next = { ...prev }
      if (!checked) delete next[itemId]
      else next[itemId] = next[itemId] ?? 1
      return next
    })
    setSuccess(false)
    setError(null)
  }

  const setQty = (itemId: string, qty: number) => {
    const safe = Number.isFinite(qty) ? Math.max(1, Math.floor(qty)) : 1
    setSelectedItems((prev) => ({ ...prev, [itemId]: safe }))
    setSuccess(false)
    setError(null)
  }

  const renderItems = (items: ItemDTO[]) => {
    return (
      <div className="grid-cols">
        {items.map((it) => {
          const checked = selectedItems[it.id] != null
          const desconta = it.descontaEstoque !== false // default true

          const max = Math.max(0, it.estoqueAtual)

          // ✅ Regra: se NÃO desconta estoque, não bloqueia por estoque 0
          const disabledCheckbox = desconta ? (it.estoqueAtual <= 0 && !checked) : false

          const label = desconta
            ? `${it.nome} (${it.estoqueAtual} ${it.unidade})`
            : `${it.nome} (sem baixa de estoque)`

          return (
            <div key={it.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Form.Check
                type="checkbox"
                id={`it_${it.id}`}
                label={label}
                checked={checked}
                onChange={(e) => toggleItem(it.id, e.target.checked)}
                disabled={disabledCheckbox}
              />

              {checked && (
                <Form.Control
                  style={{ width: 90 }}
                  type="number"
                  min={1}
                  // ✅ só limita max quando o item desconta estoque
                  max={desconta ? (max || 1) : undefined}
                  value={selectedItems[it.id]}
                  onChange={(e) => setQty(it.id, Number(e.target.value))}
                />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  /** ===== submit ===== */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (loadingLookups) {
      setError('Aguarde carregar os dados do formulário.')
      return
    }

    if (isRequiredMissing(values)) {
      setError('Preencha todos os campos obrigatórios.')
      return
    }

    const toNum = (s?: string) => (s && s.trim() !== '' ? Number(s.replace(',', '.')) : undefined)

    const temp = toNum(values.temperatura)
    if (temp !== undefined && (temp < 35 || temp > 42)) return setError('Temperatura fora de faixa (35–42 °C).')

    const fc = toNum(values.fc)
    if (fc !== undefined && (fc < 40 || fc > 200)) return setError('Frequência cardíaca fora de faixa (40–200 bpm).')

    const spo2 = toNum(values.spo2)
    if (spo2 !== undefined && (spo2 < 70 || spo2 > 100)) return setError('SpO₂ fora de faixa (70–100%).')

    const hgt = toNum(values.hgt)
    if (hgt !== undefined && (hgt < 40 || hgt > 500)) return setError('HGT fora de faixa (40–500 mg/dl).')

    // ✅ valida estoque SOMENTE para itens que descontam estoque
    const allItems = [...medItems, ...curItems]
    for (const [itemId, qty] of Object.entries(selectedItems)) {
      const item = allItems.find((x) => x.id === itemId)
      if (!item) continue

      const desconta = item.descontaEstoque !== false
      if (desconta && qty > item.estoqueAtual) {
        setError(`Quantidade maior que o estoque: ${item.nome} (estoque: ${item.estoqueAtual})`)
        return
      }
    }

    try {
      setSubmitting(true)

      const payload = {
        nome: values.nome,
        vinculo: values.vinculo,
        funcao: values.funcao,
        descricao: values.descricao || null,
        responsavel: values.responsavel || null,
        destino: values.destino,
        horaChegada: values.horaChegada
          ? new Date(`1970-01-01T${values.horaChegada}:00`).toISOString()
          : null,
        hgt: values.hgt ? Number(values.hgt.replace(',', '.')) : null,
        temperatura: values.temperatura ? Number(values.temperatura.replace(',', '.')) : null,
        fc: values.fc ? Number(values.fc.replace(',', '.')) : null,
        pa: values.pa || null,
        spo2: values.spo2 ? Number(values.spo2.replace(',', '.')) : null,

        classId: values.classId || null,
        motivoId: values.motivoId || null,
        comunicacaoId: values.comunicacaoId || null,

        medications: Object.entries(selectedItems).map(([itemId, quantidade]) => ({
          itemId,
          quantidade,
        })),
      }

      await api.post('/attendances', payload)
      setSuccess(true)
    } catch (err) {
      console.error(err)
      setError('Não foi possível salvar. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="form-page">
      <div className="novoat-topbar d-flex align-items-center p-2">
        <img src={color} alt="Logo EAR" className="novoat-logo me-2" />
        <Button variant="outline-secondary" size="sm" href="/dashboard">
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
                  onClick={() => {
                    setValues(defaultValues)
                    setSelectedItems({})
                    setSuccess(false)
                  }}
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
                  <Form.Select value={values.classId} onChange={handleChange('classId')}>
                    <option value="">Selecione...</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
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
                  <Form.Select value={values.motivoId} onChange={handleChange('motivoId')}>
                    <option value="">Selecione...</option>
                    {reasons.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </Form.Select>
                </Col>

                <Col md={4}>
                  <Form.Label>Responsável</Form.Label>
                  <Form.Control value={values.responsavel} onChange={handleChange('responsavel')} placeholder="Nome do responsável" />
                </Col>

                <Col md={4}>
                  <Form.Label>Comunicação</Form.Label>
                  <Form.Select value={values.comunicacaoId} onChange={handleChange('comunicacaoId')}>
                    <option value="">Selecione...</option>
                    {communications.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Form.Select>
                </Col>

                <Col xs={12}>
                  <Form.Label>Descrição</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
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
            <Card.Header className="bg-white">
              <strong>Medicamentos</strong> <span className="text-muted">(se administrados)</span>
            </Card.Header>
            <Card.Body>
              {renderItems(medItems)}
            </Card.Body>
          </Card>

          {/* Curativos */}
          <Card className="mb-4 shadow-sm border-0">
            <Card.Header className="bg-white">
              <strong>Curativos</strong> <span className="text-muted">(se utilizados)</span>
            </Card.Header>
            <Card.Body>
              {renderItems(curItems)}
              <Row className="mt-3">
                <Col md={12}>
                  <Form.Label>Outros</Form.Label>
                  <Form.Control
                    value={values.outros}
                    onChange={handleChange('outros')}
                    placeholder="Descreva materiais/medicamentos não listados"
                  />
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
            <Button
              variant="secondary"
              type="button"
              onClick={() => { setValues(defaultValues); setSelectedItems({}); }}
              disabled={submitting}
            >
              Limpar
            </Button>
            <Button variant="primary" type="submit" disabled={submitting || loadingLookups}>
              {submitting ? 'Salvando...' : (loadingLookups ? 'Carregando...' : 'Salvar atendimento')}
            </Button>
          </div>
        </Form>
      </Container>
    </div>
  )
}
