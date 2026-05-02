
// ══════════════════════════════════════════
// SAÍDA DA CRIANÇA
// ══════════════════════════════════════════
function confirmarSaidaCrianca(){
  // Se tem sessão salva, pergunta se quer realmente sair
  try{
    const saved=localStorage.getItem('elo_child_session');
    if(saved){
      if(!confirm('Sair do perfil? Você precisará do código novamente para entrar.'))return;
      sairComoCrianca();
      return;
    }
  }catch(e){}
  // Sem sessão salva — volta para login normalmente
  navTo('screen-login');
}

// ══════════════════════════════════════════
// ELO FAMILY — app.js v4 FINAL
// Perfis: criança / responsável / admin
// ══════════════════════════════════════════

// ── BIBLIOTECA ──
const BIBLIOTECA = [
  {nome:'Escovar os dentes',   icon:'🪥',stars:1,cat:'higiene',time:'07:30'},
  {nome:'Tomar banho',         icon:'🚿',stars:2,cat:'higiene',time:'18:00'},
  {nome:'Lavar as mãos',       icon:'🧼',stars:1,cat:'higiene',time:'12:00'},
  {nome:'Pentear o cabelo',    icon:'💇',stars:1,cat:'higiene',time:'07:45'},
  {nome:'Fazer a lição',       icon:'📝',stars:3,cat:'escola', time:'15:00'},
  {nome:'Arrumar a mochila',   icon:'🎒',stars:2,cat:'escola', time:'21:00'},
  {nome:'Ler por 20 minutos',  icon:'📚',stars:3,cat:'escola', time:'16:00'},
  {nome:'Estudar para a prova',icon:'📖',stars:5,cat:'escola', time:'15:30'},
  {nome:'Arrumar o quarto',    icon:'🛏️',stars:2,cat:'casa',   time:'08:00'},
  {nome:'Guardar brinquedos',  icon:'🧸',stars:1,cat:'casa',   time:'19:00'},
  {nome:'Ajudar a mesa',       icon:'🍽️',stars:2,cat:'casa',   time:'12:00'},
  {nome:'Varrer o quarto',     icon:'🧹',stars:2,cat:'casa',   time:'09:00'},
  {nome:'Beber água',          icon:'💧',stars:1,cat:'saude',  time:'10:00'},
  {nome:'Fazer exercício',     icon:'🏃',stars:3,cat:'saude',  time:'17:00'},
  {nome:'Dormir cedo',         icon:'😴',stars:2,cat:'saude',  time:'21:00'},
  {nome:'Comer frutas',        icon:'🍎',stars:1,cat:'saude',  time:'14:00'},
];

const REWARDS_DEFAULT = [
  {id:1,name:'Sorvete especial',       emoji:'🍦',cost:10},
  {id:2,name:'Jogar 30 min extra',     emoji:'🎮',cost:8},
  {id:3,name:'Escolher o jantar',      emoji:'🍕',cost:15},
  {id:4,name:'Cinema no fim de semana',emoji:'🎬',cost:25},
  {id:5,name:'Dormir mais tarde',      emoji:'🌙',cost:12},
  {id:6,name:'Adesivo especial',       emoji:'⭐',cost:5},
];

const RAND_ICON = () => ['📌','🎯','✨','🌟','🔥','💡','🎨','🧩'][Math.floor(Math.random()*8)];

// ── HELPERS RECORRÊNCIA ──
function getDiaAtual(){return['dom','seg','ter','qua','qui','sex','sab'][new Date().getDay()];}
function tarefaAtivaHoje(t){if(!t.recorrente)return true;if(!t.dias_semana||!t.dias_semana.length)return true;return t.dias_semana.includes(getDiaAtual());}
function getTodayKey(){const d=new Date();const m=String(d.getMonth()+1).padStart(2,'0');const day=String(d.getDate()).padStart(2,'0');return `${d.getFullYear()}-${m}-${day}`;}
function tarefaDoneHoje(t){const today=getTodayKey();if(t.completion_dates?.includes(today))return true;if(!t.done)return false;if(!t.done_date)return t.done;return t.done_date===today;}
function calcularStreak(dates){
  const done=new Set((dates||[]).filter(Boolean));
  let streak=0;
  const d=new Date();
  for(let i=0;i<120;i++){
    const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    if(!done.has(key))break;
    streak++;
    d.setDate(d.getDate()-1);
  }
  return streak;
}
function normalizarTarefa(t,completions=[]){
  const dates=completions.map(c=>c.completed_date).filter(Boolean);
  if(t.done_date&&!dates.includes(t.done_date))dates.push(t.done_date);
  return {...t,done_date:t.done_date||null,recorrente:t.recorrente||false,dias_semana:t.dias_semana||[],completion_dates:dates,completion_count:dates.length,streak:calcularStreak(dates)};
}

// ── UI helpers ──
function toggleDiasSemana(){document.getElementById('dias-semana-wrap').style.display=document.getElementById('fab-recorrente').checked?'block':'none';}
function toggleDia(btn){btn.classList.toggle('selected');}
function getDiasSelecionados(){return Array.from(document.querySelectorAll('.dia-btn.selected')).map(b=>b.dataset.dia);}
function toggleSenha(id,btn){const i=document.getElementById(id);if(i.type==='password'){i.type='text';btn.textContent='🙈';}else{i.type='password';btn.textContent='👁️';}}

let selectedBibCards=[],selectedStarsFabVal=2,selectedStarsLoteVal=1,catAtual='todos';

function abrirModalTarefas(){
  ['fab-task-child','fab-bib-child','fab-lote-child'].forEach(id=>{
    const sel=document.getElementById(id);if(!sel)return;sel.innerHTML='';
    state.profiles.forEach((f,i)=>{const o=document.createElement('option');o.value=i;o.textContent=f.emoji+' '+f.name;sel.appendChild(o);});
  });
  renderBiblioteca('todos');
  document.getElementById('modal-tarefas').classList.add('show');
}
function fecharModalTarefas(){document.getElementById('modal-tarefas').classList.remove('show');selectedBibCards=[];document.getElementById('fab-task-name').value='';document.getElementById('lote-text').value='';document.getElementById('fab-recorrente').checked=false;document.getElementById('dias-semana-wrap').style.display='none';}

function switchTab(tab){
  ['manual','biblioteca','lote'].forEach(t=>{document.getElementById('tab-content-'+t).style.display=t===tab?'block':'none';document.getElementById('tab-'+t).classList.toggle('active',t===tab);});
}
function filterCat(el,cat){document.querySelectorAll('.cat-btn').forEach(b=>b.classList.remove('active'));el.classList.add('active');catAtual=cat;renderBiblioteca(cat);}
function renderBiblioteca(cat){
  const grid=document.getElementById('biblioteca-grid');grid.innerHTML='';
  const filtered=cat==='todos'?BIBLIOTECA:BIBLIOTECA.filter(t=>t.cat===cat);
  filtered.forEach(t=>{
    const card=document.createElement('div');card.className='bib-card'+(selectedBibCards.includes(t.nome)?' selected':'');
    card.innerHTML=`<div class="bib-icon">${t.icon}</div><div class="bib-name">${t.nome}</div><div class="bib-stars">${'⭐'.repeat(Math.min(t.stars,3))} ${t.stars}★</div>`;
    card.onclick=()=>{const idx=selectedBibCards.indexOf(t.nome);if(idx>=0){selectedBibCards.splice(idx,1);card.classList.remove('selected');}else{selectedBibCards.push(t.nome);card.classList.add('selected');}};
    grid.appendChild(card);
  });
}
function selectStarsFab(el,val){el.closest('.star-select').querySelectorAll('.star-option').forEach(e=>e.classList.remove('selected'));el.classList.add('selected');selectedStarsFabVal=val;}
function selectStarsLote(el,val){el.closest('.star-select').querySelectorAll('.star-option').forEach(e=>e.classList.remove('selected'));el.classList.add('selected');selectedStarsLoteVal=val;}

// ── STATE ──
// Controle de master feito exclusivamente pelo Supabase (coluna is_master na tabela profiles)

const state={
  currentChild:null,currentUserId:null,currentUserRole:'parent',currentUserEmail:'',selectedStars:2,selectedRating:null,
  feedbacks:[],metrics:{tasksCompleted:0,rewardsClaimed:0,tasksCreated:0},
  profiles:[],tasks:[],rewards:REWARDS_DEFAULT,pendingApprovals:[],history:[],completionsAvailable:true,lastInviteCode:null,lastInviteChildIdx:0,childSession:null
};

// ── NAV ──
function navTo(screenId){if(screenId==='screen-admin'&&!isMaster()){showToast('Métricas disponíveis apenas para usuárias master.');screenId='screen-profiles';}document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));document.getElementById(screenId).classList.add('active');window.scrollTo(0,0);}
async function navParent(){await carregarTodasTarefas();renderParentDashboard();navTo('screen-parent');}
function isMaster(){return state.currentUserRole==='master';}
function navAdmin(){if(!isMaster()){showToast('Métricas disponíveis apenas para usuárias master.');return;}updateMetrics();navTo('screen-admin');}
function applyRoleUi(){
  document.querySelectorAll('.master-only').forEach(el=>{el.style.display=isMaster()?'block':'none';});
  const strip=document.getElementById('role-strip');
  if(strip){
    if(isMaster()){
      strip.innerHTML=`<div class="role-chip active">🛡️ Master do produto</div><div class="role-chip">👶 Crianças: ${state.profiles.length}</div><div class="role-chip" style="color:var(--gold);">📊 Métricas liberadas</div>`;
    } else {
      strip.innerHTML=`<div class="role-chip active">👨‍👩‍👧 Responsável</div><div class="role-chip">👶 Crianças: ${state.profiles.length}</div>`;
    }
  }
}

// ── AUTH ──
async function doLogin(){
  const email=document.getElementById('login-email').value.trim();
  const pass=document.getElementById('login-pass').value;
  const err=document.getElementById('login-error');
  if(!email||!pass){err.classList.add('show');err.textContent='Preencha e-mail e senha.';return;}
  err.classList.remove('show');showToast('Entrando... ⏳');
  const{data,error}=await db.auth.signInWithPassword({email,password:pass});
  if(error){err.classList.add('show');err.textContent='E-mail ou senha incorretos.';return;}
  showToast('Bem-vindo! 👋');
  await carregarContextoUsuario(data.user);
  renderProfiles();navTo('screen-profiles');
}

async function doRegister(){
  const name=document.getElementById('reg-name').value.trim();
  const email=document.getElementById('reg-email').value.trim();
  const pass=document.getElementById('reg-pass').value;
  const pass2=document.getElementById('reg-pass2').value;
  const terms=document.getElementById('chk-terms').checked;
  const lgpd=document.getElementById('chk-lgpd').checked;
  const err=document.getElementById('reg-error');
  if(!name||!email||!pass||!pass2){err.textContent='Preencha todos os campos.';err.classList.add('show');return;}
  if(pass.length<8||!/[0-9]/.test(pass)||!/[A-Z]/.test(pass)){err.textContent='Senha fraca: mín. 8 chars, 1 número, 1 maiúscula.';err.classList.add('show');return;}
  if(pass!==pass2){err.textContent='As senhas não coincidem.';err.classList.add('show');return;}
  if(!terms||!lgpd){err.textContent='Aceite os termos e o consentimento LGPD.';err.classList.add('show');return;}
  err.classList.remove('show');showToast('Criando conta... ⏳');
  const{data,error}=await db.auth.signUp({email,password:pass,options:{data:{full_name:name,role:'parent'}}});
  if(error){err.textContent='Erro: '+error.message;err.classList.add('show');return;}
  await db.from('profiles').insert({id:data.user.id,full_name:name,email});
  showToast('Conta criada! Verifique seu e-mail 📧');
  setTimeout(()=>navTo('screen-login'),2000);
}

function doForgot(){const email=document.getElementById('forgot-email').value.trim();if(!email)return;db.auth.resetPasswordForEmail(email);showToast('E-mail enviado! 📧');setTimeout(()=>navTo('screen-login'),1500);}

async function doLogout(){await db.auth.signOut();state.profiles=[];state.tasks=[];state.currentUserId=null;state.currentUserRole='parent';state.currentUserEmail='';showToast('Até logo! 👋');setTimeout(()=>navTo('screen-login'),800);}

// ── FILHOS ──
async function carregarContextoUsuario(user){
  state.currentUserId=user.id;
  state.currentUserEmail=(user.email||'').toLowerCase();
  state.currentUserRole=user.user_metadata?.role||user.app_metadata?.role||'parent';
  let perfil=null;
  const perfilRes=await db.from('profiles').select('role,is_master,email').eq('id',user.id).maybeSingle();
  if(perfilRes.error)console.info('Perfil sem colunas de role/is_master; usando metadados do Auth.',perfilRes.error.message);
  else perfil=perfilRes.data;
  if(perfil?.is_master||perfil?.role==='master')state.currentUserRole='master';
  await carregarFilhos(user.id);
}

async function carregarFilhos(userId){
  state.currentUserId=userId;
  const{data,error}=await db.from('children').select('*').eq('parent_id',userId).order('created_at',{ascending:true});
  if(error){console.error(error);return;}
  state.profiles=(data||[]).map(f=>({id:f.id,name:f.name,age:f.age,emoji:f.emoji,color:f.color,stars:f.stars||0}));
  state.tasks=state.profiles.map(()=>[]);
}

let emojiSelecionado='👧';
function selectEmoji(el,emoji){emojiSelecionado=emoji;document.getElementById('selected-emoji').textContent='Selecionado: '+emoji;document.querySelectorAll('.emoji-pick').forEach(e=>e.classList.remove('selected'));el.classList.add('selected');}
function abrirModalFilho(){document.getElementById('modal-add-child').classList.add('show');}
function fecharModalFilho(){document.getElementById('modal-add-child').classList.remove('show');document.getElementById('child-name').value='';document.getElementById('child-age').value='';emojiSelecionado='👧';document.getElementById('selected-emoji').textContent='Selecionado: 👧';}

async function salvarFilho(){
  const nome=document.getElementById('child-name').value.trim();
  const idade=parseInt(document.getElementById('child-age').value);
  if(!nome||!idade||idade<1||idade>17){showToast('Preencha nome e idade corretamente!');return;}
  showToast('Salvando... ⏳');
  const{data,error}=await db.from('children').insert({parent_id:state.currentUserId,name:nome,age:idade,emoji:emojiSelecionado,color:'#1a1650',stars:0}).select().single();
  if(error){showToast('Erro ao salvar.');console.error(error);return;}
  state.profiles.push({id:data.id,name:data.name,age:data.age,emoji:data.emoji,color:data.color,stars:0});
  state.tasks.push([]);
  fecharModalFilho();renderProfiles();showToast(nome+' adicionado(a)! 🎉');
}

function renderProfiles(){
  const grid=document.getElementById('profiles-grid');grid.innerHTML='';
  applyRoleUi();
  state.profiles.forEach((p,i)=>{
    const card=document.createElement('div');card.className='profile-card';
    const grad=i===0?'#7c3aed,#a855f7':'#eab308,#ca8a04';
    card.innerHTML=`<div class="profile-role">Criança</div><div class="profile-avatar" style="background:linear-gradient(135deg,${grad})">${p.emoji}</div><div class="profile-name">${p.name}</div><div class="profile-age">${p.age} anos · ⭐${p.stars||0}</div>`;
    card.onclick=()=>selectProfile(p.id);grid.appendChild(card);
  });
  const add=document.createElement('div');add.className='profile-card profile-add';
  add.innerHTML='<div class="profile-avatar" style="background:var(--card2);box-shadow:none;"><span style="font-size:28px;color:var(--sky)">+</span></div><div class="profile-name" style="color:var(--sky)">Adicionar</div>';
  add.onclick=()=>abrirModalFilho();grid.appendChild(add);
  document.getElementById('stat-filhos').textContent=state.profiles.length;
}

async function convidarCrianca(){
  // Permite escolher para qual filho gerar o código
  if(state.profiles.length===0){showToast('Cadastre um filho primeiro!');return;}

  // Se só tem um filho, usa direto; se tem mais, abre seletor
  let childIdx=0;
  if(state.profiles.length>1){
    const opts=state.profiles.map((p,i)=>i+': '+p.emoji+' '+p.name).join('\n');
    const escolha=prompt('Para qual filho?\n'+opts+'\n\nDigite o número:');
    if(escolha===null)return;
    childIdx=parseInt(escolha)||0;
    if(childIdx<0||childIdx>=state.profiles.length)childIdx=0;
  }

  const child=state.profiles[childIdx];
  const code='ELO-'+Math.random().toString(36).slice(2,7).toUpperCase();

  // Salva no Supabase
  showToast('Gerando código... ⏳');
  const{error}=await db.from('invite_codes').insert({
    code,
    parent_id:state.currentUserId,
    child_id:child.id,
    used:false
  });
  if(error){console.error(error);showToast('Erro ao gerar código.');}

  // Salva em memória também
  state.lastInviteCode=code;
  state.lastInviteChildIdx=childIdx;

  document.getElementById('convite-code-display').textContent=code;
  document.getElementById('convite-child-name').textContent='👶 Criança: '+child.name;
  document.getElementById('modal-convite').classList.add('show');
}
function fecharConvite(){document.getElementById('modal-convite').classList.remove('show');}
function copiarCodigo(){
  const code=document.getElementById('convite-code-display').textContent;
  if(navigator.clipboard){navigator.clipboard.writeText(code).then(()=>showToast('Código copiado! 📋'));}
  else{const el=document.createElement('textarea');el.value=code;document.body.appendChild(el);el.select();document.execCommand('copy');document.body.removeChild(el);showToast('Código copiado! 📋');}
}

// ── TAREFAS ──
async function carregarTarefas(childId,childIndex){
  const{data,error}=await db.from('tasks').select('*').eq('child_id',childId).order('time',{ascending:true});
  if(error){console.error('Erro ao carregar tarefas:',error);return;}
  const tasks=data||[];
  const ids=tasks.map(t=>t.id);
  let completions=[];
  if(ids.length&&state.completionsAvailable){
    const res=await db.from('task_completions').select('*').eq('child_id',childId).in('task_id',ids).order('completed_date',{ascending:false});
    if(!res.error)completions=res.data||[];
    else{
      state.completionsAvailable=false;
      console.info('task_completions indisponível; usando fallback.',res.error.message);
    }
  }
  // Garante que o array de tasks do estado tem o índice correto
  while(state.tasks.length<=childIndex)state.tasks.push([]);
  state.tasks[childIndex]=tasks.map(t=>normalizarTarefa(t,completions.filter(c=>c.task_id===t.id)));
  registrarHistoricoDeCompletions(completions,tasks);
}

async function carregarTodasTarefas(){
  for(let i=0;i<state.profiles.length;i++){
    await carregarTarefas(state.profiles[i].id,i);
  }
}

function registrarHistoricoDeCompletions(completions,tasks){
  const today=getTodayKey();
  const byTask=Object.fromEntries(tasks.map(t=>[t.id,t]));
  completions.filter(c=>c.completed_date===today).forEach(c=>{
    const task=byTask[c.task_id];
    const child=state.profiles.find(p=>p.id===c.child_id);
    if(!task||!child)return;
    const key=`${c.task_id}-${c.child_id}-${c.completed_date}`;
    if(state.history.some(h=>h.key===key))return;
    const time=c.completed_at?new Date(c.completed_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):'Hoje';
    state.history.unshift({key,task:task.name,child:child.name,stars:c.stars_earned||task.stars,time});
  });
}

async function selectProfile(id){
  state.currentChild=state.profiles.findIndex(p=>p.id===id);
  showToast('Carregando tarefas... ⏳');
  await carregarTarefas(id,state.currentChild);
  renderChildHome();navTo('screen-child-home');
}

// ── CHILD HOME ──
function renderChildHome(){
  const child=state.profiles[state.currentChild];
  const tasks=state.tasks[state.currentChild]||[];
  document.getElementById('child-greeting').textContent=child.name+'! '+child.emoji;
  document.getElementById('header-stars').textContent=child.stars||0;
  const ativas=tasks.filter(tarefaAtivaHoje);
  const done=ativas.filter(tarefaDoneHoje).length;
  const pct=ativas.length?Math.round(done/ativas.length*100):0;
  document.getElementById('progress-count').textContent=done+'/'+ativas.length+' tarefas';
  document.getElementById('progress-pct').textContent=pct+'%';
  document.getElementById('progress-bar').style.width=pct+'%';
  const list=document.getElementById('child-tasks-list');list.innerHTML='';
  const rotina=tasks.filter(t=>t.recorrente&&tarefaAtivaHoje(t));
  const unicas=tasks.filter(t=>!t.recorrente);
  if(rotina.length===0&&unicas.length===0){list.innerHTML='<div class="empty-state"><div class="empty-icon">📋</div><p>Nenhuma tarefa por hoje!</p></div>';return;}
  function renderTaskCard(task){
    const doneHoje=tarefaDoneHoje(task);
    const card=document.createElement('div');card.className='task-card'+(doneHoje?' done':'');
    const streak=task.recorrente&&task.streak>1?`<div class="task-streak">🔥 ${task.streak} dias</div>`:'';
    card.innerHTML=`<div class="task-icon">${task.icon}</div><div class="task-info"><div class="task-name">${task.name}${task.recorrente?'<span style="font-size:10px;color:var(--sky);background:#1a1650;padding:2px 6px;border-radius:6px;margin-left:6px;">🔄</span>':''}</div><div class="task-time">⏰ ${task.time}${streak}</div></div><div class="task-stars">⭐ ${task.stars}</div><div class="task-check">${doneHoje?'✓':''}</div>`;
    if(!doneHoje)card.onclick=()=>completeTask(task);
    return card;
  }
  function renderSection(arr,icon,label){
    if(!arr.length)return;
    const lbl=document.createElement('div');lbl.className='tasks-section-title';
    const dc=arr.filter(tarefaDoneHoje).length;
    lbl.innerHTML=icon+' '+label+' <span>'+dc+'/'+arr.length+'</span>';
    list.appendChild(lbl);
    const wrap=document.createElement('div');wrap.style.cssText='padding:0 16px;display:flex;flex-direction:column;gap:8px;margin-bottom:8px;';
    arr.forEach(t=>wrap.appendChild(renderTaskCard(t)));list.appendChild(wrap);
  }
  renderSection(rotina,'🔄','Rotina diária');
  renderSection(unicas,'📋','Tarefas de hoje');
}

async function completeTask(task){
  const child=state.profiles[state.currentChild];
  const today=getTodayKey();
  if(tarefaDoneHoje(task)){showToast('Missão já concluída hoje! ✅');return;}
  const completion={task_id:task.id,child_id:child.id,parent_id:state.currentUserId,completed_date:today,stars_earned:task.stars,approved_by_parent:true};
  if(state.completionsAvailable){
    const res=await db.from('task_completions').insert(completion);
    if(res.error){
      if(res.error.code==='23505'){showToast('Missão já concluída hoje! ✅');return;}
      state.completionsAvailable=false;
      console.info('task_completions indisponível; salvando conclusão no modelo antigo.',res.error.message);
      await db.from('tasks').update({done:true,done_date:today}).eq('id',task.id);
    }
  }else{
    await db.from('tasks').update({done:true,done_date:today}).eq('id',task.id);
  }
  task.done=true;task.done_date=today;
  task.completion_dates=Array.from(new Set([...(task.completion_dates||[]),today]));
  task.completion_count=task.completion_dates.length;
  task.streak=calcularStreak(task.completion_dates);
  child.stars=(child.stars||0)+task.stars;
  state.metrics.tasksCompleted++;
  await db.from('children').update({stars:child.stars}).eq('id',child.id);
  state.history.unshift({key:`${task.id}-${child.id}-${today}`,task:task.name,child:child.name,stars:task.stars,time:new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})});
  document.getElementById('reward-title').textContent='Missão completa! 🎉';
  document.getElementById('reward-msg').textContent='+'+task.stars+' estrela'+(task.stars>1?'s':'')+'! '+(task.streak>1?'Sequência de '+task.streak+' dias! ':'Continue assim, ')+child.name+'!';
  document.getElementById('reward-overlay').classList.add('show');
  renderChildHome();updateMetrics();
}
function closeReward(){document.getElementById('reward-overlay').classList.remove('show');}

function switchChildTab(tab){
  if(tab==='home'){renderChildHome();navTo('screen-child-home');}
  else{renderRewards();navTo('screen-child-rewards');}
}

// ── REWARDS ──
function renderRewards(){
  const child=state.profiles[state.currentChild];
  document.getElementById('reward-stars').textContent=child.stars||0;
  document.getElementById('reward-stars-val').textContent=child.stars||0;
  const pendChild=state.pendingApprovals.filter(a=>a.child===child.name);
  const notice=document.getElementById('pending-notice');
  if(pendChild.length>0){notice.style.display='block';notice.textContent='⏳ '+pendChild.length+' pedido(s) aguardando aprovação';}
  else notice.style.display='none';
  const grid=document.getElementById('child-rewards-grid');grid.innerHTML='';
  state.rewards.forEach(r=>{
    const canAfford=(child.stars||0)>=r.cost;
    const pend=state.pendingApprovals.some(a=>a.child===child.name&&a.reward===r.name);
    const card=document.createElement('div');card.className='reward-card'+(!canAfford||pend?' claimed':'');
    card.innerHTML=`<div class="reward-emoji">${r.emoji}</div><div class="reward-rname">${r.name}</div><div class="reward-cost">⭐ ${r.cost}</div>${pend?'<div class="reward-pending">⏳ Aguardando</div>':''}`;
    if(canAfford&&!pend)card.onclick=()=>requestReward(r);
    grid.appendChild(card);
  });
}

function requestReward(r){
  const child=state.profiles[state.currentChild];
  state.pendingApprovals.push({reward:r.name,child:child.name,cost:r.cost,emoji:r.emoji});
  state.metrics.rewardsClaimed++;updateMetrics();
  showToast('Pedido de "'+r.name+'" enviado! ⏳');renderRewards();
}

// ── PARENT DASHBOARD ──
function renderParentDashboard(){
  const allTasks=state.tasks.flat();
  const done=allTasks.filter(tarefaDoneHoje).length;
  const stars=state.profiles.reduce((a,p)=>a+(p.stars||0),0);
  document.getElementById('stat-completed').textContent=done;
  document.getElementById('stat-stars').textContent=stars;
  document.getElementById('stat-pending').textContent=state.pendingApprovals.length;
  document.getElementById('stat-filhos').textContent=state.profiles.length;
  const aList=document.getElementById('approval-list');aList.innerHTML='';
  if(state.pendingApprovals.length===0){aList.innerHTML='<div class="empty-state" style="padding:20px 0;"><div class="empty-icon">✅</div><p>Nenhum pedido pendente</p></div>';}
  else{
    state.pendingApprovals.forEach((a,i)=>{
      const card=document.createElement('div');card.className='approval-card';
      card.innerHTML=`<div style="font-size:28px;">${a.emoji}</div><div class="approval-info"><div class="approval-name">${a.reward}</div><div class="approval-child">${a.child} · ⭐ ${a.cost}</div></div><div class="approval-actions"><button style="background:var(--green);color:#fff;" onclick="approveReward(${i})">✓</button><button style="background:var(--red);color:#fff;" onclick="rejectReward(${i})">✗</button></div>`;
      aList.appendChild(card);
    });
  }
  const hList=document.getElementById('history-list');hList.innerHTML='';
  if(state.history.length===0){hList.innerHTML='<div style="text-align:center;padding:16px;color:var(--muted);font-size:13px;">Nenhuma tarefa concluída ainda</div>';}
  else{
    state.history.slice(0,8).forEach(h=>{
      const item=document.createElement('div');item.className='history-item';
      item.innerHTML=`<div class="history-dot"></div><div class="history-info"><div class="history-task">${h.task}</div><div class="history-meta">${h.child} · ${h.time}</div></div><div class="history-stars">+${h.stars}⭐</div>`;
      hList.appendChild(item);
    });
  }
}

async function approveReward(i){
  const a=state.pendingApprovals[i];
  const ci=state.profiles.findIndex(p=>p.name===a.child);
  if(ci>=0){state.profiles[ci].stars=Math.max(0,(state.profiles[ci].stars||0)-a.cost);await db.from('children').update({stars:state.profiles[ci].stars}).eq('id',state.profiles[ci].id);}
  state.pendingApprovals.splice(i,1);showToast('Recompensa aprovada! ✅');renderParentDashboard();
}
function rejectReward(i){state.pendingApprovals.splice(i,1);showToast('Pedido recusado.');renderParentDashboard();}

async function resetTarefasRotina(){
  if(!confirm('Resetar as conclusões de rotina de hoje? Isso remove apenas o check do dia atual.'))return;
  showToast('Resetando rotina... ⏳');
  const today=getTodayKey();
  const recurringIds=state.tasks.flat().filter(t=>t.recorrente&&tarefaDoneHoje(t)).map(t=>t.id);
  if(recurringIds.length&&state.completionsAvailable){
    const res=await db.from('task_completions').delete().in('task_id',recurringIds).eq('completed_date',today);
    if(res.error){state.completionsAvailable=false;console.info('task_completions indisponível; resetando pelo modelo antigo.',res.error.message);}
  }
  for(let ci=0;ci<state.profiles.length;ci++){
    const tasks=state.tasks[ci]||[];
    for(const task of tasks){
      if(task.recorrente&&tarefaDoneHoje(task)){
        await db.from('tasks').update({done:false,done_date:null}).eq('id',task.id);
        task.done=false;task.done_date=null;
        task.completion_dates=(task.completion_dates||[]).filter(d=>d!==today);
        task.completion_count=task.completion_dates.length;
        task.streak=calcularStreak(task.completion_dates);
      }
    }
  }
  state.history=state.history.filter(h=>!recurringIds.some(id=>h.key?.startsWith(id+'-')));
  showToast('Rotina resetada! ✅');renderParentDashboard();
}

// ── CRIAR TAREFAS ──
async function addTaskFab(){
  const name=document.getElementById('fab-task-name').value.trim();
  const childIdx=parseInt(document.getElementById('fab-task-child').value);
  const time=document.getElementById('fab-task-time').value;
  const recorrente=document.getElementById('fab-recorrente').checked;
  const dias_semana=recorrente?getDiasSelecionados():[];
  if(!name){showToast('Digite o nome da tarefa!');return;}
  const child=state.profiles[childIdx];if(!child){showToast('Selecione uma criança!');return;}
  showToast('Criando tarefa... ⏳');
  const{data,error}=await db.from('tasks').insert({child_id:child.id,parent_id:state.currentUserId,name,time,stars:selectedStarsFabVal,icon:RAND_ICON(),done:false,recorrente,dias_semana}).select().single();
  if(error){showToast('Erro ao criar. Tente novamente.');console.error(error);return;}
  state.tasks[childIdx].push(normalizarTarefa(data));
  state.metrics.tasksCreated++;updateMetrics();
  fecharModalTarefas();renderParentDashboard();showToast('Tarefa "'+name+'" criada! '+(recorrente?'🔄':'✅'));
}

async function adicionarSelecionadas(){
  const childIdx=parseInt(document.getElementById('fab-bib-child').value);
  const child=state.profiles[childIdx];
  if(!child){showToast('Selecione uma criança!');return;}
  if(!selectedBibCards.length){showToast('Selecione ao menos uma tarefa!');return;}
  showToast('Criando '+selectedBibCards.length+' tarefas... ⏳');
  let criadas=0;
  for(const nome of selectedBibCards){
    const t=BIBLIOTECA.find(b=>b.nome===nome);if(!t)continue;
    const{data,error}=await db.from('tasks').insert({child_id:child.id,parent_id:state.currentUserId,name:t.nome,time:t.time,stars:t.stars,icon:t.icon,done:false,recorrente:false,dias_semana:[]}).select().single();
    if(!error&&data){state.tasks[childIdx].push(normalizarTarefa(data));criadas++;}
  }
  state.metrics.tasksCreated+=criadas;updateMetrics();fecharModalTarefas();renderParentDashboard();showToast(criadas+' tarefa(s) criada(s)! ✅');
}

async function criarEmLote(){
  const childIdx=parseInt(document.getElementById('fab-lote-child').value);
  const child=state.profiles[childIdx];
  const texto=document.getElementById('lote-text').value.trim();
  if(!child){showToast('Selecione uma criança!');return;}
  if(!texto){showToast('Digite ao menos uma tarefa!');return;}
  const linhas=texto.split('\n').map(l=>l.trim()).filter(l=>l);
  showToast('Criando '+linhas.length+' tarefas... ⏳');
  let criadas=0;
  for(const nome of linhas){
    const{data,error}=await db.from('tasks').insert({child_id:child.id,parent_id:state.currentUserId,name:nome,time:'08:00',stars:selectedStarsLoteVal,icon:RAND_ICON(),done:false,recorrente:false,dias_semana:[]}).select().single();
    if(!error&&data){state.tasks[childIdx].push(normalizarTarefa(data));criadas++;}
  }
  state.metrics.tasksCreated+=criadas;updateMetrics();fecharModalTarefas();renderParentDashboard();showToast(criadas+' tarefa(s) criada(s)! ✅');
}

// ── METRICS ──
function updateMetrics(){
  const m=state.metrics;
  const el=id=>document.getElementById(id);
  const pct=v=>Math.min(100,Math.max(8,v*12))+'%';
  if(el('m-tasks'))el('m-tasks').textContent=m.tasksCompleted+' conclusões';
  if(el('m-rewards'))el('m-rewards').textContent=m.rewardsClaimed+' pedidos';
  if(el('m-created'))el('m-created').textContent=m.tasksCreated+' criadas';
  if(el('kpi-tasks'))el('kpi-tasks').textContent=m.tasksCompleted;
  if(el('kpi-rewards'))el('kpi-rewards').textContent=m.rewardsClaimed;
  if(el('kpi-created'))el('kpi-created').textContent=m.tasksCreated;
  if(el('m-tasks-bar'))el('m-tasks-bar').style.width=pct(m.tasksCompleted);
  if(el('m-rewards-bar'))el('m-rewards-bar').style.width=pct(m.rewardsClaimed);
  if(el('m-created-bar'))el('m-created-bar').style.width=pct(m.tasksCreated);
}

// ── FEEDBACK ──
function openFeedback(){document.getElementById('feedback-form-area').style.display='block';document.getElementById('feedback-success').classList.remove('show');document.getElementById('feedback-modal').classList.add('show');}
function closeFeedback(){document.getElementById('feedback-modal').classList.remove('show');state.selectedRating=null;document.querySelectorAll('.rating-btn').forEach(b=>b.classList.remove('selected'));document.querySelectorAll('.diff-tag').forEach(t=>t.classList.remove('selected'));document.getElementById('feedback-text').value='';}
function selectRating(el,val){document.querySelectorAll('.rating-btn').forEach(b=>b.classList.remove('selected'));el.classList.add('selected');state.selectedRating=val;}
function toggleTag(el){el.classList.toggle('selected');}

async function submitFeedback(){
  if(!state.selectedRating){showToast('Selecione uma avaliação!');return;}
  const difficulties=Array.from(document.querySelectorAll('.diff-tag.selected')).map(t=>t.textContent);
  const text=document.getElementById('feedback-text').value.trim();
  const emojis=['','😞','😐','🙂','😄','🤩'];
  const fb={rating:state.selectedRating,emoji:emojis[state.selectedRating],difficulties,text,time:new Date().toLocaleString('pt-BR')};
  state.feedbacks.push(fb);renderFeedbacksList();
  try{await fetch('https://formspree.io/f/mnjlezpj',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({avaliacao:fb.rating+'/5 '+fb.emoji,dificuldades:difficulties.join(', ')||'Nenhuma',comentario:text||'Sem comentário',horario:fb.time})});}catch(e){}
  document.getElementById('feedback-form-area').style.display='none';document.getElementById('feedback-success').classList.add('show');
}

function renderFeedbacksList(){
  const list=document.getElementById('feedbacks-list');if(!list)return;list.innerHTML='';
  if(!state.feedbacks.length){list.innerHTML='<div class="empty-state" style="padding:20px 0;"><div class="empty-icon">🗂️</div><p>Nenhum feedback ainda.</p></div>';return;}
  state.feedbacks.slice().reverse().forEach(fb=>{
    const item=document.createElement('div');item.className='history-item';item.style.cssText='padding:14px 0;align-items:flex-start;';
    item.innerHTML=`<div style="font-size:22px;">${fb.emoji}</div><div style="flex:1;"><div style="font-weight:700;font-size:14px;color:var(--sky);">${'★'.repeat(fb.rating)}</div>${fb.text?'<div style="font-size:13px;color:var(--text);margin-top:4px;">"'+fb.text+'"</div>':''}<div style="font-size:11px;color:var(--muted);margin-top:4px;">${fb.time}</div></div>`;
    list.appendChild(item);
  });
}


// ══════════════════════════════════════════
// LOGIN TABS
// ══════════════════════════════════════════
function switchLoginTab(tab){
  const isResp=tab==='responsavel';
  document.getElementById('ltab-resp').classList.toggle('active',isResp);
  document.getElementById('ltab-child').classList.toggle('active',!isResp);
  document.getElementById('login-panel-responsavel').style.display=isResp?'block':'none';
  document.getElementById('login-panel-crianca').style.display=isResp?'none':'block';
}

// ══════════════════════════════════════════
// CHILD LOGIN — entrar com código
// ══════════════════════════════════════════
async function entrarComCodigo(){
  const code=document.getElementById('child-invite-code').value.trim().toUpperCase();
  const err=document.getElementById('child-code-error');
  if(!code||code.length<4){err.classList.add('show');err.textContent='Digite o código de convite.';return;}
  err.classList.remove('show');
  showToast('Verificando código... ⏳');

  // Busca no Supabase — aceita usado ou não (código permanente)
  const{data,error}=await db.from('invite_codes')
    .select('*')
    .eq('code',code)
    .maybeSingle();

  if(error||!data){
    err.classList.add('show');
    err.textContent='Código inválido. Peça um novo ao responsável.';
    return;
  }

  showToast('Código válido! Carregando... ⏳');
  await acessarComoCrianca(data.parent_id, data.child_id);
}

async function acessarComoCrianca(parentId, childId){
  // Carrega filhos do responsável
  await carregarFilhos(parentId);

  // Encontra o filho correto
  const childIdx=state.profiles.findIndex(p=>p.id===childId);
  if(childIdx<0){showToast('Criança não encontrada. Contate o responsável.');return;}

  state.currentChild=childIdx;
  state.childSession={parentId,childId}; // guarda em memória

  // Salva sessão no localStorage para acesso permanente
  try{
    localStorage.setItem('elo_child_session',JSON.stringify({parentId,childId,childName:state.profiles[childIdx].name,ts:Date.now()}));
  }catch(e){console.warn('localStorage indisponível',e);}

  await carregarTarefas(childId,childIdx);
  renderChildHome();
  navTo('screen-child-home');
  showToast('Bem-vindo(a), '+state.profiles[childIdx].name+'! 🎮');
}

// ══════════════════════════════════════════
// REWARDS MANAGEMENT
// ══════════════════════════════════════════
let emojiRecompensaSelecionado='🎁';

function selecionarEmojiRecompensa(el,emoji){
  emojiRecompensaSelecionado=emoji;
  document.querySelectorAll('.rew-emoji-opt').forEach(e=>e.classList.remove('selected'));
  el.classList.add('selected');
}

function abrirRewardsMgmt(){
  renderRewardsMgmtList();
  document.getElementById('modal-rewards-mgmt').classList.add('show');
}
function fecharRewardsMgmt(){document.getElementById('modal-rewards-mgmt').classList.remove('show');}

function renderRewardsMgmtList(){
  const list=document.getElementById('rewards-mgmt-list');list.innerHTML='';
  if(!state.rewards.length){list.innerHTML='<div class="empty-state" style="padding:16px 0;"><div class="empty-icon">🎁</div><p>Nenhuma recompensa</p></div>';return;}
  state.rewards.forEach((r,i)=>{
    const item=document.createElement('div');
    item.style.cssText='display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid rgba(45,42,110,.5);';
    item.innerHTML=`<div style="font-size:28px;">${r.emoji}</div><div style="flex:1;"><div style="font-weight:800;font-size:14px;color:var(--text);">${r.name}</div><div style="font-size:12px;color:var(--gold);">⭐ ${r.cost} estrelas</div></div><button onclick="removerRecompensa(${i})" style="background:rgba(239,68,68,.12);border:1.5px solid var(--red);color:var(--red);padding:6px 12px;border-radius:8px;font-family:Nunito,sans-serif;font-weight:800;font-size:12px;cursor:pointer;">🗑️ Remover</button>`;
    list.appendChild(item);
  });
}

function adicionarRecompensa(){
  const name=document.getElementById('new-reward-name').value.trim();
  const cost=parseInt(document.getElementById('new-reward-cost').value);
  if(!name){showToast('Digite o nome!');return;}
  if(!cost||cost<1){showToast('Custo inválido!');return;}
  state.rewards.push({id:Date.now(),name,cost,emoji:emojiRecompensaSelecionado});
  document.getElementById('new-reward-name').value='';
  document.getElementById('new-reward-cost').value='10';
  emojiRecompensaSelecionado='🎁';
  document.querySelectorAll('.rew-emoji-opt').forEach(e=>e.classList.remove('selected'));
  const first=document.querySelector('.rew-emoji-opt');if(first)first.classList.add('selected');
  renderRewardsMgmtList();
  showToast('"'+name+'" adicionada! 🎁');
}

function removerRecompensa(i){
  if(!confirm('Remover "'+state.rewards[i].name+'"?'))return;
  state.rewards.splice(i,1);renderRewardsMgmtList();showToast('Recompensa removida.');
}

// ══════════════════════════════════════════
// GERENCIAR FILHOS — editar / excluir
// ══════════════════════════════════════════
let emojiEditSelecionado='👧';

function selectEmojiEdit(el,emoji){
  emojiEditSelecionado=emoji;
  document.getElementById('edit-selected-emoji').textContent='Selecionado: '+emoji;
  document.querySelectorAll('#edit-emoji-grid .emoji-pick').forEach(e=>e.classList.remove('selected'));
  el.classList.add('selected');
}

function abrirGerenciarFilhos(){
  renderFilhosMgmtList();
  document.getElementById('modal-filhos-mgmt').classList.add('show');
}
function fecharGerenciarFilhos(){document.getElementById('modal-filhos-mgmt').classList.remove('show');}
function fecharEditarFilho(){document.getElementById('modal-edit-child').classList.remove('show');}

function renderFilhosMgmtList(){
  const list=document.getElementById('filhos-mgmt-list');list.innerHTML='';
  if(!state.profiles.length){list.innerHTML='<div class="empty-state" style="padding:16px 0;"><div class="empty-icon">👶</div><p>Nenhum filho cadastrado</p></div>';return;}
  state.profiles.forEach((p,i)=>{
    const item=document.createElement('div');
    item.style.cssText='display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid rgba(45,42,110,.5);';
    item.innerHTML=`
      <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#a855f7);display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;">${p.emoji}</div>
      <div style="flex:1;">
        <div style="font-weight:800;font-size:15px;color:var(--text);">${p.name}</div>
        <div style="font-size:12px;color:var(--muted);">${p.age} anos · ⭐ ${p.stars||0} estrelas</div>
      </div>
      <div style="display:flex;gap:6px;">
        <button onclick="abrirEditarFilho(${i})" style="background:rgba(34,211,238,.1);border:1.5px solid var(--sky);color:var(--sky);padding:7px 12px;border-radius:8px;font-family:Nunito,sans-serif;font-weight:800;font-size:12px;cursor:pointer;">✏️</button>
        <button onclick="excluirFilho(${i})" style="background:rgba(239,68,68,.1);border:1.5px solid var(--red);color:var(--red);padding:7px 12px;border-radius:8px;font-family:Nunito,sans-serif;font-weight:800;font-size:12px;cursor:pointer;">🗑️</button>
      </div>
    `;
    list.appendChild(item);
  });
}

function abrirEditarFilho(i){
  const p=state.profiles[i];
  document.getElementById('edit-child-id').value=p.id;
  document.getElementById('edit-child-name').value=p.name;
  document.getElementById('edit-child-age').value=p.age;
  emojiEditSelecionado=p.emoji;
  document.getElementById('edit-selected-emoji').textContent='Selecionado: '+p.emoji;
  document.querySelectorAll('#edit-emoji-grid .emoji-pick').forEach(e=>{
    e.classList.toggle('selected',e.textContent.trim()===p.emoji);
  });
  document.getElementById('modal-edit-child').classList.add('show');
}

async function salvarEdicaoFilho(){
  const id=document.getElementById('edit-child-id').value;
  const nome=document.getElementById('edit-child-name').value.trim();
  const idade=parseInt(document.getElementById('edit-child-age').value);
  if(!nome||!idade){showToast('Preencha nome e idade!');return;}
  showToast('Salvando... ⏳');
  const{error}=await db.from('children').update({name:nome,age:idade,emoji:emojiEditSelecionado}).eq('id',id);
  if(error){showToast('Erro ao salvar.');console.error(error);return;}
  const idx=state.profiles.findIndex(p=>p.id===id);
  if(idx>=0){state.profiles[idx].name=nome;state.profiles[idx].age=idade;state.profiles[idx].emoji=emojiEditSelecionado;}
  fecharEditarFilho();renderFilhosMgmtList();renderProfiles();
  showToast(nome+' atualizado! ✅');
}

async function excluirFilho(i){
  const p=state.profiles[i];
  if(!confirm('Excluir '+p.name+' e todas as suas tarefas? Essa ação não pode ser desfeita.'))return;
  showToast('Excluindo... ⏳');
  const{error}=await db.from('children').delete().eq('id',p.id);
  if(error){showToast('Erro ao excluir.');console.error(error);return;}
  state.profiles.splice(i,1);state.tasks.splice(i,1);
  renderFilhosMgmtList();renderProfiles();
  showToast(p.name+' removido(a).');
}


// ── TOAST ──
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2500);}

// ── KEYBOARD ──
document.addEventListener('keydown',e=>{
  if(e.key==='Enter'){const active=document.querySelector('.screen.active')?.id;if(active==='screen-login')doLogin();if(active==='screen-register')doRegister();}
  if(e.key==='Escape'){closeFeedback();closeReward();fecharModalFilho();fecharModalTarefas();}
});

// ── INIT ──
db.auth.getSession().then(async({data})=>{
  if(data.session){
    showToast('Sessão ativa, carregando... ⏳');
    await carregarContextoUsuario(data.session.user);
    renderProfiles();
    navTo('screen-profiles');
    return;
  }
  // Verifica sessão de criança salva no localStorage
  try{
    const saved=localStorage.getItem('elo_child_session');
    if(saved){
      const sess=JSON.parse(saved);
      // Sessão válida por 90 dias
      const dias=(Date.now()-sess.ts)/(1000*60*60*24);
      if(dias<90&&sess.parentId&&sess.childId){
        showToast('Olá de novo, '+sess.childName+'! 🎮');
        await acessarComoCrianca(sess.parentId,sess.childId);
        return;
      }else{
        localStorage.removeItem('elo_child_session');
      }
    }
  }catch(e){console.warn('localStorage indisponível',e);}
});

function sairComoCrianca(){
  try{localStorage.removeItem('elo_child_session');}catch(e){}
  state.currentChild=null;
  state.childSession=null;
  state.profiles=[];
  state.tasks=[];
  navTo('screen-login');
}
