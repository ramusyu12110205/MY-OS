/* Qualification OS enhancements: 5:00 study-day boundary + dashboard charts */
(function(){
  function pad(n){return String(n).padStart(2,'0')}
  function localDate(d){d=d||new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
  function parseDate(s){return new Date(s+'T00:00:00')}
  function minutesText(m){m=Number(m)||0;return Math.floor(m/60)+'時間'+(m%60)+'分'}
  function esc2(s){return String(s==null?'':s).replace(/[&<>\"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[m]})}
  function studyDay(d){
    var x=new Date(d||new Date());
    if(x.getHours()<5)x.setDate(x.getDate()-1);
    return localDate(x);
  }
  function addDays5(s,n){var d=parseDate(s);d.setDate(d.getDate()+n);return localDate(d)}
  window.today=studyDay;

  function renderDashboard(){
    var box=document.getElementById('dashboard');
    if(!box || typeof sessions==='undefined' || typeof qualifications==='undefined')return;
    var st=sessions||[],qs=qualifications||[],nowDay=studyDay(),base=parseDate(nowDay);
    var dayMap={};st.forEach(function(s){dayMap[s.study_date]=(dayMap[s.study_date]||0)+Number(s.minutes||0)});
    var monday=new Date(base);var dow=monday.getDay();monday.setDate(monday.getDate()-(dow===0?6:dow-1));
    var week=[];for(var i=0;i<7;i++){var d=new Date(monday);d.setDate(d.getDate()+i);var k=localDate(d);week.push({k:k,m:dayMap[k]||0,label:['月','火','水','木','金','土','日'][i]})}
    var prev=week.map(function(x){var d=parseDate(x.k);d.setDate(d.getDate()-7);return dayMap[localDate(d)]||0});
    var weekTotal=week.reduce(function(a,x){return a+x.m},0),prevTotal=prev.reduce(function(a,x){return a+x},0);
    var max=Math.max(60,week.reduce(function(a,x){return Math.max(a,x.m)},0),prev.reduce(function(a,x){return Math.max(a,x)},0));
    var active=week.filter(function(x){return x.m>0}).length;
    var change=prevTotal?Math.round((weekTotal-prevTotal)/prevTotal*100):null;
    var bars=week.map(function(x,i){var ph=prev[i],ch=Math.max(2,Math.round(x.m/max*100)),pp=Math.max(2,Math.round(ph/max*100));return '<div class="qsd-day"><div class="qsd-bars"><div class="qsd-prev" style="height:'+pp+'%"></div><div class="qsd-cur" style="height:'+ch+'%"></div></div><div class="qsd-min">'+x.m+'分</div><div class="qsd-label">'+x.label+'</div></div>'}).join('');
    var projects=qs.map(function(q){var rows=st.filter(function(s){return s.qualification_id===q.id}),total=rows.reduce(function(a,s){return a+Number(s.minutes||0)},0),dates=rows.map(function(s){return s.study_date}).sort(),start=dates[0]||'';return {q:q,total:total,days:[...new Set(dates)].length,start:start}}).filter(function(x){return x.total>0||x.q.exam_date}).sort(function(a,b){return b.total-a.total});
    var projectHtml=projects.length?projects.map(function(x){var exam=x.q.exam_date?Math.ceil((parseDate(x.q.exam_date)-parseDate(nowDay))/86400000):null;return '<div class="qsd-project"><div><b>'+esc2(x.q.name)+'</b><div class="muted small">'+(x.start?'開始 '+x.start:'学習記録なし')+(exam!=null?' ・ '+(exam>=0?'試験まで '+exam+'日':'試験済み'):'')+'</div></div><strong>'+minutesText(x.total)+'</strong><div class="muted small qsd-sub">学習日 '+x.days+'日</div></div>'}).join(''):'<div class="item">まだ学習プロジェクトがありません。</div>';
    box.innerHTML='<style id="qsdStyle">.qsd-chart{height:210px;display:flex;align-items:flex-end;gap:7px;padding:18px 4px 0;border-bottom:1px solid #26314d;margin-top:10px}.qsd-day{flex:1;text-align:center}.qsd-bars{height:145px;display:flex;align-items:flex-end;justify-content:center;gap:3px}.qsd-bars>div{width:36%;max-width:22px;border-radius:6px 6px 2px 2px;min-height:2px}.qsd-prev{background:#35405e;opacity:.65}.qsd-cur{background:linear-gradient(180deg,#22d3ee,#8b5cf6)}.qsd-min{font-size:10px;margin-top:5px}.qsd-label{font-size:12px;font-weight:800;color:#9fa9c7;margin-top:4px}.qsd-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin:12px 0}.qsd-summary>div{background:#0e1422;border:1px solid #26314d;border-radius:13px;padding:11px}.qsd-summary span{display:block;color:#98a3bf;font-size:11px}.qsd-summary b{display:block;font-size:20px;margin-top:2px}.qsd-project{display:grid;grid-template-columns:1fr auto;gap:3px 10px;border:1px solid #26314d;border-radius:13px;padding:13px;margin:8px 0;background:#0f1627}.qsd-sub{grid-column:1/-1}@media(max-width:700px){.qsd-summary{grid-template-columns:1fr}.qsd-chart{height:185px}.qsd-bars{height:125px}}</style><div class="qsd-wrap"><div class="sectiontitle"><div><div class="kicker">WEEKLY STUDY</div><h3>今週の学習時間</h3><div class="muted small">濃い棒＝今週 / 薄い棒＝先週</div></div><span class="badge">'+localDate(monday)+'〜'+week[6].k+'</span></div><div class="qsd-chart">'+bars+'</div><div class="qsd-summary"><div><span>今週</span><b>'+minutesText(weekTotal)+'</b></div><div><span>今週の学習日数</span><b>'+active+'日</b></div><div><span>先週比</span><b>'+(change==null?'—':(change>0?'＋':'')+change+'%')+'</b></div></div><div class="item"><div class="sectiontitle"><b>先週の総合計</b><strong>'+minutesText(prevTotal)+'</strong></div></div><h3 style="margin-top:18px">📚 学習プロジェクト</h3>'+projectHtml+'</div>';
  }

  function install(){
    window.today=studyDay;
    var rd=document.getElementById('recordDate');if(rd)rd.value=studyDay();
    if(typeof window.showDashboard==='function')window.showDashboard=renderDashboard;
    var root=document.getElementById('app');
    if(root){
      var old=root.getAttribute('data-qsd-hook');
      if(old!=='1'){
        root.setAttribute('data-qsd-hook','1');
        var observer=new MutationObserver(function(){window.today=studyDay;});observer.observe(root,{subtree:true,childList:true});
      }
    }
    var now=new Date(),next=new Date(now.getFullYear(),now.getMonth(),now.getDate(),5,0,5);if(now>=next)next.setDate(next.getDate()+1);
    setTimeout(function(){window.today=studyDay;var r=document.getElementById('recordDate');if(r)r.value=studyDay();install()},Math.max(1000,next-now));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
