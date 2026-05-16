import React, { useEffect, useMemo, useState } from 'react'
import {
  Activity, AlertTriangle, Package, Users,
  ArrowUpRight, ArrowDownRight, Clock, ChevronRight,
} from 'lucide-react'
import Layout from '../components/layout'
import api from '../lib/api'
import '../styles/Dashboard.css'

type Periodo = 'hoje' | 'semana' | 'mes'

type Stats = {
  atendimentosHoje: number
  atendimentosSemana: number
  estoqueMedicamentos: number
  destinos: Record<string, number>
}

type ItemCritico = { id: string; nome: string; estoqueAtual: number; minimo?: number }
type AtendimentoDia = { hora: string; nome: string; motivo: string; destino: string }

function hojeRange() {
  const now = new Date()
  const start = new Date(now); start.setHours(0,0,0,0)
  const end = new Date(start); end.setDate(start.getDate() + 1)
  return {
    start: start.toISOString().slice(0,10),
    end: end.toISOString().slice(0,10),
  }
}

function horaBR(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function destinoLabel(d: string) {
  const map: Record<string, string> = {
    DISMISS: 'Liberado',
    HOME: 'Para casa',
    HOSPITAL: 'Hospital',
    'OFFICE/ Special': 'Secretaria',
  }
  return map[d] ?? d
}

function destinoChip(d: string) {
  if (d === 'HOSPITAL') return 'chip-danger'
  if (d === 'DISMISS')  return 'chip-success'
  if (d === 'HOME')     return 'chip-info'
  return 'chip-gray'
}

export default function Dashboard() {
  const [periodo, setPeriodo] = useState<Periodo>('hoje')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({ atendimentosHoje: 0, atendimentosSemana: 0, estoqueMedicamentos: 0, destinos: {} })
  const [itensCriticos, setItensCriticos] = useState<ItemCritico[]>([])
  const [atendimentosHoje, setAtendimentosHoje] = useState<AtendimentoDia[]>([])
  const [incompletos, setIncompletos] = useState(0)

  useEffect(() => {
    let canceled = false
    ;(async () => {
      try {
        setLoading(true)
        const [kpiP, kpiS, criticos, meds, atends] = await Promise.all([
          api.get('/metrics/kpis', { params: { period: periodo } }),
          api.get('/metrics/kpis', { params: { period: 'semana' } }),
          api.get<any[]>('/items/criticos'),
          api.get<any[]>('/items', { params: { categoria: 'MEDICAMENTO', ativos: true } }),
          api.get<any>('/attendances', { params: { ...hojeRange(), pageSize: 8 } }),
        ])
        if (canceled) return

        const kpiData = kpiP.data as { atendimentos: number; emergencias: number }
        const kpiSemana = (kpiS.data as any).atendimentos as number
        const estoqueTotal = (meds.data || []).reduce((s: number, i: any) => s + (Number(i.estoqueAtual) || 0), 0)
        const criticosData = (criticos.data || []).map((i: any) => ({
          id: i.id, nome: i.nome, estoqueAtual: Number(i.estoqueAtual), minimo: Number(i.minimo),
        }))

        // handle both array and paginated response
        const attendsRaw = Array.isArray(atends.data) ? atends.data : (atends.data?.items ?? [])
        const atendsData = attendsRaw.map((a: any) => ({
          hora: horaBR(a.horaChegada ?? a.createdAt),
          nome: a.nome,
          motivo: a.motivo?.name ?? '—',
          destino: a.destino ?? 'DISMISS',
        }))

        // Count incompletos
        const incompletosCount = attendsRaw.filter((a: any) =>
          !a.nome || !a.funcao || !a.motivoId || !a.destino
        ).length

        // Count destinos
        const destinosCount: Record<string, number> = {}
        attendsRaw.forEach((a: any) => {
          if (a.destino) {
            destinosCount[a.destino] = (destinosCount[a.destino] || 0) + 1
          }
        })

        setStats({ atendimentosHoje: kpiData.atendimentos, atendimentosSemana: kpiSemana, estoqueMedicamentos: estoqueTotal, destinos: destinosCount })
        setItensCriticos(criticosData)
        setAtendimentosHoje(atendsData)
        setIncompletos(incompletosCount)
      } catch (e) {
        console.error('Erro dashboard:', e)
      } finally {
        if (!canceled) setLoading(false)
      }
    })()
    return () => { canceled = true }
  }, [periodo])

  const kpis = useMemo(() => [
    {
      label: periodo === 'hoje' ? 'Atendimentos hoje' : periodo === 'semana' ? 'Atendimentos (semana)' : 'Atendimentos (mês)',
      value: stats.atendimentosHoje,
      icon: Activity,
      color: 'kpi-blue',
      trend: null,
    },
    {
      label: 'Atendimentos (semana)',
      value: stats.atendimentosSemana,
      icon: Users,
      color: 'kpi-teal',
      trend: null,
    },
    {
      label: 'Medicamentos em estoque',
      value: stats.estoqueMedicamentos,
      icon: Package,
      color: 'kpi-green',
      trend: null,
    },
  // destinos card handled separately
  ], [stats, periodo])

  return (
    <Layout title="Dashboard" subtitle="Painel da enfermaria">
      {/* Period chips */}
      <div className="db-chips">
        {(['hoje','semana','mes'] as Periodo[]).map(p => (
          <button
            key={p}
            className={`db-chip ${periodo === p ? 'db-chip--active' : ''}`}
            onClick={() => setPeriodo(p)}
          >
            {p === 'hoje' ? 'Hoje' : p === 'semana' ? 'Esta semana' : 'Este mês'}
          </button>
        ))}
      </div>

      {/* Alerta incompletos */}
      {!loading && incompletos > 0 && (
        <a href="/historico" className="db-alert-incomplete">
          <span className="db-alert-icon">⚠</span>
          <span>
            <strong>{incompletos} atendimento{incompletos > 1 ? 's' : ''}</strong> com dados incompletos (sem nome, motivo ou destino).
            Clique para revisar no histórico.
          </span>
          <span className="db-alert-arrow">→</span>
        </a>
      )}

      {/* KPIs */}
      <div className="db-kpis">
        {kpis.filter(k => k.label !== undefined && !k.label.toString().includes('destinos')).map((k, i) => (
          <div key={i} className={`db-kpi ${k.color}`}>
            <div className="db-kpi-icon">
              <k.icon size={20} />
            </div>
            <div className="db-kpi-body">
              <span className="db-kpi-label">{k.label}</span>
              {loading
                ? <span className="skeleton" style={{ height: 28, width: 60, display: 'block', marginTop: 4 }} />
                : <span className="db-kpi-value">{k.value.toLocaleString('pt-BR')}</span>
              }
            </div>
          </div>
        ))}

        {/* Card destinos */}
        <div className="db-kpi db-kpi--destinos kpi-blue">
          <div className="db-kpi-icon"><AlertTriangle size={20} /></div>
          <div className="db-kpi-body">
            <span className="db-kpi-label">Destinos ({periodo === 'hoje' ? 'hoje' : periodo === 'semana' ? 'semana' : 'mês'})</span>
            {loading
              ? <span className="skeleton" style={{ height: 28, width: 120, display: 'block', marginTop: 4 }} />
              : Object.keys(stats.destinos).length === 0
                ? <span className="db-kpi-value" style={{ fontSize: '1rem' }}>Sem dados</span>
                : <div className="db-destinos-list">
                    {Object.entries(stats.destinos)
                      .sort((a, b) => b[1] - a[1])
                      .map(([dest, qty]) => {
                        const labels: Record<string, string> = {
                          DISMISS: 'Liberado', HOME: 'Casa',
                          HOSPITAL: 'Hospital', 'OFFICE/ Special': 'Secretaria',
                        }
                        return (
                          <span key={dest} className="db-destino-pill">
                            <strong>{qty}</strong> {labels[dest] ?? dest}
                          </span>
                        )
                      })}
                  </div>
            }
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="db-actions">
        <h2 className="db-section-title">Ações rápidas</h2>
        <div className="db-action-grid">
          {[
            { href: '/novo-atendimento', label: 'Novo Atendimento', desc: 'Registrar uma nova visita à enfermaria', emoji: '📋', color: '#0e7490' },
            { href: '/historico',        label: 'Ver Histórico',     desc: 'Consultar atendimentos anteriores',      emoji: '📂', color: '#7c3aed' },
            { href: '/medicamentos',     label: 'Gerenciar Estoque', desc: 'Controle de medicamentos e curativos',   emoji: '💊', color: '#059669' },
            { href: '/relatorios',       label: 'Relatórios',        desc: 'Gráficos e indicadores por período',     emoji: '📊', color: '#d97706' },
          ].map(a => (
            <a key={a.href} href={a.href} className="db-action-card">
              <span className="db-action-emoji" style={{ background: `${a.color}18` }}>{a.emoji}</span>
              <div>
                <div className="db-action-label">{a.label}</div>
                <div className="db-action-desc">{a.desc}</div>
              </div>
              <ChevronRight size={16} className="db-action-arrow" />
            </a>
          ))}
        </div>
      </div>

      {/* Bottom widgets */}
      <div className="db-widgets">
        {/* Critical stock */}
        <div className="db-widget">
          <div className="db-widget-header">
            <span className="db-widget-title">Estoque crítico</span>
            <a href="/medicamentos" className="db-widget-link">Ver todos <ChevronRight size={13} /></a>
          </div>
          <div className="db-widget-body">
            {loading ? (
              [1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 36, borderRadius: 8, marginBottom: 8 }} />)
            ) : itensCriticos.length === 0 ? (
              <div className="db-empty">
                <span>✅</span>
                <span>Todos os itens em nível adequado</span>
              </div>
            ) : (
              itensCriticos.map(item => (
                <div key={item.id} className="db-critico-row">
                  <span className="db-critico-nome">{item.nome}</span>
                  <div className="db-critico-right">
                    {item.minimo && (
                      <div className="db-critico-bar">
                        <div
                          className="db-critico-bar-fill"
                          style={{ width: `${Math.min(100, (item.estoqueAtual / item.minimo) * 100)}%` }}
                        />
                      </div>
                    )}
                    <span className="chip-danger">{item.estoqueAtual}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Today attendances */}
        <div className="db-widget">
          <div className="db-widget-header">
            <span className="db-widget-title">Atendimentos de hoje</span>
            <a href="/historico" className="db-widget-link">Histórico <ChevronRight size={13} /></a>
          </div>
          <div className="db-widget-body">
            {loading ? (
              [1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 36, borderRadius: 8, marginBottom: 8 }} />)
            ) : atendimentosHoje.length === 0 ? (
              <div className="db-empty">
                <span>🕐</span>
                <span>Sem atendimentos registrados hoje</span>
              </div>
            ) : (
              <table className="db-atend-table">
                <thead>
                  <tr>
                    <th><Clock size={12} /> Hora</th>
                    <th>Nome</th>
                    <th>Motivo</th>
                    <th>Destino</th>
                  </tr>
                </thead>
                <tbody>
                  {atendimentosHoje.map((a, i) => (
                    <tr key={i}>
                      <td className="db-atend-hora">{a.hora}</td>
                      <td className="db-atend-nome">{a.nome}</td>
                      <td>{a.motivo}</td>
                      <td><span className={destinoChip(a.destino)}>{destinoLabel(a.destino)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}