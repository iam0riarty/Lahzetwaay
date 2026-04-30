import './index.css'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { useState, useEffect } from 'react'
import AuthPage from './pages/AuthPage'
import DailyCard from './pages/DailyCard'
import HafizPage from './pages/HafizPage'
import AdminPage from './pages/AdminPage'
import GroupGate from './components/GroupGate'

function AppInner() {
  const { user, loading } = useAuth()
  const [page, setPage] = useState('home')
  const [groupUnlocked, setGroupUnlocked] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('group_unlocked') === 'true') setGroupUnlocked(true)
  }, [])

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',flexDirection:'column',gap:14}}>
      <span style={{fontSize:44,filter:'drop-shadow(0 0 14px rgba(201,168,76,0.8))'}}>🌙</span>
      <p style={{color:'var(--gold-light)',fontSize:14,letterSpacing:3,fontFamily:'var(--font-arabic)'}}>لحظة وعي...</p>
    </div>
  )

  if (!user) return <AuthPage/>

  if (!groupUnlocked && page !== 'admin')
    return <GroupGate onUnlocked={()=>setGroupUnlocked(true)}/>

  if (page === 'hafiz') return <HafizPage onBack={()=>setPage('home')}/>
  if (page === 'admin') return <AdminPage onBack={()=>setPage('home')}/>

  return (
    <>
      <DailyCard onNavigate={setPage}/>
      <div style={{textAlign:'center',padding:'6px 0 4px',position:'relative',zIndex:1}}>
        <span style={{fontSize:10,color:'var(--text-sub)',cursor:'pointer',letterSpacing:1,
          fontFamily:'var(--font-arabic)',opacity:0.5}} onClick={()=>setPage('admin')}>
          ✦ لحظة وعي ✦
        </span>
      </div>
    </>
  )
}

export default function App() {
  return <AuthProvider><AppInner/></AuthProvider>
}
