import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const YEARS = ['2022', '2023', '2024'];

const CATEGORY_LABELS = {
  GOPENS:'OPEN (State)',GSCS:'SC (State)',GSTS:'ST (State)',GOBCS:'OBC (State)',
  GSEBCS:'EBC (State)',GVJS:'VJ (State)',GNT1S:'NT1 (State)',GNT2S:'NT2 (State)',
  GNT3S:'NT3 (State)',LOPENS:'OPEN (Home)',LSCS:'SC (Home)',LSTS:'ST (Home)',
  LOBCS:'OBC (Home)',LSEBCS:'EBC (Home)',TFWS:'TFWS',EWS:'EWS',
};

const PRIORITY_CATS = [
  'GOPENS','GSCS','GSTS','GOBCS','GSEBCS','GVJS',
  'GNT1S','GNT2S','GNT3S','LOPENS','LSCS','LSTS','LOBCS','LSEBCS','TFWS','EWS'
];

const COL_COLORS = ['#f59e0b','#34d399','#60a5fa','#f87171'];

function getTrend(vals) {
  const d = vals.filter(v => v != null);
  if (d.length < 2) return 'neutral';
  const diff = d[d.length-1] - d[0];
  if (diff > 1.5) return 'up';
  if (diff < -1.5) return 'down';
  return 'stable';
}
}

function TrendBadge({ trend }) {
  const cfg = {
    up:      { icon:'↑', label:'Rising',  bg:'rgba(74,222,128,0.15)',  color:'#4ade80' },
    down:    { icon:'↓', label:'Easing',  bg:'rgba(251,113,133,0.15)', color:'#fb7185' },
    stable:  { icon:'→', label:'Stable',  bg:'rgba(251,191,36,0.12)',  color:'#fbbf24' },
    neutral: { icon:'·', label:'—',       bg:'rgba(148,163,184,0.12)',color:'#94a3b8'  },
  };
  const c = cfg[trend]||cfg.neutral;
  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'2px 8px',
      borderRadius:20,fontSize:11,fontWeight:600,background:c.bg,color:c.color}}>
      {c.icon} {c.label}
    </span>
  );
}

function Spark({ vals, color, W=60, H=22 }) {
  const d = vals.filter(v=>v!=null);
  if (d.length < 2) return <span style={{color:'#555',fontSize:11}}>—</span>;
  const mn=Math.min(...d), mx=Math.max(...d), rng=mx-mn||1;
  const pts = vals.map((v,i)=>{
    if(v==null) return null;
    return { x:(i/(YEARS.length-1))*W, y:H-((v-mn)/rng)*H };
  }).filter(Boolean);
  const d2 = pts.map((p,i)=>i===0?`M${p.x},${p.y}`:`L${p.x},${p.y}`).join(' ');
  return (
    <svg width={W} height={H} style={{overflow:'visible'}}>
      <path d={d2} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="2.2" fill={color}/>)}
    </svg>
  );
}

function PercentileBar({ value, max, color }) {
  if (value == null) return <span style={{color:'#555'}}>—</span>;
  const pct = Math.min(100, (value / (max||100)) * 100);
  return (
    <div style={{width:'100%'}}>
      <div style={{fontSize:13,fontWeight:700,color,marginBottom:3,fontFamily:'monospace'}}>
        {value.toFixed(2)}
      </div>
      <div style={{height:5,borderRadius:3,background:'rgba(255,255,255,0.12)',overflow:'hidden'}}>
        <div style={{height:'100%',width:`${pct}%`,background:color,borderRadius:3,transition:'width 0.4s ease'}}/>
      </div>
    </div>
  );
}

// College picker modal
function CollegePicker({ allColleges, current, onPick, onClose }) {
  const [q, setQ] = useState('');
  const shown = useMemo(()=>{
    if (!q) return allColleges.slice(0,80);
    return allColleges.filter(c=>c.toLowerCase().includes(q.toLowerCase())).slice(0,80);
  },[q,allColleges]);

  return (
    <div className="cp-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="cp-box">
        <div className="cp-head">
          <span>Select a College</span>
          <button className="cp-close" onClick={onClose}>✕</button>
        </div>
        <input className="cp-search" autoFocus placeholder="Search college…"
          value={q} onChange={e=>setQ(e.target.value)}/>
        <div className="cp-list">
          {shown.map(c=>(
            <button key={c} className={`cp-item${c===current?' cp-item-active':''}`}
              onClick={()=>{ onPick(c); onClose(); }}>
              {c}
            </button>
          ))}
          {shown.length===0&&<div className="cp-empty">No colleges found</div>}
        </div>
      </div>
    </div>
  );
}

export default function ComparePage({ data }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Read initial colleges from URL ?colleges=CollegeA,CollegeB
  const initialColleges = useMemo(()=>{
    const param = searchParams.get('colleges');
    if (!param) return [null, null];
    const decoded = param.split(',').map(c=>decodeURIComponent(c)).filter(Boolean);
    // Pad to at least 2 slots
    while (decoded.length < 2) decoded.push(null);
    return decoded.slice(0,4);
  },[]);

  const [slots, setSlots] = useState(initialColleges);
  const [pickerSlot, setPickerSlot] = useState(null);
  const [filterCat, setFilterCat] = useState('GOPENS');
  const [filterBranch, setFilterBranch] = useState('');

  const rawData     = useMemo(()=>data?.data||{},[data]);
  const allColleges = useMemo(()=>data?.colleges||[],[data]);

  const collegeIndex = useMemo(()=>{
    const idx = {};
    Object.entries(rawData).forEach(([key,catData])=>{
      const [college,branch] = key.split('|||');
      if (!idx[college]) idx[college]={ branches:[], catData:{} };
      idx[college].branches.push(branch);
      idx[college].catData[branch] = catData;
    });
    return idx;
  },[rawData]);

  const filledSlots = slots.filter(Boolean);

  const addSlot    = () => { if(slots.length<4) setSlots(s=>[...s,null]); };
  const removeSlot = i  => setSlots(s=>s.filter((_,j)=>j!==i));
  const setSlotCollege = (i,college) => setSlots(s=>s.map((v,j)=>j===i?college:v));

  const comparisonData = useMemo(()=>{
    return filledSlots.map(college=>{
      const ci = collegeIndex[college];
      if (!ci) return null;
      const branch = (filterBranch && ci.branches.includes(filterBranch))
        ? filterBranch : ci.branches[0];
      const catData = ci.catData[branch]||{};
      const vals = YEARS.map(y=>catData[filterCat]?.[y]??null);
      return { college, branch, vals, latestVal:[...vals].reverse().find(v=>v!=null)??null, catData, branches:ci.branches };
    });
  },[filledSlots,collegeIndex,filterCat,filterBranch]);

  const maxVal = useMemo(()=>{
    const all = comparisonData.flatMap(d=>d?.vals||[]).filter(v=>v!=null);
    return all.length?Math.max(...all):100;
  },[comparisonData]);

  const availableCats = useMemo(()=>{
    const s = new Set();
    comparisonData.forEach(d=>{ if(d) Object.keys(d.catData).forEach(c=>s.add(c)); });
    return [...PRIORITY_CATS.filter(c=>s.has(c)),...[...s].filter(c=>!PRIORITY_CATS.includes(c))];
  },[comparisonData]);

  const availableBranches = useMemo(()=>{
    const s = new Set();
    filledSlots.forEach(c=>{ (collegeIndex[c]?.branches||[]).forEach(b=>s.add(b)); });
    return [...s].sort();
  },[filledSlots,collegeIndex]);

  if (!data) return (
    <div className="cp-loading"><div className="cp-spinner"/><p>Loading data…</p></div>
  );

  return (
    <>
      <style>{`
        .compare-page{min-height:100vh;padding:96px 24px 60px;max-width:1200px;margin:0 auto;font-family:inherit;background:#000000;}
        .compare-back-btn{background:none;border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.5);
          border-radius:8px;padding:6px 14px;font-size:13px;cursor:pointer;margin-bottom:16px;transition:all 0.15s;}
        .compare-back-btn:hover{border-color:var(--amber2,#f59e0b);color:var(--amber2,#f59e0b);}
        .compare-h1{font-size:clamp(1.6rem,4vw,2.4rem);font-weight:800;letter-spacing:-0.03em;margin:0 0 6px;
          background:linear-gradient(135deg,#fbbf24 0%,#f97316 60%);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
        .compare-sub{color:var(--muted,#94a3b8);font-size:13px;margin:0 0 28px;}

        .compare-slots{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;margin-bottom:28px;}
        .compare-slot{border-radius:14px;border:2px dashed rgba(255,255,255,0.1);padding:16px;
          display:flex;flex-direction:column;align-items:center;gap:10px;min-height:110px;
          background:rgba(255,255,255,0.02);transition:all 0.2s;position:relative;}
        .compare-slot.filled{border-style:solid;border-color:rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);}
        .compare-slot-num{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;
          justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;}
        .compare-slot-name{font-size:13px;font-weight:600;text-align:center;line-height:1.3;}
        .compare-slot-branch{font-size:11px;color:var(--muted,#94a3b8);text-align:center;}
        .slot-pick-btn{background:none;border:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.5);
          border-radius:8px;padding:5px 12px;font-size:12px;cursor:pointer;transition:all 0.15s;width:100%;}
        .slot-pick-btn:hover{border-color:var(--amber2,#f59e0b);color:var(--amber2,#f59e0b);}
        .slot-change-btn{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);
          color:rgba(255,255,255,0.4);border-radius:7px;padding:4px 10px;font-size:11px;cursor:pointer;transition:all 0.15s;}
        .slot-change-btn:hover{border-color:var(--amber2,#f59e0b);color:var(--amber2,#f59e0b);}
        .slot-remove-btn{position:absolute;top:8px;right:8px;background:rgba(251,113,133,0.1);
          border:none;color:#fb7185;border-radius:6px;width:22px;height:22px;font-size:14px;
          cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.15s;}
        .slot-remove-btn:hover{background:rgba(251,113,133,0.25);}
        .add-slot-btn{border-radius:14px;border:2px dashed rgba(255,255,255,0.07);padding:16px;
          background:none;color:rgba(255,255,255,0.3);font-size:22px;cursor:pointer;
          transition:all 0.2s;min-height:110px;display:flex;align-items:center;justify-content:center;}
        .add-slot-btn:hover{border-color:var(--amber2,#f59e0b);color:var(--amber2,#f59e0b);}

        .compare-filters{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:24px;align-items:center;}
        .compare-filter-label{font-size:12px;color:var(--muted,#94a3b8);white-space:nowrap;}
        .compare-select{padding:8px 14px;border-radius:9px;border:1px solid rgba(255,255,255,0.1);
          background:rgba(255,255,255,0.05);color:var(--fg,#f1f5f9);font-size:13px;outline:none;transition:border-color 0.2s;}
        .compare-select:focus{border-color:var(--amber2,#f59e0b);}
        .compare-select option{background:#1e2433;}

        .compare-table-wrap{overflow-x:auto;border-radius:16px;border:1px solid rgba(255,255,255,0.07);margin-bottom:32px;}
        .compare-table{width:100%;border-collapse:collapse;min-width:500px;}
        .compare-table th{padding:14px 18px;text-align:left;font-size:12px;font-weight:600;
          color:var(--muted,#94a3b8);border-bottom:1px solid rgba(255,255,255,0.07);
          background:rgba(255,255,255,0.02);white-space:nowrap;}
        .compare-table th.col-header{font-size:13px;font-weight:700;}
        .compare-table td{padding:13px 18px;border-bottom:1px solid rgba(255,255,255,0.04);
          vertical-align:middle;font-size:13px;}
        .compare-table tr:last-child td{border-bottom:none;}
        .compare-table .row-label{color:var(--muted,#94a3b8);font-size:12px;font-weight:600;white-space:nowrap;width:130px;}
        .compare-table tr:hover td{background:rgba(255,255,255,0.015);}
        .best-cell{background:rgba(245,158,11,0.06)!important;}
        .best-badge{display:inline-block;padding:1px 6px;border-radius:5px;font-size:10px;
          font-weight:700;background:rgba(245,158,11,0.2);color:#f59e0b;margin-left:6px;}

        .year-section-title{font-size:12px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;
          color:var(--muted,#94a3b8);margin-bottom:14px;}
        .year-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px;}
        .year-card{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);
          border-radius:12px;padding:16px;}
        .year-card-college{font-size:13px;font-weight:700;}
        .year-card-branch{font-size:11px;color:var(--muted,#94a3b8);margin-top:2px;margin-bottom:12px;}
        .year-row{display:flex;justify-content:space-between;align-items:center;
          padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04);}
        .year-row:last-child{border-bottom:none;}
        .year-row-yr{font-size:12px;color:var(--muted,#94a3b8);font-weight:600;width:36px;}
        .year-row-val{font-size:13px;font-weight:700;font-family:monospace;}
        .year-row-delta{font-size:11px;padding:1px 6px;border-radius:5px;}

        .compare-empty{text-align:center;padding:60px 20px;color:var(--muted,#94a3b8);}

        .cp-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(4px);
          z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;}
        .cp-box{background:#0f1623;border:1px solid rgba(255,255,255,0.1);border-radius:18px;
          padding:22px;width:100%;max-width:480px;max-height:80vh;display:flex;flex-direction:column;
          box-shadow:0 24px 80px rgba(0,0,0,0.6);}
        .cp-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;
          font-size:15px;font-weight:700;color:var(--fg,#f1f5f9);}
        .cp-close{background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);
          color:var(--fg,#f1f5f9);border-radius:7px;width:30px;height:30px;cursor:pointer;
          display:flex;align-items:center;justify-content:center;font-size:14px;}
        .cp-close:hover{background:rgba(251,113,133,0.2);color:#fb7185;}
        .cp-search{padding:10px 14px;border-radius:10px;border:1px solid rgba(255,255,255,0.1);
          background:rgba(255,255,255,0.05);color:var(--fg,#f1f5f9);font-size:13px;outline:none;
          margin-bottom:10px;transition:border-color 0.2s;}
        .cp-search:focus{border-color:var(--amber2,#f59e0b);}
        .cp-list{overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:4px;}
        .cp-item{background:none;border:1px solid rgba(255,255,255,0.06);border-radius:9px;
          color:rgba(255,255,255,0.7);padding:10px 14px;text-align:left;font-size:13px;cursor:pointer;transition:all 0.15s;}
        .cp-item:hover{border-color:var(--amber2,#f59e0b);color:var(--fg,#f1f5f9);background:rgba(245,158,11,0.05);}
        .cp-item-active{border-color:var(--amber2,#f59e0b)!important;background:rgba(245,158,11,0.1)!important;color:var(--amber2,#f59e0b)!important;}
        .cp-empty{text-align:center;padding:30px;color:var(--muted,#94a3b8);font-size:13px;}
        .cp-loading{display:flex;flex-direction:column;align-items:center;justify-content:center;
          min-height:60vh;gap:16px;color:var(--muted,#94a3b8);}
        .cp-spinner{width:36px;height:36px;border:3px solid rgba(245,158,11,0.2);
          border-top-color:var(--amber2,#f59e0b);border-radius:50%;animation:cpspin 0.8s linear infinite;}
          
        @keyframes cpspin{to{transform:rotate(360deg);}}

        @media(max-width:640px){.compare-page{padding:80px 14px 40px;}
          .compare-slots{grid-template-columns:1fr 1fr;}.compare-filters{flex-direction:column;align-items:flex-start;}}
      `}</style>

      {pickerSlot !== null && (
        <CollegePicker allColleges={allColleges} current={slots[pickerSlot]}
          onPick={c=>setSlotCollege(pickerSlot,c)} onClose={()=>setPickerSlot(null)}/>
      )}

      <div className="compare-page">
        <button className="compare-back-btn" onClick={()=>navigate(-1)}>← Back</button>
        <h1 className="compare-h1">⚖️ Compare Colleges</h1>
        <p className="compare-sub">Select up to 4 colleges and compare cutoffs side by side</p>

        {/* Slots */}
        <div className="compare-slots">
          {slots.map((college,i)=>{
            const color = COL_COLORS[i];
            const info = college?collegeIndex[college]:null;
            return (
              <div key={i} className={`compare-slot${college?' filled':''}`}
                style={college?{borderColor:`${color}40`}:{}}>
                <div className="compare-slot-num" style={{background:`${color}22`,color}}>{i+1}</div>
                {college ? (
                  <>
                    {slots.length>2&&<button className="slot-remove-btn" onClick={()=>removeSlot(i)}>×</button>}
                    <div className="compare-slot-name" style={{color}}>{college}</div>
                    <div className="compare-slot-branch">{info?.branches?.length} branches</div>
                    <button className="slot-change-btn" onClick={()=>setPickerSlot(i)}>Change →</button>
                  </>
                ) : (
                  <button className="slot-pick-btn" onClick={()=>setPickerSlot(i)}>+ Pick a college</button>
                )}
              </div>
            );
          })}
          {slots.length<4&&(
            <button className="add-slot-btn" onClick={addSlot}>+</button>
          )}
        </div>

        {filledSlots.length < 2 ? (
          <div className="compare-empty">
            <p>Select at least 2 colleges to compare</p>
            <span>Use the slots above to pick colleges</span>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="compare-filters">
              <span className="compare-filter-label">Category:</span>
              <select className="compare-select" value={filterCat} onChange={e=>setFilterCat(e.target.value)}>
                {availableCats.map(c=><option key={c} value={c}>{CATEGORY_LABELS[c]||c}</option>)}
              </select>
              <span className="compare-filter-label">Branch:</span>
              <select className="compare-select" value={filterBranch} onChange={e=>setFilterBranch(e.target.value)}>
                <option value="">Auto (first available)</option>
                {availableBranches.map(b=><option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            {/* Table */}
            <div className="compare-table-wrap">
              <table className="compare-table">
                <thead>
                  <tr>
                    <th className="row-label">Metric</th>
                    {comparisonData.map((d,i)=>(
                      <th key={i} className="col-header" style={{color:COL_COLORS[i]}}>
                        <div>{d?.college||'—'}</div>
                        <div style={{fontSize:11,fontWeight:400,color:'rgba(255,255,255,0.4)',marginTop:2}}>{d?.branch}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="row-label">2024 Cutoff</td>
                    {comparisonData.map((d,i)=>{
                      const v=d?.vals?.[2]??null;
                      const isMax = v!=null && v===Math.max(...comparisonData.map(x=>x?.vals?.[2]??-Infinity));
                      return (
                        <td key={i} className={isMax?'best-cell':''}>
                          <PercentileBar value={v} max={maxVal} color={COL_COLORS[i]}/>
                          {isMax&&v!=null&&<span className="best-badge">Highest</span>}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="row-label">2023 Cutoff</td>
                    {comparisonData.map((d,i)=>(
                      <td key={i}><PercentileBar value={d?.vals?.[1]??null} max={maxVal} color={COL_COLORS[i]}/></td>
                    ))}
                  </tr>
                  <tr>
                    <td className="row-label">2022 Cutoff</td>
                    {comparisonData.map((d,i)=>(
                      <td key={i}><PercentileBar value={d?.vals?.[0]??null} max={maxVal} color={COL_COLORS[i]}/></td>
                    ))}
                  </tr>
                  <tr>
                    <td className="row-label">3-yr Trend</td>
                    {comparisonData.map((d,i)=>(
                      <td key={i}>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          <Spark vals={d?.vals||[null,null,null]} color={COL_COLORS[i]}/>
                          <TrendBadge trend={getTrend(d?.vals||[])}/>
                        </div>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="row-label">Change '22→'24</td>
                    {comparisonData.map((d,i)=>{
                      const v0=d?.vals?.[0], v2=d?.vals?.[2];
                      const delta=(v0!=null&&v2!=null)?(v2-v0):null;
                      return (
                        <td key={i}>
                          {delta!=null?(
                            <span style={{fontWeight:700,fontSize:14,fontFamily:'monospace',
                              color:delta>0?'#4ade80':delta<0?'#fb7185':'#fbbf24'}}>
                              {delta>0?'+':''}{delta.toFixed(2)}
                            </span>
                          ):'—'}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="row-label">Branches</td>
                    {comparisonData.map((d,i)=>(
                      <td key={i} style={{fontSize:13,fontWeight:600,color:COL_COLORS[i]}}>{d?.branches?.length??'—'}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="row-label">Categories</td>
                    {comparisonData.map((d,i)=>(
                      <td key={i}>
                        <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                          {d?Object.keys(d.catData).slice(0,5).map(c=>(
                            <span key={c} style={{fontSize:10,padding:'2px 6px',borderRadius:5,
                              background:'rgba(255,255,255,0.05)',color:'rgba(255,255,255,0.5)'}}>
                              {CATEGORY_LABELS[c]||c}
                            </span>
                          )):'—'}
                          {d&&Object.keys(d.catData).length>5&&(
                            <span style={{fontSize:10,color:'rgba(255,255,255,0.3)'}}>+{Object.keys(d.catData).length-5}</span>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Year breakdown */}
            <div className="year-section-title">Year-by-Year Breakdown · {CATEGORY_LABELS[filterCat]||filterCat}</div>
            <div className="year-grid">
              {comparisonData.map((d,i)=>{
                if(!d) return null;
                const color=COL_COLORS[i];
                return (
                  <div key={i} className="year-card" style={{borderColor:`${color}25`}}>
                    <div className="year-card-college" style={{color}}>{d.college}</div>
                    <div className="year-card-branch">{d.branch}</div>
                    {YEARS.map((y,yi)=>{
                      const v=d.vals[yi];
                      const prev=yi>0?d.vals[yi-1]:null;
                      const delta=(v!=null&&prev!=null)?(v-prev):null;
                      return (
                        <div key={y} className="year-row">
                          <span className="year-row-yr">{y}</span>
                          <span className="year-row-val" style={{color:v!=null?color:'#555'}}>{v!=null?v.toFixed(2):'—'}</span>
                          {delta!=null&&(
                            <span className="year-row-delta" style={{
                              background:delta>0?'rgba(74,222,128,0.1)':'rgba(251,113,133,0.1)',
                              color:delta>0?'#4ade80':'#fb7185'}}>
                              {delta>0?'+':''}{delta.toFixed(2)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}