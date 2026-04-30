import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const SALAWAT = [
  {key:'fajr',name:'الفجر',emoji:'🌙'},
  {key:'dhuhr',name:'الظهر',emoji:'☀️'},
  {key:'asr',name:'العصر',emoji:'🌤️'},
  {key:'maghrib',name:'المغرب',emoji:'🌅'},
  {key:'isha',name:'العشاء',emoji:'⭐'},
]
const ATHKAR = [
  {key:'athkar_morning',label:'أذكار الصباح',emoji:'🌅'},
  {key:'athkar_evening',label:'أذكار المساء',emoji:'🌆'},
]
const DEFAULT_WIRDS = [
  {id:'istighfar',key:'istighfar_count',label:'الاستغفار',icon:'🙏',target:100},
  {id:'salah_nabi',key:'salah_nabi_count',label:'الصلاة على النبي ﷺ',icon:'💚',target:100},
  {id:'hawqala',key:'hawqala_count',label:'الحوقلة',icon:'⚡',target:100},
  {id:'iftiqar',key:'iftiqar_count',label:'ورد الافتقار',icon:'🌿',target:50},
]

const today = () => new Date().toISOString().split('T')[0]

const defaultCard = () => ({
  date:today(), fajr:false, dhuhr:false, asr:false, maghrib:false, isha:false,
  sunnan_count:0, duha_count:0, qiyam:false, witr:false,
  athkar_morning:false, athkar_evening:false, quran_wird:false,
  istighfar_count:0, salah_nabi_count:0, hawqala_count:0, iftiqar_count:0,
  tazkia_done:false, week_theme:'', score:0
})

function calcScore(s, wirds=DEFAULT_WIRDS) {
  let done=0,total=0
  SALAWAT.forEach(({key})=>{ total++; if(s[key]===true) done++ })
  total++; if((s.sunnan_count||0)>=12) done++
  total++; if((s.duha_count||0)>=4) done++
  total++; if(s.qiyam) done++
  total++; if(s.witr) done++
  ATHKAR.forEach(({key})=>{ total++; if(s[key]) done++ })
  total++; if(s.quran_wird) done++
  wirds.forEach(w=>{ const k=w.key||w.id+'_count'; total++; if((s[k]||0)>=(w.target||100)) done++ })
  total++; if(s.tazkia_done) done++
  return total>0?Math.round((done/total)*100):0
}

export default function DailyCard({ onNavigate }) {
  const { user, logout } = useAuth()
  const [card, setCard] = useState(defaultCard())
  const [worldly, setWorldly] = useState({})
  const [tazkia, setTazkia] = useState({icon:'🗣️',title:'أسبوع الصمت',task:'التزمت بالصمت إلا لضرورة أو خير'})
  const [worldlyGoals, setWorldlyGoals] = useState([
    {id:'reading_15',label:'قراءة كتاب',duration:'١٥ دقيقة',icon:'📚'},
    {id:'skill_30',label:'تعلم مهارة جديدة',duration:'٣٠ دقيقة',icon:'🎯'},
  ])
  const [wirds, setWirds] = useState(DEFAULT_WIRDS)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [streak, setStreak] = useState(0)

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    const {data:s} = await supabase.from('admin_settings').select('*')
    if(s) s.forEach(x=>{
      if(x.setting_key==='current_tazkia') setTazkia(x.setting_value)
      if(x.setting_key==='worldly_goals')  setWorldlyGoals(x.setting_value)
      if(x.setting_key==='wirds')          setWirds(x.setting_value)
    })
    const {data:c} = await supabase.from('daily_cards').select('*').eq('user_id',user.id).eq('date',today()).single()
    if(c) setCard(c)
    const {data:w} = await supabase.from('worldly_goals').select('*').eq('user_id',user.id).eq('date',today()).single()
    if(w) setWorldly(w)
    calcStreak()
  }

  const calcStreak = async () => {
    const {data} = await supabase.from('daily_cards').select('date,score').eq('user_id',user.id).order('date',{ascending:false}).limit(30)
    if(!data) return
    let s=0
    for(let i=0;i<data.length;i++){
      const exp=new Date(); exp.setDate(exp.getDate()-i)
      if(data[i]?.date===exp.toISOString().split('T')[0]&&data[i]?.score>0) s++
      else break
    }
    setStreak(s)
  }

  const upd = (key,val) => setCard(p=>{ const n={...p,[key]:val}; n.score=calcScore(n,wirds); return n })
  const toggle = (key) => upd(key,!card[key])
  const salahState = (key) => card[key]===true?'done':card[key]==='missed'?'missed':''
  const toggleSalah = (key) => { const v=card[key]; upd(key,!v?true:v===true?'missed':false) }

  const BoxCounter = ({countKey, total}) => (
    <div style={{display:'flex',gap:3,flexWrap:'wrap',marginTop:6}}>
      {Array.from({length:total}).map((_,i)=>(
        <div key={i} onClick={()=>upd(countKey,i<(card[countKey]||0)?i:i+1)}
          style={{width:25,height:25,borderRadius:5,cursor:'pointer',transition:'all 0.12s',
            background:i<(card[countKey]||0)?'var(--green-light)':'rgba(255,255,255,0.05)',
            border:`1px solid ${i<(card[countKey]||0)?'var(--green-light)':'rgba(255,255,255,0.1)'}`,
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:9,color:i<(card[countKey]||0)?'white':'var(--text-sub)',fontWeight:700}}>
          {i+1}
        </div>
      ))}
    </div>
  )

  const save = async () => {
    setSaving(true)
    await supabase.from('daily_cards').upsert({...card,user_id:user.id,score:calcScore(card,wirds),week_theme:tazkia.title},{onConflict:'user_id,date'})
    await supabase.from('worldly_goals').upsert({...worldly,user_id:user.id,date:today()},{onConflict:'user_id,date'})
    setSaving(false); showToast('✅ تم الحفظ بنجاح'); calcStreak()
  }

  const copyCard = async () => {
    await save()
    const sc=calcScore(card,wirds)
    const sl=SALAWAT.map(s=>(card[s.key]===true?'✅':card[s.key]==='missed'?'❌':'⬜')+s.name).join(' ')
    navigator.clipboard.writeText(
      `🌙 بطاقة لحظة وعي\n━━━━━━━━━━━━━━━\n👤 ${user.name}  |  📅 ${card.date}\n🕌 ${sl}\n📿 السنن: ${card.sunnan_count||0}/12  🌅 الضحى: ${card.duha_count||0}/4\n📊 النتيجة: ${sc}%\n━━━━━━━━━━━━━━━`
    ).then(()=>showToast('📋 تم النسخ — أرسلها للجروب!')).catch(()=>showToast('انسخ يدوياً'))
  }

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(''),3000) }
  const score = calcScore(card,wirds)
  const sc = score>=80?'var(--green-light)':score>=50?'var(--gold)':'var(--red)'

  return (
    <div className="app-container">
      {/* Top */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <div>
          <p style={{fontSize:11,color:'var(--text-sub)'}}>مرحباً</p>
          <p style={{fontFamily:'var(--font-arabic)',fontSize:17,fontWeight:700,color:'var(--gold-light)'}}>{user.name} 🌙</p>
        </div>
        <div style={{display:'flex',gap:5,alignItems:'center'}}>
          {streak>0&&<span style={{fontSize:11,background:'rgba(201,168,76,0.15)',color:'var(--gold)',padding:'3px 8px',borderRadius:20,border:'1px solid rgba(201,168,76,0.25)'}}>🔥 {streak}</span>}
          <button className="btn btn-ghost" style={{padding:'6px 10px',fontSize:11}} onClick={()=>onNavigate('hafiz')}>📖 حفاظ</button>
          <button className="btn btn-ghost" style={{padding:'6px 10px',fontSize:11}} onClick={logout}>خروج</button>
        </div>
      </div>

      {/* Tazkia */}
      <div className="week-pill">
        <span className="wp-icon">{tazkia.icon}</span>
        <div style={{flex:1}}><div className="wp-label">أسبوع التزكية</div><div className="wp-title">{tazkia.title}</div></div>
      </div>

      {/* Score */}
      <div className="card" style={{background:'linear-gradient(135deg,rgba(201,168,76,0.08),rgba(201,168,76,0.03))',border:'1px solid rgba(201,168,76,0.2)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <div style={{fontFamily:'var(--font-arabic)',fontSize:48,color:sc,lineHeight:1,textShadow:`0 0 20px ${sc}`}}>{score}%</div>
            <p style={{fontSize:11,color:'var(--text-sub)',marginTop:3}}>
              {score===100?'يوم مثالي 🌟':score>=80?'ماشٍ على الخطة 💪':score>=50?'نصف الطريق 🔥':'ابدأ الآن ⏰'}
            </p>
          </div>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:26}}>🔥</div>
            <p style={{fontFamily:'var(--font-arabic)',fontSize:20,fontWeight:700,color:'var(--gold)'}}>{streak}</p>
            <p style={{fontSize:10,color:'var(--text-sub)'}}>يوماً متتالياً</p>
          </div>
        </div>
        <div className="progress-bar" style={{marginTop:10}}><div className="progress-fill" style={{width:score+'%'}}/></div>
      </div>

      {/* ── الصلوات ── */}
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
        {[{key:'sunnan_count',label:'السنن الرواتب',total:12},{key:'duha_count',label:'صلاة الضحى',total:4}].map(item=>(
          <div key={item.key} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:10,padding:'10px 12px',marginBottom:8}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:12.5,fontWeight:600}}>📿 {item.label}</span>
              <span style={{fontSize:13,fontWeight:700,color:(card[item.key]||0)>=item.total?'var(--green-light)':'var(--gold)'}}>{card[item.key]||0}/{item.total}</span>
            </div>
            <BoxCounter countKey={item.key} total={item.total}/>
          </div>
        ))}
        <div className="grid-2" style={{gap:8}}>
          {[{key:'qiyam',label:'قيام الليل',emoji:'🌙'},{key:'witr',label:'ركعة الوتر',emoji:'✨'}].map(c=>(
            <div key={c.key} className={`check-item ${card[c.key]?'done':''}`} onClick={()=>toggle(c.key)}>
              <div className="check-box">{card[c.key]?'✓':c.emoji}</div>
              <span className="check-label">{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── القرآن ── */}
      <div className="card">
        <div className="card-accent green"/>
        <div className="section-title"><span className="icon">📖</span><span className="label">القرآن الكريم</span></div>
        <div className={`check-item ${card.quran_wird?'done':''}`} onClick={()=>toggle('quran_wird')}>
          <div className="check-box">{card.quran_wird?'✓':'📖'}</div>
          <span className="check-label">ورد القراءة اليومي</span>
        </div>
        <p style={{fontSize:11,color:'var(--text-sub)',marginTop:8,textAlign:'center'}}>
          الحفظ والمراجعة التفصيلية ← تاب الحفاظ 📖
        </p>
      </div>

      {/* ── الأذكار ── */}
      <div className="card">
        <div className="card-accent blue"/>
        <div className="section-title"><span className="icon">🤲</span><span className="label">الأذكار والأوراد</span></div>
        <div className="grid-2" style={{gap:8,marginBottom:10}}>
          {ATHKAR.map(c=>(
            <div key={c.key} className={`check-item ${card[c.key]?'done':''}`} onClick={()=>toggle(c.key)}>
              <div className="check-box">{card[c.key]?'✓':c.emoji}</div>
              <span className="check-label">{c.label}</span>
            </div>
          ))}
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:7}}>
          {wirds.map(w=>{
            const key=w.key||w.id+'_count', val=card[key]||0, tgt=w.target||100
            return (
              <div key={w.id||w.label} className="counter-row">
                <span className="counter-label">{w.icon} {w.label}</span>
                <div className="counter-ctrl">
                  <button className="c-btn" onClick={()=>upd(key,Math.max(0,val-10))}>−</button>
                  <span className="c-val" style={{color:val>=tgt?'var(--green-light)':'var(--gold-light)'}}>{val}</span>
                  <button className="c-btn" onClick={()=>upd(key,Math.min(tgt,val+10))}>+</button>
                  <span className="c-target">/{tgt}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── التزكية ── */}
      <div className="card">
        <div className="card-accent teal"/>
        <div className="section-title"><span className="icon">{tazkia.icon}</span><span className="label">التزكية الأسبوعية</span></div>
        <div className={`check-item ${card.tazkia_done?'done':''}`} onClick={()=>toggle('tazkia_done')}>
          <div className="check-box">{card.tazkia_done?'✓':'🌱'}</div>
          <span className="check-label">{tazkia.task}</span>
        </div>
      </div>

      {/* ── نافذة التقدم ── */}
      {worldlyGoals.length>0&&(
        <div className="card">
          <div className="card-accent purple"/>
          <div className="section-title"><span className="icon">🌍</span><span className="label">نافذة التقدم</span></div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {worldlyGoals.map(g=>(
              <div key={g.id} className={`check-item ${worldly[g.id]?'done':''}`}
                onClick={()=>setWorldly(p=>({...p,[g.id]:!p[g.id]}))}>
                <div className="check-box">{worldly[g.id]?'✓':g.icon}</div>
                <span className="check-label">{g.label}</span>
                <span style={{fontSize:11,color:'var(--text-sub)',marginRight:'auto'}}>{g.duration}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid-2" style={{gap:10,marginTop:4}}>
        <button className="btn btn-gold btn-full" onClick={save} disabled={saving}>{saving?'...':'💾 حفظ'}</button>
        <button className="btn btn-ghost btn-full" onClick={copyCard}>📤 إرسال للجروب</button>
      </div>

      <div className={`toast ${toast?'show':''}`}>{toast}</div>
    </div>
  )
}
