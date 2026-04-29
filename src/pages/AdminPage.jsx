import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

const today = () => new Date().toISOString().split('T')[0]
const CODE_TYPES = ['admin', 'hafiz', 'group']

export default function AdminPage({ onBack }) {
  const { verifyCode } = useAuth()
  const [unlocked, setUnlocked] = useState(false)
  const [codeInput, setCodeInput] = useState('')
  const [codeError, setCodeError] = useState('')
  const [users, setUsers] = useState([])
  const [todayCards, setTodayCards] = useState([])
  const [weekCards, setWeekCards] = useState([])
  const [codes, setCodes] = useState({})
  const [newCodes, setNewCodes] = useState({})
  const [tab, setTab] = useState('overview') // overview | members | codes

  const unlock = async () => {
    const correct = await verifyCode('admin')
    if (codeInput === correct) { setUnlocked(true); loadData() }
    else setCodeError('الكود غلط 🔒')
  }

  const loadData = async () => {
    const [u, tc, wc, c] = await Promise.all([
      supabase.from('users').select('*').order('joined_at'),
      supabase.from('daily_cards').select('*').eq('date', today()),
      supabase.from('daily_cards').select('*').gte('date', getWeekStart()),
      supabase.from('secret_codes').select('*'),
    ])
    if (u.data) setUsers(u.data)
    if (tc.data) setTodayCards(tc.data)
    if (wc.data) setWeekCards(wc.data)
    if (c.data) {
      const m = {}; c.data.forEach(x=>m[x.code_type]=x.code_value); setCodes(m)
      setNewCodes({...m})
    }
  }

  const getWeekStart = () => {
    const d = new Date(); d.setDate(d.getDate()-6)
    return d.toISOString().split('T')[0]
  }

  const generateCode = (type) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const code = Array.from({length:8},()=>chars[Math.floor(Math.random()*chars.length)]).join('')
    setNewCodes(prev=>({...prev,[type]:code}))
  }

  const saveCode = async (type) => {
    await supabase.from('secret_codes').update({code_value:newCodes[type],updated_at:new Date().toISOString()}).eq('code_type',type)
    setCodes(prev=>({...prev,[type]:newCodes[type]}))
    alert(`✅ تم تحديث كود ${type}`)
  }

  // Stats
  const totalMembers = users.length
  const todayActive = todayCards.length
  const avgScore = todayCards.length ? Math.round(todayCards.reduce((s,c)=>s+c.score,0)/todayCards.length) : 0
  const fullDayCount = todayCards.filter(c=>c.score===100).length

  // Per-member table
  const getMemberStats = (userId) => {
    const cards = weekCards.filter(c=>c.user_id===userId)
    const avg = cards.length ? Math.round(cards.reduce((s,c)=>s+c.score,0)/cards.length) : 0
    const fajrDays = cards.filter(c=>c.fajr===true).length
    return { days: cards.length, avg, fajrDays }
  }

  // Chart data
  const chartData = users.slice(0,10).map(u=>{
    const s = getMemberStats(u.id)
    return { name: u.name.split(' ')[0], avg: s.avg, days: s.days }
  })

  if (!unlocked) return (
    <div className="app-container" style={{display:'flex',flexDirection:'column',justifyContent:'center',minHeight:'100vh'}}>
      <div style={{textAlign:'center',marginBottom:28}}>
        <span style={{fontSize:48}}>🛡️</span>
        <h2 style={{fontFamily:'Amiri,serif',fontSize:26,color:'var(--gold)',marginTop:8}}>لوحة الأدمن</h2>
        <p style={{fontSize:12,color:'var(--text-sub)',marginTop:6,letterSpacing:2}}>للمشرف فقط</p>
      </div>
      <div className="card">
        <div className="card-accent gold"/>
        <input className="input-field" type="password" placeholder="كود الأدمن..." value={codeInput} onChange={e=>setCodeInput(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&unlock()} style={{marginBottom:10,direction:'ltr',textAlign:'center',letterSpacing:4,fontSize:18}}/>
        {codeError && <p style={{color:'var(--red)',fontSize:13,textAlign:'center',marginBottom:8}}>{codeError}</p>}
        <button className="btn btn-gold btn-full" onClick={unlock}>🛡️ دخول</button>
      </div>
      <button className="btn btn-ghost" style={{marginTop:12}} onClick={onBack}>← رجوع</button>
    </div>
  )

  return (
    <div className="app-container">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div>
          <p style={{fontSize:11,color:'var(--text-sub)'}}>لوحة</p>
          <p style={{fontSize:16,fontWeight:700,color:'var(--gold)'}}>🛡️ الأدمن</p>
        </div>
        <button className="btn btn-ghost" style={{padding:'7px 12px',fontSize:12}} onClick={onBack}>← رجوع</button>
      </div>

      {/* Tabs */}
      <div className="nav-tabs">
        {[['overview','📊 نظرة عامة'],['members','👥 الأعضاء'],['codes','🔑 الأكواد']].map(([k,l])=>(
          <button key={k} className={`nav-tab ${tab===k?'active':''}`} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          {/* Stats grid */}
          <div className="grid-2" style={{gap:10,marginBottom:12}}>
            <div className="stat-card">
              <div className="stat-num">{totalMembers}</div>
              <div className="stat-label">إجمالي الأعضاء</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">{todayActive}</div>
              <div className="stat-label">نشطوا اليوم</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">{avgScore}%</div>
              <div className="stat-label">متوسط النتيجة اليوم</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">{fullDayCount}</div>
              <div className="stat-label">يوم مثالي 100%</div>
            </div>
          </div>

          {/* Bar chart */}
          {chartData.length > 0 && (
            <div className="card">
              <div className="card-accent gold"/>
              <p style={{fontSize:13,fontWeight:700,color:'var(--gold-light)',marginBottom:14}}>📊 متوسط الأعضاء هذا الأسبوع</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} margin={{top:0,right:0,bottom:0,left:-20}}>
                  <XAxis dataKey="name" tick={{fill:'#8a9ab5',fontSize:11,fontFamily:'Cairo'}}/>
                  <YAxis tick={{fill:'#8a9ab5',fontSize:10}} domain={[0,100]}/>
                  <Tooltip contentStyle={{background:'#0f1a30',border:'1px solid rgba(201,168,76,0.3)',borderRadius:8,fontFamily:'Cairo',fontSize:12}}/>
                  <Bar dataKey="avg" fill="url(#barGrad)" radius={[4,4,0,0]}/>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#c9a84c"/>
                      <stop offset="100%" stopColor="#52b788"/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Today's results */}
          <div className="card">
            <div className="card-accent green"/>
            <p style={{fontSize:13,fontWeight:700,color:'var(--gold-light)',marginBottom:12}}>🌙 نتائج اليوم ({today()})</p>
            {todayCards.length === 0 ? (
              <p style={{fontSize:12,color:'var(--text-sub)',textAlign:'center',padding:'12px 0'}}>لا يوجد بيانات بعد</p>
            ) : todayCards.sort((a,b)=>b.score-a.score).map(c=>{
              const u = users.find(x=>x.id===c.user_id)
              return (
                <div key={c.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                  <span style={{fontSize:13,fontWeight:600}}>{u?.name||'—'}</span>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{width:80,height:5,background:'rgba(255,255,255,0.07)',borderRadius:10,overflow:'hidden'}}>
                      <div style={{width:c.score+'%',height:'100%',background:'linear-gradient(90deg,var(--green-light),var(--gold))',borderRadius:10}}/>
                    </div>
                    <span style={{fontSize:13,fontWeight:700,color:c.score>=80?'var(--green-light)':c.score>=50?'var(--gold)':'var(--red)',minWidth:36,textAlign:'left'}}>{c.score}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {tab === 'members' && (
        <div className="card">
          <div className="card-accent blue"/>
          <p style={{fontSize:13,fontWeight:700,color:'var(--gold-light)',marginBottom:12}}>👥 الأعضاء ({totalMembers})</p>
          {users.map(u=>{
            const s = getMemberStats(u.id)
            return (
              <div key={u.id} style={{padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <p style={{fontSize:13,fontWeight:700}}>{u.name}</p>
                    <p style={{fontSize:11,color:'var(--text-sub)'}}>{u.username} · انضم {u.joined_at?.split('T')[0]}</p>
                  </div>
                  <div style={{textAlign:'center'}}>
                    <p style={{fontSize:18,fontWeight:700,fontFamily:'Amiri,serif',color:s.avg>=80?'var(--green-light)':s.avg>=50?'var(--gold)':'var(--red)'}}>{s.avg}%</p>
                    <p style={{fontSize:10,color:'var(--text-sub)'}}>{s.days} أيام هذا الأسبوع</p>
                  </div>
                </div>
                <div style={{display:'flex',gap:8,marginTop:6}}>
                  <span className={`badge ${s.fajrDays>=5?'badge-green':s.fajrDays>=3?'badge-gold':'badge-red'}`}>
                    🌙 الفجر {s.fajrDays}/{s.days} أيام
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'codes' && (
        <>
          {CODE_TYPES.map(type => (
            <div key={type} className="card">
              <div className={`card-accent ${type==='admin'?'gold':type==='hafiz'?'green':'blue'}`}/>
              <div className="section-title">
                <span className="icon">{type==='admin'?'🛡️':type==='hafiz'?'📖':'👥'}</span>
                <span className="label">كود {type==='admin'?'الأدمن':type==='hafiz'?'الحفاظ':'الجروب'}</span>
              </div>
              <div style={{display:'flex',gap:8,marginBottom:8}}>
                <input className="input-field" value={newCodes[type]||''} onChange={e=>setNewCodes(prev=>({...prev,[type]:e.target.value}))}
                  style={{flex:1,direction:'ltr',textAlign:'center',letterSpacing:4,fontSize:16,fontWeight:700}}/>
              </div>
              <div style={{display:'flex',gap:8}}>
                <button className="btn btn-ghost" style={{flex:1,fontSize:12}} onClick={()=>generateCode(type)}>⚡ توليد تلقائي</button>
                <button className="btn btn-gold" style={{flex:1,fontSize:12}} onClick={()=>saveCode(type)}>💾 حفظ</button>
              </div>
              {codes[type] && (
                <p style={{fontSize:11,color:'var(--text-sub)',textAlign:'center',marginTop:8}}>
                  الكود الحالي: <span style={{color:'var(--gold)',letterSpacing:3,fontWeight:700}}>{codes[type]}</span>
                </p>
              )}
            </div>
          ))}
          <div className="card" style={{background:'rgba(220,80,80,0.08)',border:'1px solid rgba(220,80,80,0.2)'}}>
            <p style={{fontSize:12,color:'rgba(220,150,150,0.9)',lineHeight:1.8}}>
              ⚠️ بعد تغيير أي كود — أبلغ الأعضاء المعنيين بالكود الجديد عبر قناة خاصة فقط.
              لا ترسل الأكواد في الجروب العام.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
