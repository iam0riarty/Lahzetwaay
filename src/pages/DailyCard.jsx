import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const SALAWAT = [
  { key:'fajr', name:'الفجر', emoji:'🌙' },
  { key:'dhuhr', name:'الظهر', emoji:'☀️' },
  { key:'asr', name:'العصر', emoji:'🌤️' },
  { key:'maghrib', name:'المغرب', emoji:'🌅' },
  { key:'isha', name:'العشاء', emoji:'⭐' },
]
const QIYAM_CHECKS = [
  { key:'duha', label:'الضحى ٤ ركعات', emoji:'🌅' },
  { key:'qiyam', label:'قيام الليل', emoji:'🌙' },
  { key:'witr', label:'ركعة الوتر', emoji:'✨' },
]
const COUNTERS = [
  { key:'istighfar_count', label:'🙏 الاستغفار', target:100 },
  { key:'salah_nabi_count', label:'💚 الصلاة على النبي ﷺ', target:100 },
  { key:'hawqala_count', label:'⚡ الحوقلة', target:100 },
  { key:'iftiqar_count', label:'🌿 ورد الافتقار', target:50 },
]
const ATHKAR_CHECKS = [
  { key:'athkar_morning', label:'أذكار الصباح', emoji:'🌅' },
  { key:'athkar_evening', label:'أذكار المساء', emoji:'🌆' },
]
const today = () => new Date().toISOString().split('T')[0]
const defaultCard = () => ({
  date:today(), fajr:false, dhuhr:false, asr:false, maghrib:false, isha:false,
  sunnan_count:0, duha:false, qiyam:false, witr:false,
  athkar_morning:false, athkar_evening:false, quran_wird:false,
  istighfar_count:0, salah_nabi_count:0, hawqala_count:0, iftiqar_count:0,
  tazkia_done:false, week_theme:'', score:0
})

function calcScore(s, st=12) {
  let done=0, total=0
  SALAWAT.forEach(({key})=>{ total++; if(s[key]===true) done++ })
  total++; if((s.sunnan_count||0)>=st) done++
  ;[...QIYAM_CHECKS, ...ATHKAR_CHECKS].forEach(({key})=>{ total++; if(s[key]) done++ })
  total++; if(s.quran_wird) done++
  COUNTERS.forEach(({key,target})=>{ total++; if((s[key]||0)>=target) done++ })
  total++; if(s.tazkia_done) done++
  return total>0?Math.round((done/total)*100):0
}

export default function DailyCard({ onNavigate }) {
  const { user, logout } = useAuth()
  const [card, setCard] = useState(defaultCard())
  const [worldly, setWorldly] = useState({reading_15:false, skill_30:false})
  const [tazkia, setTazkia] = useState({icon:'🗣️',title:'أسبوع الصمت',task:'التزمت بالصمت إلا لضرورة أو خير'})
  const [worldlyGoals, setWorldlyGoals] = useState([
    {id:'reading_15',label:'قراءة كتاب',duration:'١٥ دقيقة',icon:'📚'},
    {id:'skill_30',label:'تعلم مهارة جديدة',duration:'٣٠ دقيقة',icon:'🎯'}
  ])
  const [sunnanTarget, setSunnanTarget] = useState(12)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [streak, setStreak] = useState(0)

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    const { data: settings } = await supabase.from('admin_settings').select('*')
    if (settings) settings.forEach(s => {
      if (s.setting_key==='current_tazkia') setTazkia(s.setting_value)
      if (s.setting_key==='worldly_goals') setWorldlyGoals(s.setting_value)
      if (s.setting_key==='sunnan_target') setSunnanTarget(parseInt(s.setting_value))
    })
    const {data:c} = await supabase.from('daily_cards').select('*').eq('user_id',user.id).eq('date',today()).single()
    if (c) setCard(c)
    const {data:w} = await supabase.from('worldly_goals').select('*').eq('user_id',user.id).eq('date',today()).single()
    if (w) setWorldly(w)
    calcStreak()
  }

  const calcStreak = async () => {
    const {data} = await supabase.from('daily_cards').select('date,score').eq('user_id',user.id).order('date',{ascending:false}).limit(30)
    if (!data) return
    let s=0
    for (let i=0;i<data.length;i++) {
      const expected = new Date(); expected.setDate(expected.getDate()-i)
      if (data[i]?.date===expected.toISOString().split('T')[0]&&data[i]?.score>0) s++
      else break
    }
    setStreak(s)
  }

  const upd = (key,val) => setCard(prev=>{const n={...prev,[key]:val};n.score=calcScore(n,sunnanTarget);return n})
  const toggle = (key) => upd(key,!card[key])
  const salahState = (key) => card[key]===true?'done':card[key]==='missed'?'missed':''
  const toggleSalah = (key) => { const v=card[key]; upd(key,!v?true:v===true?'missed':false) }

  const save = async () => {
    setSaving(true)
    await supabase.from('daily_cards').upsert({...card,user_id:user.id,score:calcScore(card,sunnanTarget),week_theme:tazkia.title},{onConflict:'user_id,date'})
    await supabase.from('worldly_goals').upsert({...worldly,user_id:user.id,date:today()},{onConflict:'user_id,date'})
    setSaving(false); showToast('✅ تم الحفظ!'); calcStreak()
  }

  const copyCard = async () => {
    await save()
    const sc = calcScore(card,sunnanTarget)
    const sl = SALAWAT.map(s=>(card[s.key]===true?'✅':card[s.key]==='missed'?'❌':'⬜')+s.name).join(' ')
    navigator.clipboard.writeText(`🌙 بطاقة لحظة وعي\n━━━━━━━━━━━━━━━\n👤 ${user.name} | 📅 ${card.date}\n🕌 ${sl}\n📿 السنن: ${card.sunnan_count||0}/${sunnanTarget}\n📊 ${sc}%\n━━━━━━━━━━━━━━━`).then(()=>showToast('📋 تم النسخ!')).catch(()=>showToast('انسخ يدوياً'))
  }

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(''),3000) }
  const score = calcScore(card,sunnanTarget)
  const scoreColor = score>=80?'var(--green-light)':score>=50?'var(--gold)':'var(--red)'

  return (
    <div className="app-container">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div>
          <p style={{fontSize:11,color:'var(--text-sub)'}}>أهلاً</p>
          <p style={{fontSize:15,fontWeight:700,color:'var(--gold-light)'}}>{user.name} 🌙</p>
        </div>
        <div style={{display:'flex',gap:6,alignItems:'center'}}>
          {streak>0&&<span style={{fontSize:11,background:'rgba(201,168,76,0.15)',color:'var(--gold)',padding:'3px 8px',borderRadius:20,border:'1px solid rgba(201,168,76,0.25)'}}>🔥{streak}</span>}
          <button className="btn btn-ghost" style={{padding:'6px 10px',fontSize:11}} onClick={()=>onNavigate('hafiz')}>📖 حفاظ</button>
          <button className="btn btn-ghost" style={{padding:'6px 10px',fontSize:11}} onClick={logout}>خروج</button>
        </div>
      </div>

      <div className="week-pill">
        <span className="wp-icon">{tazkia.icon}</span>
        <div style={{flex:1}}><div className="wp-label">أسبوع التزكية</div><div className="wp-title">{tazkia.title}</div></div>
      </div>

      <div className="card" style={{background:'linear-gradient(135deg,rgba(201,168,76,0.08),rgba(201,168,76,0.03))',border:'1px solid rgba(201,168,76,0.2)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div><div className="score-big" style={{fontSize:46,color:scoreColor}}>{score}%</div>
          <p style={{fontSize:11,color:'var(--text-sub)',marginTop:2}}>{score===100?'يوم مثالي 🌟':score>=80?'ماشي على الخطة 💪':score>=50?'نصف الطريق 🔥':'ابدأ الآن ⏰'}</p></div>
          <div style={{textAlign:'center'}}><div style={{fontSize:28}}>🔥</div><p style={{fontSize:18,fontWeight:700,color:'var(--gold)'}}>{streak}</p><p style={{fontSize:10,color:'var(--text-sub)'}}>يوم متتالي</p></div>
        </div>
        <div className="progress-bar" style={{marginTop:10}}><div className="progress-fill" style={{width:score+'%'}}/></div>
      </div>

      {/* Salah */}
      <div className="card">
        <div className="card-accent gold"/>
        <div className="section-title"><span className="icon">🕌</span><span className="label">الصلوات والسنن</span></div>
        <div className="salah-row" style={{marginBottom:12}}>
          {SALAWAT.map(s=>(
            <div key={s.key} className={`salah-circle ${salahState(s.key)}`} onClick={()=>toggleSalah(s.key)}>
              <span className="s-name">{s.name}</span>
              <div className="salah-dot">{salahState(s.key)==='done'?'✓':salahState(s.key)==='missed'?'✗':s.emoji}</div>
            </div>
          ))}
        </div>
        <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:10,padding:'10px 12px',marginBottom:8}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:7}}>
            <span style={{fontSize:12.5,fontWeight:600}}>📿 السنن الرواتب</span>
            <span style={{fontSize:13,fontWeight:700,color:(card.sunnan_count||0)>=sunnanTarget?'var(--green-light)':'var(--gold)'}}>{card.sunnan_count||0}/{sunnanTarget}</span>
          </div>
          <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
            {Array.from({length:sunnanTarget}).map((_,i)=>(
              <div key={i} onClick={()=>upd('sunnan_count',i<(card.sunnan_count||0)?i:i+1)}
                style={{width:26,height:26,borderRadius:6,cursor:'pointer',transition:'all 0.15s',
                  background:i<(card.sunnan_count||0)?'var(--green-light)':'rgba(255,255,255,0.05)',
                  border:`1px solid ${i<(card.sunnan_count||0)?'var(--green-light)':'rgba(255,255,255,0.1)'}`,
                  display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,
                  color:i<(card.sunnan_count||0)?'white':'var(--text-sub)',fontWeight:700}}
              >{i+1}</div>
            ))}
          </div>
        </div>
        <div className="grid-2" style={{gap:8}}>
          {QIYAM_CHECKS.map(c=>(
            <div key={c.key} className={`check-item ${card[c.key]?'done':''}`} onClick={()=>toggle(c.key)}>
              <div className="check-box">{card[c.key]?'✓':c.emoji}</div><span className="check-label">{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quran */}
      <div className="card">
        <div className="card-accent green"/>
        <div className="section-title"><span className="icon">📖</span><span className="label">القرآن الكريم</span></div>
        <div className={`check-item ${card.quran_wird?'done':''}`} onClick={()=>toggle('quran_wird')}>
          <div className="check-box">{card.quran_wird?'✓':'📖'}</div><span className="check-label">ورد القراءة اليومي</span>
        </div>
        <p style={{fontSize:11,color:'var(--text-sub)',marginTop:8,textAlign:'center'}}>الحفظ والمراجعة التفصيلية ← تاب الحفاظ 📖</p>
      </div>

      {/* Athkar */}
      <div className="card">
        <div className="card-accent blue"/>
        <div className="section-title"><span className="icon">🤲</span><span className="label">الأذكار والأوراد</span></div>
        <div className="grid-2" style={{gap:8,marginBottom:10}}>
          {ATHKAR_CHECKS.map(c=>(
            <div key={c.key} className={`check-item ${card[c.key]?'done':''}`} onClick={()=>toggle(c.key)}>
              <div className="check-box">{card[c.key]?'✓':c.emoji}</div><span className="check-label">{c.label}</span>
            </div>
          ))}
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:7}}>
          {COUNTERS.map(c=>(
            <div key={c.key} className="counter-row">
              <span className="counter-label">{c.label}</span>
              <div className="counter-ctrl">
                <button className="c-btn" onClick={()=>upd(c.key,Math.max(0,(card[c.key]||0)-10))}>−</button>
                <span className="c-val" style={{color:(card[c.key]||0)>=c.target?'var(--green-light)':'var(--gold-light)'}}>{card[c.key]||0}</span>
                <button className="c-btn" onClick={()=>upd(c.key,Math.min(c.target,(card[c.key]||0)+10))}>+</button>
                <span className="c-target">/{c.target}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tazkia */}
      <div className="card">
        <div className="card-accent teal"/>
        <div className="section-title"><span className="icon">{tazkia.icon}</span><span className="label">التزكية الأسبوعية</span></div>
        <div className={`check-item ${card.tazkia_done?'done':''}`} onClick={()=>toggle('tazkia_done')}>
          <div className="check-box">{card.tazkia_done?'✓':'🌱'}</div><span className="check-label">{tazkia.task}</span>
        </div>
      </div>

      {/* Worldly */}
      <div className="card">
        <div className="card-accent purple"/>
        <div className="section-title"><span className="icon">🌍</span><span className="label">نافذة التقدم</span></div>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {worldlyGoals.map(g=>(
            <div key={g.id} className={`check-item ${worldly[g.id]?'done':''}`} onClick={()=>setWorldly(prev=>({...prev,[g.id]:!prev[g.id]}))}>
              <div className="check-box">{worldly[g.id]?'✓':g.icon}</div>
              <span className="check-label">{g.label}</span>
              <span style={{fontSize:11,color:'var(--text-sub)',marginRight:'auto'}}>{g.duration}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2" style={{gap:10,marginTop:4}}>
        <button className="btn btn-gold btn-full" onClick={save} disabled={saving}>{saving?'...':'💾 حفظ'}</button>
        <button className="btn btn-ghost btn-full" onClick={copyCard}>📤 إرسال</button>
      </div>
      <div className={`toast ${toast?'show':''}`}>{toast}</div>
    </div>
  )
}
