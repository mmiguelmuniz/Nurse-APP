import React, { useEffect, useMemo, useState } from 'react'
import {
  Search, Download, Info, Printer, X, Filter,
  ChevronLeft, ChevronRight, AlertTriangle, Edit2, Check
} from 'lucide-react'
import Layout from '../components/layout'
import api from '../lib/api'
import '../styles/Historico.css'

type ClassDTO  = { id: string; name: string }
type ReasonDTO = { id: string; name: string; active?: boolean }
type UsedItem  = {
  id: string; quantidade: number
  item: { id: string; nome: string; categoria: 'MEDICAMENTO' | 'CURATIVO'; unidade?: string | null }
}
type Registro = {
  id: string; dataISO: string; hora: string; nome: string; vinculo: string
  funcao: string; turma: string; motivo: string; destino: string
  comunicacao?: string; observacao?: string; atendente?: string
  temperatura?: number | null; pa?: string | null
  horaChegadaISO?: string | null
  usedItems?: UsedItem[]
  incompleto?: boolean
  classId?: string; motivoId?: string; comunicacaoId?: string
}

function toHoraBR(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function mapAttendance(a: any): Registro {
  const usedItems: UsedItem[] = Array.isArray(a.medications)
    ? a.medications.map((m: any) => {
        const cat = m?.item?.categoria as 'MEDICAMENTO' | 'CURATIVO' | undefined
        if (cat !== 'MEDICAMENTO' && cat !== 'CURATIVO') return null
        return { id: m?.id, quantidade: Number(m?.quantidade ?? 0),
          item: { id: m?.item?.id, nome: m?.item?.nome ?? '—', categoria: cat, unidade: m?.item?.unidade ?? null } }
      }).filter(Boolean)
    : []
  const dataISO = a.createdAt ?? new Date().toISOString()
  const horaChegadaISO = a.horaChegada ?? null
  const horaDisplay = horaChegadaISO ? toHoraBR(horaChegadaISO) : toHoraBR(dataISO)
  const incompleto = !a.nome || !a.funcao || !a.motivoId || !a.destino
  return {
    id: a.id, dataISO, hora: horaDisplay, horaChegadaISO,
    nome: a.nome ?? '—', vinculo: a.vinculo ?? '—', funcao: a.funcao ?? '—',
    turma: a.class?.name ?? '—', motivo: a.motivo?.name ?? '—',
    destino: a.destino ?? '—', comunicacao: a.comunicacao?.name ?? undefined,
    observacao: a.descricao ?? undefined, atendente: a.user?.name ?? a.user?.email ?? '—',
    temperatura: a.temperatura ?? null, pa: a.pa ?? null,
    usedItems, incompleto,
    classId: a.classId ?? '', motivoId: a.motivoId ?? '', comunicacaoId: a.comunicacaoId ?? '',
  }
}

function destinoChip(d: string) {
  const u = d?.toUpperCase() ?? ''
  if (u === 'HOSPITAL') return { cls: 'chip-danger',  label: 'Hospital' }
  if (u === 'HOME')     return { cls: 'chip-info',    label: 'Casa' }
  if (u === 'DISMISS')  return { cls: 'chip-warning', label: 'Liberado' }
  if (u.startsWith('OFFICE')) return { cls: 'chip-gray', label: 'Office' }
  return { cls: 'chip-gray', label: d || '—' }
}

const FUNCOES = ['Todos','Aluno','Funcionário','Teacher','TA','ADM','Maint','Nurse','Office','Psi','TI','RH','Storage','Special','Portaria/Segurança']
const DESTINOS = ['DISMISS','HOME','HOSPITAL','OFFICE/ Special']
const DESTINO_LABELS: Record<string, string> = {
  DISMISS: 'Liberado', HOME: 'Para casa', HOSPITAL: 'Hospital', 'OFFICE/ Special': 'Secretaria',
}

// ─── TimeDropdown component ───
function TimeDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  const times: string[] = []
  for (let h = 7; h <= 21; h++) {
    const startMin = h === 7 ? 30 : 0
    const endMin   = h === 21 ? 0 : 55
    for (let m = startMin; m <= endMin; m += 5) {
      times.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
    }
  }

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

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
            <button key={t} type="button"
              className={`na-time-option ${value === t ? 'na-time-option--active' : ''}`}
              onClick={() => { onChange(t); setOpen(false) }}>
              {display(t)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Modal de edição ───
function EditModal({ registro, classes, reasons, onClose, onSaved }: {
  registro: Registro
  classes: ClassDTO[]
  reasons: ReasonDTO[]
  onClose: () => void
  onSaved: () => void
}) {
  const [nome,     setNome]     = useState(registro.nome === '—' ? '' : registro.nome)
  const [funcao,   setFuncao]   = useState(registro.funcao === '—' ? '' : registro.funcao)
  const [classId,  setClassId]  = useState(registro.classId ?? '')
  const [motivoId, setMotivoId] = useState(registro.motivoId ?? '')
  const [destino,  setDestino]  = useState(registro.destino)
  const [descricao,setDescricao]= useState(registro.observacao ?? '')
  const [temperatura, setTemperatura] = useState(String(registro.temperatura ?? ''))
  const [pa, setPa]             = useState(registro.pa ?? '')
  const [horaChegada, setHoraChegada] = useState(() => {
    try {
      const iso = registro.horaChegadaISO ?? registro.dataISO
      return new Date(iso).toTimeString().slice(0,5)
    } catch { return '' }
  })
  const [medItems, setMedItems]   = useState<any[]>([])
  const [curItems, setCurItems]   = useState<any[]>([])
  const [selectedMeds, setSelectedMeds] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    registro.usedItems?.forEach(m => { init[m.item.id] = m.quantidade })
    return init
  })
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const FUNCOES_EDIT = ['Aluno','Funcionário','Parents/Relatives','ADM','Maint','Nurse','Office','Psi','Teacher','TA','Terceirizado','TI','RH','Storage','Special','Portaria/Segurança']

  useEffect(() => {
    Promise.all([
      api.get('/items', { params: { categoria: 'MEDICAMENTO', ativos: 'true' } }),
      api.get('/items', { params: { categoria: 'CURATIVO', ativos: 'true' } }),
    ]).then(([m, c]) => {
      const meds = Array.isArray(m.data) ? m.data : (m.data?.items ?? [])
      const curs = Array.isArray(c.data) ? c.data : (c.data?.items ?? [])
      setMedItems(meds.sort((a: any, b: any) => a.nome.localeCompare(b.nome)))
      setCurItems(curs.sort((a: any, b: any) => a.nome.localeCompare(b.nome)))
    }).catch(() => {})
  }, [])

  const toggleMed = (id: string, checked: boolean) =>
    setSelectedMeds(p => { const n = { ...p }; if (!checked) delete n[id]; else n[id] = n[id] ?? 1; return n })

  const setMedQty = (id: string, qty: number) =>
    setSelectedMeds(p => ({ ...p, [id]: Math.max(1, Math.floor(qty)) }))

  const handleSave = async () => {
    try {
      setLoading(true)
      const horaChegadaISO = (() => {
        if (!horaChegada) return null
        const base = new Date(registro.horaChegadaISO ?? registro.dataISO)
        const [h, m] = horaChegada.split(':').map(Number)
        base.setHours(h, m, 0, 0)
        return base.toISOString()
      })()

      await api.patch(`/attendances/${registro.id}`, {
        nome: nome || null, funcao: funcao || null,
        classId: classId || null, motivoId: motivoId || null,
        destino: destino || null, descricao: descricao || null,
        temperatura: temperatura ? Number(temperatura) : null,
        pa: pa || null,
        horaChegada: horaChegadaISO,
      })
      onSaved()
      onClose()
    } catch {
      setError('Erro ao salvar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="hist-modal-overlay" onClick={onClose}>
      <div className="hist-modal" onClick={e => e.stopPropagation()}>
        <div className="hist-modal-header">
          <div>
            <h3 className="hist-modal-title">Editar atendimento</h3>
            <p className="hist-modal-sub">{new Date(registro.dataISO).toLocaleString('pt-BR')}</p>
          </div>
          <button className="est-modal-close" onClick={onClose}><X size={18}/></button>
        </div>
        <div className="hist-modal-body">
          {error && <div className="hist-edit-error">{error}</div>}
          <div className="hist-edit-grid">
            <div className="na-field">
              <label className="na-label">Nome</label>
              <input className="na-input" value={nome} onChange={e => setNome(e.target.value)} />
            </div>
            <div className="na-field">
              <label className="na-label">Função</label>
              <select className="na-select" value={funcao} onChange={e => setFuncao(e.target.value)}>
                <option value="">Selecione...</option>
                {FUNCOES_EDIT.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="na-field">
              <label className="na-label">Turma</label>
              <select className="na-select" value={classId} onChange={e => setClassId(e.target.value)}>
                <option value="">Selecione...</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="na-field">
              <label className="na-label">Motivo</label>
              <select className="na-select" value={motivoId} onChange={e => setMotivoId(e.target.value)}>
                <option value="">Selecione...</option>
                {reasons.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="na-field">
              <label className="na-label">Temperatura °C</label>
              <input className="na-input" value={temperatura} onChange={e => setTemperatura(e.target.value)} placeholder="Ex.: 37.5" inputMode="decimal" />
            </div>
            <div className="na-field">
              <label className="na-label">PA (mmHg)</label>
              <input className="na-input" value={pa} onChange={e => setPa(e.target.value)} placeholder="Ex.: 120/80" />
            </div>
            <div className="na-field">
              <label className="na-label">Hora da chegada</label>
<TimeDropdown value={horaChegada} onChange={setHoraChegada} />
            </div>
            <div className="na-field hist-edit-full">
              <label className="na-label">Destino</label>
              <div className="hist-edit-destinos">
                {DESTINOS.map(d => (
                  <label key={d} className={`na-destino-opt na-destino-opt--sm ${destino === d ? 'na-destino-opt--active' : ''}`}>
                    <input type="radio" name="edit-destino" value={d} checked={destino === d} onChange={() => setDestino(d)} style={{ display: 'none' }} />
                    <span className="na-destino-label">{DESTINO_LABELS[d]}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="na-field hist-edit-full">
              <label className="na-label">Conduta / Observações</label>
              <textarea className="na-textarea" rows={3} value={descricao} onChange={e => setDescricao(e.target.value)} />
            </div>

            {/* Medicamentos e curativos */}
            {[{ label: 'Medicamentos', items: medItems }, { label: 'Curativos', items: curItems }].map(({ label, items }) => (
              <div key={label} className="na-field hist-edit-full">
                <label className="na-label">{label}</label>
                <div className="hist-edit-items">
                  {items.map((it: any) => {
                    const checked = selectedMeds[it.id] != null
                    return (
                      <label key={it.id} className={`hist-edit-item-check ${checked ? 'hist-edit-item-check--active' : ''}`}>
                        <input type="checkbox" checked={checked}
                          onChange={e => toggleMed(it.id, e.target.checked)}
                          style={{ display: 'none' }} />
                        <span className="hist-edit-check-box">{checked && '✓'}</span>
                        <span className="hist-edit-item-nome">{it.nome}</span>
                        {checked && (
                          <input type="number" min={1} value={selectedMeds[it.id]}
                            onClick={e => e.stopPropagation()}
                            onChange={e => setMedQty(it.id, Number(e.target.value))}
                            className="hist-edit-item-qty" />
                        )}
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="hist-modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-brand" onClick={handleSave} disabled={loading}>
            <Check size={14} /> {loading ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Historico() {
  const [classes, setClasses]   = useState<ClassDTO[]>([])
  const [reasons, setReasons]   = useState<ReasonDTO[]>([])
  const [q, setQ]               = useState('')
  const [funcao, setFuncao]     = useState('Todos')
  const [classId, setClassId]   = useState('')
  const [motivoId, setMotivoId] = useState('')
  const [soEmerg, setSoEmerg]   = useState(false)
  const [dtIni, setDtIni]       = useState('')
  const [dtFim, setDtFim]       = useState('')
  const [page, setPage]         = useState(1)
  const PAGE_SIZE               = 20
  const [total, setTotal]       = useState<number | null>(null)
  const [registros, setRegistros] = useState<Registro[]>([])
  const [loading, setLoading]   = useState(false)
  const [detalhe, setDetalhe]   = useState<Registro | null>(null)
  const [editando, setEditando] = useState<Registro | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const loadData = async (pg = page) => {
    let canceled = false
    setLoading(true)
    try {
      const params: any = { page: pg, pageSize: PAGE_SIZE }
      if (q.trim())           params.busca = q.trim()
      if (funcao !== 'Todos') params.funcao = funcao
      if (classId)            params.turma = classId
      if (motivoId)           params.motivo = motivoId
      if (soEmerg)            params.emergencia = true
      if (dtIni)              params.start = dtIni
      if (dtFim)              params.end = dtFim
      const { data } = await api.get('/attendances', { params })
      const items = Array.isArray(data) ? data : (data.items ?? [])
      const tot   = Array.isArray(data) ? null : (data.total ?? null)
      if (!canceled) { setRegistros(items.map(mapAttendance)); setTotal(tot) }
    } catch {
      if (!canceled) { setRegistros([]); setTotal(null) }
    } finally {
      if (!canceled) setLoading(false)
    }
    return () => { canceled = true }
  }

  useEffect(() => { loadData() }, [q, funcao, classId, motivoId, soEmerg, dtIni, dtFim, page])
  useEffect(() => { setPage(1) }, [q, funcao, classId, motivoId, soEmerg, dtIni, dtFim])

  useEffect(() => {
    let canceled = false
    ;(async () => {
      try {
        const [cls, rea] = await Promise.all([api.get<ClassDTO[]>('/classes'), api.get<ReasonDTO[]>('/reasons')])
        if (!canceled) {
          setClasses((cls.data ?? []).sort((a,b) => a.name.localeCompare(b.name)))
          setReasons((rea.data ?? []).filter((r:any) => r.active !== false).sort((a,b) => a.name.localeCompare(b.name)))
        }
      } catch {}
    })()
    return () => { canceled = true }
  }, [])

  const lista = useMemo(
    () => [...registros].sort((a,b) => +new Date(b.dataISO) - +new Date(a.dataISO)),
    [registros]
  )

  const hasFilters = q || funcao !== 'Todos' || classId || motivoId || soEmerg || dtIni || dtFim

  const clearFilters = () => {
    setQ(''); setFuncao('Todos'); setClassId(''); setMotivoId('')
    setSoEmerg(false); setDtIni(''); setDtFim(''); setPage(1)
  }

  const exportCSV = () => {
    const headers = ['Atendente','Data','Hora','Nome','Vínculo','Função','Turma','Motivo','T°C','PA','Conduta','Destino']
    const rows = lista.map(r => [
      r.atendente||'', new Date(r.dataISO).toLocaleDateString('pt-BR'), r.hora,
      r.nome, r.vinculo, r.funcao, r.turma, r.motivo,
      r.temperatura ?? '', r.pa ?? '', r.observacao||'', r.destino
    ])
    const enc = (s: any) => { const v = String(s??''); return /[\",;\n]/.test(v) ? `"${v.replace(/"/g,'""')}"` : v }
    const csv = [headers,...rows].map(c => c.map(enc).join(';')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    a.download = `historico_${new Date().toISOString().slice(0,10)}.csv`
    document.body.appendChild(a); a.click(); a.remove()
  }

  const imprimir = (r: Registro) => {
    const w = window.open('', '_blank', 'width=800,height=900')
    if (!w) return
    const meds = (r.usedItems??[]).filter(i => i.item.categoria === 'MEDICAMENTO')
    const curs = (r.usedItems??[]).filter(i => i.item.categoria === 'CURATIVO')
    w.document.write(`<html><head><meta charset="utf-8"/><title>${r.nome}</title>
    <style>body{font-family:system-ui;margin:24px;color:#0f172a}h1{font-size:18px}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;margin:12px 0}
    .label{font-weight:700;color:#334155}.card{border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin-bottom:12px}
    </style></head><body>
    <h1>Atendimento — ${r.nome}</h1>
    <div class="card"><div class="grid">
    <div><span class="label">Atendente:</span> ${r.atendente||'—'}</div>
    <div><span class="label">Data/Hora:</span> ${new Date(r.dataISO).toLocaleString('pt-BR')}</div>
    <div><span class="label">Função:</span> ${r.funcao}</div>
    <div><span class="label">Turma:</span> ${r.turma||'—'}</div>
    <div><span class="label">Motivo:</span> ${r.motivo}</div>
    <div><span class="label">Destino:</span> ${r.destino}</div>
    <div><span class="label">T°C:</span> ${r.temperatura??'—'}</div>
    <div><span class="label">PA:</span> ${r.pa||'—'}</div>
    </div></div>
    ${r.observacao ? `<div class="card"><span class="label">Conduta:</span> ${r.observacao}</div>` : ''}
    <div class="card"><span class="label">Medicamentos:</span>
    ${meds.length ? `<ul>${meds.map(m=>`<li>${m.item.nome} — ${m.quantidade} ${m.item.unidade||''}</li>`).join('')}</ul>` : '<p>Nenhum.</p>'}
    <span class="label">Curativos:</span>
    ${curs.length ? `<ul>${curs.map(c=>`<li>${c.item.nome} — ${c.quantidade} ${c.item.unidade||''}</li>`).join('')}</ul>` : '<p>Nenhum.</p>'}
    </div>
    <script>window.onload=()=>setTimeout(()=>window.print(),50)</script>
    </body></html>`)
    w.document.close()
  }

  const totalPages = total ? Math.ceil(total / PAGE_SIZE) : null

  return (
    <Layout title="Histórico" subtitle="Registros de atendimentos">
      {/* Toolbar */}
      <div className="hist-toolbar">
        <div className="hist-toolbar-left">
          <div className="hist-search">
            <Search size={15} className="hist-search-icon" />
            <input type="text" placeholder="Buscar por nome..."
              value={q} onChange={e => setQ(e.target.value)} className="hist-search-input" />
            {q && <button className="hist-search-clear" onClick={() => setQ('')}><X size={13}/></button>}
          </div>
          <button className={`btn-ghost hist-filter-btn ${showFilters ? 'hist-filter-btn--active' : ''}`}
            onClick={() => setShowFilters(v => !v)}>
            <Filter size={14} /> Filtros
            {hasFilters && <span className="hist-filter-dot" />}
          </button>
          {hasFilters && <button className="btn-ghost" onClick={clearFilters}><X size={13} /> Limpar</button>}
        </div>
        <div className="hist-toolbar-right">
          <button className="btn-ghost" onClick={exportCSV} disabled={loading || lista.length === 0}>
            <Download size={14} /> Exportar CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="hist-filters">
          <div className="hist-filter-row">
            <div className="hist-filter-field">
              <label>Função</label>
              <select value={funcao} onChange={e => setFuncao(e.target.value)} className="hist-select">
                {FUNCOES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="hist-filter-field">
              <label>Turma</label>
              <select value={classId} onChange={e => setClassId(e.target.value)} className="hist-select">
                <option value="">Todas</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="hist-filter-field">
              <label>Motivo</label>
              <select value={motivoId} onChange={e => setMotivoId(e.target.value)} className="hist-select">
                <option value="">Todos</option>
                {reasons.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="hist-filter-field">
              <label>De</label>
              <input type="date" value={dtIni} onChange={e => setDtIni(e.target.value)} className="hist-input" />
            </div>
            <div className="hist-filter-field">
              <label>Até</label>
              <input type="date" value={dtFim} onChange={e => setDtFim(e.target.value)} className="hist-input" />
            </div>
            <label className="hist-emerg-toggle">
              <input type="checkbox" checked={soEmerg} onChange={e => setSoEmerg(e.target.checked)} />
              <span>Só emergências</span>
            </label>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="hist-card">
        <div className="hist-table-wrap">
          <table className="hist-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Turma / Função</th>
                <th>Motivo</th>
                <th>T°C / PA</th>
                <th>Medicamentos</th>
                <th>Destino</th>
                <th>Data</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_,i) => (
                  <tr key={i}>{[...Array(8)].map((_,j) => (
                    <td key={j}><div className="skeleton" style={{ height: 14, borderRadius: 4 }} /></td>
                  ))}</tr>
                ))
              ) : lista.length === 0 ? (
                <tr><td colSpan={8} className="hist-empty">Nenhum registro encontrado.</td></tr>
              ) : lista.map(r => {
                const chip = destinoChip(r.destino)
                return (
                  <tr key={r.id} className={r.incompleto ? 'hist-row--incomplete' : ''}>
                    <td>
                      <div className="hist-nome-cell">
                        {r.incompleto && (
                          <span title="Atendimento incompleto" className="hist-incomplete-icon">
                            <AlertTriangle size={12} />
                          </span>
                        )}
                        <span className="hist-nome">{r.nome}</span>
                      </div>
                    </td>
                    <td>
                      <div className="hist-turma-cell">
                        <span className="hist-turma">{r.turma !== '—' ? r.turma : r.funcao}</span>
                        {r.turma !== '—' && <span className="hist-funcao-small">{r.funcao}</span>}
                      </div>
                    </td>
                    <td>{r.motivo}</td>
                    <td>
                      <span style={{ fontSize: '0.82rem', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                        {r.temperatura && r.pa ? `${r.temperatura}°C / ${r.pa}` : r.temperatura ? `${r.temperatura}°C` : r.pa ? r.pa : '—'}
                      </span>
                    </td>
                    <td className="hist-meds">
                      {(() => {
                        const meds = (r.usedItems ?? []).filter(i => i.item.categoria === 'MEDICAMENTO')
                        const curs = (r.usedItems ?? []).filter(i => i.item.categoria === 'CURATIVO')
                        if (meds.length === 0 && curs.length === 0) return <span className="hist-empty-cell">—</span>
                        const group = (items: typeof meds) => {
                          const g: Record<string, number> = {}
                          items.forEach(m => { g[m.item.nome] = (g[m.item.nome] || 0) + m.quantidade })
                          return g
                        }
                        return (
                          <div className="hist-meds-list">
                            {Object.entries(group(meds)).map(([nome, qty]) => (
                              <span key={nome} className="hist-med-pill hist-med-pill--med">
                                {nome}{qty > 1 ? ` (${qty}x)` : ''}
                              </span>
                            ))}
                            {Object.entries(group(curs)).map(([nome, qty]) => (
                              <span key={nome} className="hist-med-pill hist-med-pill--cur">
                                {nome}{qty > 1 ? ` (${qty}x)` : ''}
                              </span>
                            ))}
                          </div>
                        )
                      })()}
                    </td>
                    <td><span className={chip.cls}>{chip.label}</span></td>
                    <td className="hist-data">
                      <div>{new Date(r.dataISO).toLocaleDateString('pt-BR')}</div>
                      <div className="hist-hora">{r.hora}</div>
                    </td>
                    <td>
                      <div className="hist-actions">
                        <button className="hist-btn hist-btn--detail" onClick={() => setDetalhe(r)}>
                          <Info size={13} /> Ver
                        </button>
                        <button className="hist-btn hist-btn--edit" onClick={() => setEditando(r)}>
                          <Edit2 size={13} />
                        </button>
                        <button className="hist-btn hist-btn--print" onClick={() => imprimir(r)}>
                          <Printer size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="hist-pagination">
          <span className="hist-pagination-info">
            {loading ? 'Carregando...' : total != null
              ? `${lista.length} de ${total} registros — pág. ${page}${totalPages ? ` de ${totalPages}` : ''}`
              : `${lista.length} registros`}
          </span>
          <div className="hist-pagination-btns">
            <button className="btn-ghost" onClick={() => setPage(p => Math.max(1, p-1))} disabled={loading || page === 1}>
              <ChevronLeft size={15} /> Anterior
            </button>
            <button className="btn-ghost"
              onClick={() => setPage(p => p+1)}
              disabled={loading || (total != null && page * PAGE_SIZE >= total)}>
              Próximo <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Detail modal */}
      {detalhe && (
        <div className="hist-modal-overlay" onClick={() => setDetalhe(null)}>
          <div className="hist-modal" onClick={e => e.stopPropagation()}>
            <div className="hist-modal-header">
              <div>
                <h3 className="hist-modal-title">
                  {detalhe.incompleto && <AlertTriangle size={15} style={{ color: '#d97706', marginRight: 6 }} />}
                  {detalhe.nome}
                </h3>
                <p className="hist-modal-sub">{new Date(detalhe.dataISO).toLocaleString('pt-BR')} · {detalhe.atendente}</p>
              </div>
              <button className="est-modal-close" onClick={() => setDetalhe(null)}><X size={18}/></button>
            </div>
            <div className="hist-modal-body">
              <div className="hist-detail-grid">
                {[
                  ['Vínculo',      detalhe.vinculo],
                  ['Função',       detalhe.funcao],
                  ['Turma',        detalhe.turma],
                  ['Motivo',       detalhe.motivo],
                  ['Destino',      detalhe.destino],
                  ['Comunicação',  detalhe.comunicacao || '—'],
                  ['Temperatura',  detalhe.temperatura ? `${detalhe.temperatura}°C` : '—'],
                  ['PA',           detalhe.pa || '—'],
                ].map(([l,v]) => (
                  <div key={l} className="hist-detail-item">
                    <span className="hist-detail-label">{l}</span>
                    <span className="hist-detail-value">{v}</span>
                  </div>
                ))}
              </div>
              {detalhe.observacao && (
                <div className="hist-detail-obs">
                  <span className="hist-detail-label">Conduta / Observações</span>
                  <p>{detalhe.observacao}</p>
                </div>
              )}
              {(() => {
                const meds = (detalhe.usedItems??[]).filter(i => i.item.categoria === 'MEDICAMENTO')
                const curs = (detalhe.usedItems??[]).filter(i => i.item.categoria === 'CURATIVO')
                return (
                  <div className="hist-detail-items">
                    <div className="hist-detail-items-col">
                      <span className="hist-detail-label">Medicamentos</span>
                      {meds.length === 0 ? <span className="hist-detail-empty">Nenhum</span>
                        : meds.map(m => (
                          <div key={m.id} className="hist-item-pill">
                            {m.item.nome}
                            <span className="hist-item-qty">{m.quantidade} {m.item.unidade||''}</span>
                          </div>
                        ))}
                    </div>
                    <div className="hist-detail-items-col">
                      <span className="hist-detail-label">Curativos</span>
                      {curs.length === 0 ? <span className="hist-detail-empty">Nenhum</span>
                        : curs.map(c => (
                          <div key={c.id} className="hist-item-pill">
                            {c.item.nome}
                            <span className="hist-item-qty">{c.quantidade} {c.item.unidade||''}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )
              })()}
            </div>
            <div className="hist-modal-footer">
              <button className="btn-ghost" onClick={() => { setDetalhe(null); setEditando(detalhe) }}>
                <Edit2 size={14}/> Editar
              </button>
              <button className="btn-ghost" onClick={() => imprimir(detalhe)}>
                <Printer size={14}/> Imprimir
              </button>
              <button className="btn-brand" onClick={() => setDetalhe(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editando && (
        <EditModal
          registro={editando}
          classes={classes}
          reasons={reasons}
          onClose={() => setEditando(null)}
          onSaved={() => loadData()}
        />
      )}
    </Layout>
  )
}