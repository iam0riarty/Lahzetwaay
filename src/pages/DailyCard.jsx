import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const WEEKS = [
  { icon:'🗣️', title:'أسبوع الصمت', task:'التزمت بالصمت إلا لضرورة أو خير' },
  { icon:'🍽️', title:'أسبوع الجوع', task:'خففت الطعام وتأملت في نعمة الشبع' },
  { icon:'👁️', title:'أسبوع الغض', task:'غضضت بصري وقللت الشاشات' },
  { icon:'🤲', title:'أسبوع السخاء', task:'تصدقت أو خدمت شخصاً بلا مقابل' },
  { icon:'😊', title:'أسبوع البشاشة', task:'ابتسمت وأسعدت شخصاً من حولي' },
  { icon:'🧹', title:'أسبوع الطهارة', task:'حافظت على الوضوء الدائم' },
  { icon:'🌙', title:'أسبوع الليل', task:'قمت الليل ودعوت في السجود بصدق' },
  { icon:'🤫', title:'أسبوع إخفاء العمل', task:'عملت خيراً سرياً لا يعلمه أحد' },
  { icon:'🌿', title:'أسبوع الزهد', task:'أحجمت عن الاستهلاك وتأملت الزوال' },
  { icon:'👥', title:'أسبوع صلة الرحم', task:'تواصلت مع أهلي وأسعدت أحدهم' },
]

const SALAWAT = [
  { key:'fajr', name:'الفجر', emoji:'🌙' },
  { key:'dhuhr', name:'الظهر', emoji:'☀️' },
  { key:'asr', name:'العصر', emoji:'🌤️' },
  { key:'maghrib', name:'المغرب', emoji:'🌅' },
  { key:'isha', name:'العشاء', emoji:'⭐' },
]

const CHECKS = [
  { key:'sunnan', label:'السنن الرواتب', emoji:'📿' },
  { key:'duha', label:'الضحى ٤ ركعات', emoji:'🌅' },
  { key:'qiyam', label:'قيام الليل', emoji:'🌙' },
  { key:'witr', label:'ركعة الوتر', emoji:'✨' },
  { key:'athkar_morning', label:'أذكار الصباح', emoji:'🌅' },
  { key:'athkar_evening', label:'أذكار المساء', emoji:'🌆' },
  { key:'tazkia_done', label:'التزكية الأسبوعية', emoji:'🌱' },
]

const QURAN_ITEMS = [
  { key:'quran_wird', label:'ورد القراءة', emoji:'📖' },
  { key:'quran_review_old', label:'مراجعة المحفوظ', emoji:'🔄' },
  { key:'quran_review_new', label:'مراجعة الحفظ الجديد', emoji:'✅' },
]

const COUNTERS = [
  { key:'istighfar_count', label:'🙏 الاستغفار', target:100 },
  { key:'salah_nabi_count', label:'💚 الصلاة على النبي ﷺ', target:100 },
  { key:'hawqala_count', label:'⚡ الحوقلة', target:100 },
  { key:'iftiqar_count', label:'🌿 ورد الافتقار', target:50 },
]

const today = () => new Date().toISOString().split('T')[0]
const weekIdx = () => Math.floor((Date.now() - new Date(new Date().getFullYear(),0,0)) / (7*86400000)) % WEEKS.length

const defaultState = () => ({
  date: today(),
  fajr:false, dhuhr:false, asr:false, maghrib:false, isha:false,
  sunnan:false, duha:false, qiyam:false, witr:false,
  athkar_morning:false, athkar_evening:false,
  quran_wird:false, quran_review_old:false, quran_review_new:false,
  quran_new_hafz:'',
  istighfar_count:0, salah_nabi_count:0, hawqala_count:0, iftiqar_count:0,
  tazkia_done:false, tazkia_note:'', week_theme: WEEKS[weekIdx()].title,
  moment_text:'', score:0
})

function calcScore(s) {
  let done=0, total=0
  ;[...SALAWAT.map(x=>x.key), ...CHECKS.map(x=>x.key), ...QURAN_ITEMS.map(x=>x.key)].forEach(k=>{ total++; if(s[k]) done++ })
  COUNTERS.forEach(({key,target})=>{ total++; if((s[key]||0)>=target) done++ })
  return total>0?Math.round((done/total)*100):0
}

export default function DailyCard({ onNavigate }) {
  const { user, logout } = useAuth()
  const [card, setCard] = useState(defaultState())
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [weekI, setWeekI] = useState(weekIdx())

  const week = WEEKS[weekI]

  useEffect(() => { loadCard() }, [])

  const loadCard = async () => {
    const { data } = await supabase
      .from('daily_cards').select('*')
      .eq('user_id', user.id).eq('date', today()).single()
    if (data) setCard(data)
  }

  const update = (key, val) => setCard(prev => {
    const next = { ...prev, [key]: val }
    next.score = calcScore(next)
    return next
  })

  const toggle3 = (key) => {
    const cur = card[key]
    update(key, cur === false ? true : cur === true ? 'missed' : false)
  }

  const salahState = (key) => {
    const v = card[key]
    if (v === true) return 'done'
    if (v === 'missed') return 'missed'
    return ''
  }

  const checkState = (key) => {
    const v = card[key]
    if (v === true) return 'done'
    if (v === 'missed') return 'missed'
    return ''
  }

  const save = async () => {
    setSaving(true)
    const payload = { ...card, user_id: user.id, score: calcScore(card), week_theme: week.title }
    const { error } = await supabase.from('daily_cards')
      .upsert(payload, { onConflict: 'user_id,date' })
    setSaving(false)
    showToast(error ? '❌ حصل خطأ — حاول تاني' : '✅ تم الحفظ!')
  }

  const copyCard = async () => {
    await save()
    const score = calcScore(card)
    const salahLine = SALAWAT.map(s => (card[s.key]===true?'✅':card[s.key]==='missed'?'❌':'⬜')+s.name).join(' ')
    const text = `🌙 بطاقة لحظة وعي\n━━━━━━━━━━━━━━━\n👤 ${user.name} | 📅 ${card.date}\n━━━━━━━━━━━━━━━\n🕌 ${salahLine}\n📊 النتيجة: ${score}%\n🌙 لحظة وعي:\n${card.moment_text||'—'}\n━━━━━━━━━━━━━━━`
    navigator.clipboard.writeText(text).then(()=>showToast('📋 تم النسخ — أرسلها!')).catch(()=>showToast('انسخ يدوياً'))
  }

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(()=>setToast(''), 3000)
  }

  const score = calcScore(card)
  const scoreLabel = score===100?'يوم مثالي 🌟':score>=80?'ماشي على الخطة 💪':score>=50?'نصف الطريق 🔥':'لحظة وعي — ابدأ الآن ⏰'

  return (
    <div className="app-container">
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div>
          <p style={{fontSize:11,color:'var(--text-sub)'}}>أهلاً</p>
          <p style={{fontSize:15,fontWeight:700,color:'var(--gold-light)'}}>{user.name} 🌙</p>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-ghost" style={{padding:'7px 12px',fontSize:12}} onClick={()=>onNavigate('hafiz')}>📖 حفاظ</button>
          <button className="btn btn-ghost" style={{padding:'7px 12px',fontSize:12}} onClick={logout}>خروج</button>
        </div>
      </div>

      {/* Week badge */}
      <div className="week-pill">
        <span className="wp-icon">{week.icon}</span>
        <div style={{flex:1}}>
          <div className="wp-label">أسبوع التزكية</div>
          <div className="wp-title">{week.title}</div>
        </div>
        <button className="c-btn" onClick={()=>setWeekI((weekI+1)%WEEKS.length)} style={{fontSize:14}}>↻</button>
      </div>

      {/* Score */}
      <div className="card" style={{background:'linear-gradient(135deg,rgba(201,168,76,0.1),rgba(201,168,76,0.04))',border:'1px solid rgba(201,168,76,0.25)'}}>
        <div className="score-ring">
          <div className="score-big">{score}%</div>
          <p style={{fontSize:12,color:'var(--text-sub)',marginTop:4}}>{scoreLabel}</p>
          <div className="progress-bar"><div className="progress-fill" style={{width:score+'%'}}/></div>
        </div>
      </div>

      {/* Salah */}
      <div className="card">
        <div className="card-accent gold"/>
        <div className="section-title"><span className="icon">🕌</span><span className="label">الصلوات الخمسة</span></div>
        <div className="salah-row" style={{marginBottom:10}}>
          {SALAWAT.map(s=>(
            <div key={s.key} className={`salah-circle ${salahState(s.key)}`} onClick={()=>toggle3(s.key)}>
              <span className="s-name">{s.name}</span>
              <div className="salah-dot">{salahState(s.key)==='done'?'✓':salahState(s.key)==='missed'?'✗':s.emoji}</div>
            </div>
          ))}
        </div>
        <div className="grid-2" style={{gap:8}}>
          {CHECKS.slice(0,4).map(c=>(
            <div key={c.key} className={`check-item ${checkState(c.key)}`} onClick={()=>toggle3(c.key)}>
              <div className="check-box">{checkState(c.key)==='done'?'✓':checkState(c.key)==='missed'?'✗':c.emoji}</div>
              <span className="check-label">{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quran */}
      <div className="card">
        <div className="card-accent green"/>
        <div className="section-title"><span className="icon">📖</span><span className="label">القرآن الكريم</span></div>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {QURAN_ITEMS.map(q=>(
            <div key={q.key} className={`check-item ${checkState(q.key)}`} onClick={()=>toggle3(q.key)}>
              <div className="check-box">{checkState(q.key)==='done'?'✓':checkState(q.key)==='missed'?'✗':q.emoji}</div>
              <span className="check-label">{q.label}</span>
            </div>
          ))}
          <input className="input-field" placeholder="ما حفظته هذا الأسبوع..." value={card.quran_new_hafz||''} onChange={e=>update('quran_new_hafz',e.target.value)} style={{marginTop:4}}/>
        </div>
      </div>

      {/* Athkar counters */}
      <div className="card">
        <div className="card-accent blue"/>
        <div className="section-title"><span className="icon">🤲</span><span className="label">الأذكار والأوراد</span></div>
        <div style={{display:'flex',flexDirection:'column',gap:7,marginBottom:10}}>
          {COUNTERS.map(c=>(
            <div key={c.key} className="counter-row">
              <span className="counter-label">{c.label}</span>
              <div className="counter-ctrl">
                <button className="c-btn" onClick={()=>update(c.key,Math.max(0,(card[c.key]||0)-10))}>−</button>
                <span className="c-val">{card[c.key]||0}</span>
                <button className="c-btn" onClick={()=>update(c.key,Math.min(c.target,(card[c.key]||0)+10))}>+</button>
                <span className="c-target">/{c.target}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="grid-2" style={{gap:8}}>
          {CHECKS.slice(4,6).map(c=>(
            <div key={c.key} className={`check-item ${checkState(c.key)}`} onClick={()=>toggle3(c.key)}>
              <div className="check-box">{checkState(c.key)==='done'?'✓':checkState(c.key)==='missed'?'✗':c.emoji}</div>
              <span className="check-label">{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tazkia */}
      <div className="card">
        <div className="card-accent teal"/>
        <div className="section-title"><span className="icon">🌱</span><span className="label">التزكية الأسبوعية</span></div>
        <div className={`check-item ${checkState('tazkia_done')}`} onClick={()=>toggle3('tazkia_done')} style={{marginBottom:8}}>
          <div className="check-box">{checkState('tazkia_done')==='done'?'✓':checkState('tazkia_done')==='missed'?'✗':'🌱'}</div>
          <span className="check-label">{week.task}</span>
        </div>
        <textarea className="input-field" placeholder="كيف طبّقت التزكية اليوم؟" value={card.tazkia_note||''} onChange={e=>update('tazkia_note',e.target.value)}/>
      </div>

      {/* Moment */}
      <div className="card">
        <div className="card-accent purple"/>
        <div className="section-title"><span className="icon">🌙</span><span className="label">لحظة وعي اليوم</span></div>
        <textarea className="input-field" placeholder="موقف أو فكرة نبّهتك اليوم... ولو جملة واحدة 🌙" value={card.moment_text||''} onChange={e=>update('moment_text',e.target.value)} style={{minHeight:80}}/>
      </div>

      {/* Actions */}
      <div className="grid-2" style={{gap:10,marginTop:4}}>
        <button className="btn btn-gold btn-full" onClick={save} disabled={saving}>{saving?'...':'💾 حفظ'}</button>
        <button className="btn btn-ghost btn-full" onClick={copyCard}>📤 إرسال للجروب</button>
      </div>

      <div className={`toast ${toast?'show':''}`}>{toast}</div>
    </div>
  )
}
