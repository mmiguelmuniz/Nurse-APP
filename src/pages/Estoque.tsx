import React, { useEffect, useState, useCallback } from 'react'
import {
  Package, TrendingDown, TrendingUp, AlertTriangle,
  Search, Plus, Minus, History, X, PlusCircle, Pencil, Trash2
} from 'lucide-react'
import Layout from '../components/layout'
import api from '../lib/api'
import '../styles/Estoque.css'

type Item = {
  id: string
  nome: string
  categoria: 'MEDICAMENTO' | 'CURATIVO'
  unidade: string
  estoqueAtual: number
  minimo: number
  descontaEstoque: boolean
  active: boolean
}

type Movement = {
  id: string
  tipo: 'ENTRADA' | 'SAIDA'
  quantidade: number
  motivo?: string
  createdAt: string
  item?: { nome: string; unidade: string }
  attendance?: { nome: string }
  contabilizaEstoque: boolean
}

type Tab = 'itens' | 'movimentacoes'
type CategoriaFiltro = 'TODOS' | 'MEDICAMENTO' | 'CURATIVO'

function dataBR(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function stockStatus(item: Item): 'ok' | 'low' | 'critical' | 'zero' {
  if (!item.descontaEstoque) return 'ok'
  if (item.estoqueAtual <= 0) return 'zero'
  if (item.minimo > 0 && item.estoqueAtual < item.minimo) return 'critical'
  if (item.minimo > 0 && item.estoqueAtual < item.minimo * 1.5) return 'low'
  return 'ok'
}

const statusLabel: Record<string, string> = {
  ok: 'OK', low: 'Baixo', critical: 'Crítico', zero: 'Zerado',
}
const statusChip: Record<string, string> = {
  ok: 'chip-success', low: 'chip-warning', critical: 'chip-danger', zero: 'chip-danger',
}

// ─── Modal de entrada/saída manual ───
function MovimentoModal({ item, tipo, onClose, onSuccess }: {
  item: Item; tipo: 'ENTRADA' | 'SAIDA'; onClose: () => void; onSuccess: () => void
}) {
  const [qty, setQty] = useState(1)
  const [motivo, setMotivo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (qty < 1) return setError('Quantidade deve ser maior que 0.')
    if (tipo === 'SAIDA' && item.descontaEstoque && qty > item.estoqueAtual) {
      return setError(`Estoque insuficiente. Disponível: ${item.estoqueAtual} ${item.unidade}`)
    }
    try {
      setLoading(true)
      await api.post(`/items/${item.id}/${tipo === 'ENTRADA' ? 'entrada' : 'saida'}`, {
        quantidade: qty,
        motivo: motivo || (tipo === 'ENTRADA' ? 'Entrada manual' : 'Saída manual'),
      })
      onSuccess()
      onClose()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Erro ao registrar movimento.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="est-modal-overlay" onClick={onClose}>
      <div className="est-modal" onClick={e => e.stopPropagation()}>
        <div className="est-modal-header">
          <div>
            <h3 className="est-modal-title">
              {tipo === 'ENTRADA' ? '↑ Registrar Entrada' : '↓ Registrar Saída'}
            </h3>
            <p className="est-modal-sub">{item.nome}</p>
          </div>
          <button className="est-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="est-modal-body">
          {tipo === 'SAIDA' && item.descontaEstoque && (
            <div className="est-modal-info">
              Estoque atual: <strong>{item.estoqueAtual} {item.unidade}</strong>
            </div>
          )}
          {error && <div className="est-modal-error">{error}</div>}

          <div className="est-modal-field">
            <label>Quantidade *</label>
            <input
              type="number"
              min={1}
              max={tipo === 'SAIDA' && item.descontaEstoque ? item.estoqueAtual : undefined}
              value={qty}
              onChange={e => { setQty(Number(e.target.value)); setError(null) }}
              className="est-input"
            />
          </div>
          <div className="est-modal-field">
            <label>Motivo</label>
            <input
              type="text"
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              placeholder={tipo === 'ENTRADA' ? 'Ex.: Reposição mensal' : 'Ex.: Uso em atendimento'}
              className="est-input"
            />
          </div>
        </div>

        <div className="est-modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button
            className={`btn-brand ${tipo === 'SAIDA' ? 'btn-brand--danger' : ''}`}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Salvando...' : tipo === 'ENTRADA' ? 'Registrar entrada' : 'Registrar saída'}
          </button>
        </div>
      </div>
    </div>
  )
}



// ─── Modal editar item ───
function EditItemModal({ item, onClose, onSuccess }: { item: Item; onClose: () => void; onSuccess: () => void }) {
  const [nome, setNome] = useState(item.nome)
  const [minimo, setMinimo] = useState(item.minimo)
  const [descontaEstoque, setDescontaEstoque] = useState(item.descontaEstoque)
  const [active, setActive] = useState(item.active)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!nome.trim()) return setError('Nome é obrigatório.')
    try {
      setLoading(true)
      await api.patch(`/items/${item.id}`, { nome: nome.trim(), minimo: Number(minimo), descontaEstoque, active })
      onSuccess()
      onClose()
    } catch {
      setError('Erro ao salvar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="est-modal-overlay" onClick={onClose}>
      <div className="est-modal" onClick={e => e.stopPropagation()}>
        <div className="est-modal-header">
          <div>
            <h3 className="est-modal-title">Editar item</h3>
            <p className="est-modal-sub">{item.nome}</p>
          </div>
          <button className="est-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="est-modal-body">
          {error && <div className="est-modal-error">{error}</div>}
          <div className="est-modal-field">
            <label>Nome *</label>
            <input className="est-input" value={nome} onChange={e => { setNome(e.target.value); setError(null) }} />
          </div>
          <div className="est-modal-field">
            <label>Estoque mínimo</label>
            <input type="number" min={0} className="est-input" value={minimo} onChange={e => setMinimo(Number(e.target.value))} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-700)', cursor: 'pointer' }}>
            <input type="checkbox" checked={descontaEstoque} onChange={e => setDescontaEstoque(e.target.checked)} />
            Controlar estoque
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-700)', cursor: 'pointer' }}>
            <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} />
            Item ativo
          </label>
        </div>
        <div className="est-modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-brand" onClick={handleSave} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

const UNIDADES = ['Comprimido', 'Cápsula', 'ml', 'mg', 'un', 'ampola', 'frasco', 'sachê', 'gota', 'supositório']

// ─── Modal novo item ───
function NovoItemModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [nome, setNome] = useState('')
  const [categoria, setCategoria] = useState<'MEDICAMENTO' | 'CURATIVO'>('MEDICAMENTO')
  const [unidade, setUnidade] = useState('')
  const [minimo, setMinimo] = useState(0)
  const [estoqueInicial, setEstoqueInicial] = useState(0)
  const [descontaEstoque, setDescontaEstoque] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!nome.trim()) return setError('Nome é obrigatório.')
    if (!unidade.trim()) return setError('Unidade é obrigatória.')
    try {
      setLoading(true)
      await api.post('/items', {
        nome: nome.trim(),
        categoria,
        unidade: unidade.trim(),
        minimo: Number(minimo),
        estoqueAtual: Number(estoqueInicial),
        descontaEstoque,
        active: true,
      })
      onSuccess()
      onClose()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Erro ao criar item.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="est-modal-overlay" onClick={onClose}>
      <div className="est-modal" onClick={e => e.stopPropagation()}>
        <div className="est-modal-header">
          <div>
            <h3 className="est-modal-title">Novo item de estoque</h3>
            <p className="est-modal-sub">Medicamento ou curativo</p>
          </div>
          <button className="est-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="est-modal-body">
          {error && <div className="est-modal-error">{error}</div>}
          <div className="est-modal-field">
            <label>Nome *</label>
            <input className="est-input" value={nome} onChange={e => { setNome(e.target.value); setError(null) }} placeholder="Ex.: Paracetamol 500mg" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="est-modal-field">
              <label>Categoria *</label>
              <select className="est-input" value={categoria} onChange={e => setCategoria(e.target.value as any)}>
                <option value="MEDICAMENTO">Medicamento</option>
                <option value="CURATIVO">Curativo</option>
              </select>
            </div>
            <div className="est-modal-field">
              <label>Unidade *</label>
              <select className="est-input" value={unidade} onChange={e => { setUnidade(e.target.value); setError(null) }}>
                <option value="">Selecione...</option>
                {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="est-modal-field">
              <label>Estoque inicial</label>
              <input type="number" min={0} className="est-input" value={estoqueInicial} onChange={e => setEstoqueInicial(Number(e.target.value))} />
            </div>
            <div className="est-modal-field">
              <label>Estoque mínimo</label>
              <input type="number" min={0} className="est-input" value={minimo} onChange={e => setMinimo(Number(e.target.value))} />
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-700)', cursor: 'pointer' }}>
            <input type="checkbox" checked={descontaEstoque} onChange={e => setDescontaEstoque(e.target.checked)} />
            Controlar estoque (descontar nas saídas)
          </label>
        </div>
        <div className="est-modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-brand" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Salvando...' : 'Criar item'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Estoque() {
  const [tab, setTab] = useState<Tab>('itens')
  const [items, setItems] = useState<Item[]>([])
  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)
  const [movLoading, setMovLoading] = useState(false)
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState<CategoriaFiltro>('TODOS')
  const [modal, setModal] = useState<{ item: Item; tipo: 'ENTRADA' | 'SAIDA' } | null>(null)
  const [novoItem, setNovoItem] = useState(false)
  const [editItem, setEditItem] = useState<Item | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Item | null>(null)
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [movPage, setMovPage] = useState(1)
  const [movTotal, setMovTotal] = useState(0)
  const MOV_PAGE_SIZE = 20

  const loadItems = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get<Item[]>('/items', { params: { ativos: true } })
      setItems(res.data ?? [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMovements = useCallback(async (page = 1) => {
    try {
      setMovLoading(true)
      const res = await api.get<any>('/movements', { params: { page, pageSize: MOV_PAGE_SIZE } })
      const data = res.data
      if (Array.isArray(data)) {
        setMovements(data)
        setMovTotal(data.length)
      } else {
        setMovements(data.items ?? [])
        setMovTotal(data.total ?? 0)
      }
      setMovPage(page)
    } catch (e) {
      console.error(e)
    } finally {
      setMovLoading(false)
    }
  }, [])

  useEffect(() => { loadItems() }, [loadItems])
  useEffect(() => { if (tab === 'movimentacoes') loadMovements(1) }, [tab, loadMovements])

  const filteredItems = items.filter(it => {
    const matchBusca = it.nome.toLowerCase().includes(busca.toLowerCase())
    const matchCat = categoria === 'TODOS' || it.categoria === categoria
    return matchBusca && matchCat
  })

  const criticos = items.filter(it => ['critical','zero'].includes(stockStatus(it)))
  const totalMeds = items.filter(it => it.categoria === 'MEDICAMENTO').reduce((s, it) => s + it.estoqueAtual, 0)
  const totalCur  = items.filter(it => it.categoria === 'CURATIVO').reduce((s, it) => s + it.estoqueAtual, 0)

  return (
    <Layout title="Estoque" subtitle="Medicamentos e curativos">
      {/* Summary cards */}
      <div className="est-summary">
        <div className="est-sum-card">
          <Package size={18} className="est-sum-icon est-sum-icon--blue" />
          <div>
            <div className="est-sum-label">Medicamentos</div>
            <div className="est-sum-value">{totalMeds.toLocaleString('pt-BR')}</div>
          </div>
        </div>
        <div className="est-sum-card">
          <Package size={18} className="est-sum-icon est-sum-icon--green" />
          <div>
            <div className="est-sum-label">Curativos</div>
            <div className="est-sum-value">{totalCur.toLocaleString('pt-BR')}</div>
          </div>
        </div>
        <div className="est-sum-card">
          <AlertTriangle size={18} className="est-sum-icon est-sum-icon--red" />
          <div>
            <div className="est-sum-label">Itens críticos</div>
            <div className="est-sum-value">{criticos.length}</div>
          </div>
        </div>
        <div className="est-sum-card">
          <Package size={18} className="est-sum-icon est-sum-icon--teal" />
          <div>
            <div className="est-sum-label">Total de itens</div>
            <div className="est-sum-value">{items.length}</div>
          </div>
        </div>
      </div>

      {/* New item button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
        <button className="btn-brand" onClick={() => setNovoItem(true)}>
          <PlusCircle size={15} /> Novo item
        </button>
      </div>

      {/* Tabs */}
      <div className="est-tabs">
        <button className={`est-tab ${tab === 'itens' ? 'est-tab--active' : ''}`} onClick={() => setTab('itens')}>
          <Package size={15} /> Itens em estoque
        </button>
        <button className={`est-tab ${tab === 'movimentacoes' ? 'est-tab--active' : ''}`} onClick={() => setTab('movimentacoes')}>
          <History size={15} /> Movimentações
        </button>
      </div>

      {/* Tab: Itens */}
      {tab === 'itens' && (
        <div className="est-card">
          {/* Filters */}
          <div className="est-filters">
            <div className="est-search">
              <Search size={15} className="est-search-icon" />
              <input
                type="text"
                placeholder="Buscar item..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                className="est-search-input"
              />
            </div>
            <div className="est-cat-chips">
              {(['TODOS','MEDICAMENTO','CURATIVO'] as CategoriaFiltro[]).map(c => (
                <button
                  key={c}
                  className={`db-chip ${categoria === c ? 'db-chip--active' : ''}`}
                  onClick={() => setCategoria(c)}
                >
                  {c === 'TODOS' ? 'Todos' : c === 'MEDICAMENTO' ? 'Medicamentos' : 'Curativos'}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="est-loading">
              {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 48, marginBottom: 8, borderRadius: 8 }} />)}
            </div>
          ) : (
            <div className="est-table-wrap">
              <table className="est-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Categoria</th>
                    <th>Estoque atual</th>
                    <th>Mínimo</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length === 0 ? (
                    <tr><td colSpan={6} className="est-empty">Nenhum item encontrado.</td></tr>
                  ) : filteredItems.map(item => {
                    const status = stockStatus(item)
                    return (
                      <tr key={item.id} className={status === 'critical' || status === 'zero' ? 'est-row--critical' : ''}>
                        <td className="est-item-nome">{item.nome}</td>
                        <td>
                          <span className={item.categoria === 'MEDICAMENTO' ? 'chip-info' : 'chip-gray'}>
                            {item.categoria === 'MEDICAMENTO' ? 'Medicamento' : 'Curativo'}
                          </span>
                        </td>
                        <td className="est-qty">
                          <span className="est-qty-val">{item.estoqueAtual}</span>
                          <span className="est-qty-unit">{item.unidade}</span>
                        </td>
                        <td className="est-min">
                          {item.descontaEstoque ? `${item.minimo} ${item.unidade}` : '—'}
                        </td>
                        <td>
                          {item.descontaEstoque
                            ? <span className={statusChip[status]}>{statusLabel[status]}</span>
                            : <span className="chip-gray">Sem controle</span>
                          }
                        </td>
                        <td>
                          <div className="est-actions">
                            <button className="est-btn-action est-btn-action--in" onClick={() => setModal({ item, tipo: 'ENTRADA' })} title="Registrar entrada">
                              <Plus size={13} /> Entrada
                            </button>
                            <button className="est-btn-action est-btn-action--out" onClick={() => setModal({ item, tipo: 'SAIDA' })} disabled={item.descontaEstoque && item.estoqueAtual <= 0} title="Registrar saída">
                              <Minus size={13} /> Saída
                            </button>
                            <button className="est-btn-action est-btn-action--edit" onClick={() => setEditItem(item)} title="Editar item">
                              <Pencil size={13} />
                            </button>
                            <button className="est-btn-action est-btn-action--del" onClick={() => setConfirmDelete(item)} title="Remover item">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Movimentações */}
      {tab === 'movimentacoes' && (
        <div className="est-card">
          {movLoading ? (
            <div className="est-loading">
              {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 52, marginBottom: 8, borderRadius: 8 }} />)}
            </div>
          ) : (
            <>
              <div className="est-table-wrap">
                <table className="est-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Item</th>
                      <th>Tipo</th>
                      <th>Quantidade</th>
                      <th>Motivo</th>
                      <th>Atendimento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.length === 0 ? (
                      <tr><td colSpan={6} className="est-empty">Nenhuma movimentação encontrada.</td></tr>
                    ) : movements.map(m => (
                      <tr key={m.id}>
                        <td className="est-mov-data">{dataBR(m.createdAt)}</td>
                        <td className="est-item-nome">{m.item?.nome ?? '—'}</td>
                        <td>
                          <span className={m.tipo === 'ENTRADA' ? 'chip-success' : 'chip-danger'}>
                            {m.tipo === 'ENTRADA'
                              ? <><TrendingUp size={11} style={{ marginRight: 3 }} />Entrada</>
                              : <><TrendingDown size={11} style={{ marginRight: 3 }} />Saída</>
                            }
                          </span>
                        </td>
                        <td className="est-qty">
                          <span className="est-qty-val">{m.quantidade}</span>
                          <span className="est-qty-unit">{m.item?.unidade ?? ''}</span>
                        </td>
                        <td>{m.motivo ?? '—'}</td>
                        <td>{m.attendance?.nome ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {movTotal > MOV_PAGE_SIZE && (
                <div className="est-pagination">
                  <button
                    className="btn-ghost"
                    disabled={movPage <= 1}
                    onClick={() => loadMovements(movPage - 1)}
                  >
                    ← Anterior
                  </button>
                  <span className="est-pagination-info">
                    Página {movPage} de {Math.ceil(movTotal / MOV_PAGE_SIZE)}
                  </span>
                  <button
                    className="btn-ghost"
                    disabled={movPage >= Math.ceil(movTotal / MOV_PAGE_SIZE)}
                    onClick={() => loadMovements(movPage + 1)}
                  >
                    Próxima →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Edit item modal */}
      {editItem && (
        <EditItemModal item={editItem} onClose={() => setEditItem(null)} onSuccess={loadItems} />
      )}

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div className="est-modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="est-modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="est-modal-header">
              <h3 className="est-modal-title">Remover item</h3>
              <button className="est-modal-close" onClick={() => setConfirmDelete(null)}><X size={18} /></button>
            </div>
            <div className="est-modal-body">
              <p style={{ fontSize: '0.9rem', color: 'var(--gray-700)', margin: 0 }}>
                Tem certeza que deseja remover <strong>{confirmDelete.nome}</strong>? Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="est-modal-footer">
              <button className="btn-ghost" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="btn-brand btn-brand--danger" onClick={async () => {
                try {
                  await api.delete(`/items/${confirmDelete.id}`)
                  setConfirmDelete(null)
                  loadItems()
                } catch {
                  alert('Erro ao remover item.')
                }
              }}>Remover</button>
            </div>
          </div>
        </div>
      )}

      {/* Novo item modal */}
      {novoItem && (
        <NovoItemModal onClose={() => setNovoItem(false)} onSuccess={loadItems} />
      )}

      {/* Modal */}
      {modal && (
        <MovimentoModal
          item={modal.item}
          tipo={modal.tipo}
          onClose={() => setModal(null)}
          onSuccess={loadItems}
        />
      )}
    </Layout>
  )
}