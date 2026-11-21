'use strict';

const chapters = ['绪论','药事管理体制与药事组织','药品管理立法','药品研究与注册管理','药品上市后管理','药品生产质量管理','药品经营质量管理','医疗机构药事管理','特殊管理的药品'];
const numerals = '一二三四五六七八九';
const kinds = { A:'单选题', B:'选择题', X:'多选题', J:'判断题' };
const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const shelf = 'yaoshi.study.v1.';
const paths = {
  book:'<path d="M3 5c3-1 6 0 9 2 3-2 6-3 9-2v14c-3-1-6 0-9 2-3-2-6-3-9-2zM12 7v14"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1.2"/><rect x="14" y="3" width="7" height="7" rx="1.2"/><rect x="3" y="14" width="7" height="7" rx="1.2"/><rect x="14" y="14" width="7" height="7" rx="1.2"/>',
  wrong:'<path d="M8 3h11v18H6a2 2 0 0 1-2-2V6a3 3 0 0 1 3-3h1zm0 0v18m3-12 5 5m0-5-5 5"/>',
  star:'<path d="m12 3 2.8 5.8 6.3.9-4.6 4.5 1.1 6.3-5.6-3-5.6 3 1.1-6.3L3 9.7l6.3-.9z"/>',
  play:'<path d="m8 5 11 7-11 7z" fill="currentColor" stroke="none"/>',
  shuffle:'<path d="M3 6h3c4 0 8 12 12 12h3m-4-4 4 4-4 3M3 18h3c1.5 0 3-1.5 4-3.3M14 8.8C15.5 7 16.8 6 18 6h3m-4-3 4 3-4 4"/>',
  chart:'<path d="M3 3v17h18M7 15v-4m5 4V7m5 8v-6"/>',
  check:'<path d="m4 12 5 5L20 6"/>', x:'<path d="m6 6 12 12M18 6 6 18"/>',
  scope:'<circle cx="10" cy="10" r="6.5"/><path d="m15 15 6 6"/>',
  layers:'<path d="m3 8 9-5 9 5-9 5zm0 5 9 5 9-5m-18 5 9 5 9-5"/>',
  clip:'<path d="M7 5H5v16h14V5h-2M9 3h6v4H9zM8 12h8m-8 4h5"/>'
};
function icon(key){return '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[key]||'')+'</svg>';}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function read(key, fallback){try{return JSON.parse(localStorage.getItem(shelf+key))??fallback;}catch{return fallback;}}
let storageWarning = false;
function persist(key,value){try{localStorage.setItem(shelf+key,JSON.stringify(value));}catch{storageWarning=true;showToast('浏览器无法保存，本次仍可继续练习');}}
let bank=[], byId=new Map(), records=read('records',{}), stars=read('stars',{}), run=read('session',null);
let homeKind='', listChapter='', listSearch='', toastTimer;
const root=document.getElementById('app'), dialog=document.getElementById('dialog');
const tabs=[['home','grid','练习首页'],['wrong','wrong','错题本'],['random','shuffle','随机练习']];
function current(){return location.hash.slice(1)||'home';}
function go(name){if(current()===name){render();window.scrollTo(0,0);}else location.hash=name;}
function showToast(text){const t=document.getElementById('toast');t.textContent=text;clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.textContent='',2200);}
function sectionTitle(c){return '第'+numerals[c-1]+'章';}
function ref(q){return sectionTitle(q.c)+' · '+kinds[q.kind]+' '+q.n;}
function percent(n,d){return d?Math.round(n*100/d):0;}
function filterByMode(mode){
  if(mode==='wrong')return bank.filter(q=>q.answer&&records[q.id]?.last===false);
  if(mode==='stars')return bank.filter(q=>stars[q.id]);
  return bank.filter(q=>q.answer);
}
function optionsFor(map,selected){return Object.entries(map).map(([v,l])=>'<option value="'+esc(v)+'" '+(String(selected)===v?'selected':'')+'>'+esc(l)+'</option>').join('');}
function chapterOptions(selected,includeAll=true){return (includeAll?'<option value="">全部章节</option>':'')+chapters.map((v,i)=>'<option value="'+(i+1)+'" '+(String(selected)===String(i+1)?'selected':'')+'>'+sectionTitle(i+1)+' · '+v+'</option>').join('');}
function sourceLink(q){const url=q.source||'';return /^https?:\/\//i.test(url)?' <a class="source-link" href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">查看资料依据</a>':'';}
function showDialog(title,body){
  dialog.innerHTML='<div class="dialog-head"><h2 id="dialog-title">'+esc(title)+'</h2><button class="icon-btn" aria-label="关闭" data-act="close">'+icon('x')+'</button></div><div class="dialog-body">'+body+'</div>';
  if(!dialog.open)dialog.showModal();
}
function showAbout(){
  const scored=filterByMode('all').length;
  showDialog('题库说明','<p>题库依据《药事管理学》（第四版）前九章习题整理，共 '+scored+' 道练习题。</p><p>参考答案按第四版教材及题目指定年份的规定整理。解析中保留了法条依据、扫描勘误和容易混淆的选项。参考资料可在提交后查看。</p><p>共用备选项的选择题逐小题作答，多选题需要选全。</p><p>答题进度、错题和收藏保存在当前浏览器。重做答对后，该题会移出错题本。</p><p><a href="#stars">打开收藏夹</a></p><p><a href="https://www.aijiaocai.com/textbook/details?textbook_id=12195537" target="_blank" rel="noopener">查看第四版教材目录</a></p>');
}
function renderNav(view){
  document.getElementById('nav').innerHTML=tabs.map(([key,ico,label])=>'<a href="#'+key+'" class="nav-link '+((key===view||(key==='home'&&['quiz','result'].includes(view)))?'active':'')+'" '+(key===view?'aria-current="page"':'')+'>'+icon(ico)+label+'</a>').join('');
}
function render(){
  const view=current();renderNav(view);
  if(view==='quiz'&&run?.ids?.length)quiz();
  else if(view==='result'&&run?.ids?.length&&run.ids.every(id=>run.results[id]))result();
  else if(view==='random')randomPage();
  else if(['wrong','stars'].includes(view))list(view);
  else home();
}
function home(){
  const scored=filterByMode('all'), answered=scored.filter(q=>records[q.id]?.tries);
  const totalTries=answered.reduce((s,q)=>s+records[q.id].tries,0);
  const totalCorrect=answered.reduce((s,q)=>s+records[q.id].wins,0);
  const pct=percent(answered.length,scored.length);
  const resume=run?.ids?.some(id=>!run.results[id]);
  const titles=chapters.map((name,i)=>{
    const pool=scored.filter(q=>q.c===i+1&&(!homeKind||q.kind===homeKind));
    const done=pool.filter(q=>records[q.id]?.tries).length;
    const p=percent(done,pool.length);
    return '<button class="chapter" data-act="chapter" data-c="'+(i+1)+'" '+(!pool.length?'disabled':'')+'><span class="index">'+String(i+1).padStart(2,'0')+'</span><span class="chapter-main"><span class="chapter-name">'+name+'</span><span class="sub">'+pool.length+' 道'+(homeKind?kinds[homeKind]:'练习题')+'<span class="and">·</span>已练 '+done+' 题</span></span><span class="chapter-progress"><span class="line"><i style="width:'+p+'%"></i></span>'+p+'%</span><span class="row-play">'+icon('play')+'</span></button>';
  }).join('');
  const shortcuts=[['wrong','red','错题重练','wrong'],['shuffle','gold','随机练习','random']].map(([ico,cls,title,key])=>'<a class="tool" href="#'+key+'"><span class="tile '+cls+'">'+icon(ico)+'</span><strong>'+title+'</strong><span class="tool-count">'+(key==='random'?'全题库 / 按章节':filterByMode(key).length+' 题')+'</span></a>').join('');
  root.innerHTML='<section class="hero"><div class="hero-content"><span class="eyebrow">'+icon('book')+'第四版教材</span><h1>药事管理学</h1><p>9 个章节<span class="and">/</span>'+scored.length+' 道练习题<span class="and">/</span>4 种题型</p><div class="hero-actions"><button class="btn cream" data-act="continue">'+icon('play')+(resume?'继续练习':'开始练习')+'</button><a class="btn glass" href="#random">'+icon('shuffle')+'随机练习</a></div></div></section><div class="dashboard"><section class="leftcol"><div class="section-head"><div class="section-title"><h2>章节练习</h2><span class="count-chip">9 章</span></div><select class="dropdown" id="home-kind" aria-label="章节练习题型"><option value="">全部题型</option>'+optionsFor(kinds,homeKind)+'</select></div><div class="chapters">'+titles+'</div></section><aside class="side"><section class="panel overview"><div class="card-heading"><h2>学习概览</h2><span class="heading-icon">'+icon('chart')+'</span></div><div class="stat-row"><div class="ring" style="--p:'+pct+'%"><span>'+pct+'%</span></div><div class="stat-text"><b>题库完成度</b><small>已练 '+answered.length+' / '+scored.length+' 题</small></div></div><div class="stats"><div><small>累计作答</small><strong>'+totalTries+'</strong></div><div><small>作答正确率</small><strong>'+(totalTries?percent(totalCorrect,totalTries)+'%':'—')+'</strong></div></div></section><section class="panel"><h2 class="toolheading">复习工具</h2><div class="tools-list">'+shortcuts+'</div></section></aside></div>';
}
const randomSettings = {
  bank:{chapter:'',kind:'',count:'10'},
  chapter:{chapter:'1',kind:'',count:'10'}
};

function randomPage(){
  const modes = [
    ['bank','layers','全题库抽题','从全部章节的可判分题中随机抽取。'],
    ['chapter','book','指定章节抽题','从所选章节随机抽题，按打乱后的顺序练习。']
  ];
  const cards = modes.map(([mode,symbol,title,description])=>{
    const settings=randomSettings[mode];
    const chapterField=mode==='chapter'
      ? '<label class="field">选择章节<select class="dropdown" name="chapter">'+chapterOptions(settings.chapter,false)+'</select></label>'
      : '';
    const counts={'5':'5 题','10':'10 题','20':'20 题','50':'50 题',all:'全部可练题'};
    return '<form class="panel random-card" data-random-mode="'+mode+'" aria-labelledby="random-title-'+mode+'">'
      +'<div class="random-heading"><span class="section-symbol">'+icon(symbol)+'</span><h2 id="random-title-'+mode+'">'+title+'</h2></div>'
      +'<p class="description">'+description+'</p>'+chapterField
      +'<div class="random-fields"><label class="field">题型<select class="dropdown" name="kind"><option value="">全部题型</option>'+optionsFor(kinds,settings.kind)+'</select></label>'
      +'<label class="field">练习题数<select class="dropdown" name="count">'+optionsFor(counts,settings.count)+'</select></label></div>'
      +'<div class="random-footer"><p class="tiny random-pool" role="status"></p><button class="btn solid" type="submit">'+icon('play')+'开始'+(mode==='bank'?'全题库':'章节')+'练习</button></div></form>';
  }).join('');
  root.innerHTML='<div class="page-head"><div><h1 class="page-title">随机练习</h1><p class="description">选择抽题范围、题型和题数。同一轮练习中，每题只出现一次。</p></div></div><section class="random-layout" aria-label="随机练习方式">'+cards+'</section>';
  root.querySelectorAll('[data-random-mode]').forEach(updateRandom);
}
function randomPool(settings){
  return filterByMode('all').filter(q=>
    (!settings.chapter||q.c===Number(settings.chapter))&&(!settings.kind||q.kind===settings.kind));
}
function randomCount(settings,available){
  return settings.count==='all'?available:Math.min(available,Number(settings.count));
}
function updateRandom(form){
  const settings=randomSettings[form.dataset.randomMode];
  const available=randomPool(settings).length;
  form.querySelector('.random-pool').textContent=available
    ? '可抽取 '+available+' 题 · 本轮 '+randomCount(settings,available)+' 题'
    : '该章节没有此题型，请切换题型。';
  form.querySelector('button[type="submit"]').disabled=!available;
}
function newRun(pool,title,start=0){
  if(!pool.length){showToast('当前没有可练习的题目');return;}
  run={ids:pool.map(q=>q.id),title,at:start,drafts:{},results:{}};
  persist('session',run);if(dialog.open)dialog.close();go('quiz');
}
function startRandom(mode){
  const settings=randomSettings[mode];
  const pool=randomPool(settings);
  for(let i=pool.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [pool[i],pool[j]]=[pool[j],pool[i]];
  }
  const chapter=Number(settings.chapter);
  const title=chapter?sectionTitle(chapter)+' · '+chapters[chapter-1]+' · 随机练习':'全题库随机练习';
  newRun(pool.slice(0,randomCount(settings,pool.length)),title);
}
function startChapter(c){
  const pool=filterByMode('all').filter(q=>q.c===c&&(!homeKind||q.kind===homeKind));
  const at=pool.findIndex(q=>!records[q.id]?.tries);
  newRun(pool,sectionTitle(c)+' · '+chapters[c-1]+(homeKind?' · '+kinds[homeKind]:''),Math.max(0,at));
}
function list(mode){
  const all=filterByMode(mode), title={wrong:'错题本',stars:'收藏夹'}[mode];
  const shown=all.filter(q=>(!listChapter||q.c===Number(listChapter))&&(!listSearch||(ref(q)+q.stem).includes(listSearch)));
  const emptyText={wrong:'还没有错题',stars:'还没有收藏题目'}[mode];
  const emptySub={wrong:'答错的题目会自动收在这里。',stars:'答题时点题目右上角的星标，即可收藏。'}[mode];
  const output=shown.map(q=>{
    const meta='<span>'+esc(ref(q))+'</span>';
    return '<article class="list-card"><span class="tiny">'+meta+'</span><button class="list-link" data-act="from-list" data-id="'+q.id+'">'+esc(q.stem)+'</button></article>';
  }).join('');
  root.innerHTML='<div class="page-head"><div><h1 class="page-title">'+title+'</h1><p class="description">'+({wrong:'集中重做上次答错的题目。',stars:'在这里回顾你标记的题目。'}[mode])+'</p></div>'+(shown.length?'<button class="btn solid" data-act="practice-list">'+icon('play')+'开始练习</button>':'')+'</div>'+(all.length?'<div class="browse-toolbar"><label class="search">'+icon('scope')+'<input id="list-search" aria-label="搜索题目" placeholder="搜索题目" value="'+esc(listSearch)+'"></label><select id="list-chapter" class="dropdown" aria-label="按章节筛选">'+chapterOptions(listChapter)+'</select></div><p class="count-summary">共 '+shown.length+' 题</p>':'')+(output||'<div class="empty">'+icon(mode==='wrong'?'wrong':'star')+'<h2>'+(all.length?'没有匹配的题目':emptyText)+'</h2><p class="sub">'+(all.length?'可以更换关键词或章节。':emptySub)+'</p><a href="#home" class="btn soft">返回练习首页</a></div>');
}
function listPool(){return filterByMode(current()).filter(q=>q.answer&&(!listChapter||q.c===Number(listChapter))&&(!listSearch||(ref(q)+q.stem).includes(listSearch)));}
function quiz(){
  const q=byId.get(run.ids[run.at]), total=run.ids.length, marked=run.results[q.id], pick=marked?.pick||run.drafts[q.id]||'';
  const complete=Object.keys(run.results).length;
  const choices=q.options.map((o,i)=>{
    const l=letters[i], sel=pick.includes(l), good=!!marked&&q.answer.includes(l), bad=!!marked&&sel&&!good;
    return '<button type="button" class="choice '+(sel?'selected ':'')+(good?'correct ':bad?'incorrect':'')+'" data-act="pick" data-letter="'+l+'" aria-pressed="'+sel+'" '+(marked?'disabled':'')+'><span class="letter">'+l+'</span><span>'+esc(o)+'</span>'+(good?icon('check'):bad?icon('x'):'')+'</button>';
  }).join('');
  let explanation='';
  if(marked){
    const matchesCurrentAnswer=marked.pick===q.answer;
    const answerUpdated=matchesCurrentAnswer!==marked.right;
    const status=answerUpdated?'参考答案已更新':marked.right?'回答正确':'回答错误';
    const history=answerUpdated?'<p class="tiny">这次作答按提交时的答案计入练习记录。</p>':'';
    explanation='<section class="answer-box '+(marked.right&&!answerUpdated?'':'bad')+'" role="status"><strong>'
      +icon(answerUpdated?'book':marked.right?'check':'x')+' '+status+'</strong><p>参考答案 <b>'
      +esc(q.answer)+'</b>　你的答案 <b>'+esc(marked.pick)+'</b></p>'+history+'<p>'+esc(q.note)+'</p>'+sourceLink(q)+'</section>';
  }
  root.innerHTML='<div class="quiz-area"><div class="quiz-toolbar"><a href="#home" class="btn plain">'+icon('grid')+'练习首页</a><span class="tiny">'+esc(run.title)+'</span><button class="btn soft" data-act="grid">'+icon('grid')+'答题卡</button></div><div class="sheet"><div class="card-heading"><span class="tiny">本轮进度</span><span class="tiny">已答 '+complete+' / '+total+'</span></div><div class="quiz-bar"><div class="line"><i style="width:'+percent(complete,total)+'%"></i></div></div><div class="question-meta"><span class="chip">'+kinds[q.kind]+'</span><span>'+esc(ref(q))+'</span><button class="icon-btn '+(stars[q.id]?'on':'')+'" data-act="star" aria-pressed="'+!!stars[q.id]+'" aria-label="'+(stars[q.id]?'取消收藏':'收藏题目')+'" title="'+(stars[q.id]?'取消收藏':'收藏题目')+'">'+icon('star')+'</button></div><h1 class="question-title">'+esc(q.stem)+'</h1>'+(q.kind==='X'?'<p class="group-label">选择所有符合题意的选项。</p>':q.kind==='B'?'<p class="group-label">从本组共用备选项中选出一个答案。</p>':'')+'<div class="choices" role="group" aria-label="备选答案">'+choices+'</div>'+explanation+'<div class="quiz-foot"><button class="btn soft" data-act="prev" '+(run.at===0?'disabled':'')+'>上一题</button><span class="tiny">第 '+(run.at+1)+' / '+total+' 题</span>'+(marked?'<button class="btn solid" data-act="next">'+(run.review&&run.at<total-1?'下一题':complete===total?'查看本轮结果':run.at===total-1?'继续未答题':'下一题')+'</button>':'<button class="btn solid" data-act="grade" '+(!pick?'disabled':'')+'>提交答案</button>')+'</div></div></div>';
}
function pickAnswer(l){
  const id=run.ids[run.at],q=byId.get(id);
  if(run.results[id]||!letters.slice(0,q.options.length).includes(l))return;
  let pick=run.drafts[id]||'';
  run.drafts[id]=q.kind==='X'?(pick.includes(l)?pick.replace(l,''):[...pick,l].sort().join('')):l;
  persist('session',run);quiz();
  root.querySelector('[data-letter="'+l+'"]')?.focus({preventScroll:true});
}
function grade(){
  const id=run.ids[run.at],pick=run.drafts[id],q=byId.get(id);
  const validLetters=letters.slice(0,q.options.length);
  if(!pick||run.results[id]||!q.answer||[...pick].some(letter=>!validLetters.includes(letter)))return;
  if(!storageWarning)records=read('records',records);
  const prev=records[id]||{tries:0,wins:0};
  const right=pick===q.answer;
  run.results[id]={right,pick};records[id]={tries:prev.tries+1,wins:prev.wins+Number(right),last:right};
  persist('records',records);persist('session',run);quiz();
  root.querySelector('.answer-box')?.scrollIntoView({block:'nearest'});
}
function setAt(at){
  if(at<0||at>=run.ids.length)return;
  run.at=at;persist('session',run);if(dialog.open)dialog.close();go('quiz');
}
function nextQuestion(){
  if(run.review&&run.at<run.ids.length-1){setAt(run.at+1);return;}
  if(run.ids.every(id=>run.results[id])){go('result');return;}
  setAt(run.at<run.ids.length-1?run.at+1:run.ids.findIndex(id=>!run.results[id]));
}
function showGrid(){
  showDialog('本轮答题卡','<p class="tiny">点击题号跳转。绿底为答对，浅红底为答错。</p><div class="question-grid">'+run.ids.map((id,i)=>'<button class="'+(run.results[id]?(run.results[id].right?'done':'bad'):'')+(run.at===i?' current':'')+'" aria-label="第 '+(i+1)+' 题'+(run.results[id]?(run.results[id].right?'，已答对':'，已答错'):'，未答')+'" data-act="jump" data-at="'+i+'">'+(i+1)+'</button>').join('')+'</div>');
}
function result(){
  const wrong=run.ids.filter(id=>!run.results[id].right),correct=run.ids.length-wrong.length;
  root.innerHTML='<div class="quiz-area"><div class="sheet"><span class="chip">'+esc(run.title)+'</span><h1 class="page-title" style="margin-top:14px">本轮练习完成</h1><div class="end-stats"><div><b>'+run.ids.length+'</b><span>已答题目</span></div><div><b>'+correct+'</b><span>答对题目</span></div><div><b>'+percent(correct,run.ids.length)+'%</b><span>本轮正确率</span></div></div><div class="actions">'+(wrong.length?'<button class="btn solid" data-act="retry">重练本轮错题</button>':'')+'<button class="btn soft" data-act="review">回看答案</button><a class="btn soft" href="#home">返回首页</a></div></div></div>';
}
document.addEventListener('click',e=>{
  const btn=e.target.closest('[data-act]');if(!btn||btn.disabled)return;
  const a=btn.dataset.act;
  if(a==='close')dialog.close();
  else if(a==='continue'){if(run?.ids?.some(id=>!run.results[id]))go('quiz');else {const unvisited=filterByMode('all').find(q=>!records[q.id]?.tries);homeKind='';startChapter(unvisited?.c||1);}}
  else if(a==='chapter')startChapter(Number(btn.dataset.c));
  else if(a==='pick')pickAnswer(btn.dataset.letter);
  else if(a==='grade')grade();
  else if(a==='star'){const id=run.ids[run.at];if(!storageWarning)stars=read('stars',stars);if(stars[id])delete stars[id];else stars[id]=true;persist('stars',stars);quiz();showToast(stars[id]?'已加入收藏夹':'已取消收藏');}
  else if(a==='grid')showGrid();
  else if(a==='prev')setAt(run.at-1);
  else if(a==='next')nextQuestion();
  else if(a==='jump')setAt(Number(btn.dataset.at));
  else if(a==='retry')newRun(run.ids.filter(id=>!run.results[id].right).map(id=>byId.get(id)),'本轮错题重练');
  else if(a==='review'){run.review=true;setAt(0);}
  else if(a==='practice-list'||a==='from-list'){const pool=listPool();newRun(pool,current()==='wrong'?'错题重练':'收藏练习',Math.max(0,pool.findIndex(q=>q.id===btn.dataset.id)));}
});
document.addEventListener('change',e=>{
  if(e.target.id==='home-kind'){homeKind=e.target.value;home();}
  if(e.target.id==='list-chapter'){listChapter=e.target.value;list(current());}
  const form=e.target.closest('[data-random-mode]');
  if(form){
    randomSettings[form.dataset.randomMode][e.target.name]=e.target.value;
    updateRandom(form);
  }
});
root.addEventListener('submit',e=>{
  const mode=e.target.dataset.randomMode;
  if(!mode)return;
  e.preventDefault();
  startRandom(mode);
});
document.addEventListener('input',e=>{if(e.target.id==='list-search'&&!e.isComposing){const pos=e.target.selectionStart;listSearch=e.target.value;list(current());const input=document.getElementById('list-search');input.focus();input.setSelectionRange(pos,pos);}});
document.addEventListener('compositionend',e=>{if(e.target.id==='list-search')e.target.dispatchEvent(new Event('input',{bubbles:true}));});
document.getElementById('about').addEventListener('click',showAbout);
window.addEventListener('hashchange',()=>{listChapter='';listSearch='';if(dialog.open)dialog.close();render();window.scrollTo(0,0);root.focus({preventScroll:true});});
window.addEventListener('storage',e=>{if(e.key===shelf+'stars')stars=read('stars',{});if(e.key===shelf+'records')records=read('records',{});if(bank.length&&!dialog.open)render();});
async function init(){try{
  const response=await fetch('questions.json');if(!response.ok)throw Error('bank');
  bank=await response.json();byId=new Map(bank.map(q=>[q.id,q]));
  if(!Array.isArray(run?.ids)||!run.ids.length||!run.ids.every(id=>byId.get(id)?.answer)||!run.results||!run.drafts||!Number.isInteger(run.at)||run.at<0||run.at>=run.ids.length)run=null;
  if(run){
    for(const id of run.ids){
      const draft=run.drafts[id];
      const validLetters=letters.slice(0,byId.get(id).options.length);
      if(draft&&[...draft].some(letter=>!validLetters.includes(letter)))delete run.drafts[id];
    }
  }
  render();
}catch{root.innerHTML='<div class="empty"><h1>题库暂时无法打开</h1><p>请检查网络后重新加载。</p><button class="btn solid" id="reload">重新加载</button></div>';document.getElementById('reload').onclick=()=>location.reload();}}
init();
