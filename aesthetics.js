// RE:DRAFT 2017 presentation polish — automatically applied by season
(() => {
 const css=`
 html,body{min-width:100%;min-height:100%} body{background:#d7dce1!important;font-family:Arial,Helvetica,sans-serif!important}
 .wrap{max-width:none!important;width:100%!important;margin:0!important}
 header{height:42px;box-sizing:border-box;padding:11px 18px!important;background:linear-gradient(#294760,#20394f)!important;box-shadow:0 1px 2px #667!important}
 .setup{max-width:1050px;margin:18px auto!important;box-shadow:0 1px 3px #9aa5ae;background:#f8f9fa!important}
 .room{width:100%!important;border-left:0!important;border-right:0!important;grid-template-columns:285px minmax(850px,1fr)!important;min-height:calc(100vh - 42px);align-items:start}
 .side{background:#f4f6f7!important;position:sticky;top:0;height:calc(100vh - 42px);overflow:auto}
 .side .head{background:linear-gradient(#e9edf0,#d5dce2)!important;color:#20394f!important;padding:7px!important}
 .slot{min-height:22px;padding:5px 7px!important;font-size:10px!important;grid-template-columns:46px 1fr!important;background:#fafbfc}
 .slot:nth-child(even){background:#f1f4f6}.slotlabel{font-size:10px!important}
 main{min-width:0;background:#fff}
 .status{height:33px;box-sizing:border-box;background:linear-gradient(#294760,#20394f)!important;border-bottom:1px solid #102638;font-size:11px!important;font-weight:bold;display:flex;align-items:center}
 main>.head{padding:6px 8px!important;background:linear-gradient(#e7ebef,#d5dce2)!important;color:#20394f;border-top:1px solid #aab6c0!important}
 .players{max-height:330px!important;background:#fff}
 .player{grid-template-columns:48px minmax(220px,1fr) 65px 90px 70px 100px!important;min-height:51px!important;padding:3px 10px!important;font-size:10px!important}
 .player:hover{background:#edf4fa!important}.photo{width:42px!important;height:42px!important;border:1px solid #c2cbd2;background:#e4e8eb!important}
 .nm{font-size:11px!important}.meta{margin-top:2px}.draft{padding:5px 9px!important;border-color:#bc8415!important;background:linear-gradient(#ffc341,#e9a117)!important}.star{vertical-align:middle}
 .board{min-width:980px!important}.pick{height:50px!important;padding:4px!important;font-size:9px!important;background:#fff}.pick:hover{background:#eaf1f7!important}.pick.mine{background:#fff0bd!important;border-bottom-color:#d9bd62!important}
 .queue{line-height:1.7;background:#fff;min-height:30px}.scroll{background:#fff}
 .finish{margin:14px!important;box-shadow:0 1px 3px #a6afb7}
 @media(min-width:1450px){.room{grid-template-columns:310px minmax(1000px,1fr)!important}.players{max-height:365px!important}.player{grid-template-columns:52px minmax(280px,1fr) 75px 100px 80px 110px!important}.photo{width:46px!important;height:46px!important}.pick{height:54px!important;font-size:9.5px!important}}
 `;
 const s=document.createElement('style');s.id='era2017Style';s.textContent=css;document.head.appendChild(s);
 function improveLabels(){
   const roster=document.getElementById('rosterTeam');if(roster)roster.title='Switch between every team roster';
   const boardHead=[...document.querySelectorAll('.head')].find(x=>x.textContent.includes('DRAFT BOARD'));if(boardHead)boardHead.textContent='DRAFT BOARD — CLICK ANY TEAM COLUMN TO VIEW ITS ROSTER';
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',improveLabels);else improveLabels();
})();