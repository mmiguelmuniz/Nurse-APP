import React, { useMemo, useState, useEffect } from 'react'
import { ClipboardCheck, AlertCircle, X, AlertTriangle } from 'lucide-react'
import Layout from '../components/layout'
import api from '../lib/api'
import '../styles/NovoAtendimento.css'

type ClassDTO         = { id: string; name: string }
type ReasonDTO        = { id: string; name: string; active?: boolean }
type CommunicationDTO = { id: string; name: string }
type ItemDTO = {
  id: string; nome: string; categoria: 'MEDICAMENTO' | 'CURATIVO'
  unidade: string; minimo: number; estoqueAtual: number
  active: boolean; descontaEstoque?: boolean
}
type FormValues = {
  nome: string; vinculo: string; horaChegada: string; funcao: string
  classId: string; motivoId: string; descricao: string; responsavel: string
  comunicacaoId: string; hgt: string; temperatura: string; fc: string
  pa: string; spo2: string; destino: string
}

const VINCULOS = [
  'Aluno(a)','Funcionário','Visitante','Parents/Relatives',
]

const FUNCOES = [
  'Funcionário','Parents/Relatives','ADM','Maint','Nurse',
  'Office','Psi','Teacher','TA','Terceirizado','TI','RH','Storage',
  'Special','Portaria/Segurança',
]

const VINCULOS_SEM_FUNCAO = ['Aluno(a)', 'Visitante', 'Parents/Relatives']
const DESTINOS = ['DISMISS','HOME','HOSPITAL','OFFICE/ Special']
const DESTINO_LABELS: Record<string, string> = {
  DISMISS: 'Liberado', HOME: 'Para casa', HOSPITAL: 'Hospital', 'OFFICE/ Special': 'Secretaria',
}

function nowTime(): string {
  const now = new Date()
  return now.toTimeString().slice(0, 5)
}

function isIncomplete(values: FormValues): boolean {
  return !values.nome.trim() || !values.funcao || !values.motivoId || !values.destino
}


// ─── TimeInput component ───
function TimeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  // Generate times every 5 minutes from 07:30 to 21:00
  const times: string[] = []
  for (let h = 7; h <= 21; h++) {
    const startMin = h === 7 ? 30 : 0
    const endMin   = h === 21 ? 0  : 55
    for (let m = startMin; m <= endMin; m += 5) {
      times.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
    }
  }

  // Close on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Scroll to current time when opens
  React.useEffect(() => {
    if (open && ref.current) {
      const active = ref.current.querySelector('.na-time-option--active')
      active?.scrollIntoView({ block: 'center' })
    }
  }, [open])

  const display = (t: string) => {
    if (!t) return '--:--'
    return t
  }

  return (
    <div className="na-time-wrapper" ref={ref}>
      <button type="button" className="na-time-trigger" onClick={() => setOpen(v => !v)}>
        <span>&#128336; {display(value)}</span>
        <span className="na-time-caret">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="na-time-dropdown">
          {times.map(t => (
            <button
              key={t}
              type="button"
              className={`na-time-option ${value === t ? 'na-time-option--active' : ''}`}
              onClick={() => { onChange(t); setOpen(false) }}
            >
              {display(t)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function NovoAtendimento() {
  const [values, setValues] = useState<FormValues>(() => ({
    nome: '', vinculo: '', horaChegada: nowTime(), funcao: '', classId: '',
    motivoId: '', descricao: '', responsavel: '', comunicacaoId: '',
    hgt: '', temperatura: '', fc: '', pa: '', spo2: '', destino: '',
  }))
  const [submitting, setSubmitting]     = useState(false)
  const [loadingLookups, setLoadingLookups] = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [success, setSuccess]           = useState(false)
  const [savedIncomplete, setSavedIncomplete] = useState(false)

  const [classes, setClasses]             = useState<ClassDTO[]>([])
  const [reasons, setReasons]             = useState<ReasonDTO[]>([])
  const [communications, setCommunications] = useState<CommunicationDTO[]>([])
  const [medItems, setMedItems]           = useState<ItemDTO[]>([])
  const [curItems, setCurItems]           = useState<ItemDTO[]>([])
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({})

  useEffect(() => {
    let canceled = false
    ;(async () => {
      try {
        setLoadingLookups(true)
        const [cls, rea, com, med, cur] = await Promise.all([
          api.get<ClassDTO[]>('/classes'),
          api.get<ReasonDTO[]>('/reasons'),
          api.get<CommunicationDTO[]>('/communications'),
          api.get<ItemDTO[]>('/items', { params: { categoria: 'MEDICAMENTO', ativos: 'true' } }),
          api.get<ItemDTO[]>('/items', { params: { categoria: 'CURATIVO', ativos: 'true' } }),
        ])
        if (canceled) return
        setClasses((cls.data ?? []).sort((a, b) => a.name.localeCompare(b.name)))
        setReasons((rea.data ?? []).filter((r: any) => r.active !== false).sort((a, b) => a.name.localeCompare(b.name)))
        setCommunications((com.data ?? []).sort((a, b) => a.name.localeCompare(b.name)))
        setMedItems((med.data ?? []).sort((a, b) => a.nome.localeCompare(b.nome)))
        setCurItems((cur.data ?? []).sort((a, b) => a.nome.localeCompare(b.nome)))
      } catch {
        setError('Não foi possível carregar dados do formulário.')
      } finally {
        if (!canceled) setLoadingLookups(false)
      }
    })()
    return () => { canceled = true }
  }, [])

  const incomplete = useMemo(() => isIncomplete(values), [values])

  const set = (field: keyof FormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const value = e.target.value
      if (field === 'vinculo') {
        const isAluno = VINCULOS_SEM_FUNCAO.some(v => value.toLowerCase().includes(v.toLowerCase()))
        setValues(p => ({ ...p, [field]: value, funcao: isAluno ? 'Aluno' : p.funcao }))
      } else {
        setValues(p => ({ ...p, [field]: value }))
      }
      setError(null)
    }

  const isAluno = VINCULOS_SEM_FUNCAO.some(v => values.vinculo.toLowerCase().includes(v.toLowerCase()))

  const toggleItem = (id: string, checked: boolean) =>
    setSelectedItems(p => { const n = { ...p }; if (!checked) delete n[id]; else n[id] = n[id] ?? 1; return n })

  const setQty = (id: string, qty: number) =>
    setSelectedItems(p => ({ ...p, [id]: Math.max(1, Math.floor(qty)) }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const allItems = [...medItems, ...curItems]
    for (const [itemId, qty] of Object.entries(selectedItems)) {
      const item = allItems.find(x => x.id === itemId)
      if (item?.descontaEstoque !== false && item && qty > item.estoqueAtual)
        return setError(`Estoque insuficiente: ${item.nome} (disponível: ${item.estoqueAtual} ${item.unidade})`)
    }
    const toNum = (s?: string) => s?.trim() ? Number(s.replace(',', '.')) : undefined
    const temp = toNum(values.temperatura)
    const fc   = toNum(values.fc)
    const spo2 = toNum(values.spo2)
    const hgt  = toNum(values.hgt)
    if (temp !== undefined && (temp < 35 || temp > 42)) return setError('Temperatura fora de faixa (35–42 °C).')
    if (fc   !== undefined && (fc < 40 || fc > 200))    return setError('FC fora de faixa (40–200 bpm).')
    if (spo2 !== undefined && (spo2 < 70 || spo2 > 100)) return setError('SpO₂ fora de faixa (70–100%).')
    if (hgt  !== undefined && (hgt < 40 || hgt > 500))   return setError('HGT fora de faixa (40–500 mg/dl).')

    try {
      setSubmitting(true)
      await api.post('/attendances', {
        nome: values.nome || null,
        vinculo: values.vinculo || null,
        funcao: values.funcao || null,
        descricao: values.descricao || null,
        responsavel: values.responsavel || null,
        destino: values.destino || null,
        horaChegada: values.horaChegada
          ? new Date(`1970-01-01T${values.horaChegada}:00`).toISOString()
          : null,
        hgt: hgt ?? null, temperatura: temp ?? null,
        fc: fc ?? null, pa: values.pa || null, spo2: spo2 ?? null,
        classId: values.classId || null,
        motivoId: values.motivoId || null,
        comunicacaoId: values.comunicacaoId || null,
        medications: Object.entries(selectedItems).map(([itemId, quantidade]) => ({ itemId, quantidade })),
      })
      setSavedIncomplete(incomplete)
      setSuccess(true)
    } catch {
      setError('Não foi possível salvar. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const reset = () => {
    setValues({ nome: '', vinculo: '', horaChegada: nowTime(), funcao: '', classId: '',
      motivoId: '', descricao: '', responsavel: '', comunicacaoId: '',
      hgt: '', temperatura: '', fc: '', pa: '', spo2: '', destino: '' })
    setSelectedItems({})
    setSuccess(false)
    setSavedIncomplete(false)
    setError(null)
  }

  const renderItems = (items: ItemDTO[]) => (
    <div className="na-items-grid">
      {items.map(it => {
        const checked  = selectedItems[it.id] != null
        const desconta = it.descontaEstoque !== false
        const disabled = desconta && it.estoqueAtual <= 0 && !checked
        return (
          <label key={it.id}
            className={`na-item-check ${checked ? 'na-item-check--active' : ''} ${disabled ? 'na-item-check--disabled' : ''}`}>
            <input type="checkbox" checked={checked} disabled={disabled}
              onChange={e => toggleItem(it.id, e.target.checked)} style={{ display: 'none' }} />
            <div className="na-item-check-box">{checked && '✓'}</div>
            <div className="na-item-info">
              <span className="na-item-nome">{it.nome}</span>
              <span className="na-item-stock">
                {desconta ? `${it.estoqueAtual} ${it.unidade} disponíveis` : 'Sem controle de estoque'}
              </span>
            </div>
            {checked && (
              <input type="number" min={1}
                max={desconta ? it.estoqueAtual || 1 : undefined}
                value={selectedItems[it.id]}
                onClick={e => e.stopPropagation()}
                onChange={e => setQty(it.id, Number(e.target.value))}
                className="na-item-qty" />
            )}
          </label>
        )
      })}
    </div>
  )

  return (
    <Layout title="Novo Atendimento" subtitle="Registrar visita à enfermaria">
      <div className="na-root">
        {/* Alerta campos incompletos */}
        {incomplete && (
          <div className="na-alert na-alert--warn">
            <AlertTriangle size={15} />
            <span>Campos importantes em branco (nome, função, motivo ou destino). O atendimento será salvo como <strong>incompleto</strong>.</span>
          </div>
        )}

        {error && (
          <div className="na-alert na-alert--error">
            <AlertCircle size={16} />
            <span>{error}</span>
            <button onClick={() => setError(null)}><X size={14} /></button>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="na-success-overlay">
            <div className="na-success-card">
              <div className={`na-success-icon ${savedIncomplete ? 'na-success-icon--warn' : ''}`}>
                {savedIncomplete ? '⚠' : '✓'}
              </div>
              <h3>{savedIncomplete ? 'Atendimento salvo (incompleto)' : 'Atendimento salvo!'}</h3>
              <p>{savedIncomplete
                ? 'Atendimento registrado com campos em branco. Você pode editá-lo no Histórico.'
                : 'Registrado com sucesso.'}</p>
              <div className="na-success-actions">
                <button className="btn-brand" onClick={reset}>Novo atendimento</button>
                <a className="btn-ghost" href="/">Voltar ao início</a>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="na-form">
          {/* Identificação */}
          <section className="na-section">
            <div className="na-section-header">
              <h2 className="na-section-title">Identificação</h2>
              <span className="na-optional">todos os campos são opcionais</span>
            </div>
            <div className="na-grid na-grid--3">
              <div className="na-field na-col-2">
                <label className="na-label">Nome completo</label>
                <input className="na-input" value={values.nome} onChange={set('nome')} placeholder="Nome do paciente" />
              </div>
              <div className="na-field">
                <label className="na-label">Hora da chegada</label>
                <TimeInput value={values.horaChegada} onChange={v => setValues(p => ({ ...p, horaChegada: v }))} />
              </div>
              <div className="na-field">
                <label className="na-label">Vínculo</label>
                <select className="na-select" value={values.vinculo} onChange={set('vinculo')}>
                  <option value="">Selecione...</option>
                  {VINCULOS.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              {!isAluno && (
                <div className="na-field">
                  <label className="na-label">Função</label>
                  <select className="na-select" value={values.funcao} onChange={set('funcao')}>
                    <option value="">Selecione...</option>
                    {FUNCOES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              )}
              <div className="na-field">
                <label className="na-label">Turma</label>
                <select className="na-select" value={values.classId} onChange={set('classId')}>
                  <option value="">Selecione...</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </section>

          {/* Atendimento */}
          <section className="na-section">
            <div className="na-section-header">
              <h2 className="na-section-title">Atendimento</h2>
            </div>
            <div className="na-grid na-grid--3">
              <div className="na-field">
                <label className="na-label">Motivo</label>
                <select className="na-select" value={values.motivoId} onChange={set('motivoId')}>
                  <option value="">Selecione...</option>
                  {reasons.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div className="na-field">
                <label className="na-label">Responsável</label>
                <input className="na-input" value={values.responsavel} onChange={set('responsavel')} placeholder="Nome do responsável" />
              </div>
              <div className="na-field">
                <label className="na-label">Comunicação</label>
                <select className="na-select" value={values.comunicacaoId} onChange={set('comunicacaoId')}>
                  <option value="">Selecione...</option>
                  {communications.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="na-field na-col-3">
                <label className="na-label">Conduta / Observações</label>
                <textarea className="na-textarea" rows={3} value={values.descricao} onChange={set('descricao')}
                  placeholder="Sinais, queixas, conduta adotada..." />
              </div>
            </div>
          </section>

          {/* Sinais vitais */}
          <section className="na-section">
            <div className="na-section-header">
              <h2 className="na-section-title">Sinais vitais</h2>
            </div>
            <div className="na-grid na-grid--5">
              {([
                { label: 'HGT (mg/dl)',    field: 'hgt',         placeholder: '40–500' },
                { label: 'Temperatura °C', field: 'temperatura', placeholder: '35–42' },
                { label: 'FC (bpm)',        field: 'fc',          placeholder: '40–200' },
                { label: 'PA (mmHg)',       field: 'pa',          placeholder: '120/80' },
                { label: 'SpO₂ (%)',        field: 'spo2',        placeholder: '70–100' },
              ] as { label: string; field: keyof FormValues; placeholder: string }[]).map(({ label, field, placeholder }) => (
                <div className="na-field" key={field}>
                  <label className="na-label">{label}</label>
                  <input className="na-input" value={values[field] as string}
                    onChange={set(field)} placeholder={placeholder} inputMode="decimal" />
                </div>
              ))}
            </div>
          </section>

          {/* Medicamentos */}
          <section className="na-section">
            <div className="na-section-header">
              <h2 className="na-section-title">Medicamentos</h2>
              <span className="na-section-sub">Se administrados</span>
            </div>
            {loadingLookups
              ? <div className="skeleton" style={{ height: 60, borderRadius: 10 }} />
              : medItems.length === 0
                ? <p className="na-empty">Nenhum medicamento cadastrado.</p>
                : renderItems(medItems)}
          </section>

          {/* Curativos */}
          <section className="na-section">
            <div className="na-section-header">
              <h2 className="na-section-title">Curativos e Materiais</h2>
              <span className="na-section-sub">Se utilizados</span>
            </div>
            {loadingLookups
              ? <div className="skeleton" style={{ height: 60, borderRadius: 10 }} />
              : curItems.length === 0
                ? <p className="na-empty">Nenhum curativo cadastrado.</p>
                : renderItems(curItems)}
          </section>

          {/* Encaminhamento */}
          <section className="na-section">
            <div className="na-section-header">
              <h2 className="na-section-title">Encaminhamento / Destino</h2>
            </div>
            <div className="na-destino-grid">
              {DESTINOS.map(d => (
                <label key={d} className={`na-destino-opt ${values.destino === d ? 'na-destino-opt--active' : ''}`}>
                  <input type="radio" name="destino" value={d}
                    checked={values.destino === d} onChange={set('destino')} style={{ display: 'none' }} />
                  <span className="na-destino-label">{DESTINO_LABELS[d]}</span>
                  <span className="na-destino-val">{d}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Actions */}
          <div className="na-form-actions">
            <button type="button" className="btn-ghost" onClick={reset} disabled={submitting}>
              Limpar formulário
            </button>
            <button type="submit" className="btn-brand" disabled={submitting || loadingLookups}>
              <ClipboardCheck size={16} />
              {submitting ? 'Salvando...' : 'Salvar atendimento'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}