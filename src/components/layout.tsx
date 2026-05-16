import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, ClipboardPlus, FolderOpen,
  Package, BarChart3, LogOut, Menu, Heart, ClipboardList,
} from 'lucide-react'
import logoImg from '../assets/EAR.png'
import { logout } from '../lib/auth'
import './Layout.css'

interface LayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
}

const navItems = [
  { path: '/',                 label: 'Dashboard',        icon: LayoutDashboard },
  { path: '/novo-atendimento', label: 'Novo Atendimento', icon: ClipboardPlus   },
  { path: '/historico',        label: 'Histórico',        icon: FolderOpen      },
  { path: '/medicamentos',     label: 'Estoque',          icon: Package         },
  { path: '/relatorios',       label: 'Relatórios',       icon: BarChart3       },
  { path: '/prontuario',        label: 'Prontuário',       icon: ClipboardList   },
]

const IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000

function getUserNameFromToken(): string {
  try {
    const token = localStorage.getItem('access')
    if (!token) return 'Usuário'
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload?.name ?? payload?.email?.split('@')[0] ?? 'Usuário'
  } catch { return 'Usuário' }
}

export const Layout: React.FC<LayoutProps> = ({ children, title, subtitle }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed,  setCollapsed]  = useState(() => {
    try { return localStorage.getItem('sidebar-collapsed') === 'true' } catch { return false }
  })
  const userName = getUserNameFromToken()

  const resetTimer = useCallback(() => window.setTimeout(() => logout(), IDLE_TIMEOUT_MS), [])
  useEffect(() => {
    let timerId = resetTimer()
    const events = ['mousemove','keydown','click','scroll','touchstart']
    const onActivity = () => { clearTimeout(timerId); timerId = resetTimer() }
    events.forEach(e => window.addEventListener(e, onActivity))
    return () => { clearTimeout(timerId); events.forEach(e => window.removeEventListener(e, onActivity)) }
  }, [resetTimer])

  const toggleCollapsed = () => {
    const next = !collapsed
    setCollapsed(next)
    try { localStorage.setItem('sidebar-collapsed', String(next)) } catch {}
  }

  return (
    <div className={`layout-root ${collapsed ? 'layout-root--collapsed' : ''}`}>

      <aside className={`sidebar ${mobileOpen ? 'sidebar--open' : ''} ${collapsed ? 'sidebar--collapsed' : ''}`}>

        {/* Logo + nome + hamburguer */}
        <div className="sidebar-logo">
          <img src={logoImg} alt="EAR Logo" className="sidebar-logo-img" />
          {!collapsed && (
            <>
              <div className="sidebar-logo-text">
                <span className="sidebar-logo-name">Nursing App</span>
                <span className="sidebar-logo-sub">EAR School</span>
              </div>
              <button className="sidebar-hamburger" onClick={toggleCollapsed} title="Recolher menu">
                <span className="sidebar-hamburger-icon">&#9776;</span>
              </button>
            </>
          )}
          {collapsed && (
            <button className="sidebar-hamburger sidebar-hamburger--only" onClick={toggleCollapsed} title="Expandir menu">
              <span className="sidebar-hamburger-icon">&#9776;</span>
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path
            return (
              <a key={path} href={path}
                className={`sidebar-link ${active ? 'sidebar-link--active' : ''}`}
                title={collapsed ? label : undefined}
                onClick={e => { e.preventDefault(); navigate(path); setMobileOpen(false) }}
              >
                <Icon size={17} />
                {!collapsed && <span>{label}</span>}
                {!collapsed && active && <span className="sidebar-link-dot" />}
              </a>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          {!collapsed && (
            <div className="sidebar-user">
              <div className="sidebar-user-avatar">{userName.charAt(0).toUpperCase()}</div>
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{userName}</span>
                <span className="sidebar-user-role">Enfermagem</span>
              </div>
            </div>
          )}
          <button className="sidebar-logout" onClick={() => logout()} title="Sair">
            <LogOut size={15} />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

      <div className="layout-main">
        <header className="topbar">
          <div className="topbar-left">
            <button className="topbar-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}>
              <Menu size={20} />
            </button>
            {title && (
              <div>
                <h1 className="topbar-title">{title}</h1>
                {subtitle && <p className="topbar-subtitle">{subtitle}</p>}
              </div>
            )}
          </div>
          <div className="topbar-right">
            <div className="topbar-status">
              <Heart size={14} className="topbar-status-icon" />
              <span>Online</span>
            </div>
          </div>
        </header>
        <main className="layout-content">{children}</main>
      </div>
    </div>
  )
}

export default Layout