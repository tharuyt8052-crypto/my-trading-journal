const $=id=>document.getElementById(id);
const STORAGE='myTradingJournal.multiAccount.v1';
const defaults={
  2500:{id:2500,name:'FundingPips $2,500',start:2500,risk:6.25,p1:8,p2:5,daily:5,max:10,phase:1,trades:[],milestones:[false,false,false]},
  5000:{id:5000,name:'FundingPips $5,000',start:5000,risk:12.5,p1:8,p2:5,daily:5,max:10,phase:1,trades:[],milestones:[false,false,false]},
  10000:{id:10000,name:'FundingPips $10,000',start:10000,risk:25,p1:8,p2:5,daily:5,max:10,phase:1,trades:[],milestones:[false,false,false]}
};
let data;
try{data=JSON.parse(localStorage.getItem(STORAGE))}catch(e){}
if(!data||!data.accounts)data={accounts:defaults};
for(const id of [2500,5000,10000])if(!data.accounts[id])data.accounts[id]=structuredClone(defaults[id]);
let selected=5000,viewMonth=new Date(),selectedDate=new Date().toISOString().slice(0,10);
const account=()=>data.accounts[selected];
const money=n=>(n<0?'-$':'$')+Math.abs(n).toFixed(2);
const num=v=>Number(v)||0;
function save(){localStorage.setItem(STORAGE,JSON.stringify(data))}
function notify(msg){const n=document.createElement('div');n.textContent=msg;n.style='position:fixed;bottom:18px;left:50%;transform:translateX(-50%);background:#087bc9;color:white;padding:12px 18px;border-radius:9px;z-index:9';document.body.append(n);setTimeout(()=>n.remove(),2000)}
function stats(){const t=account().trades,pl=t.reduce((s,x)=>s+x.pl,0),wins=t.filter(x=>x.pl>0),loss=t.filter(x=>x.pl<0),target=account().start*(account().phase===2?account().p2:account().p1)/100,progress=target?Math.max(0,Math.min(100,pl/target*100)):0;
$('dashTitle').textContent=account().name;$('phaseLabel').textContent=account().phase===3?'FUNDED':'PHASE '+account().phase;
$('balance').textContent=money(account().start+pl);$('totalPL').textContent=money(pl);$('totalPL').className=pl>=0?'green':'red';
$('winRate').textContent=(t.length?wins.length/t.length*100:0).toFixed(1)+'%';$('totalTrades').textContent=t.length;$('wins').textContent=wins.length;$('losses').textContent=loss.length;
$('bestTrade').textContent=money(t.length?Math.max(0,...t.map(x=>x.pl)):0);$('worstTrade').textContent=money(t.length?Math.min(0,...t.map(x=>x.pl)):0);
$('targetPct').textContent=progress.toFixed(1)+'%';$('targetBar').style.width=progress+'%';$('targetEarned').textContent=money(pl)+' / '+money(target);$('targetName').textContent='Phase '+account().phase+' target';
$('recentTrades').innerHTML=t.slice().reverse().slice(0,5).map(x=>`<tr><td>${x.date}</td><td>${esc(x.symbol)}</td><td>${x.side}</td><td>${x.lot}</td><td class="${x.pl>=0?'green':'red'}">${money(x.pl)}</td></tr>`).join('');$('noRecent').hidden=!!t.length;drawChart();renderRisk();renderTrades();renderCalendar();renderMilestones();$('accountTag').textContent='$'+Number(selected).toLocaleString()+' ACCOUNT';
}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function drawChart(){const c=$('profitChart'),ctx=c.getContext('2d'),w=c.width,h=c.height;ctx.clearRect(0,0,w,h);let vals=[0],sum=0;account().trades.forEach(t=>{sum+=t.pl;vals.push(sum)});let max=Math.max(10,...vals),min=Math.min(-10,...vals),range=max-min;ctx.strokeStyle='#314a67';ctx.lineWidth=1;for(let i=1;i<4;i++){let y=h*i/4;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}ctx.strokeStyle='#48baff';ctx.lineWidth=3;ctx.beginPath();vals.forEach((v,i)=>{let x=vals.length===1?w/2:i*w/(vals.length-1),y=h-12-(v-min)/range*(h-24);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke()}
function renderRisk(){const a=account();$('riskBalance').value=a.start;$('riskAmount').value=a.risk;$('riskReference').innerHTML='';for(let i=1;i<=10;i++){let lot=i/100,pips=a.risk/(lot*10);$('riskReference').innerHTML+=`<tr><td>${lot.toFixed(2)}</td><td>${pips.toFixed(2)}</td><td>${money(a.risk)}</td></tr>`}calcRisk()}
function calcRisk(){let lot=num($('lotSize').value),sl=num($('slPips').value),pv=num($('pipValue').value),risk=num($('riskAmount').value),bal=num($('riskBalance').value),loss=lot*100*pv*sl,sp=lot*100*pv?risk/(lot*100*pv):0;$('estimatedRisk').textContent=money(loss);$('riskPercent').textContent=(bal?loss/bal*100:0).toFixed(2)+'%';$('suggestedSL').textContent=sp.toFixed(2);$('riskStatus').textContent=loss<=risk+0.001?'Within Plan':'Above Risk Plan';$('riskStatus').className=loss<=risk+0.001?'green':'red'}
function renderTrades(){let t=account().trades;$('allTrades').innerHTML=t.slice().reverse().map(x=>`<tr><td>${x.date}</td><td>${esc(x.symbol)}</td><td>${x.side}</td><td>${x.lot}</td><td class="${x.pl>=0?'green':'red'}">${money(x.pl)}</td><td><button data-delete="${x.id}">Delete</button></td></tr>`).join('');$('noTrades').hidden=!!t.length}
function renderMilestones(){let m=account().milestones;['phase1Passed','phase2Passed','funded'].forEach((id,i)=>$(id).checked=!!m[i]);let n=m.filter(Boolean).length;$('milestoneBar').style.width=n/3*100+'%';$('milestoneCount').textContent=n+' / 3 milestones completed';$('fundedBadge').textContent=m[2]?'🏆 FUNDED TRADER!':'🔒 Funded Trader milestone pending';$('p1target').textContent=money(account().start*account().p1/100);$('p2target').textContent=money(account().start*account().p2/100)}
function renderCalendar(){let y=viewMonth.getFullYear(),m=viewMonth.getMonth(),first=new Date(y,m,1).getDay(),last=new Date(y,m+1,0).getDate();$('monthLabel').textContent=viewMonth.toLocaleString('en',{month:'long',year:'numeric'});let html='';for(let i=0;i<first;i++)html+='<div class="day blank"></div>';for(let d=1;d<=last;d++){let date=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`,pl=account().trades.filter(t=>t.date===date).reduce((s,t)=>s+t.pl,0),cls=account().trades.some(t=>t.date===date)?(pl>=0?'profit':'loss'):'';html+=`<button class="day ${cls} ${date===selectedDate?'today':''}" data-date="${date}">${d}<br><small>${account().trades.some(t=>t.date===date)?money(pl):''}</small></button>`}$('calendarGrid').innerHTML=html;showDay()}
function showDay(){let ts=account().trades.filter(t=>t.date===selectedDate),pl=ts.reduce((s,t)=>s+t.pl,0);$('selectedDayTitle').textContent=selectedDate;$('selectedDaySummary').textContent=ts.length?`${ts.length} trades · Net P/L ${money(pl)}`:'No trades recorded on this date.'}
function loadSettings(){let a=account();$('accountName').value=a.name;$('startingBalance').value=a.start;$('settingRisk').value=a.risk;$('phase1Target').value=a.p1;$('phase2Target').value=a.p2;$('dailyLimit').value=a.daily;$('maxLimit').value=a.max;$('currentPhase').value=a.phase}
function switchAccount(){selected=Number($('accountSelect').value);$('riskBalance').value=account().start;loadSettings();stats()}
document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x.id===b.dataset.tab));if(b.dataset.tab==='settings')loadSettings()}));
$('accountSelect').addEventListener('change',switchAccount);
['lotSize','slPips','pipValue','riskAmount','riskBalance'].forEach(id=>$(id).addEventListener('input',calcRisk));
$('tradeDate').value=new Date().toISOString().slice(0,10);
$('tradeForm').addEventListener('submit',e=>{e.preventDefault();let t={id:Date.now(),date:$('tradeDate').value,symbol:$('symbol').value.trim().toUpperCase(),side:$('side').value,lot:num($('tradeLot').value),entry:num($('entry').value),exit:num($('exit').value),sl:num($('tradeSL').value),pl:num($('tradePL').value),notes:$('notes').value};account().trades.push(t);save();e.target.reset();$('tradeDate').value=new Date().toISOString().slice(0,10);stats();notify('Trade saved to '+account().name)});
$('allTrades').addEventListener('click',e=>{let id=e.target.dataset.delete;if(!id)return;if(confirm('Delete this trade?')){account().trades=account().trades.filter(t=>t.id!==Number(id));save();stats()}});
$('saveSettings').addEventListener('click',()=>{let a=account();a.name=$('accountName').value||'Trading Account';a.start=Math.max(0,num($('startingBalance').value));a.risk=Math.max(0,num($('settingRisk').value));a.p1=num($('phase1Target').value);a.p2=num($('phase2Target').value);a.daily=num($('dailyLimit').value);a.max=num($('maxLimit').value);a.phase=num($('currentPhase').value);save();stats();notify('Settings saved for this account')});
['phase1Passed','phase2Passed','funded'].forEach((id,i)=>$(id).addEventListener('change',()=>{account().milestones[i]=$(id).checked;save();renderMilestones()}));
$('prevMonth').onclick=()=>{viewMonth.setMonth(viewMonth.getMonth()-1);renderCalendar()};$('nextMonth').onclick=()=>{viewMonth.setMonth(viewMonth.getMonth()+1);renderCalendar()};
$('calendarGrid').addEventListener('click',e=>{let date=e.target.closest('[data-date]')?.dataset.date;if(date){selectedDate=date;renderCalendar()}});
function download(name,content,type){let blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url)}
$('exportJSON').onclick=()=>download(`trading-journal-${selected}.json`,JSON.stringify({account:account()},null,2),'application/json');
$('importJSON').onchange=async e=>{let f=e.target.files[0];if(!f)return;try{let x=JSON.parse(await f.text()),a=x.account||x;if(!Array.isArray(a.trades))throw Error();data.accounts[selected]=a;save();loadSettings();stats();notify('Backup restored')}catch(err){alert('Invalid backup file')}e.target.value=''};
$('exportCSV').onclick=()=>{let rows=[['Date','Symbol','Side','Lot','Entry','Exit','SL Pips','Profit Loss','Notes'],...account().trades.map(t=>[t.date,t.symbol,t.side,t.lot,t.entry,t.exit,t.sl,t.pl,t.notes])];let csv=rows.map(r=>r.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\n');download(`trades-${selected}.csv`,'\ufeff'+csv,'text/csv;charset=utf-8')};
$('printReport').onclick=()=>window.print();
stats();loadSettings();
