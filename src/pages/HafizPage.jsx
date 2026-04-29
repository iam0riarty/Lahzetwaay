import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const SURAHS = [
  {n:1,name:'الفاتحة',v:7},{n:2,name:'البقرة',v:286},{n:3,name:'آل عمران',v:200},
  {n:4,name:'النساء',v:176},{n:5,name:'المائدة',v:120},{n:6,name:'الأنعام',v:165},
  {n:7,name:'الأعراف',v:206},{n:8,name:'الأنفال',v:75},{n:9,name:'التوبة',v:129},
  {n:10,name:'يونس',v:109},{n:11,name:'هود',v:123},{n:12,name:'يوسف',v:111},
  {n:13,name:'الرعد',v:43},{n:14,name:'إبراهيم',v:52},{n:15,name:'الحجر',v:99},
  {n:16,name:'النحل',v:128},{n:17,name:'الإسراء',v:111},{n:18,name:'الكهف',v:110},
  {n:19,name:'مريم',v:98},{n:20,name:'طه',v:135},{n:21,name:'الأنبياء',v:112},
  {n:22,name:'الحج',v:78},{n:23,name:'المؤمنون',v:118},{n:24,name:'النور',v:64},
  {n:25,name:'الفرقان',v:77},{n:26,name:'الشعراء',v:227},{n:27,name:'النمل',v:93},
  {n:28,name:'القصص',v:88},{n:29,name:'العنكبوت',v:69},{n:30,name:'الروم',v:60},
  {n:31,name:'لقمان',v:34},{n:32,name:'السجدة',v:30},{n:33,name:'الأحزاب',v:73},
  {n:34,name:'سبأ',v:54},{n:35,name:'فاطر',v:45},{n:36,name:'يس',v:83},
  {n:37,name:'الصافات',v:182},{n:38,name:'ص',v:88},{n:39,name:'الزمر',v:75},
  {n:40,name:'غافر',v:85},{n:41,name:'فصلت',v:54},{n:42,name:'الشورى',v:53},
  {n:43,name:'الزخرف',v:89},{n:44,name:'الدخان',v:59},{n:45,name:'الجاثية',v:37},
  {n:46,name:'الأحقاف',v:35},{n:47,name:'محمد',v:38},{n:48,name:'الفتح',v:29},
  {n:49,name:'الحجرات',v:18},{n:50,name:'ق',v:45},{n:51,name:'الذاريات',v:60},
  {n:52,name:'الطور',v:49},{n:53,name:'النجم',v:62},{n:54,name:'القمر',v:55},
  {n:55,name:'الرحمن',v:78},{n:56,name:'الواقعة',v:96},{n:57,name:'الحديد',v:29},
  {n:58,name:'المجادلة',v:22},{n:59,name:'الحشر',v:24},{n:60,name:'الممتحنة',v:13},
  {n:61,name:'الصف',v:14},{n:62,name:'الجمعة',v:11},{n:63,name:'المنافقون',v:11},
  {n:64,name:'التغابن',v:18},{n:65,name:'الطلاق',v:12},{n:66,name:'التحريم',v:12},
  {n:67,name:'الملك',v:30},{n:68,name:'القلم',v:52},{n:69,name:'الحاقة',v:52},
  {n:70,name:'المعارج',v:44},{n:71,name:'نوح',v:28},{n:72,name:'الجن',v:28},
  {n:73,name:'المزمل',v:20},{n:74,name:'المدثر',v:56},{n:75,name:'القيامة',v:40},
  {n:76,name:'الإنسان',v:31},{n:77,name:'المرسلات',v:50},{n:78,name:'النبأ',v:40},
  {n:79,name:'النازعات',v:46},{n:80,name:'عبس',v:42},{n:81,name:'التكوير',v:29},
  {n:82,name:'الانفطار',v:19},{n:83,name:'المطففين',v:36},{n:84,name:'الانشقاق',v:25},
  {n:85,name:'البروج',v:22},{n:86,name:'الطارق',v:17},{n:87,name:'الأعلى',v:19},
  {n:88,name:'الغاشية',v:26},{n:89,name:'الفجر',v:30},{n:90,name:'البلد',v:20},
  {n:91,name:'الشمس',v:15},{n:92,name:'الليل',v:21},{n:93,name:'الضحى',v:11},
  {n:94,name:'الشرح',v:8},{n:95,name:'التين',v:8},{n:96,name:'العلق',v:19},
  {n:97,name:'القدر',v:5},{n:98,name:'البينة',v:8},{n:99,name:'الزلزلة',v:8},
  {n:100,name:'العاديات',v:11},{n:101,name:'القارعة',v:11},{n:102,name:'التكاثر',v:8},
  {n:103,name:'العصر',v:3},{n:104,name:'الهمزة',v:9},{n:105,name:'الفيل',v:5},
  {n:106,name:'قريش',v:4},{n:107,name:'الماعون',v:7},{n:108,name:'الكوثر',v:3},
  {n:109,name:'الكافرون',v:6},{n:110,name:'النصر',v:3},{n:111,name:'المسد',v:5},
  {n:112,name:'الإخلاص',v:4},{n:113,name:'الفلق',v:5},{n:114,name:'الناس',v:6},
]

const S = {
  0:{label:'لم يُحفظ',bg:'rgba(255,255,255,0.05)',border:'rgba(255,255,255,0.08)',text:'var(--text-sub)',dot:''},
  1:{label:'حفظ جديد',bg:'rgba(201,168,76,0.3)',border:'rgba(201,168,76,0.7)',text:'var(--gold-light)',dot:'🟡'},
  2:{label:'مراجعة جارية',bg:'rgba(91,141,217,0.35)',border:'rgba(91,141,217,0.75)',text:'#8bb4e8',dot:'🔵'},
  3:{label:'متقن ✨',bg:'rgba(45,106,79,0.45)',border:'rgba(82,183,136,0.85)',text:'var(--green-light)',dot:'🟢'},
}

export default function HafizPage({ onBack }) {
  const { user, verifyCode } = useAuth()
  const [unlocked, setUnlocked] = useState(false)
  const [codeInput, setCodeInput] = useState('')
  const [codeError, setCodeError] = useState('')
  const [progress, setProgress] = useState({})
  const [selected, setSelected] = useState(null)
  const [toast, setToast] = useState('')
  const [tab, setTab] = useState('heatmap')

  const unlock = async () => {
    const correct = await verifyCode('hafiz')
    if (!correct || codeInput === correct) { setUnlocked(true); loadProgress() }
    else setCodeError('الكود غلط 🔒')
  }

  const loadProgress = async () => {
    const {data} = await supabase.from('hafiz_progress').select('*').eq('user_id',user.id)
    if (data) {
      const map = {}
      data.forEach(r => { map[r.surah_number] = r.status==='none'?0:r.status==='memorized'?1:r.status==='reviewed_new'?2:3 })
      setProgress(map)
    }
  }

  const updateSurah = async (n, st) => {
    const str = st===0?'none':st===1?'memorized':st===2?'reviewed_new':'mastered'
    setProgress(p=>({...p,[n]:st}))
    setSelected(n)
    await supabase.from('hafiz_progress').upsert(
      {user_id:user.id,surah_number:n,status:str,updated_at:new Date().toISOString()},
      {onConflict:'user_id,surah_number'}
    )
    showToast(`${SURAHS[n-1].name} ← ${S[st].label}`)
  }

  const cycleStatus = (n) => { const cur=progress[n]||0; updateSurah(n,(cur+1)%4) }
  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(''),2500) }

  const counts = {0:0,1:0,2:0,3:0}
  SURAHS.forEach(s=>{ counts[progress[s.n]||0]++ })
  const memorizedVerses = SURAHS.filter(s=>(progress[s.n]||0)>=1).reduce((sum,s)=>sum+s.v,0)
  const juz = (memorizedVerses/6236*30).toFixed(1)

  if (!unlocked) return (
    <div className="app-container" style={{display:'flex',flexDirection:'column',justifyContent:'center',minHeight:'100vh'}}>
      <div style={{textAlign:'center',marginBottom:28}}>
        <span style={{fontSize:48}}>📖</span>
        <h2 style={{fontFamily:"'Amiri',serif",fontSize:26,color:'var(--gold)',marginTop:8}}>نافذة الحفاظ</h2>
        <p style={{fontSize:12,color:'var(--text-sub)',marginTop:6,letterSpacing:2}}>أدخل الكود السري للدخول</p>
      </div>
      <div className="card">
        <div className="card-accent green"/>
        <input className="input-field" type="password" placeholder="الكود السري..." value={codeInput}
          onChange={e=>setCodeInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&unlock()}
          style={{marginBottom:10,direction:'ltr',textAlign:'center',letterSpacing:6,fontSize:20}}/>
        {codeError&&<p style={{color:'var(--red)',fontSize:13,textAlign:'center',marginBottom:8}}>{codeError}</p>}
        <button className="btn btn-gold btn-full" onClick={unlock}>📖 دخول</button>
      </div>
      <button className="btn btn-ghost" style={{marginTop:12}} onClick={onBack}>← رجوع</button>
    </div>
  )

  return (
    <div className="app-container">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <div><p style={{fontSize:11,color:'var(--text-sub)'}}>نافذة</p><p style={{fontSize:16,fontWeight:700,color:'var(--green-light)'}}>📖 الحفاظ</p></div>
        <button className="btn btn-ghost" style={{padding:'7px 12px',fontSize:12}} onClick={onBack}>← رجوع</button>
      </div>

      {/* Mini stats bar */}
      <div style={{display:'flex',gap:6,marginBottom:12,overflowX:'auto',paddingBottom:2}}>
        {[
          {label:`${counts[1]+counts[2]+counts[3]} محفوظة`,bg:'rgba(201,168,76,0.15)',color:'var(--gold)'},
          {label:`${counts[3]} متقنة`,bg:'rgba(45,106,79,0.2)',color:'var(--green-light)'},
          {label:`${juz} جزء`,bg:'rgba(91,141,217,0.15)',color:'#8bb4e8'},
          {label:`${Math.round((counts[1]+counts[2]+counts[3])/114*100)}%`,bg:'rgba(155,114,207,0.15)',color:'var(--purple)'},
        ].map((item,i)=>(
          <div key={i} style={{padding:'5px 10px',borderRadius:20,background:item.bg,whiteSpace:'nowrap',flexShrink:0}}>
            <span style={{fontSize:12,fontWeight:700,color:item.color}}>{item.label}</span>
          </div>
        ))}
      </div>

      <div className="nav-tabs" style={{marginBottom:12}}>
        <button className={`nav-tab ${tab==='heatmap'?'active':''}`} onClick={()=>setTab('heatmap')}>🗺️ خريطة السور</button>
        <button className={`nav-tab ${tab==='stats'?'active':''}`} onClick={()=>setTab('stats')}>📊 إحصائياتي</button>
      </div>

      {tab==='heatmap'&&(
        <>
          {/* Legend */}
          <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:10}}>
            {Object.entries(S).map(([k,v])=>(
              <div key={k} style={{display:'flex',alignItems:'center',gap:4,padding:'3px 8px',borderRadius:20,background:v.bg,border:`1px solid ${v.border}`}}>
                <span style={{fontSize:9,color:v.text,fontWeight:700}}>{v.label}</span>
              </div>
            ))}
          </div>

          <div className="card" style={{padding:'12px 10px'}}>
            <div className="card-accent green"/>
            <p style={{fontSize:10,color:'var(--text-sub)',marginBottom:10,textAlign:'center'}}>
              اضغط لتغيير الحالة • ⬜ ← 🟡 حفظ ← 🔵 مراجعة ← 🟢 إتقان
            </p>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(48px,1fr))',gap:3}}>
              {SURAHS.map(s=>{
                const st=progress[s.n]||0, cfg=S[st], isSel=selected===s.n
                return (
                  <div key={s.n} onClick={()=>cycleStatus(s.n)}
                    style={{
                      aspectRatio:'1',borderRadius:6,
                      background:cfg.bg,
                      border:`1.5px solid ${isSel?'var(--gold-light)':cfg.border}`,
                      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
                      cursor:'pointer',transition:'all 0.12s',
                      transform:isSel?'scale(1.1)':'scale(1)',
                      boxShadow:isSel?`0 0 8px ${cfg.border}`:'none',
                      padding:'2px',userSelect:'none',
                    }}>
                    <span style={{fontSize:7,color:'rgba(255,255,255,0.35)',lineHeight:1}}>{s.n}</span>
                    <span style={{fontSize:8.5,color:cfg.text,fontWeight:700,textAlign:'center',lineHeight:1.2,
                      width:'100%',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',padding:'0 1px'}}>
                      {s.name.length>5?s.name.slice(0,4)+'…':s.name}
                    </span>
                    {st>0&&<span style={{fontSize:7,lineHeight:1}}>{cfg.dot}</span>}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Selected detail */}
          {selected&&(()=>{
            const s=SURAHS[selected-1], st=progress[selected]||0, cfg=S[st]
            return (
              <div className="card" style={{background:cfg.bg,border:`1px solid ${cfg.border}`,marginTop:2}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                  <div>
                    <p style={{fontSize:10,color:'rgba(255,255,255,0.4)'}}>السورة {s.n} • {s.v} آية</p>
                    <p style={{fontFamily:"'Amiri',serif",fontSize:22,color:cfg.text,fontWeight:700,marginTop:2}}>{s.name}</p>
                  </div>
                  <span style={{fontSize:24}}>{cfg.dot||'⬜'}</span>
                </div>
                <div style={{display:'flex',gap:5}}>
                  {[0,1,2,3].map(v=>(
                    <button key={v} onClick={()=>updateSurah(selected,v)}
                      style={{flex:1,padding:'7px 2px',borderRadius:8,border:`1px solid ${S[v].border}`,
                        background:st===v?S[v].bg:'transparent',color:S[v].text,
                        fontSize:9.5,fontWeight:700,cursor:'pointer',fontFamily:"'Cairo',sans-serif",
                        transition:'all 0.12s',lineHeight:1.3}}>
                      {S[v].label}
                    </button>
                  ))}
                </div>
              </div>
            )
          })()}
        </>
      )}

      {tab==='stats'&&(
        <>
          <div className="card">
            <div className="card-accent green"/>
            <p style={{fontSize:13,fontWeight:700,color:'var(--gold-light)',marginBottom:14,textAlign:'center'}}>تقدمك في القرآن الكريم 📖</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:14}}>
              {[
                {label:'سور محفوظة',val:counts[1]+counts[2]+counts[3],sub:'من ١١٤ سورة',c:'var(--gold)'},
                {label:'سور متقنة',val:counts[3],sub:'حفظاً ومراجعةً',c:'var(--green-light)'},
                {label:'نسبة الحفظ',val:Math.round((counts[1]+counts[2]+counts[3])/114*100)+'%',sub:'من القرآن',c:'var(--gold)'},
                {label:'جزء محفوظ',val:juz,sub:'من ٣٠ جزءاً',c:'#8bb4e8'},
              ].map((item,i)=>(
                <div key={i} style={{background:'rgba(255,255,255,0.04)',borderRadius:12,padding:'12px',textAlign:'center'}}>
                  <p style={{fontFamily:"'Amiri',serif",fontSize:34,color:item.c,lineHeight:1}}>{item.val}</p>
                  <p style={{fontSize:11,fontWeight:700,color:'var(--text)',marginTop:3}}>{item.label}</p>
                  <p style={{fontSize:10,color:'var(--text-sub)'}}>{item.sub}</p>
                </div>
              ))}
            </div>
            {[
              {label:'🟡 حفظ جديد',count:counts[1],color:'rgba(201,168,76,0.7)'},
              {label:'🔵 مراجعة جارية',count:counts[2],color:'rgba(91,141,217,0.7)'},
              {label:'🟢 متقن',count:counts[3],color:'rgba(82,183,136,0.8)'},
            ].map(item=>(
              <div key={item.label} style={{marginBottom:8}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                  <span style={{fontSize:11,color:'var(--text-sub)'}}>{item.label}</span>
                  <span style={{fontSize:11,fontWeight:700,color:'var(--text)'}}>{item.count} سورة ({Math.round(item.count/114*100)}%)</span>
                </div>
                <div style={{height:6,background:'rgba(255,255,255,0.07)',borderRadius:10,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${item.count/114*100}%`,background:item.color,borderRadius:10,transition:'width 0.5s'}}/>
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{textAlign:'center',background:'linear-gradient(135deg,rgba(201,168,76,0.1),rgba(201,168,76,0.03))'}}>
            <div className="card-accent gold"/>
            <p style={{fontSize:11,color:'var(--text-sub)',marginBottom:4}}>إجمالي الآيات المحفوظة</p>
            <p style={{fontFamily:"'Amiri',serif",fontSize:44,color:'var(--gold)',lineHeight:1}}>{memorizedVerses.toLocaleString()}</p>
            <p style={{fontSize:12,color:'var(--text-sub)',marginTop:4}}>آية من أصل ٦٢٣٦ آية</p>
            <div className="progress-bar" style={{marginTop:10}}>
              <div className="progress-fill" style={{width:`${memorizedVerses/6236*100}%`}}/>
            </div>
          </div>
        </>
      )}

      <div className={`toast ${toast?'show':''}`}>{toast}</div>
    </div>
  )
}
