import { useState, useMemo, useEffect, useCallback } from 'react';

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

const LINE_COLORS = [
  '#f59e0b','#34d399','#60a5fa','#f87171','#a78bfa','#fb923c',
  '#38bdf8','#4ade80','#e879f9','#facc15','#fb7185','#67e8f9',
  '#86efac','#c4b5fd','#fda4af','#93c5fd','#fcd34d','#6ee7b7',
];

function getTrend(vals) {
  const d = vals.filter(v => v != null);
  if (d.length < 2) return 'neutral';
  const diff = d[d.length-1] - d[0];
  if (diff > 1.5) return 'up';
  if (diff < -1.5) return 'down';
  return 'stable';
}

function TrendBadge({ trend }) {
  const cfg = {
    up:      { icon:'↑', label:'Rising',  bg:'rgba(74,222,128,0.15)',  color:'#4ade80' },
    down:    { icon:'↓', label:'Easing',  bg:'rgba(251,113,133,0.15)', color:'#fb7185' },
    stable:  { icon:'→', label:'Stable',  bg:'rgba(251,191,36,0.12)',  color:'#fbbf24' },
    neutral: { icon:'·', label:'Limited', bg:'rgba(148,163,184,0.12)',color:'#94a3b8' },
  };
  const c = cfg[trend]||cfg.neutral;
  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'3px 10px',
      borderRadius:20,fontSize:11,fontWeight:600,background:c.bg,color:c.color,
      letterSpacing:'0.03em',whiteSpace:'nowrap'}}>
      {c.icon} {c.label}
    </span>
  );
}

// ── SVG Chart core ────────────────────────────────────────────────────────────
function LineChart({ catData, activeCats, allCats, W, H, PL, PR, PT, PB, fontSize=9, dotR=2.8 }) {
  const innerW = W - PL - PR;
  const innerH = H - PT - PB;

  const scores = [];
  activeCats.forEach(cat => YEARS.forEach(y => { const v=catData[cat]?.[y]; if(v!=null) scores.push(v); }));
  if (!scores.length) return null;

  const minY = Math.min(...scores);
  const maxY = Math.max(...scores);
  const range = maxY - minY || 1;
  const pad = range * 0.08;

  const toX = i => PL + (i/(YEARS.length-1))*innerW;
  const toY = val => PT + innerH - ((val-(minY-pad))/((maxY+pad)-(minY-pad)))*innerH;

  const ticks = 5;
  const tickVals = Array.from({length:ticks},(_,i)=>minY + (range/(ticks-1))*i);

  return (
    <svg width={W} height={H} style={{overflow:'visible',display:'block',width:'100%'}}>
      {/* grid */}
      {tickVals.map((tv,i)=>(
        <g key={i}>
          <line x1={PL} x2={W-PR} y1={toY(tv)} y2={toY(tv)}
            stroke="rgba(255,255,255,0.07)" strokeWidth="1" strokeDasharray="3,3"/>
          <text x={PL-6} y={toY(tv)+4} textAnchor="end"
            fontSize={fontSize} fill="rgba(255,255,255,0.4)">{tv.toFixed(0)}</text>
        </g>
      ))}

      {/* x axis */}
      <line x1={PL} x2={W-PR} y1={PT+innerH} y2={PT+innerH}
        stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>

      {/* year labels */}
      {YEARS.map((y,i)=>(
        <text key={y} x={toX(i)} y={H-4} textAnchor="middle"
          fontSize={fontSize+1} fill="rgba(255,255,255,0.5)" fontWeight="600">{y}</text>
      ))}

      {/* lines */}
      {activeCats.map((cat,ci)=>{
        const colorIdx = allCats.indexOf(cat);
        const color = LINE_COLORS[colorIdx % LINE_COLORS.length];
        const pts = YEARS.map((y,yi)=>{
          const v=catData[cat]?.[y];
          return v!=null?{x:toX(yi),y:toY(v),v}:null;
        });
        const def = pts.filter(Boolean);
        if(!def.length) return null;
        const d = def.map((p,i)=>i===0?`M${p.x},${p.y}`:`L${p.x},${p.y}`).join(' ');
        return (
          <g key={cat}>
            {def.length>1&&<path d={d} fill="none" stroke={color} strokeWidth={dotR===2.8?1.8:2.5}
              strokeLinejoin="round" strokeLinecap="round"/>}
            {def.map((p,i)=>(
              <circle key={i} cx={p.x} cy={p.y} r={dotR} fill={color}>
                <title>{CATEGORY_LABELS[cat]||cat}: {p.v.toFixed(2)}</title>
              </circle>
            ))}
            {/* end label */}
            {def[def.length-1] && (
              <text x={def[def.length-1].x+6} y={def[def.length-1].y+4}
                fontSize={fontSize-1} fill={color} fontWeight="600" opacity="0.9">
                {(CATEGORY_LABELS[cat]||cat).split(' ')[0]}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── Zoom Modal ────────────────────────────────────────────────────────────────
function ChartModal({ college, branch, catData, allCats, onClose }) {
  const [active, setActive] = useState(() => new Set(allCats.slice(0,8)));

  const toggle = cat => setActive(prev => {
    const n = new Set(prev);
    n.has(cat) ? n.delete(cat) : n.add(cat);
    return n;
  });

  const selectAll = () => setActive(new Set(allCats));
  const clearAll  = () => setActive(new Set());

  useEffect(()=>{
    const onKey = e => { if(e.key==='Escape') onClose(); };
    document.addEventListener('keydown',onKey);
    return ()=>document.removeEventListener('keydown',onKey);
  },[onClose]);

  const activeCats = allCats.filter(c=>active.has(c));

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box">
        {/* Header */}
        <div className="modal-header">
          <div>
            <div className="modal-college">{college}</div>
            <div className="modal-branch">{branch}</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Chart */}
        <div className="modal-chart-wrap">
          <LineChart
            catData={catData} activeCats={activeCats} allCats={allCats}
            W={680} H={320} PL={46} PR={80} PT={16} PB={32}
            fontSize={11} dotR={4}
          />
        </div>

        {/* Toggle controls */}
        <div className="modal-legend-controls">
          <button className="legend-ctrl-btn" onClick={selectAll}>Show all</button>
          <button className="legend-ctrl-btn" onClick={clearAll}>Hide all</button>
        </div>
        <div className="modal-legend">
          {allCats.map((cat,ci)=>{
            const color = LINE_COLORS[ci%LINE_COLORS.length];
            const on = active.has(cat);
            return (
              <button key={cat} className={`legend-chip${on?'':' off'}`}
                onClick={()=>toggle(cat)}
                style={on?{borderColor:color,background:`${color}18`,color}:{}}>
                <span className="legend-line" style={on?{background:color}:{}}/>
                {CATEGORY_LABELS[cat]||cat}
              </button>
            );
          })}
        </div>

        <p className="modal-hint">Click categories to toggle · Press Esc to close</p>
      </div>
    </div>
  );
}

// ── Mini chart inside card ────────────────────────────────────────────────────
function MiniChart({ catData, shownCats, allCats, onClick }) {
  const DEFAULT_SHOW = 6;
  const activeCats = shownCats.slice(0, DEFAULT_SHOW);
  return (
    <div className="mini-chart-wrap" onClick={onClick} title="Click to zoom in">
      <div className="mini-chart-title">
        PERCENTILE TREND
        <span className="zoom-hint">🔍 click to zoom</span>
      </div>
      <LineChart
        catData={catData} activeCats={activeCats} allCats={allCats}
        W={260} H={140} PL={40} PR={64} PT={12} PB={28}
        fontSize={9} dotR={2.8}
      />
      <div className="mini-legend">
        {activeCats.map((cat,ci)=>{
          const color = LINE_COLORS[allCats.indexOf(cat)%LINE_COLORS.length];
          return (
            <div key={cat} className="mini-legend-item">
              <div style={{width:14,height:2.5,borderRadius:2,background:color,flexShrink:0}}/>
              <span>{CATEGORY_LABELS[cat]||cat}</span>
            </div>
          );
        })}
        {shownCats.length > DEFAULT_SHOW && (
          <div className="mini-legend-item" style={{color:'rgba(255,255,255,0.3)'}}>
            +{shownCats.length-DEFAULT_SHOW} more →
          </div>
        )}
      </div>
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
function CollegeBranchCard({ college, branch, catData }) {
  const [expanded, setExpanded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const allCats = useMemo(()=>{
    const p = PRIORITY_CATS.filter(c=>catData[c]);
    const r = Object.keys(catData).filter(c=>!PRIORITY_CATS.includes(c));
    return [...p,...r];
  },[catData]);

  const topVals = allCats[0]?YEARS.map(y=>catData[allCats[0]]?.[y]??null):[];
  const topTrend = getTrend(topVals);
  const shownCats = expanded?allCats:allCats.slice(0,6);

  return (
    <>
      {modalOpen && (
        <ChartModal
          college={college} branch={branch}
          catData={catData} allCats={allCats}
          onClose={()=>setModalOpen(false)}
        />
      )}

      <div className="trend-card">
        <div className="trend-card-header">
          <div>
            <div className="trend-college">{college}</div>
            <div className="trend-branch">{branch}</div>
          </div>
          <TrendBadge trend={topTrend}/>
        </div>

        <div className="trend-body">
          {/* Table */}
          <div className="trend-table-wrap">
            <table className="trend-table">
              <thead>
                <tr>
                  <th>Category</th>
                  {YEARS.map(y=><th key={y}>{y}</th>)}
                  <th>Trend</th>
                </tr>
              </thead>
              <tbody>
                {shownCats.map((cat,ci)=>{
                  const vals = YEARS.map(y=>catData[cat]?.[y]??null);
                  const color = LINE_COLORS[allCats.indexOf(cat)%LINE_COLORS.length];
                  return (
                    <tr key={cat}>
                      <td className="cat-cell">
                        <span className="cat-dot" style={{background:color}}/>
                        <span className="cat-tag">{CATEGORY_LABELS[cat]||cat}</span>
                      </td>
                      {vals.map((v,i)=>(
                        <td key={i} className="score-cell">
                          {v!=null?v.toFixed(2):<span style={{color:'var(--muted)'}}>—</span>}
                        </td>
                      ))}
                      <td><TrendBadge trend={getTrend(vals)}/></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {allCats.length>6&&(
              <button className="expand-btn" onClick={()=>setExpanded(e=>!e)}>
                {expanded?'▲ Show less':`▼ Show ${allCats.length-6} more categories`}
              </button>
            )}
          </div>

          {/* Mini chart */}
          <MiniChart
            catData={catData} shownCats={allCats} allCats={allCats}
            onClick={()=>setModalOpen(true)}
          />
        </div>
      </div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TrendsPage({ data }) {
  const [search, setSearch] = useState('');
  const [filterCollege, setFilterCollege] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterTrend, setFilterTrend] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const colleges = useMemo(()=>data?.colleges||[],[data]);
  const branches = useMemo(()=>data?.branches||[],[data]);
  const rawData  = useMemo(()=>data?.data||{},[data]);

  const entries = useMemo(()=>
    Object.entries(rawData).map(([key,catData])=>{
      const [college,branch]=key.split('|||');
      return {college,branch,catData};
    }),[rawData]);

  const filtered = useMemo(()=>entries.filter(({college,branch,catData})=>{
    if(filterCollege&&college!==filterCollege) return false;
    if(filterBranch&&branch!==filterBranch) return false;
    if(search){const q=search.toLowerCase();if(!college.toLowerCase().includes(q)&&!branch.toLowerCase().includes(q))return false;}
    if(filterCategory&&!catData[filterCategory]) return false;
    if(filterTrend){
      const has=Object.entries(catData).some(([cat,yd])=>{
        if(filterCategory&&cat!==filterCategory) return false;
        return getTrend(YEARS.map(y=>yd[y]??null))===filterTrend;
      });
      if(!has) return false;
    }
    return true;
  }),[entries,filterCollege,filterBranch,search,filterCategory,filterTrend]);

  const totalPages = Math.ceil(filtered.length/PER_PAGE);
  const paged = filtered.slice((page-1)*PER_PAGE,page*PER_PAGE);
  useEffect(()=>setPage(1),[search,filterCollege,filterBranch,filterTrend,filterCategory]);

  if(!data) return (
    <div className="trends-loading">
      <div className="trends-spinner"/>
      <p>Loading trend data…</p>
    </div>
  );

  return (
    <>
      <style>{`
        .trends-page{min-height:100vh;padding:100px 24px 60px;max-width:1300px;margin:0 auto;font-family:inherit;background:#0b0f1a;}
        .trends-hero{text-align:center;margin-bottom:36px;}
        .trends-hero h1{font-size:clamp(2rem,5vw,3rem);font-weight:800;letter-spacing:-0.03em;margin:0 0 10px;
          background:linear-gradient(135deg,#fbbf24 0%,#f97316 60%);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
        .trends-hero p{color:var(--muted,#94a3b8);font-size:1rem;margin:0;}
        .trends-stats{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:28px;}
        .trend-stat-chip{background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.14);
          border-radius:40px;padding:6px 16px;font-size:12px;color:var(--muted,#94a3b8);}
        .trend-stat-chip b{color:var(--amber2,#f59e0b);font-weight:700;}

        .trends-filters{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:10px;}
        .trends-filters-row2{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:20px;}
        .trends-filters input,.trends-filters select,.trends-filters-row2 select{
          width:100%;padding:10px 14px;border-radius:10px;border:1px solid rgba(255,255,255,0.1);
          background:rgba(255,255,255,0.05);color:var(--fg,#f1f5f9);font-size:13px;outline:none;
          transition:border-color 0.2s;box-sizing:border-box;}
        .trends-filters input:focus,.trends-filters select:focus,.trends-filters-row2 select:focus{border-color:var(--amber2,#f59e0b);}
        .trends-filters select option,.trends-filters-row2 select option{background:#1e2433;}
        .trends-results-bar{display:flex;justify-content:space-between;align-items:center;
          margin-bottom:16px;font-size:13px;color:var(--muted,#94a3b8);}
        .trends-grid{display:grid;grid-template-columns:1fr;gap:20px;margin-bottom:40px;}

        /* Card */
        .trend-card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);
          border-radius:16px;padding:20px 22px;transition:border-color 0.2s,transform 0.2s;}
        .trend-card:hover{border-color:rgba(245,158,11,0.25);transform:translateY(-1px);}
        .trend-card-header{display:flex;justify-content:space-between;align-items:flex-start;
          margin-bottom:16px;gap:12px;}
        .trend-college{font-size:12px;color:var(--muted,#94a3b8);margin-bottom:3px;}
        .trend-branch{font-size:17px;font-weight:700;color:var(--fg,#f1f5f9);letter-spacing:-0.01em;}
        .trend-body{display:grid;grid-template-columns:1fr 300px;gap:20px;align-items:start;}

        .trend-table-wrap{overflow-x:auto;}
        .trend-table{width:100%;border-collapse:collapse;font-size:13px;}
        .trend-table th{text-align:left;padding:7px 10px;color:var(--muted,#94a3b8);font-weight:600;
          border-bottom:1px solid rgba(255,255,255,0.07);white-space:nowrap;}
        .trend-table td{padding:8px 10px;border-bottom:1px solid rgba(255,255,255,0.04);vertical-align:middle;}
        .trend-table tr:last-child td{border-bottom:none;}
        .cat-cell{display:flex;align-items:center;gap:7px;}
        .cat-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
        .cat-tag{display:inline-block;padding:2px 7px;border-radius:5px;font-size:11px;font-weight:600;
          background:rgba(245,158,11,0.1);color:var(--amber2,#f59e0b);white-space:nowrap;}
        .score-cell{font-family:'Courier New',monospace;font-size:12.5px;font-weight:600;color:var(--fg,#f1f5f9);}
        .expand-btn{margin-top:10px;background:none;border:1px solid rgba(255,255,255,0.1);
          color:var(--muted,#94a3b8);border-radius:8px;padding:5px 12px;font-size:11.5px;
          cursor:pointer;transition:all 0.2s;}
        .expand-btn:hover{border-color:var(--amber2,#f59e0b);color:var(--amber2,#f59e0b);}

        /* Mini chart */
        .mini-chart-wrap{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);
          border-radius:12px;padding:14px 14px 10px;cursor:pointer;position:sticky;top:90px;
          transition:border-color 0.2s,box-shadow 0.2s;}
        .mini-chart-wrap:hover{border-color:rgba(245,158,11,0.4);
          box-shadow:0 0 20px rgba(245,158,11,0.1);}
        .mini-chart-title{font-size:10px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;
          color:var(--muted,#94a3b8);margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;}
        .zoom-hint{font-size:10px;font-weight:400;letter-spacing:0;text-transform:none;
          color:rgba(255,255,255,0.25);font-style:italic;}
        .mini-legend{display:flex;flex-wrap:wrap;gap:4px 10px;margin-top:8px;
          padding-top:8px;border-top:1px solid rgba(255,255,255,0.05);}
        .mini-legend-item{display:flex;align-items:center;gap:4px;font-size:9.5px;
          color:rgba(255,255,255,0.4);white-space:nowrap;}

        /* Modal */
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(4px);
          z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;}
        .modal-box{background:#0f1623;border:1px solid rgba(255,255,255,0.1);border-radius:20px;
          padding:28px;max-width:820px;width:100%;max-height:90vh;overflow-y:auto;
          box-shadow:0 24px 80px rgba(0,0,0,0.6);}
        .modal-header{display:flex;justify-content:space-between;align-items:flex-start;
          margin-bottom:20px;gap:12px;}
        .modal-college{font-size:12px;color:var(--muted,#94a3b8);margin-bottom:4px;}
        .modal-branch{font-size:22px;font-weight:800;color:var(--fg,#f1f5f9);letter-spacing:-0.02em;}
        .modal-close{background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);
          color:var(--fg,#f1f5f9);border-radius:8px;width:36px;height:36px;
          display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;
          transition:all 0.15s;flex-shrink:0;}
        .modal-close:hover{background:rgba(251,113,133,0.2);border-color:#fb7185;color:#fb7185;}
        .modal-chart-wrap{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);
          border-radius:12px;padding:16px 8px 8px;margin-bottom:16px;overflow:hidden;}
        .modal-legend-controls{display:flex;gap:8px;margin-bottom:10px;}
        .legend-ctrl-btn{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);
          color:rgba(255,255,255,0.6);border-radius:7px;padding:4px 12px;font-size:11.5px;
          cursor:pointer;transition:all 0.15s;}
        .legend-ctrl-btn:hover{border-color:var(--amber2,#f59e0b);color:var(--amber2,#f59e0b);}
        .modal-legend{display:flex;flex-wrap:wrap;gap:6px;}
        .legend-chip{display:inline-flex;align-items:center;gap:6px;padding:5px 10px;
          border-radius:8px;border:1px solid rgba(255,255,255,0.08);
          background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.4);
          font-size:11.5px;cursor:pointer;transition:all 0.15s;}
        .legend-chip:hover{border-color:rgba(255,255,255,0.2);color:rgba(255,255,255,0.7);}
        .legend-chip.off{opacity:0.35;filter:grayscale(1);}
        .legend-line{width:16px;height:2.5px;border-radius:2px;background:rgba(255,255,255,0.2);flex-shrink:0;}
        .modal-hint{text-align:center;font-size:11px;color:rgba(255,255,255,0.2);margin:14px 0 0;font-style:italic;}

        /* Pagination */
        .trends-pagination{display:flex;justify-content:center;align-items:center;gap:8px;flex-wrap:wrap;}
        .pg-btn{padding:8px 14px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);
          background:rgba(255,255,255,0.03);color:var(--fg,#f1f5f9);font-size:13px;
          cursor:pointer;transition:all 0.15s;}
        .pg-btn:hover:not(:disabled){border-color:var(--amber2,#f59e0b);color:var(--amber2,#f59e0b);}
        .pg-btn.active{background:var(--amber2,#f59e0b);border-color:var(--amber2,#f59e0b);color:#000;font-weight:700;}
        .pg-btn:disabled{opacity:0.3;cursor:not-allowed;}

        .trends-loading{display:flex;flex-direction:column;align-items:center;justify-content:center;
          min-height:60vh;gap:16px;color:var(--muted,#94a3b8);}
        .trends-spinner{width:36px;height:36px;border:3px solid rgba(245,158,11,0.2);
          border-top-color:var(--amber2,#f59e0b);border-radius:50%;animation:spin 0.8s linear infinite;}
        @keyframes spin{to{transform:rotate(360deg);}}
        .no-results{text-align:center;padding:60px 20px;color:var(--muted,#94a3b8);}

        @media(max-width:900px){.trend-body{grid-template-columns:1fr;}.mini-chart-wrap{position:static;}}
        @media(max-width:640px){.trends-filters,.trends-filters-row2{grid-template-columns:1fr;}
          .trends-page{padding:80px 14px 40px;}.modal-box{padding:18px;}}
      `}</style>

      <div className="trends-page">
        <div className="trends-hero">
          <h1> Cutoff Trends</h1>
          <p>3-year historical analysis · click any chart to explore interactively</p>
        </div>

        <div className="trends-stats">
          <div className="trend-stat-chip"><b>{entries.length}</b> college–branch combos</div>
          <div className="trend-stat-chip"><b>{colleges.length}</b> colleges</div>
          <div className="trend-stat-chip"><b>{branches.length}</b> branches</div>
          <div className="trend-stat-chip">Years: <b>2022 · 2023 · 2024</b></div>
        </div>

        <div className="trends-filters">
          <input placeholder="🔍  Search college or branch…" value={search} onChange={e=>setSearch(e.target.value)}/>
          <select value={filterCollege} onChange={e=>setFilterCollege(e.target.value)}>
            <option value="">All Colleges</option>
            {colleges.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterBranch} onChange={e=>setFilterBranch(e.target.value)}>
            <option value="">All Branches</option>
            {branches.map(b=><option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="trends-filters-row2">
          <select value={filterCategory} onChange={e=>setFilterCategory(e.target.value)}>
            <option value="">All Categories</option>
            {PRIORITY_CATS.map(c=><option key={c} value={c}>{CATEGORY_LABELS[c]||c}</option>)}
          </select>
          <select value={filterTrend} onChange={e=>setFilterTrend(e.target.value)}>
            <option value="">All Trends</option>
            <option value="up">↑ Rising (more competitive)</option>
            <option value="down">↓ Easing (less competitive)</option>
            <option value="stable">→ Stable</option>
          </select>
          <button className="pg-btn" onClick={()=>{setSearch('');setFilterCollege('');setFilterBranch('');setFilterTrend('');setFilterCategory('');}}>
            ✕ Clear Filters
          </button>
        </div>

        <div className="trends-results-bar">
          <span>Showing <b style={{color:'var(--fg)'}}>{filtered.length}</b> results</span>
          <span>Page {page} of {totalPages||1}</span>
        </div>

        {paged.length===0?(
          <div className="no-results"><p>No results found</p><span>Try adjusting your filters</span></div>
        ):(
          <div className="trends-grid">
            {paged.map(({college,branch,catData})=>(
              <CollegeBranchCard key={`${college}|||${branch}`} college={college} branch={branch} catData={catData}/>
            ))}
          </div>
        )}

        {totalPages>1&&(
          <div className="trends-pagination">
            <button className="pg-btn" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>← Prev</button>
            {Array.from({length:Math.min(7,totalPages)},(_,i)=>{
              let p;
              if(totalPages<=7) p=i+1;
              else if(page<=4) p=i+1;
              else if(page>=totalPages-3) p=totalPages-6+i;
              else p=page-3+i;
              return <button key={p} className={`pg-btn${page===p?' active':''}`} onClick={()=>setPage(p)}>{p}</button>;
            })}
            <button className="pg-btn" onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}>Next →</button>
          </div>
        )}
      </div>
    </>
  );
}