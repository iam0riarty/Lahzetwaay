import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

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
  {id:'istighfar',label:'الاستغفار',icon:'🙏',target:100},
  {id:'salah_nabi',label:'الصلاة على النبي ﷺ',icon:'💚',target:100},
  {id:'hawqala',label:'الحوقلة',icon:'⚡',target:100},
  {id:'iftiqar',label:'ورد الافتقار',icon:'🌿',target:50},
]

const today = () => new Date().toISOString().split('T')[0]

export default function AdminPage({ onBack }) {
  const { verifyCode } = useAuth()
  const [unlocked, setUnlocked] = useState(false)
  const [codeInput, setCodeInput] = useState('')
  const [codeError, setCodeError] = useState('')
  const [users, setUsers] = useState([])
  const [todayCards, setTodayCards] = useState([])
  const [weekCards, setWeekCards] = useState([])
  const [hafizProgress, setHafizProgress] = useState([])
  const [codes, setCodes] = useState({})
  const [newCodes, setNewCodes] = useState({})
  const [tab, setTab] = useState('overview')
  const [toast, setToast] = useState('')
  const [tazkia, setTazkia] = useState(WEEKS_LIST[0])
  const [worldlyGoals, setWorldlyGoals] = useState([
    {id:'reading_15',label:'قراءة كتاب',duration:'١٥ دقيقة',icon:'📚'},
    {id:'skill_30',label:'تعلم مهارة جديدة',duration:'٣٠ دقيقة',icon:'🎯'},
  ])
  const [wirds, setWirds] = useState(DEFAULT_WIRDS)
  const [newGoal, setNewGoal] = useState({label:'',duration:'',icon:'🎯'})
  const [newWird, setNewWird] = useState({label:'',icon:'🤲',target:100})

  const unlock = async () => {
    const correct = await verifyCode('admin')
    if (codeInput === correct) { setUnlocked(true); loadData() }
    else setCodeError('الكود غلط 🔒')
  }

  const loadData = async () => {
    const weekStart = new Date(); weekStart.setDate(weekStart.getDate()-6)
    const ws = weekStart.toISOString().split('T')[0]
    const [u,tc,wc,c,s,hp] = await Promise.all([
      supabase.from('users').select('*').order('joined_at'),
      supabase.from('daily_cards').select('*').eq('date',today()),
      supabase.from('daily_cards').select('*').gte('date',ws),
      supabase.from('secret_codes').select('*'),
      supabase.from('admin_settings').select('*'),
      supabase.from('hafiz_progress').select('*'),
    ])
    if(u.data) setUsers(u.data)
    if(tc.data) setTodayCards(tc.data)
    if(wc.data) setWeekCards(wc.data)
    if(hp.data) setHafizProgress(hp.data)
    if(c.data){const m={};c.data.forEach(x=>m[x.code_type]=x.code_value);setCodes(m);setNewCodes({...m})}
    if(s.data) s.data.forEach(x=>{
      if(x.setting_key==='current_tazkia') setTazkia(x.setting_value)
      if(x.setting_key==='worldly_goals') setWorldlyGoals(x.setting_value)
      if(x.setting_key==='wirds') setWirds(x.setting_value)
    })
  }

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(''),3000) }

  const deleteUser = async (uid, name) => {
    if (!window.confirm(`هل تريد حذف "${name}" نهائياً؟\nسيتم حذف كل بياناته.`)) return
    await supabase.from('users').delete().eq('id',uid)
    setUsers(prev=>prev.filter(u=>u.id!==uid))
    setTodayCards(prev=>prev.filter(c=>c.user_id!==uid))
    setWeekCards(prev=>prev.filter(c=>c.user_id!==uid))
    showToast(`🗑️ تم حذف ${name}`)
  }

  const saveCode = async (type) => {
    await supabase.from('secret_codes').update({code_value:newCodes[type],updated_at:new Date().toISOString()}).eq('code_type',type)
    setCodes(prev=>({...prev,[type]:newCodes[type]}))
    showToast(`✅ تم تحديث كود ${type}`)
  }

  const genCode = (type) => {
    const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    setNewCodes(prev=>({...prev,[type]:Array.from({length:8},()=>c[Math.floor(Math.random()*c.length)]).join('')}))
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

  const addGoal = () => {
    if (!newGoal.label) return
    setWorldlyGoals(prev=>[...prev,{...newGoal,id:'g_'+Date.now()}])
    setNewGoal({label:'',duration:'',icon:'🎯'})
  }

  const addWird = () => {
    if (!newWird.label) return
    setWirds(prev=>[...prev,{...newWird,id:'w_'+Date.now()}])
    setNewWird({label:'',icon:'🤲',target:100})
  }

  // Stats
  const totalM = users.length
  const todayActive = todayCards.length
  const avgScore = todayCards.length?Math.round(todayCards.reduce((s,c)=>s+c.score,0)/todayCards.length):0
  const perfect = todayCards.filter(c=>c.score===100).length

  const getMemberStats = (uid) => {
    const cards = weekCards.filter(c=>c.user_id===uid)
    return {
      days:cards.length,
      avg:cards.length?Math.round(cards.reduce((s,c)=>s+c.score,0)/cards.length):0,
      fajr:cards.filter(c=>c.fajr===true).length
    }
  }

  // Hafiz progress per user
  const SURAHS_VERSES = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6]
  const totalVerses = 6236

  const getUserHafizStats = (uid) => {
    const prog = hafizProgress.filter(p=>p.user_id===uid)
    const memorizedVerses = prog.filter(p=>p.status!=='none').reduce((sum,p)=>{
      const v = SURAHS_VERSES[p.surah_number-1]||0; return sum+v
    },0)
    return {
      juz: (memorizedVerses/totalVerses*30).toFixed(1),
      pct: Math.round(memorizedVerses/totalVerses*100),
      mastered: prog.filter(p=>p.status==='mastered').length,
    }
  }

  const chartData = users.slice(0,12).map(u=>({name:u.name.split(' ')[0],...getMemberStats(u.id)}))

  if (!unlocked) return (
    <div className="app-container" style={{display:'flex',flexDirection:'column',justifyContent:'center',minHeight:'100vh'}}>
      <div style={{textAlign:'center',marginBottom:28}}>
        <span style={{fontSize:48}}>🛡️</span>
        <h2 style={{fontFamily:"'Amiri',serif",fontSize:26,color:'var(--gold)',marginTop:8}}>لوحة الأدمن</h2>
        <p style={{fontSize:12,color:'var(--text-sub)',marginTop:6,letterSpacing:2}}>للمشرف فقط</p>
      </div>
      <div className="card">
        <div className="card-accent gold"/>
        <input className="input-field" type="password" placeholder="كود الأدمن..." value={codeInput}
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
        <div><p style={{fontSize:11,color:'var(--text-sub)'}}>لوحة</p><p style={{fontSize:16,fontWeight:700,color:'var(--gold)'}}>🛡️ الأدمن</p></div>
        <button className="btn btn-ghost" style={{padding:'7px 12px',fontSize:12}} onClick={onBack}>← رجوع</button>
      </div>

      <div className="nav-tabs" style={{flexWrap:'wrap',gap:4}}>
        {[['overview','📊 عامة'],['members','👥 الأعضاء'],['settings','⚙️ إعدادات'],['codes','🔑 أكواد']].map(([k,l])=>(
          <button key={k} className={`nav-tab ${tab===k?'active':''}`} onClick={()=>setTab(k)} style={{fontSize:12}}>{l}</button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab==='overview'&&(
        <>
          <div className="grid-2" style={{gap:10,marginBottom:12}}>
            {[{n:totalM,l:'إجمالي الأعضاء'},{n:todayActive,l:'نشطوا اليوم'},{n:avgScore+'%',l:'متوسط اليوم'},{n:perfect,l:'يوم مثالي 💯'}].map((x,i)=>(
              <div key={i} className="stat-card"><div className="stat-num">{x.n}</div><div className="stat-label">{x.l}</div></div>
            ))}
          </div>
          {chartData.length>0&&(
            <div className="card">
              <div className="card-accent gold"/>
              <p style={{fontSize:13,fontWeight:700,color:'var(--gold-light)',marginBottom:12}}>📊 متوسط الأعضاء هذا الأسبوع</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData} margin={{top:0,right:0,bottom:0,left:-25}}>
                  <XAxis dataKey="name" tick={{fill:'#8a9ab5',fontSize:10,fontFamily:'Cairo'}}/>
                  <YAxis tick={{fill:'#8a9ab5',fontSize:9}} domain={[0,100]}/>
                  <Tooltip contentStyle={{background:'#0f1a30',border:'1px solid rgba(201,168,76,0.3)',borderRadius:8,fontFamily:'Cairo',fontSize:11}}/>
                  <Bar dataKey="avg" fill="url(#bg)" radius={[4,4,0,0]}/>
                  <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c9a84c"/><stop offset="100%" stopColor="#52b788"/></linearGradient></defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="card">
            <div className="card-accent green"/>
            <p style={{fontSize:13,fontWeight:700,color:'var(--gold-light)',marginBottom:12}}>🌙 نتائج اليوم</p>
            {todayCards.length===0
              ?<p style={{fontSize:12,color:'var(--text-sub)',textAlign:'center',padding:'12px 0'}}>لا يوجد بيانات بعد</p>
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

      {/* ── MEMBERS ── */}
      {tab==='members'&&(
        <div className="card">
          <div className="card-accent blue"/>
          <p style={{fontSize:13,fontWeight:700,color:'var(--gold-light)',marginBottom:12}}>👥 الأعضاء ({totalM})</p>
          {users.map(u=>{
            const s=getMemberStats(u.id)
            const h=getUserHafizStats(u.id)
            const isHafiz = hafizProgress.some(p=>p.user_id===u.id&&p.status!=='none')
            return (
              <div key={u.id} style={{padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
                      <p style={{fontSize:13,fontWeight:700}}>{u.name}</p>
                      {isHafiz&&(
                        <div style={{display:'flex',alignItems:'center',gap:4,padding:'2px 7px',borderRadius:20,
                          background:'linear-gradient(135deg,rgba(82,183,136,0.25),rgba(45,106,79,0.2))',
                          border:'1px solid rgba(82,183,136,0.4)'}}>
                          <span style={{fontSize:11}}>📖</span>
                          <span style={{fontSize:10,fontWeight:700,color:'var(--green-light)'}}>{h.juz} جزء</span>
                          <span style={{fontSize:9,color:'var(--text-sub)'}}>({h.pct}%)</span>
                        </div>
                      )}
                    </div>
                    <p style={{fontSize:10,color:'var(--text-sub)'}}>{u.username} · {u.joined_at?.split('T')[0]}</p>
                    <div style={{display:'flex',gap:5,marginTop:5,flexWrap:'wrap'}}>
                      <span className={`badge ${s.fajr>=5?'badge-green':s.fajr>=3?'badge-gold':'badge-red'}`}>🌙 فجر {s.fajr}/{s.days}</span>
                      <span className="badge badge-gold">📅 {s.days} أيام</span>
                    </div>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                    <p style={{fontSize:20,fontWeight:700,fontFamily:"'Amiri',serif",color:s.avg>=80?'var(--green-light)':s.avg>=50?'var(--gold)':'var(--red)'}}>{s.avg}%</p>
                    <button onClick={()=>deleteUser(u.id,u.name)}
                      style={{padding:'4px 8px',borderRadius:8,border:'1px solid rgba(220,80,80,0.4)',
                        background:'rgba(220,80,80,0.1)',color:'rgba(220,130,130,0.9)',
                        fontSize:11,cursor:'pointer',fontFamily:"'Cairo',sans-serif"}}>
                      🗑️ حذف
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
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
              <input className="input-field" value={tazkia.task} onChange={e=>setTazkia(prev=>({...prev,task:e.target.value}))}/>
            </div>
            <button className="btn btn-gold btn-full" onClick={saveTazkia}>💾 حفظ أسبوع التزكية</button>
          </div>

          {/* Wirds control */}
          <div className="card">
            <div className="card-accent blue"/>
            <div className="section-title"><span className="icon">🤲</span><span className="label">أوراد الذكر وأعدادها</span></div>
            <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:12}}>
              {wirds.map((w,i)=>(
                <div key={w.id||i} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',
                  background:'rgba(255,255,255,0.03)',borderRadius:10,border:'1px solid rgba(255,255,255,0.06)'}}>
                  <span style={{fontSize:18}}>{w.icon}</span>
                  <span style={{flex:1,fontSize:12,fontWeight:600}}>{w.label}</span>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <button className="c-btn" onClick={()=>setWirds(prev=>prev.map((x,j)=>j===i?{...x,target:Math.max(10,x.target-10)}:x))}>−</button>
                    <span style={{fontSize:13,fontWeight:700,color:'var(--gold)',minWidth:36,textAlign:'center'}}>{w.target}</span>
                    <button className="c-btn" onClick={()=>setWirds(prev=>prev.map((x,j)=>j===i?{...x,target:x.target+10}:x))}>+</button>
                  </div>
                  <button onClick={()=>setWirds(prev=>prev.filter((_,j)=>j!==i))}
                    style={{background:'transparent',border:'none',color:'var(--red)',cursor:'pointer',fontSize:15}}>✕</button>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:6,marginBottom:8}}>
              <input className="input-field" placeholder="🤲" value={newWird.icon} onChange={e=>setNewWird(p=>({...p,icon:e.target.value}))} style={{width:52,textAlign:'center',fontSize:18}}/>
              <input className="input-field" placeholder="اسم الورد..." value={newWird.label} onChange={e=>setNewWird(p=>({...p,label:e.target.value}))} style={{flex:1}}/>
              <input className="input-field" type="number" placeholder="العدد" value={newWird.target} onChange={e=>setNewWird(p=>({...p,target:parseInt(e.target.value)||100}))} style={{width:70,direction:'ltr'}}/>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-ghost" style={{flex:1,fontSize:12}} onClick={addWird}>+ أضف ورد</button>
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
                  <div style={{flex:1}}>
                    <p style={{fontSize:12,fontWeight:700}}>{g.label}</p>
                    <p style={{fontSize:10,color:'var(--text-sub)'}}>{g.duration}</p>
                  </div>
                  <button onClick={()=>setWorldlyGoals(prev=>prev.filter(x=>x.id!==g.id))}
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
                <input className="input-field" placeholder="المدة مثلاً: ١٥ دقيقة" value={newGoal.duration} onChange={e=>setNewGoal(p=>({...p,duration:e.target.value}))} style={{flex:1}}/>
                <button className="btn btn-gold" style={{padding:'10px 14px',fontSize:12}} onClick={addGoal}>+ أضف</button>
              </div>
            </div>
            <button className="btn btn-gold btn-full" onClick={saveWorldlyGoals}>💾 حفظ الأهداف</button>
          </div>
        </>
      )}

      {/* ── CODES ── */}
      {tab==='codes'&&(
        <>
          {['admin','hafiz','group'].map(type=>(
            <div key={type} className="card">
              <div className={`card-accent ${type==='admin'?'gold':type==='hafiz'?'green':'blue'}`}/>
              <div className="section-title">
                <span className="icon">{type==='admin'?'🛡️':type==='hafiz'?'📖':'👥'}</span>
                <span className="label">كود {type==='admin'?'الأدمن':type==='hafiz'?'الحفاظ':'الجروب'}</span>
              </div>
              <input className="input-field" value={newCodes[type]||''} onChange={e=>setNewCodes(p=>({...p,[type]:e.target.value}))}
                style={{marginBottom:8,direction:'ltr',textAlign:'center',letterSpacing:5,fontSize:16,fontWeight:700}}/>
              <div style={{display:'flex',gap:8}}>
                <button className="btn btn-ghost" style={{flex:1,fontSize:12}} onClick={()=>genCode(type)}>⚡ توليد</button>
                <button className="btn btn-gold" style={{flex:1,fontSize:12}} onClick={()=>saveCode(type)}>💾 حفظ</button>
              </div>
              {codes[type]&&<p style={{fontSize:11,color:'var(--text-sub)',textAlign:'center',marginTop:8}}>الحالي: <span style={{color:'var(--gold)',letterSpacing:3,fontWeight:700}}>{codes[type]}</span></p>}
            </div>
          ))}
          <div className="card" style={{background:'rgba(220,80,80,0.07)',border:'1px solid rgba(220,80,80,0.2)'}}>
            <p style={{fontSize:11,color:'rgba(220,150,150,0.9)',lineHeight:1.9}}>⚠️ بعد تغيير أي كود أبلغ الأعضاء عبر قناة خاصة — لا ترسل الأكواد في الجروب العام.</p>
          </div>
        </>
      )}

      <div className={`toast ${toast?'show':''}`}>{toast}</div>
    </div>
  )
}
