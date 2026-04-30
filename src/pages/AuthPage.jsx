import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function AuthPage() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    setError(''); setLoading(true)
    let res
    if (mode==='login') res = await login(username, password)
    else res = await register(name, username, password)
    if (res.error) setError(res.error)
    setLoading(false)
  }

  return (
    <div className="app-container" style={{display:'flex',flexDirection:'column',justifyContent:'center',minHeight:'100vh'}}>

      {/* Brand */}
      <div className="brand-header" style={{marginBottom:32}}>
        <span className="brand-moon">🌙</span>
        <h1 className="brand-title">لحظة وعي</h1>
        <p className="brand-sub">وَدَاعاً لِلْكَسَلِ</p>
        <div className="brand-divider"><span>✦</span></div>
      </div>

      <div className="card">
        <div className="card-accent gold"/>
        <div className="nav-tabs" style={{marginBottom:20}}>
          <button className={`nav-tab ${mode==='login'?'active':''}`} onClick={()=>{setMode('login');setError('')}}>دخول</button>
          <button className={`nav-tab ${mode==='register'?'active':''}`} onClick={()=>{setMode('register');setError('')}}>تسجيل جديد</button>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {mode==='register'&&(
            <input className="input-field" placeholder="الاسم الكامل" value={name} onChange={e=>setName(e.target.value)}/>
          )}
          <input className="input-field" placeholder="اسم المستخدم" value={username} onChange={e=>setUsername(e.target.value)} style={{direction:'ltr',textAlign:'right'}}/>
          <input className="input-field" type="password" placeholder="كلمة المرور" value={password} onChange={e=>setPassword(e.target.value)} style={{direction:'ltr',textAlign:'right'}}/>
          {error&&<p style={{color:'var(--red)',fontSize:13,textAlign:'center'}}>{error}</p>}
          <button className="btn btn-gold btn-full" style={{marginTop:6}} onClick={handle} disabled={loading}>
            {loading?'...':mode==='login'?'🌙 دخول':'✨ سجِّل وابدأ رحلتك'}
          </button>
        </div>
      </div>

      <p style={{textAlign:'center',fontSize:11,color:'var(--text-sub)',marginTop:16,lineHeight:1.9}}>
        بدخولك تقبل الالتزام بقواعد المجموعة<br/>
        <span style={{color:'var(--gold)',fontFamily:'var(--font-arabic)',fontSize:14}}>"مَن جَدَّ وَجَد"</span>
      </p>
    </div>
  )
}
