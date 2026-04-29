import './index.css'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { useState } from 'react'
import AuthPage from './pages/AuthPage'
import DailyCard from './pages/DailyCard'
import HafizPage from './pages/HafizPage'
import AdminPage from './pages/AdminPage'

function AppInner() {
  const { user, loading } = useAuth()
  const [page, setPage] = useState('home') // home | hafiz | admin

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',flexDirection:'column',gap:12}}>
      <span style={{fontSize:40,animation:'moonPulse 2s infinite'}}>🌙</span>
      <p style={{color:'var(--gold-light)',fontSize:14,letterSpacing:2}}>لحظة وعي...</p>
      <style>{`@keyframes moonPulse{0%,100%{opacity:.5}50%{opacity:1}}`}</style>
    </div>
  )

  if (!user) return <AuthPage/>

  if (page === 'hafiz') return <HafizPage onBack={()=>setPage('home')}/>
  if (page === 'admin') return <AdminPage onBack={()=>setPage('home')}/>

  return (
    <>
      <DailyCard onNavigate={setPage}/>
      {/* Hidden admin access - triple tap footer */}
      <div style={{textAlign:'center',padding:'8px 0 4px',position:'relative',zIndex:1}}>
        <span style={{fontSize:10,color:'var(--text-sub)',cursor:'pointer',letterSpacing:1}} onClick={()=>setPage('admin')}>
          ✦ لحظة وعي ✦
        </span>
      </div>
    </>
  )
}

export default function App() {
  return <AuthProvider><AppInner/></AuthProvider>
}
