import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'

const WEEKS_LIST = [
  {icon:'🗣️',title:'أسبوع الصمت',task:'التزمت بالصمت إلا لضرورة أو خير'},
  {icon:'🍽️',title:'أسبوع الجوع',task:'خففت الطعام وتأملت في نعمة الشبع'},
  {icon:'👁️',title:'أسبوع الغض',task:'غضضت بصري وقللت الشاشات'},
  {icon:'🤲',title:'أسبوع السخاء',task:'تصدقت أو خدمت شخصاً بلا مقابل'},
  {icon:'😊',title:'أسبوع البشاشة',task:'ابتسمت وأسعدت شخصاً من حولي'},
  {icon:'🧹',title:'أسبوع الطهارة',task:'حافظت على الوضوء الدائم'},
  {icon:'🌙',title:'أسبوع الليل',task:'قمت الليل ودعوت في السجود بصدق'},
  {icon:'🤫',title:'أسبوع إخفاء العمل',task:'عملت خيراً سرياً لا يعلمه أحد'},
  {icon:'🌿',title:'أسبوع الزهد',task:'أحجمت عن الاستهلاك وتأملت الزوال'},
  {icon:'👥',title:'أسبوع صلة الرحم',task:'تواصلت مع أهلي وأسعدت أحدهم'},
]

const DEFAULT_WIRDS = [
  {id:'istighfar',key:'istighfar_count',label:'الاستغفار',icon:'🙏',target:100},
  {id:'salah_nabi',key:'salah_nabi_count',label:'الصلاة على النبي ﷺ',icon:'💚',target:100},
  {id:'hawqala',key:'hawqala_count',label:'الحوقلة',icon:'⚡',target:100},
  {id:'iftiqar',key:'iftiqar_count',label:'ورد الافتقار',icon:'🌿',target:50},
]

const SURAHS_VERSES = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6]

const today = () => new Date().toISOString().split('T')[0]
const ARABIC_MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']

export default function AdminPage({ onBack }) {
  const { verifyCode } = useAuth()
  const [unlocked, setUnlocked] = useState(false)
  const [codeInput, setCodeInput] = useState('')
  const [codeError, setCodeError] = useState('')
  const [tab, setTab] = useState('overview')
  const [toast, setToast] = useState('')

  // Data
  const [users, setUsers] = useState([])
  const [allCards, setAllCards] = useState([])
  const [todayCards, setTodayCards] = useState([])
  const [hafizProgress, setHafizProgress] = useState([])
  const [codes, setCodes] = useState({})
  const [newCodes, setNewCodes] = useState({})

  // Settings
  const [tazkia, setTazkia] = useState(WEEKS_LIST[0])
  const [worldlyGoals, setWorldlyGoals] = useState([
    {id:'reading_15',label:'قراءة كتاب',duration:'١٥ دقيقة',icon:'📚'},
    {id:'skill_30',label:'تعلم مهارة جديدة',duration:'٣٠ دقيقة',icon:'🎯'},
  ])
  const [wirds, setWirds] = useState(DEFAULT_WIRDS)
  const [newGoal, setNewGoal] = useState({label:'',duration:'',icon:'🎯'})
  const [newWird, setNewWird] = useState({label:'',icon:'🤲',target:100})
  const [windowStatus, setWindowStatus] = useState('closed')
  const [windowMsg, setWindowMsg] = useState('النافذة مغلقة في الوقت الحالي')

  // Stats filter
  const [statsFilter, setStatsFilter] = useState('week') // week | month | year

  const unlock = async () => {
    const correct = await verifyCode('admin')
    if (codeInput === correct) { setUnlocked(true); loadData() }
    else setCodeError('الكود غير صحيح 🔒')
  }

  const loadData = async () => {
    const yearStart = new Date(); yearStart.setFullYear(yearStart.getFullYear()-1)
    const [u,ac,tc,c,s,hp] = await Promise.all([
      supabase.from('users').select('*').order('joined_at'),
      supabase.from('daily_cards').select('*').gte('date', yearStart.toISOString().split('T')[0]).order('date'),
      supabase.from('daily_cards').select('*').eq('date', today()),
      supabase.from('secret_codes').select('*'),
      supabase.from('admin_settings').select('*'),
      supabase.from('hafiz_progress').select('*'),
    ])
    if(u.data)  setUsers(u.data)
    if(ac.data) setAllCards(ac.data)
    if(tc.data) setTodayCards(tc.data)
    if(hp.data) setHafizProgress(hp.data)
    if(c.data)  { const m={};c.data.forEach(x=>m[x.code_type]=x.code_value);setCodes(m);setNewCodes({...m}) }
    if(s.data)  s.data.forEach(x=>{
      if(x.setting_key==='current_tazkia')  setTazkia(x.setting_value)
      if(x.setting_key==='worldly_goals')   setWorldlyGoals(x.setting_value)
      if(x.setting_key==='wirds')           setWirds(x.setting_value)
      if(x.setting_key==='window_status')   { setWindowStatus(x.setting_value.status||'closed'); setWindowMsg(x.setting_value.message||'') }
    })
  }

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(''),3000) }

  const deleteUser = async (uid, name) => {
    if(!window.confirm(`حذف "${name}" نهائياً؟`)) return
    await supabase.from('users').delete().eq('id',uid)
    setUsers(p=>p.filter(u=>u.id!==uid))
    setAllCards(p=>p.filter(c=>c.user_id!==uid))
    setTodayCards(p=>p.filter(c=>c.user_id!==uid))
    showToast(`🗑️ تم حذف ${name}`)
  }

  const saveCode = async (type) => {
    await supabase.from('secret_codes').update({code_value:newCodes[type],updated_at:new Date().toISOString()}).eq('code_type',type)
    setCodes(p=>({...p,[type]:newCodes[type]}))
    showToast(`✅ تم تحديث كود ${type}`)
  }
  const genCode = (type) => {
    const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    setNewCodes(p=>({...p,[type]:Array.from({length:8},()=>c[Math.floor(Math.random()*c.length)]).join('')}))
  }

  const saveWindowStatus = async () => {
    await supabase.from('admin_settings').upsert(
      {setting_key:'window_status', setting_value:{status:windowStatus,message:windowMsg}, updated_at:new Date().toISOString()},
      {onConflict:'setting_key'}
    )
    showToast(windowStatus==='open'?'✅ النافذة مفتوحة الآن':'🔒 النافذة مغلقة الآن')
  }

  const saveTazkia = async () => {
    await supabase.from('admin_settings').upsert({setting_key:'current_tazkia',setting_value:tazkia,updated_at:new Date().toISOString()},{onConflict:'setting_key'})
    showToast('✅ تم تحديث أسبوع التزكية')
  }
  const saveWorldlyGoals = async () => {
    await supabase.from('admin_settings').upsert({setting_key:'worldly_goals',setting_value:worldlyGoals,updated_at:new Date().toISOString()},{onConflict:'setting_key'})
    showToast('✅ تم حفظ الأهداف')
  }
  const saveWirds = async () => {
    await supabase.from('admin_settings').upsert({setting_key:'wirds',setting_value:wirds,updated_at:new Date().toISOString()},{onConflict:'setting_key'})
    showToast('✅ تم حفظ الأوراد')
  }

  // ── STATS CALCULATIONS ──
  const getFilteredCards = () => {
    const now = new Date()
    let cutoff
    if (statsFilter==='week')  { cutoff = new Date(); cutoff.setDate(cutoff.getDate()-7) }
    if (statsFilter==='month') { cutoff = new Date(); cutoff.setDate(1) }
    if (statsFilter==='year')  { cutoff = new Date(); cutoff.setMonth(0,1) }
    return allCards.filter(c => new Date(c.date) >= cutoff)
  }

  const filteredCards = getFilteredCards()
  const uniqueDates = [...new Set(filteredCards.map(c=>c.date))].sort()

  // Daily average chart
  const dailyChartData = uniqueDates.slice(-30).map(date => {
    const dayCards = filteredCards.filter(c=>c.date===date)
    const avg = dayCards.length ? Math.round(dayCards.reduce((s,c)=>s+c.score,0)/dayCards.length) : 0
    const d = new Date(date)
    return { date: `${d.getDate()}/${d.getMonth()+1}`, avg, count: dayCards.length }
  })

  // Monthly chart
  const monthlyChartData = (() => {
    const map = {}
    allCards.forEach(c => {
      const d = new Date(c.date)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      if (!map[key]) map[key] = { label: ARABIC_MONTHS[d.getMonth()], scores:[], count:0 }
      map[key].scores.push(c.score); map[key].count++
    })
    return Object.values(map).slice(-12).map(m => ({
      date: m.label,
      avg: Math.round(m.scores.reduce((a,b)=>a+b,0)/m.scores.length),
      count: m.count
    }))
  })()

  // Fajr adherence
  const fajrPct = filteredCards.length
    ? Math.round(filteredCards.filter(c=>c.fajr===true).length/filteredCards.length*100) : 0

  // Top performers
  const memberStats = users.map(u => {
    const cards = filteredCards.filter(c=>c.user_id===u.id)
    const avg = cards.length ? Math.round(cards.reduce((s,c)=>s+c.score,0)/cards.length) : 0
    const fajr = cards.filter(c=>c.fajr===true).length
    const hp = hafizProgress.filter(p=>p.user_id===u.id)
    const memV = hp.filter(p=>p.status!=='none').reduce((sum,p)=>sum+(SURAHS_VERSES[p.surah_number-1]||0),0)
    const juz = (memV/6236*30).toFixed(1)
    return { ...u, avg, days:cards.length, fajr, juz, isHafiz: hp.some(p=>p.status!=='none') }
  }).sort((a,b)=>b.avg-a.avg)

  const getMemberStats = (uid) => {
    const w = new Date(); w.setDate(w.getDate()-7)
    const cards = allCards.filter(c=>c.user_id===uid&&new Date(c.date)>=w)
    return { days:cards.length, avg:cards.length?Math.round(cards.reduce((s,c)=>s+c.score,0)/cards.length):0, fajr:cards.filter(c=>c.fajr===true).length }
  }

  const chartTooltipStyle = {background:'#0f1a30',border:'1px solid rgba(201,168,76,0.3)',borderRadius:8,fontFamily:'Cairo',fontSize:11}

  if (!unlocked) return (
    <div className="app-container" style={{display:'flex',flexDirection:'column',justifyContent:'center',minHeight:'100vh'}}>
      <div style={{textAlign:'center',marginBottom:28}}>
        <span style={{fontSize:50}}>🛡️</span>
        <h2 style={{fontFamily:'var(--font-arabic)',fontSize:28,color:'var(--gold)',marginTop:8}}>لوحة الإدارة</h2>
        <p style={{fontSize:12,color:'var(--text-sub)',marginTop:6,letterSpacing:2}}>للمشرف فقط</p>
      </div>
      <div className="card">
        <div className="card-accent gold"/>
        <input className="input-field" type="password" placeholder="كود الإدارة..." value={codeInput}
          onChange={e=>setCodeInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&unlock()}
          style={{marginBottom:10,direction:'ltr',textAlign:'center',letterSpacing:4,fontSize:18}}/>
        {codeError&&<p style={{color:'var(--red)',fontSize:13,textAlign:'center',marginBottom:8}}>{codeError}</p>}
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
          <p style={{fontFamily:'var(--font-arabic)',fontSize:18,fontWeight:700,color:'var(--gold)'}}>🛡️ الإدارة</p>
        </div>
        <button className="btn btn-ghost" style={{padding:'7px 12px',fontSize:12}} onClick={onBack}>← رجوع</button>
      </div>

      <div className="nav-tabs" style={{flexWrap:'wrap',gap:4}}>
        {[['overview','📊 عامة'],['stats','📈 إحصائيات'],['members','👥 الأعضاء'],['window','🔑 النافذة'],['settings','⚙️ إعدادات']].map(([k,l])=>(
          <button key={k} className={`nav-tab ${tab===k?'active':''}`} onClick={()=>setTab(k)} style={{fontSize:11.5}}>{l}</button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab==='overview'&&(
        <>
          <div className="grid-2" style={{gap:10,marginBottom:12}}>
            {[
              {n:users.length,       l:'إجمالي الأعضاء'},
              {n:todayCards.length,  l:'نشطوا اليوم'},
              {n:todayCards.length?Math.round(todayCards.reduce((s,c)=>s+c.score,0)/todayCards.length):0,l:'متوسط اليوم %'},
              {n:todayCards.filter(c=>c.score===100).length, l:'يوم مثالي 💯'},
            ].map((x,i)=>(
              <div key={i} className="stat-card">
                <div className="stat-num">{x.n}{i===2?'%':''}</div>
                <div className="stat-label">{x.l}</div>
              </div>
            ))}
          </div>

          {/* Window status card */}
          <div className="card" style={{
            background: windowStatus==='open'?'rgba(45,106,79,0.15)':'rgba(139,46,46,0.1)',
            border:`1px solid ${windowStatus==='open'?'rgba(82,183,136,0.3)':'rgba(220,80,80,0.25)'}`,
          }}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <p style={{fontSize:11,color:'var(--text-sub)',marginBottom:2}}>حالة نافذة الأعمال</p>
                <p style={{fontFamily:'var(--font-arabic)',fontSize:18,fontWeight:700,
                  color:windowStatus==='open'?'var(--green-light)':'rgba(220,130,130,0.9)'}}>
                  {windowStatus==='open'?'🟢 مفتوحة الآن':'🔴 مغلقة الآن'}
                </p>
              </div>
              <button className="btn" style={{
                background:windowStatus==='open'?'rgba(220,80,80,0.2)':'rgba(45,106,79,0.3)',
                color:windowStatus==='open'?'rgba(220,130,130,0.9)':'var(--green-light)',
                border:`1px solid ${windowStatus==='open'?'rgba(220,80,80,0.4)':'rgba(82,183,136,0.4)'}`,
                padding:'9px 16px',fontSize:12,
              }} onClick={()=>{ setWindowStatus(p=>p==='open'?'closed':'open'); }}>
                {windowStatus==='open'?'🔒 أغلق':'🔓 افتح'}
              </button>
            </div>
            <button className="btn btn-gold btn-full" style={{marginTop:10,fontSize:12}} onClick={saveWindowStatus}>
              💾 حفظ حالة النافذة
            </button>
          </div>

          {/* Today results */}
          <div className="card">
            <div className="card-accent green"/>
            <p style={{fontFamily:'var(--font-arabic)',fontSize:15,fontWeight:700,color:'var(--gold-light)',marginBottom:12}}>
              نتائج اليوم — {today()}
            </p>
            {todayCards.length===0
              ?<p style={{fontSize:12,color:'var(--text-sub)',textAlign:'center',padding:'12px 0'}}>لا توجد بيانات بعد</p>
              :todayCards.sort((a,b)=>b.score-a.score).map(c=>{
                const u=users.find(x=>x.id===c.user_id)
                return (
                  <div key={c.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                    <span style={{fontSize:13,fontWeight:600}}>{u?.name||'—'}</span>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{width:70,height:5,background:'rgba(255,255,255,0.07)',borderRadius:10,overflow:'hidden'}}>
                        <div style={{width:c.score+'%',height:'100%',background:'linear-gradient(90deg,var(--green-light),var(--gold))',borderRadius:10}}/>
                      </div>
                      <span style={{fontSize:13,fontWeight:700,minWidth:36,color:c.score>=80?'var(--green-light)':c.score>=50?'var(--gold)':'var(--red)',textAlign:'left'}}>{c.score}%</span>
                    </div>
                  </div>
                )
              })
            }
          </div>
        </>
      )}

      {/* ── STATS ── */}
      {tab==='stats'&&(
        <>
          {/* Filter */}
          <div className="nav-tabs" style={{marginBottom:14}}>
            {[['week','هذا الأسبوع'],['month','هذا الشهر'],['year','هذا العام']].map(([k,l])=>(
              <button key={k} className={`nav-tab ${statsFilter===k?'active':''}`} onClick={()=>setStatsFilter(k)} style={{fontSize:12}}>{l}</button>
            ))}
          </div>

          {/* Summary stats */}
          <div className="grid-2" style={{gap:10,marginBottom:12}}>
            {[
              {n:filteredCards.length,              l:'إجمالي البطاقات'},
              {n:[...new Set(filteredCards.map(c=>c.user_id))].length, l:'عضو نشط'},
              {n:filteredCards.length?Math.round(filteredCards.reduce((s,c)=>s+c.score,0)/filteredCards.length):0, l:'متوسط الالتزام %'},
              {n:fajrPct+'%',                       l:'الالتزام بالفجر'},
            ].map((x,i)=>(
              <div key={i} className="stat-card">
                <div className="stat-num">{x.n}{i===2?'%':''}</div>
                <div className="stat-label">{x.l}</div>
              </div>
            ))}
          </div>

          {/* Daily average chart */}
          {dailyChartData.length>0&&(
            <div className="card">
              <div className="card-accent gold"/>
              <p style={{fontFamily:'var(--font-arabic)',fontSize:14,fontWeight:700,color:'var(--gold-light)',marginBottom:12}}>
                📊 متوسط الالتزام اليومي
              </p>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={dailyChartData} margin={{top:0,right:0,bottom:0,left:-25}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                  <XAxis dataKey="date" tick={{fill:'#8a9ab5',fontSize:9,fontFamily:'Cairo'}}/>
                  <YAxis tick={{fill:'#8a9ab5',fontSize:9}} domain={[0,100]}/>
                  <Tooltip contentStyle={chartTooltipStyle}/>
                  <Line type="monotone" dataKey="avg" stroke="var(--gold)" strokeWidth={2} dot={{fill:'var(--gold)',r:3}}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Monthly chart */}
          {monthlyChartData.length>1&&(
            <div className="card">
              <div className="card-accent blue"/>
              <p style={{fontFamily:'var(--font-arabic)',fontSize:14,fontWeight:700,color:'var(--gold-light)',marginBottom:12}}>
                📅 المتوسط الشهري
              </p>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={monthlyChartData} margin={{top:0,right:0,bottom:0,left:-25}}>
                  <XAxis dataKey="date" tick={{fill:'#8a9ab5',fontSize:9,fontFamily:'Cairo'}}/>
                  <YAxis tick={{fill:'#8a9ab5',fontSize:9}} domain={[0,100]}/>
                  <Tooltip contentStyle={chartTooltipStyle}/>
                  <Bar dataKey="avg" fill="url(#grad1)" radius={[4,4,0,0]}/>
                  <defs><linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c9a84c"/><stop offset="100%" stopColor="#52b788"/></linearGradient></defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top 3 leaderboard */}
          <div className="card">
            <div className="card-accent purple"/>
            <p style={{fontFamily:'var(--font-arabic)',fontSize:14,fontWeight:700,color:'var(--gold-light)',marginBottom:12}}>
              🏆 لوحة الشرف
            </p>
            {memberStats.slice(0,3).map((u,i)=>(
              <div key={u.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                <span style={{fontSize:i===0?24:i===1?20:18,minWidth:28}}>{['🥇','🥈','🥉'][i]}</span>
                <div style={{flex:1}}>
                  <p style={{fontSize:13,fontWeight:700}}>{u.name}</p>
                  <p style={{fontSize:10,color:'var(--text-sub)'}}>{u.days} يوم نشط</p>
                </div>
                <span style={{fontFamily:'var(--font-arabic)',fontSize:22,fontWeight:700,color:i===0?'var(--gold)':i===1?'var(--silver)':'#cd7f32'}}>{u.avg}%</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── MEMBERS ── */}
      {tab==='members'&&(
        <div className="card">
          <div className="card-accent blue"/>
          <p style={{fontFamily:'var(--font-arabic)',fontSize:15,fontWeight:700,color:'var(--gold-light)',marginBottom:12}}>
            الأعضاء ({users.length})
          </p>
          {memberStats.map(u=>(
            <div key={u.id} style={{padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3,flexWrap:'wrap'}}>
                    <p style={{fontSize:13,fontWeight:700}}>{u.name}</p>
                    {u.isHafiz&&(
                      <div style={{display:'flex',alignItems:'center',gap:4,padding:'2px 7px',borderRadius:20,
                        background:'linear-gradient(135deg,rgba(82,183,136,0.25),rgba(45,106,79,0.2))',
                        border:'1px solid rgba(82,183,136,0.4)'}}>
                        <span style={{fontSize:11}}>📖</span>
                        <span style={{fontSize:10,fontWeight:700,color:'var(--green-light)'}}>{u.juz} جزء</span>
                      </div>
                    )}
                  </div>
                  <p style={{fontSize:10,color:'var(--text-sub)'}}>{u.username} · انضم {u.joined_at?.split('T')[0]}</p>
                  <div style={{display:'flex',gap:5,marginTop:5,flexWrap:'wrap'}}>
                    <span className={`badge ${u.fajr>=5?'badge-green':u.fajr>=3?'badge-gold':'badge-red'}`}>🌙 فجر {u.fajr}/{u.days}</span>
                    <span className="badge badge-gold">📅 {u.days} أيام</span>
                  </div>
                </div>
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                  <p style={{fontFamily:'var(--font-arabic)',fontSize:20,fontWeight:700,
                    color:u.avg>=80?'var(--green-light)':u.avg>=50?'var(--gold)':'var(--red)'}}>{u.avg}%</p>
                  <button onClick={()=>deleteUser(u.id,u.name)}
                    style={{padding:'4px 8px',borderRadius:8,border:'1px solid rgba(220,80,80,0.4)',
                      background:'rgba(220,80,80,0.1)',color:'rgba(220,130,130,0.9)',
                      fontSize:11,cursor:'pointer',fontFamily:'var(--font-ui)'}}>
                    🗑️ حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── WINDOW CONTROL ── */}
      {tab==='window'&&(
        <>
          <div className="card">
            <div className={`card-accent ${windowStatus==='open'?'green':'red'}`}/>
            <div className="section-title"><span className="icon">🔑</span><span className="label">التحكم في نافذة الأعمال</span></div>

            <div style={{display:'flex',gap:8,marginBottom:16}}>
              {[['open','🟢 مفتوحة'],['closed','🔴 مغلقة']].map(([v,l])=>(
                <div key={v} className={`check-item ${windowStatus===v?'done':''}`} style={{flex:1,justifyContent:'center'}}
                  onClick={()=>setWindowStatus(v)}>
                  <span style={{fontSize:13,fontWeight:700}}>{l}</span>
                </div>
              ))}
            </div>

            <div style={{marginBottom:12}}>
              <p style={{fontSize:11,color:'var(--text-sub)',marginBottom:6}}>رسالة تظهر للأعضاء عند الإغلاق:</p>
              <input className="input-field" value={windowMsg} onChange={e=>setWindowMsg(e.target.value)}
                placeholder="النافذة مغلقة في الوقت الحالي..."/>
            </div>

            <button className="btn btn-gold btn-full" onClick={saveWindowStatus}>💾 حفظ الحالة</button>
          </div>

          <div className="card">
            <div className="card-accent gold"/>
            <div className="section-title"><span className="icon">🔒</span><span className="label">كود الجروب اليومي</span></div>
            <p style={{fontSize:11,color:'var(--text-sub)',marginBottom:10,lineHeight:1.8}}>
              غيِّر الكود يومياً — من يملك الكود يدخل النافذة
            </p>
            <input className="input-field" value={newCodes['group']||''} onChange={e=>setNewCodes(p=>({...p,group:e.target.value}))}
              style={{marginBottom:8,direction:'ltr',textAlign:'center',letterSpacing:5,fontSize:18,fontWeight:700}}/>
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-ghost" style={{flex:1,fontSize:12}} onClick={()=>genCode('group')}>⚡ توليد تلقائي</button>
              <button className="btn btn-gold" style={{flex:1,fontSize:12}} onClick={()=>saveCode('group')}>💾 حفظ الكود</button>
            </div>
            {codes['group']&&<p style={{fontSize:11,color:'var(--text-sub)',textAlign:'center',marginTop:8}}>
              الكود الحالي: <span style={{color:'var(--gold)',letterSpacing:4,fontWeight:700,fontSize:16}}>{codes['group']}</span>
            </p>}
          </div>
        </>
      )}

      {/* ── SETTINGS ── */}
      {tab==='settings'&&(
        <>
          {/* Tazkia */}
          <div className="card">
            <div className="card-accent purple"/>
            <div className="section-title"><span className="icon">🌱</span><span className="label">أسبوع التزكية الحالي</span></div>
            <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:12}}>
              {WEEKS_LIST.map(w=>(
                <div key={w.title} className={`check-item ${tazkia.title===w.title?'done':''}`} onClick={()=>setTazkia(w)}>
                  <div className="check-box">{tazkia.title===w.title?'✓':w.icon}</div>
                  <span className="check-label">{w.title}</span>
                </div>
              ))}
            </div>
            <div style={{background:'rgba(255,255,255,0.03)',borderRadius:10,padding:'10px 12px',marginBottom:10}}>
              <p style={{fontSize:11,color:'var(--text-sub)',marginBottom:6}}>تخصيص المهمة اليومية:</p>
              <input className="input-field" value={tazkia.task} onChange={e=>setTazkia(p=>({...p,task:e.target.value}))}/>
            </div>
            <button className="btn btn-gold btn-full" onClick={saveTazkia}>💾 حفظ أسبوع التزكية</button>
          </div>

          {/* Wirds */}
          <div className="card">
            <div className="card-accent blue"/>
            <div className="section-title"><span className="icon">🤲</span><span className="label">أوراد الذكر وأعدادها</span></div>
            <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:12}}>
              {wirds.map((w,i)=>(
                <div key={w.id||i} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',
                  background:'rgba(255,255,255,0.03)',borderRadius:10,border:'1px solid rgba(255,255,255,0.06)'}}>
                  <span style={{fontSize:18}}>{w.icon}</span>
                  <span style={{flex:1,fontSize:12,fontWeight:600}}>{w.label}</span>
                  <button className="c-btn" onClick={()=>setWirds(p=>p.map((x,j)=>j===i?{...x,target:Math.max(10,x.target-10)}:x))}>−</button>
                  <span style={{fontSize:13,fontWeight:700,color:'var(--gold)',minWidth:36,textAlign:'center'}}>{w.target}</span>
                  <button className="c-btn" onClick={()=>setWirds(p=>p.map((x,j)=>j===i?{...x,target:x.target+10}:x))}>+</button>
                  <button onClick={()=>setWirds(p=>p.filter((_,j)=>j!==i))}
                    style={{background:'transparent',border:'none',color:'var(--red)',cursor:'pointer',fontSize:15}}>✕</button>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:6,marginBottom:8}}>
              <input className="input-field" placeholder="🤲" value={newWird.icon} onChange={e=>setNewWird(p=>({...p,icon:e.target.value}))} style={{width:52,textAlign:'center',fontSize:18}}/>
              <input className="input-field" placeholder="اسم الورد..." value={newWird.label} onChange={e=>setNewWird(p=>({...p,label:e.target.value}))} style={{flex:1}}/>
              <input className="input-field" type="number" value={newWird.target} onChange={e=>setNewWird(p=>({...p,target:parseInt(e.target.value)||100}))} style={{width:66,direction:'ltr'}}/>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-ghost" style={{flex:1,fontSize:12}} onClick={()=>{if(!newWird.label)return;setWirds(p=>[...p,{...newWird,id:'w_'+Date.now()}]);setNewWird({label:'',icon:'🤲',target:100})}}>+ إضافة ورد</button>
              <button className="btn btn-gold" style={{flex:1,fontSize:12}} onClick={saveWirds}>💾 حفظ الأوراد</button>
            </div>
          </div>

          {/* Worldly goals */}
          <div className="card">
            <div className="card-accent teal"/>
            <div className="section-title"><span className="icon">🌍</span><span className="label">أهداف نافذة التقدم</span></div>
            <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:12}}>
              {worldlyGoals.map(g=>(
                <div key={g.id} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',
                  background:'rgba(255,255,255,0.03)',borderRadius:10,border:'1px solid rgba(255,255,255,0.06)'}}>
                  <span style={{fontSize:18}}>{g.icon}</span>
                  <div style={{flex:1}}><p style={{fontSize:12,fontWeight:700}}>{g.label}</p><p style={{fontSize:10,color:'var(--text-sub)'}}>{g.duration}</p></div>
                  <button onClick={()=>setWorldlyGoals(p=>p.filter(x=>x.id!==g.id))}
                    style={{background:'transparent',border:'none',color:'var(--red)',cursor:'pointer',fontSize:16}}>✕</button>
                </div>
              ))}
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:10}}>
              <div style={{display:'flex',gap:6}}>
                <input className="input-field" placeholder="🎯" value={newGoal.icon} onChange={e=>setNewGoal(p=>({...p,icon:e.target.value}))} style={{width:52,textAlign:'center',fontSize:18}}/>
                <input className="input-field" placeholder="اسم الهدف..." value={newGoal.label} onChange={e=>setNewGoal(p=>({...p,label:e.target.value}))} style={{flex:1}}/>
              </div>
              <div style={{display:'flex',gap:6}}>
                <input className="input-field" placeholder="المدة: ١٥ دقيقة" value={newGoal.duration} onChange={e=>setNewGoal(p=>({...p,duration:e.target.value}))} style={{flex:1}}/>
                <button className="btn btn-gold" style={{padding:'10px 14px',fontSize:12}}
                  onClick={()=>{if(!newGoal.label)return;setWorldlyGoals(p=>[...p,{...newGoal,id:'g_'+Date.now()}]);setNewGoal({label:'',duration:'',icon:'🎯'})}}>
                  + إضافة
                </button>
              </div>
            </div>
            <button className="btn btn-gold btn-full" onClick={saveWorldlyGoals}>💾 حفظ الأهداف</button>
          </div>

          {/* Admin + hafiz codes */}
          {['admin','hafiz'].map(type=>(
            <div key={type} className="card">
              <div className={`card-accent ${type==='admin'?'gold':'green'}`}/>
              <div className="section-title">
                <span className="icon">{type==='admin'?'🛡️':'📖'}</span>
                <span className="label">كود {type==='admin'?'الإدارة':'الحفاظ'}</span>
              </div>
              <input className="input-field" value={newCodes[type]||''} onChange={e=>setNewCodes(p=>({...p,[type]:e.target.value}))}
                style={{marginBottom:8,direction:'ltr',textAlign:'center',letterSpacing:5,fontSize:16,fontWeight:700}}/>
              <div style={{display:'flex',gap:8}}>
                <button className="btn btn-ghost" style={{flex:1,fontSize:12}} onClick={()=>genCode(type)}>⚡ توليد</button>
                <button className="btn btn-gold" style={{flex:1,fontSize:12}} onClick={()=>saveCode(type)}>💾 حفظ</button>
              </div>
            </div>
          ))}
        </>
      )}

      <div className={`toast ${toast?'show':''}`}>{toast}</div>
    </div>
  )
}
