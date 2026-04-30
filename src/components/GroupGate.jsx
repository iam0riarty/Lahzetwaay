import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export default function GroupGate({ onUnlocked }) {
  const { user } = useAuth()
  const [codeInput, setCodeInput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [windowStatus, setWindowStatus] = useState(null) // null=loading, open/closed
  const [windowMsg, setWindowMsg] = useState('')

  useEffect(() => { checkWindow() }, [])

  const checkWindow = async () => {
    const { data } = await supabase
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'window_status')
      .single()

    if (!data) {
      // No setting yet — default closed
      setWindowStatus('closed')
      setWindowMsg('النافذة مغلقة في الوقت الحالي')
      return
    }

    const val = data.setting_value
    setWindowStatus(val.status || 'closed')
    setWindowMsg(val.message || 'تابع الجروب للحصول على الكود اليومي')
  }

  const verify = async () => {
    setError(''); setLoading(true)
    const { data } = await supabase
      .from('secret_codes')
      .select('code_value')
      .eq('code_type', 'group')
      .single()

    if (data?.code_value === codeInput.trim().toUpperCase()) {
      // Save unlock in session
      sessionStorage.setItem('group_unlocked', 'true')
      onUnlocked()
    } else {
      setError('الكود غير صحيح — تابع الجروب للكود اليومي')
    }
    setLoading(false)
  }

  if (windowStatus === null) return (
    <div className="locked-screen">
      <span style={{fontSize:40,animation:'moonFloat 2s infinite'}}>🌙</span>
      <p style={{color:'var(--text-sub)',fontSize:13}}>جارٍ التحقق...</p>
    </div>
  )

  if (windowStatus === 'closed') return (
    <div className="app-container">
      <div className="locked-screen">
        <div className="card" style={{width:'100%',textAlign:'center',padding:'32px 24px',
          background:'linear-gradient(135deg,rgba(201,168,76,0.08),rgba(201,168,76,0.03))',
          border:'1px solid rgba(201,168,76,0.2)'}}>
          <div className="card-accent gold"/>
          <span style={{fontSize:56,display:'block',marginBottom:16}}>🔒</span>
          <h2 style={{fontFamily:'var(--font-arabic)',fontSize:26,color:'var(--gold)',marginBottom:10}}>
            النافذة مغلقة
          </h2>
          <p style={{fontSize:13,color:'var(--text-sub)',lineHeight:2,marginBottom:20}}>
            {windowMsg}
          </p>
          <div style={{
            padding:'12px 16px',borderRadius:12,
            background:'rgba(201,168,76,0.08)',
            border:'1px dashed rgba(201,168,76,0.25)',
            fontSize:12,color:'var(--silver)',lineHeight:1.9
          }}>
            تُفتح النافذة مرةً واحدةً في اليوم<br/>
            من يُسجِّل يُسجِّل، ومن لا يُسجِّل فله أمره 🌙
          </div>
        </div>
      </div>
    </div>
  )

  // Window is open — show code input
  return (
    <div className="app-container" style={{display:'flex',flexDirection:'column',justifyContent:'center',minHeight:'100vh'}}>
      <div className="brand-header" style={{marginBottom:28}}>
        <span className="brand-moon">🌙</span>
        <h1 className="brand-title">لحظة وعي</h1>
        <div className="brand-divider"><span>✦</span></div>
      </div>

      <div className="card">
        <div className="card-accent gold"/>
        <div style={{textAlign:'center',marginBottom:20}}>
          <span style={{fontSize:36,display:'block',marginBottom:8}}>🗝️</span>
          <h3 style={{fontFamily:'var(--font-arabic)',fontSize:20,color:'var(--gold-light)',marginBottom:6}}>
            النافذة مفتوحة الآن
          </h3>
          <p style={{fontSize:12,color:'var(--text-sub)',lineHeight:1.9}}>
            أدخل الكود اليومي من الجروب للدخول
          </p>
        </div>

        <input
          className="input-field"
          placeholder="الكود اليومي..."
          value={codeInput}
          onChange={e=>setCodeInput(e.target.value.toUpperCase())}
          onKeyDown={e=>e.key==='Enter'&&verify()}
          style={{marginBottom:10,direction:'ltr',textAlign:'center',letterSpacing:6,fontSize:20,fontWeight:700}}
        />
        {error&&<p style={{color:'var(--red)',fontSize:12,textAlign:'center',marginBottom:8}}>{error}</p>}
        <button className="btn btn-gold btn-full" onClick={verify} disabled={loading}>
          {loading?'...':'🌙 دخول'}
        </button>
      </div>

      <p style={{textAlign:'center',fontSize:11,color:'var(--text-sub)',marginTop:14,lineHeight:1.9}}>
        أهلاً <span style={{color:'var(--gold-light)',fontWeight:700}}>{user?.name}</span> 🌙<br/>
        الكود يتغيَّر يومياً — تابع الجروب
      </p>
    </div>
  )
}
