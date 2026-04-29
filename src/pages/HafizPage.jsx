import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const today = () => new Date().toISOString().split('T')[0]

export default function HafizPage({ onBack }) {
  const { user, verifyCode } = useAuth()
  const [unlocked, setUnlocked] = useState(false)
  const [codeInput, setCodeInput] = useState('')
  const [codeError, setCodeError] = useState('')
  const [card, setCard] = useState({
    date: today(),
    new_surah: '', new_verses: '',
    review_old: '', review_new: '', notes: ''
  })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  const unlock = async () => {
    const correct = await verifyCode('hafiz')
    if (codeInput === correct) {
      setUnlocked(true)
      loadCard()
    } else {
      setCodeError('الكود غلط 🔒')
    }
  }

  const loadCard = async () => {
    const { data } = await supabase.from('hafiz_cards')
      .select('*').eq('user_id', user.id).eq('date', today()).single()
    if (data) setCard(data)
  }

  const save = async () => {
    setSaving(true)
    const { error } = await supabase.from('hafiz_cards')
      .upsert({ ...card, user_id: user.id }, { onConflict: 'user_id,date' })
    setSaving(false)
    showToast(error ? '❌ حصل خطأ' : '✅ تم الحفظ!')
  }

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(''),3000) }

  if (!unlocked) return (
    <div className="app-container" style={{display:'flex',flexDirection:'column',justifyContent:'center',minHeight:'100vh'}}>
      <div style={{textAlign:'center',marginBottom:28}}>
        <span style={{fontSize:48}}>🔒</span>
        <h2 style={{fontFamily:'Amiri,serif',fontSize:26,color:'var(--gold)',marginTop:8}}>نافذة الحفاظ</h2>
        <p style={{fontSize:12,color:'var(--text-sub)',marginTop:6,letterSpacing:2}}>أدخل الكود السري للدخول</p>
      </div>
      <div className="card">
        <div className="card-accent green"/>
        <input className="input-field" type="password" placeholder="الكود السري..." value={codeInput} onChange={e=>setCodeInput(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&unlock()} style={{marginBottom:10,direction:'ltr',textAlign:'center',letterSpacing:4,fontSize:18}}/>
        {codeError && <p style={{color:'var(--red)',fontSize:13,textAlign:'center',marginBottom:8}}>{codeError}</p>}
        <button className="btn btn-gold btn-full" onClick={unlock}>🌿 دخول</button>
      </div>
      <button className="btn btn-ghost" style={{marginTop:12}} onClick={onBack}>← رجوع</button>
    </div>
  )

  return (
    <div className="app-container">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div>
          <p style={{fontSize:11,color:'var(--text-sub)'}}>نافذة</p>
          <p style={{fontSize:16,fontWeight:700,color:'var(--green-light)'}}>📖 الحفاظ</p>
        </div>
        <button className="btn btn-ghost" style={{padding:'7px 12px',fontSize:12}} onClick={onBack}>← رجوع</button>
      </div>

      {/* الحفظ الجديد */}
      <div className="card">
        <div className="card-accent green"/>
        <div className="section-title"><span className="icon">🆕</span><span className="label">الحفظ الجديد هذا الأسبوع</span></div>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          <input className="input-field" placeholder="السورة / الجزء..." value={card.new_surah} onChange={e=>setCard({...card,new_surah:e.target.value})}/>
          <textarea className="input-field" placeholder="الآيات المحفوظة..." value={card.new_verses} onChange={e=>setCard({...card,new_verses:e.target.value})} style={{minHeight:100,fontFamily:'Amiri,serif',fontSize:16,lineHeight:1.9}}/>
        </div>
      </div>

      {/* مراجعة القديم */}
      <div className="card">
        <div className="card-accent blue"/>
        <div className="section-title"><span className="icon">🔄</span><span className="label">مراجعة المحفوظ القديم</span></div>
        <textarea className="input-field" placeholder="ما راجعته اليوم من القديم..." value={card.review_old} onChange={e=>setCard({...card,review_old:e.target.value})} style={{minHeight:80,fontFamily:'Amiri,serif',fontSize:15,lineHeight:1.8}}/>
      </div>

      {/* مراجعة الجديد */}
      <div className="card">
        <div className="card-accent gold"/>
        <div className="section-title"><span className="icon">✅</span><span className="label">مراجعة الحفظ الجديد</span></div>
        <textarea className="input-field" placeholder="ما راجعته من الحفظ الجديد..." value={card.review_new} onChange={e=>setCard({...card,review_new:e.target.value})} style={{minHeight:80,fontFamily:'Amiri,serif',fontSize:15,lineHeight:1.8}}/>
      </div>

      {/* ملاحظات */}
      <div className="card">
        <div className="card-accent purple"/>
        <div className="section-title"><span className="icon">📝</span><span className="label">ملاحظات الجلسة</span></div>
        <textarea className="input-field" placeholder="ملاحظاتك ومشاعرك مع القرآن اليوم..." value={card.notes} onChange={e=>setCard({...card,notes:e.target.value})} style={{minHeight:80}}/>
      </div>

      <button className="btn btn-gold btn-full" onClick={save} disabled={saving} style={{marginTop:4}}>
        {saving ? '...' : '💾 حفظ جلسة الحفظ'}
      </button>

      <div className={`toast ${toast?'show':''}`}>{toast}</div>
    </div>
  )
}
