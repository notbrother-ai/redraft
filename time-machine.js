// RE:DRAFT Time Machine Reveal foundation.
// Outcome data is intentionally separate from draft-day ADP/rank data so hindsight never leaks into the draft room.
(() => {
  window.REDRAFT_OUTCOMES_2017={
    'Todd Gurley':{posFinish:1,note:'Breakout league-winning season'},
    'LeVeon Bell':{posFinish:2,note:'Elite season matched premium draft cost'},
    'Kareem Hunt':{posFinish:4,note:'Major value relative to preseason market'},
    'Alvin Kamara':{posFinish:3,note:'Historic late-round rookie breakout'},
    'David Johnson':{note:'Season derailed by early injury'},
    'Odell Beckham Jr.':{note:'Season derailed by injury'},
    'Antonio Brown':{posFinish:1,note:'Finished as an elite fantasy WR'},
    'DeAndre Hopkins':{posFinish:2,note:'Massive rebound season'},
    'Adam Thielen':{note:'Significantly outperformed preseason cost'},
    'Rob Gronkowski':{posFinish:1,note:'Elite TE production'},
    'Zach Ertz':{note:'Strong value at tight end'},
    'Carson Wentz':{note:'Breakout season before late injury'}
  };
  window.redraftTimeMachine=()=>{
    const r=rosters?.[user]||[],data=window.REDRAFT_OUTCOMES_2017;return r.map(p=>({player:p,outcome:data[p.name]||null}));
  };
  const wait=()=>{if(typeof window.finish!=='function')return setTimeout(wait,35);if(window.finish.__tmPatched)return;const old=window.finish;window.finish=function(){old();const report=document.getElementById('report'),rows=window.redraftTimeMachine().filter(x=>x.outcome);if(!report||!rows.length)return;const box=document.createElement('div');box.style.cssText='margin:14px 0;padding:14px;background:#20394f;color:white;border-top:3px solid #e6a21a';box.innerHTML=`<div style="font-size:11px;font-weight:bold;letter-spacing:1px">TIME MACHINE REVEAL · WHAT ACTUALLY HAPPENED</div><div style="font-size:10px;margin:5px 0 10px;color:#cbd4dc">This is revealed only after the draft. It never affects draft-day rankings or CPU decisions.</div>${rows.map(x=>`<div style="padding:5px 0;border-top:1px solid #526577;font-size:11px"><b>${x.player.name}</b>${x.outcome.posFinish?` · ${x.player.pos}${x.outcome.posFinish}`:''} — ${x.outcome.note}</div>`).join('')}`;report.appendChild(box)};window.finish.__tmPatched=true};wait();
})();