// ══════════════════════════════════════════════════════════════
// ELO Family — app.js (Beta v4)
// Correções aplicadas:
//  1. Tab "Login" ≠ botão "Entrar"
//  2. Loading state em login/cadastro
//  3. Validação inline com field errors
//  4. bottom-nav removido do fluxo de responsável
//  5. Hierarquia CTA: forte em Hoje, secundário nas abas
//  6. Navegação unificada em tabs
//  7. PIN para sair do modo criança
//  8. Microcopy de recorrência
//  9. Empty states completos (ícone + título + sub + CTA)
// 10. localStorage versionado (elo_child_session_v2)
// 11. Feedback consistente em todas as ações críticas
// 12. Biblioteca com header de contexto de valor
// ══════════════════════════════════════════════════════════════

// ── STUBS de tema (sobrescritos pelo inline do HTML) ──
if (typeof window.ativarTemaAventura === 'undefined')
  window.ativarTemaAventura  = () => document.body.classList.add('child-mode');
if (typeof window.desativarTemaAventura === 'undefined')
  window.desativarTemaAventura = () => document.body.classList.remove('child-mode');

// ── CHAVE DE STORAGE (T4: versionado + migração) ──
const STORAGE_KEY = 'elo_state_v1';
const ONBOARD_KEY = 'elo_onboarded_v2';
const PIN_KEY     = 'elo_parent_pin';

function _storageGet(key) {
  try { return localStorage.getItem(key); } catch(e) { return null; }
}
function _storageSet(key, val) {
  try {
    if (val === null) localStorage.removeItem(key);
    else localStorage.setItem(key, val);
  } catch(e) {}
}
// T4: migração da chave legada
(function migrarStorageLegado() {
  try {
    const legado = localStorage.getItem('elo_child_session_v2');
    if (legado && !localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, legado);
      localStorage.removeItem('elo_child_session_v2');
    }
  } catch(e) {}
})();

// ── BIBLIOTECA ──
const BIBLIOTECA = [
  { nome:'Escovar os dentes',    icon:'🪥', stars:1, cat:'higiene', time:'07:30' },
  { nome:'Tomar banho',          icon:'🚿', stars:2, cat:'higiene', time:'18:00' },
  { nome:'Lavar as mãos',        icon:'🧼', stars:1, cat:'higiene', time:'12:00' },
  { nome:'Pentear o cabelo',     icon:'💇', stars:1, cat:'higiene', time:'07:45' },
  { nome:'Fazer a lição',        icon:'📝', stars:3, cat:'escola',  time:'15:00' },
  { nome:'Arrumar a mochila',    icon:'🎒', stars:2, cat:'escola',  time:'21:00' },
  { nome:'Ler por 20 minutos',   icon:'📚', stars:3, cat:'escola',  time:'16:00' },
  { nome:'Estudar para a prova', icon:'📖', stars:5, cat:'escola',  time:'15:30' },
  { nome:'Arrumar o quarto',     icon:'🛏️', stars:2, cat:'casa',    time:'08:00' },
  { nome:'Guardar brinquedos',   icon:'🧸', stars:1, cat:'casa',    time:'19:00' },
  { nome:'Ajudar a mesa',        icon:'🍽️', stars:2, cat:'casa',    time:'12:00' },
  { nome:'Varrer o quarto',      icon:'🧹', stars:2, cat:'casa',    time:'09:00' },
  { nome:'Beber água',           icon:'💧', stars:1, cat:'saude',   time:'10:00' },
  { nome:'Fazer exercício',      icon:'🏃', stars:3, cat:'saude',   time:'17:00' },
  { nome:'Dormir cedo',          icon:'😴', stars:2, cat:'saude',   time:'21:00' },
  { nome:'Comer frutas',         icon:'🍎', stars:1, cat:'saude',   time:'14:00' },
];

const REWARDS_DEFAULT = [
  { id:1, name:'Sorvete especial',        emoji:'🍦', cost:10 },
  { id:2, name:'Jogar 30 min extra',      emoji:'🎮', cost:8  },
  { id:3, name:'Escolher o jantar',       emoji:'🍕', cost:15 },
  { id:4, name:'Cinema no fim de semana', emoji:'🎬', cost:25 },
  { id:5, name:'Dormir mais tarde',       emoji:'🌙', cost:12 },
  { id:6, name:'Adesivo especial',        emoji:'⭐', cost:5  },
];

const ICON_MAP = [
  { keys:['dente','escov','bucal'],               icon:'🪥' },
  { keys:['banho','chuveiro','ducha'],             icon:'🚿' },
  { keys:['mão','sabão','lavar'],                  icon:'🧼' },
  { keys:['cabelo','penteado','pentear'],           icon:'💇' },
  { keys:['lição','tarefa','dever','escola','estudar','prova'], icon:'📝' },
  { keys:['mochila'],                              icon:'🎒' },
  { keys:['ler','leitura','livro'],                icon:'📚' },
  { keys:['quarto','cama','arrumar quarto'],        icon:'🛏️' },
  { keys:['brinquedo','guardar'],                  icon:'🧸' },
  { keys:['mesa','prato','jantar','almoço'],        icon:'🍽️' },
  { keys:['varrer','limpar','vassoura'],            icon:'🧹' },
  { keys:['água','beber','hidrat'],                 icon:'💧' },
  { keys:['exercício','correr','treino','esporte'], icon:'🏃' },
  { keys:['dormir','deitar','sono'],               icon:'😴' },
  { keys:['fruta','comer','alimenta','verdura'],   icon:'🍎' },
  { keys:['medicament','remédio','vitamina'],      icon:'💊' },
];
function iconParaTarefa(nome = '') {
  const n = nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const m of ICON_MAP) { if (m.keys.some(k => n.includes(k))) return m.icon; }
  const fb = ['⚔️','🎯','✨','🌟','🔥','💡','🎨','🧩','🏆','📌'];
  return fb[Math.floor(Math.random() * fb.length)];
}

// ── RECORRÊNCIA helpers ──
function getDiaAtual() { return ['dom','seg','ter','qua','qui','sex','sab'][new Date().getDay()]; }
function tarefaAtivaHoje(t) {
  if (!t.recorrente) return true;
  if (!t.dias_semana || !t.dias_semana.length) return true;
  return t.dias_semana.includes(getDiaAtual());
}
function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function tarefaDoneHoje(t) {
  const today = getTodayKey();
  if (t.completion_dates?.includes(today)) return true;
  if (!t.done) return false;
  if (!t.done_date) return t.done;
  return t.done_date === today;
}
function calcularStreak(dates) {
  const done = new Set((dates || []).filter(Boolean));
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 120; i++) {
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    if (!done.has(key)) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
function normalizarTarefa(t, completions = []) {
  const dates = completions.map(c => c.completed_date).filter(Boolean);
  if (t.done_date && !dates.includes(t.done_date)) dates.push(t.done_date);
  return { ...t, done_date: t.done_date || null, recorrente: t.recorrente || false, dias_semana: t.dias_semana || [], completion_dates: dates, completion_count: dates.length, streak: calcularStreak(dates) };
}

// ── STATE ──
const state = {
  currentChild: null, currentUserId: null, currentUserRole: 'parent', currentUserEmail: '',
  selectedRating: null, feedbacks: [],
  metrics: { tasksCompleted: 0, rewardsClaimed: 0, tasksCreated: 0 },
  profiles: [], tasks: [], rewards: REWARDS_DEFAULT, pendingApprovals: [], history: [],
  completionsAvailable: true, lastInviteCode: null, childSession: null, isChildMode: false,
};

// ── NAV ──
function navTo(screenId) {
  if (state.isChildMode && (screenId === 'screen-parent' || screenId === 'screen-admin')) {
    showToast('Área restrita ao responsável.');
    return;
  }
  if (screenId === 'screen-admin' && !isMaster()) { showToast('Métricas disponíveis apenas para usuárias master.'); return; }
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
  window.scrollTo(0, 0);
}
async function navParent() {
  desativarTemaAventura();
  state.isChildMode = false;
  await carregarTodasTarefas();
  renderParentDashboard();
  renderChildSwitchCards();
  renderParentGreeting();
  applyRoleUi();
  navTo('screen-parent');
}
function isMaster() { return state.currentUserRole === 'master'; }
function navAdmin() { if (!isMaster()) { showToast('Métricas disponíveis apenas para usuárias master.'); return; } updateMetrics(); navTo('screen-admin'); }
function applyRoleUi() {
  document.querySelectorAll('.master-only').forEach(el => el.style.display = isMaster() ? 'block' : 'none');
  const btnAdminNav = document.getElementById('btn-admin-nav');
  if (btnAdminNav) btnAdminNav.style.display = isMaster() ? 'flex' : 'none';
}

// ══════════════════════════════════════════
// FIX 3 — VALIDAÇÃO INLINE
// ══════════════════════════════════════════
function setFieldError(inputId, msgId, msg) {
  const inp = document.getElementById(inputId);
  const msgEl = document.getElementById(msgId);
  if (inp) inp.classList.add('field-error');
  if (msgEl) { msgEl.textContent = msg; msgEl.className = 'field-msg err show'; }
}
function clearFieldError(inputId, msgId) {
  const inp = document.getElementById(inputId);
  const msgEl = document.getElementById(msgId);
  if (inp) inp.classList.remove('field-error');
  if (msgEl) { msgEl.textContent = ''; msgEl.classList.remove('show'); }
}
function clearAllFieldErrors() {
  document.querySelectorAll('.field-error').forEach(el => el.classList.remove('field-error'));
  document.querySelectorAll('.field-msg').forEach(el => { el.textContent = ''; el.classList.remove('show'); });
}

// ══════════════════════════════════════════
// FIX 2 — LOADING STATE
// ══════════════════════════════════════════
function setLoading(btnId, loading, text = '') {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  if (loading) { btn._origText = btn.textContent; btn.textContent = text || 'Aguarde…'; }
  else          { btn.textContent = btn._origText || btn.textContent; }
}

// ══════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════

// FIX 1: tab renomeada para "Login" (no HTML) — função mantida
function switchLoginTab(tab) {
  const isResp = tab === 'responsavel';
  document.getElementById('ltab-resp').classList.toggle('active', isResp);
  document.getElementById('ltab-child').classList.toggle('active', !isResp);
  document.getElementById('login-panel-responsavel').style.display = isResp ? 'block' : 'none';
  document.getElementById('login-panel-crianca').style.display     = isResp ? 'none' : 'block';
}

async function doLogin() {
  // T1: limpa erros anteriores
  clearAllFieldErrors();
  const errGeral = document.getElementById('login-error');
  errGeral.classList.remove('show');

  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value;
  let hasErr  = false;

  // T1: validação inline por campo — sem toast
  if (!email) { setFieldError('login-email', 'login-email-msg', 'E-mail é obrigatório.'); hasErr = true; }
  if (!pass)  { setFieldError('login-pass',  'login-pass-msg',  'Senha é obrigatória.');  hasErr = true; }
  if (hasErr) return;

  // T2: loading — bloqueia múltiplos cliques
  setLoading('btn-login', true, 'Entrando...');

  const { data, error } = await db.auth.signInWithPassword({ email, password: pass });

  if (error) {
    // T2: restaura botão após erro
    setLoading('btn-login', false);
    // T3: erro de autenticação → mensagem geral acima do botão
    errGeral.textContent = 'E-mail ou senha incorretos.';
    errGeral.classList.add('show');
    return;
  }

  // T2: sucesso — mantém fluxo normal (loading fica até navegar)
  showToast('Bem-vindo! 👋');
  await carregarContextoUsuario(data.user);
  await carregarTodasTarefas();
  renderParentDashboard();
  navTo('screen-parent');
  setLoading('btn-login', false);
}

async function doRegister() {
  // T1: limpa erros anteriores
  clearAllFieldErrors();
  const errGeral = document.getElementById('reg-error');
  errGeral.classList.remove('show');

  const name  = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass  = document.getElementById('reg-pass').value;
  const pass2 = document.getElementById('reg-pass2').value;
  const terms = document.getElementById('chk-terms').checked;
  const lgpd  = document.getElementById('chk-lgpd').checked;
  let hasErr  = false;

  // T1: validação inline por campo — sem toast
  if (!name)  { setFieldError('reg-name',  'reg-name-msg',  'Nome é obrigatório.');   hasErr = true; }
  if (!email) { setFieldError('reg-email', 'reg-email-msg', 'E-mail é obrigatório.'); hasErr = true; }
  if (!pass)  { setFieldError('reg-pass',  'reg-pass-msg',  'Senha é obrigatória.');  hasErr = true; }
  else if (pass.length < 6) {
    setFieldError('reg-pass', 'reg-pass-msg', 'Senha deve ter no mínimo 6 caracteres.'); hasErr = true;
  }
  if (pass && pass.length >= 6 && pass !== pass2) {
    setFieldError('reg-pass2', 'reg-pass2-msg', 'As senhas não coincidem.'); hasErr = true;
  }
  // T3: termos → erro geral (não é erro de campo individual)
  if (!terms || !lgpd) {
    errGeral.textContent = 'Aceite os termos e o consentimento LGPD para continuar.';
    errGeral.classList.add('show');
    hasErr = true;
  }
  if (hasErr) return;

  // T2: loading — bloqueia múltiplos cliques
  setLoading('btn-register', true, 'Criando conta...');

  const { data, error } = await db.auth.signUp({ email, password: pass, options: { data: { full_name: name, role: 'parent' } } });
  setLoading('btn-register', false);

  if (error) {
    // T3: erro de servidor → mensagem geral
    errGeral.textContent = 'Erro ao criar conta: ' + error.message;
    errGeral.classList.add('show');
    return;
  }

  await db.from('profiles').insert({ id: data.user.id, full_name: name, email });
  showToast('Conta criada! Verifique seu e-mail 📧');
  setTimeout(() => navTo('screen-login'), 2000);
}

// Ajuste 4: loading state + validação inline adicionados.
// Antes: toast para campo vazio, sem feedback de processamento.
// Depois: erro abaixo do campo, botão desabilitado enquanto envia.
function doForgot() {
  clearFieldError('forgot-email', 'forgot-email-msg');
  const email = document.getElementById('forgot-email').value.trim();

  if (!email) {
    setFieldError('forgot-email', 'forgot-email-msg', 'E-mail é obrigatório.');
    return;
  }

  setLoading('btn-forgot', true, 'Enviando...');
  db.auth.resetPasswordForEmail(email).then(() => {
    setLoading('btn-forgot', false);
    showToast('E-mail enviado! Verifique sua caixa de entrada 📧');
    setTimeout(() => navTo('screen-login'), 1800);
  }).catch(() => {
    setLoading('btn-forgot', false);
    setFieldError('forgot-email', 'forgot-email-msg', 'Não foi possível enviar. Verifique o e-mail.');
  });
}

async function doLogout() {
  await db.auth.signOut();
  state.profiles = []; state.tasks = []; state.currentUserId = null;
  state.currentUserRole = 'parent'; state.currentUserEmail = '';
  showToast('Até logo! 👋');
  setTimeout(() => navTo('screen-login'), 800);
}

// ── FILHOS ──
async function carregarContextoUsuario(user) {
  state.currentUserId   = user.id;
  state.currentUserEmail = (user.email || '').toLowerCase();
  state.currentUserRole  = user.user_metadata?.role || user.app_metadata?.role || 'parent';
  const { data: perfil } = await db.from('profiles').select('role,is_master,email').eq('id', user.id).maybeSingle();
  if (perfil?.is_master || perfil?.role === 'master') state.currentUserRole = 'master';
  await carregarFilhos(user.id);
}

async function carregarFilhos(userId) {
  state.currentUserId = userId;
  const { data, error } = await db.from('children').select('*').eq('parent_id', userId).order('created_at', { ascending: true });
  if (error) { console.error(error); return; }
  state.profiles = (data || []).map(f => ({ id: f.id, name: f.name, age: f.age, emoji: f.emoji, stars: f.stars || 0 }));
  state.tasks    = state.profiles.map(() => []);
}

let emojiSelecionado = '👧';
function selectEmoji(el, emoji) {
  emojiSelecionado = emoji;
  document.getElementById('selected-emoji').textContent = 'Selecionado: ' + emoji;
  document.querySelectorAll('.emoji-pick').forEach(e => e.classList.remove('selected'));
  el.classList.add('selected');
}
function abrirModalFilho() { document.getElementById('modal-add-child').classList.add('show'); }
function fecharModalFilho() {
  document.getElementById('modal-add-child').classList.remove('show');
  document.getElementById('child-name').value = '';
  document.getElementById('child-age').value  = '';
  emojiSelecionado = '👧';
  document.getElementById('selected-emoji').textContent = 'Selecionado: 👧';
}

async function salvarFilho() {
  const nome  = document.getElementById('child-name').value.trim();
  const idade = parseInt(document.getElementById('child-age').value);
  // FIX 11 — feedback consistente
  if (!nome || !idade || idade < 1 || idade > 17) { showToast('Preencha nome e idade corretamente!', 'warn'); return; }
  showToast('Salvando… ⏳');
  const { data, error } = await db.from('children').insert({ parent_id: state.currentUserId, name: nome, age: idade, emoji: emojiSelecionado, stars: 0 }).select().single();
  if (error) { showToast('Erro ao salvar filho.', 'err'); console.error(error); return; }
  state.profiles.push({ id: data.id, name: data.name, age: data.age, emoji: data.emoji, stars: 0 });
  state.tasks.push([]);
  fecharModalFilho();
  renderProfiles();
  // FIX 9 — empty state desaparece imediatamente
  renderChildSwitchCards();
  showToast(nome + ' adicionado(a)! 🎉');
  // ONBOARDING: filho criado = passo 1 concluído
  if (typeof obAvancar === 'function') obAvancar(1);
}

function renderProfiles() {
  const grid = document.getElementById('profiles-grid');
  if (!grid) return;
  grid.innerHTML = '';
  applyRoleUi();
  state.profiles.forEach((p, i) => {
    const card = document.createElement('div'); card.className = 'profile-card';
    const grad = i === 0 ? '#7c3aed,#a855f7' : '#eab308,#ca8a04';
    card.innerHTML = `<div class="profile-role">Criança</div><div class="profile-avatar" style="background:linear-gradient(135deg,${grad})">${p.emoji}</div><div class="profile-name">${p.name}</div><div class="profile-age">${p.age} anos · ⭐${p.stars || 0}</div>`;
    card.onclick = () => selectProfile(p.id); grid.appendChild(card);
  });
  const add = document.createElement('div'); add.className = 'profile-card profile-add';
  add.innerHTML = '<div class="profile-avatar" style="background:var(--card2);box-shadow:none;"><span style="font-size:28px;color:var(--sky)">+</span></div><div class="profile-name" style="color:var(--sky)">Adicionar</div>';
  add.onclick = () => abrirModalFilho(); grid.appendChild(add);
  document.getElementById('stat-filhos').textContent = state.profiles.length;
}

async function convidarCrianca() {
  if (!state.profiles.length) { showToast('Cadastre um filho primeiro!'); return; }
  let childIdx = 0;
  if (state.profiles.length > 1) {
    const opts = state.profiles.map((p, i) => i + ': ' + p.emoji + ' ' + p.name).join('\n');
    const escolha = prompt('Para qual filho?\n' + opts + '\n\nDigite o número:');
    if (escolha === null) return;
    childIdx = parseInt(escolha) || 0;
    if (childIdx < 0 || childIdx >= state.profiles.length) childIdx = 0;
  }
  const child = state.profiles[childIdx];
  const code  = 'ELO-' + Math.random().toString(36).slice(2, 7).toUpperCase();
  showToast('Gerando código… ⏳');
  const { error } = await db.from('invite_codes').insert({ code, parent_id: state.currentUserId, child_id: child.id, used: false });
  if (error) { showToast('Erro ao gerar código.'); return; }
  state.lastInviteCode = code;
  document.getElementById('convite-code-display').textContent = code;
  document.getElementById('convite-child-name').textContent   = '👶 Criança: ' + child.name;
  document.getElementById('modal-convite').classList.add('show');
}
function fecharConvite() { document.getElementById('modal-convite').classList.remove('show'); }
function copiarCodigo() {
  const code = document.getElementById('convite-code-display').textContent;
  if (navigator.clipboard) navigator.clipboard.writeText(code).then(() => showToast('Código copiado! 📋'));
  else { const el = document.createElement('textarea'); el.value = code; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el); showToast('Código copiado! 📋'); }
}

// ── TAREFAS ──
async function carregarTarefas(childId, childIndex) {
  const { data, error } = await db.from('tasks').select('*').eq('child_id', childId).order('time', { ascending: true });
  if (error) { console.error(error); return; }
  const tasks = data || [];
  let completions = [];
  if (tasks.length && state.completionsAvailable) {
    const res = await db.from('task_completions').select('*').eq('child_id', childId).in('task_id', tasks.map(t => t.id)).order('completed_date', { ascending: false });
    if (!res.error) completions = res.data || [];
    else { state.completionsAvailable = false; }
  }
  while (state.tasks.length <= childIndex) state.tasks.push([]);
  state.tasks[childIndex] = tasks.map(t => normalizarTarefa(t, completions.filter(c => c.task_id === t.id)));
  registrarHistoricoDeCompletions(completions, tasks);
}

async function carregarTodasTarefas() {
  for (let i = 0; i < state.profiles.length; i++) await carregarTarefas(state.profiles[i].id, i);
}

function registrarHistoricoDeCompletions(completions, tasks) {
  const today  = getTodayKey();
  const byTask = Object.fromEntries(tasks.map(t => [t.id, t]));
  completions.filter(c => c.completed_date === today).forEach(c => {
    const task  = byTask[c.task_id];
    const child = state.profiles.find(p => p.id === c.child_id);
    if (!task || !child) return;
    const key = `${c.task_id}-${c.child_id}-${c.completed_date}`;
    if (state.history.some(h => h.key === key)) return;
    const time = c.completed_at ? new Date(c.completed_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Hoje';
    state.history.unshift({ key, task: task.name, child: child.name, stars: c.stars_earned || task.stars, time });
  });
}

async function selectProfile(id) {
  state.currentChild = state.profiles.findIndex(p => p.id === id);
  showToast('Carregando tarefas… ⏳');
  await carregarTarefas(id, state.currentChild);
  renderChildHome();
  navTo('screen-child-home');
}

// ── CHILD HOME ──
function renderChildHome() {
  const child = state.profiles[state.currentChild];
  const tasks = state.tasks[state.currentChild] || [];
  document.getElementById('child-greeting').textContent = child.name + '! ' + child.emoji;
  document.getElementById('header-stars').textContent   = child.stars || 0;
  const ativas = tasks.filter(tarefaAtivaHoje);
  const done   = ativas.filter(tarefaDoneHoje).length;
  const pct    = ativas.length ? Math.round(done / ativas.length * 100) : 0;
  document.getElementById('progress-count').textContent = done + '/' + ativas.length + ' tarefas';
  document.getElementById('progress-pct').textContent   = pct + '%';
  document.getElementById('progress-bar').style.width   = pct + '%';

  const list    = document.getElementById('child-tasks-list');
  const emptyEl = document.getElementById('empty-tasks-state');
  list.innerHTML = '';

  const rotina  = tasks.filter(t =>  t.recorrente && tarefaAtivaHoje(t));
  const unicas  = tasks.filter(t => !t.recorrente);

  // FIX 9 — empty state completo
  if (!rotina.length && !unicas.length) {
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }
  if (emptyEl) emptyEl.style.display = 'none';

  function renderTaskCard(task) {
    const doneHoje = tarefaDoneHoje(task);
    const card     = document.createElement('div'); card.className = 'task-card' + (doneHoje ? ' done' : '');
    const streak   = task.recorrente && task.streak > 1 ? `<div class="task-streak">🔥 ${task.streak} dias</div>` : '';
    card.innerHTML = `<div class="task-icon">${task.icon}</div><div class="task-info"><div class="task-name">${task.name}${task.recorrente ? '<span style="font-size:10px;color:var(--sky);background:#1a1650;padding:2px 6px;border-radius:6px;margin-left:6px;">🔄</span>' : ''}</div><div class="task-time">⏰ ${task.time}${streak}</div></div><div class="task-stars">⭐ ${task.stars}</div><div class="task-check">${doneHoje ? '✓' : ''}</div>`;
    if (!doneHoje) card.onclick = () => completeTask(task);
    return card;
  }
  function renderSection(arr, icon, label) {
    if (!arr.length) return;
    const lbl = document.createElement('div'); lbl.className = 'tasks-section-title';
    const dc  = arr.filter(tarefaDoneHoje).length;
    lbl.innerHTML = icon + ' ' + label + ' <span>' + dc + '/' + arr.length + '</span>';
    list.appendChild(lbl);
    const wrap = document.createElement('div'); wrap.style.cssText = 'padding:0 16px;display:flex;flex-direction:column;gap:8px;margin-bottom:8px;';
    arr.forEach(t => wrap.appendChild(renderTaskCard(t))); list.appendChild(wrap);
  }
  renderSection(rotina, '🔄', 'Rotina diária');
  renderSection(unicas, '📋', 'Missões de hoje');
}

async function completeTask(task) {
  const child = state.profiles[state.currentChild];
  const today = getTodayKey();
  if (tarefaDoneHoje(task)) { showToast('Missão já concluída hoje! ✅'); return; }
  const completion = { task_id: task.id, child_id: child.id, parent_id: state.currentUserId, completed_date: today, stars_earned: task.stars, approved_by_parent: true };
  if (state.completionsAvailable) {
    const res = await db.from('task_completions').insert(completion);
    if (res.error) {
      if (res.error.code === '23505') { showToast('Missão já concluída hoje! ✅'); return; }
      state.completionsAvailable = false;
      await db.from('tasks').update({ done: true, done_date: today }).eq('id', task.id);
    }
  } else {
    await db.from('tasks').update({ done: true, done_date: today }).eq('id', task.id);
  }
  task.done = true; task.done_date = today;
  task.completion_dates = Array.from(new Set([...(task.completion_dates || []), today]));
  task.completion_count = task.completion_dates.length;
  task.streak = calcularStreak(task.completion_dates);
  child.stars = (child.stars || 0) + task.stars;
  state.metrics.tasksCompleted++;
  await db.from('children').update({ stars: child.stars }).eq('id', child.id);
  state.history.unshift({ key: `${task.id}-${child.id}-${today}`, task: task.name, child: child.name, stars: task.stars, time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) });
  const streakMsg = task.streak > 1 ? `🔥 ${task.streak} dias seguidos!` : `Continue assim, ${child.name}!`;
  if (typeof window.showReward === 'function') {
    window.showReward(task.stars, `+${task.stars} estrela${task.stars > 1 ? 's' : ''}! ${streakMsg}`, 'Missão completa! 🎉');
  } else {
    document.getElementById('reward-title').textContent = 'Missão completa! 🎉';
    document.getElementById('reward-msg').textContent   = `+${task.stars} estrela${task.stars > 1 ? 's' : ''}! ${streakMsg}`;
    document.getElementById('reward-overlay').classList.add('show');
  }
  renderChildHome(); updateMetrics();
  // ONBOARDING: primeira missão concluída = passo 4 concluído
  if (typeof obAvancar === 'function') obAvancar(4);
}
function closeReward() { document.getElementById('reward-overlay').classList.remove('show'); }

function switchChildTab(tab) {
  if (tab === 'home')    { renderChildHome();  navTo('screen-child-home'); }
  else                   { renderRewards();    navTo('screen-child-rewards'); }
}

// ── REWARDS ──
function renderRewards() {
  const child = state.profiles[state.currentChild];
  document.getElementById('reward-stars').textContent     = child.stars || 0;
  document.getElementById('reward-stars-val').textContent = child.stars || 0;
  const pendChild = state.pendingApprovals.filter(a => a.child === child.name);
  const notice    = document.getElementById('pending-notice');
  if (pendChild.length) { notice.style.display = 'block'; notice.textContent = '⏳ ' + pendChild.length + ' pedido(s) aguardando aprovação'; }
  else notice.style.display = 'none';
  const grid = document.getElementById('child-rewards-grid'); grid.innerHTML = '';
  // FIX 9 — empty state
  if (!state.rewards.length) {
    grid.innerHTML = `<div class="empty-v2" style="grid-column:1/-1"><div class="e2-art">🎁</div><div class="e2-title">Nenhum prêmio disponível</div><div class="e2-sub">Continue concluindo missões para ganhar estrelas e trocar por prêmios incríveis!</div></div>`;
    return;
  }
  state.rewards.forEach(r => {
    const canAfford = (child.stars || 0) >= r.cost;
    const pend      = state.pendingApprovals.some(a => a.child === child.name && a.reward === r.name);
    const card      = document.createElement('div'); card.className = 'reward-card' + (!canAfford || pend ? ' claimed' : '');
    card.innerHTML  = `<div class="reward-emoji">${r.emoji}</div><div class="reward-rname">${r.name}</div><div class="reward-cost">⭐ ${r.cost}</div>${pend ? '<div class="reward-pending">⏳ Aguardando</div>' : ''}`;
    if (canAfford && !pend) card.onclick = () => requestReward(r);
    grid.appendChild(card);
  });
}

function requestReward(r) {
  const child = state.profiles[state.currentChild];
  state.pendingApprovals.push({ reward: r.name, child: child.name, cost: r.cost, emoji: r.emoji });
  state.metrics.rewardsClaimed++; updateMetrics();
  // FIX 11
  showToast('Pedido de "' + r.name + '" enviado! ⏳');
  renderRewards();
}

// ── PARENT DASHBOARD ──
function renderParentDashboard() {
  const allTasks = state.tasks.flat();
  const done     = allTasks.filter(tarefaDoneHoje).length;
  const stars    = state.profiles.reduce((a, p) => a + (p.stars || 0), 0);
  document.getElementById('stat-completed').textContent = done;
  document.getElementById('stat-stars').textContent     = stars;
  document.getElementById('stat-pending').textContent   = state.pendingApprovals.length;
  document.getElementById('stat-filhos').textContent    = state.profiles.length;

  // Badge na aba Aprovar
  const badge = document.querySelector('[data-tab="aprovar"] .tab-badge');
  if (badge) { badge.textContent = state.pendingApprovals.length; badge.classList.toggle('show', state.pendingApprovals.length > 0); }

  renderChildSwitchCards();
  renderParentGreeting();
  // Renderiza apenas a aba ativa do card de progresso
  renderProgressoTabAtual();
  renderHomeMeta();
  switchParentTab(_parentTabAtual);

  const hList = document.getElementById('history-list'); if (!hList) return; hList.innerHTML = '';
  if (!state.history.length) {
    hList.innerHTML = '<div style="text-align:center;padding:16px;color:var(--muted);font-size:13px;">Nenhuma missão concluída ainda hoje.</div>';
  } else {
    state.history.slice(0, 8).forEach(h => {
      const item = document.createElement('div'); item.className = 'history-item';
      item.innerHTML = `<div class="history-dot"></div><div class="history-info"><div class="history-task">${h.task}</div><div class="history-meta">${h.child} · ${h.time}</div></div><div class="history-stars">+${h.stars}⭐</div>`;
      hList.appendChild(item);
    });
  }
  verificarOnboarding();
}

async function approveReward(i) {
  const a  = state.pendingApprovals[i];
  const ci = state.profiles.findIndex(p => p.name === a.child);
  if (ci >= 0) { state.profiles[ci].stars = Math.max(0, (state.profiles[ci].stars || 0) - a.cost); await db.from('children').update({ stars: state.profiles[ci].stars }).eq('id', state.profiles[ci].id); }
  state.pendingApprovals.splice(i, 1);
  showToast('Recompensa aprovada! ✅'); // FIX 11
  renderParentDashboard();
}
function rejectReward(i) {
  state.pendingApprovals.splice(i, 1);
  showToast('Pedido recusado.'); // FIX 11
  renderParentDashboard();
}

// resetTarefasRotina: confirmação inline — sem confirm() nativo.
// Ação destrutiva (apaga conclusões do banco). Botão muta para "Confirmar reset" e volta em 4s.
let _resetRotinaTimer = null;
async function resetTarefasRotina() {
  const btn = document.querySelector('[data-reset-rotina]');

  if (!btn || !btn.classList.contains('btn-confirming')) {
    if (btn) {
      btn.classList.add('btn-confirming');
      btn._origText = btn.textContent;
      btn.textContent = '⚠️ Confirmar reset';
      clearTimeout(_resetRotinaTimer);
      _resetRotinaTimer = setTimeout(() => {
        btn.classList.remove('btn-confirming');
        btn.textContent = btn._origText || '🔄 Resetar rotina diária';
      }, 4000);
    }
    return;
  }

  // Confirmar: executa o reset
  clearTimeout(_resetRotinaTimer);
  if (btn) { btn.classList.remove('btn-confirming'); btn.disabled = true; btn.textContent = 'Resetando...'; }

  const today = getTodayKey();
  const recurringIds = state.tasks.flat().filter(t => t.recorrente && tarefaDoneHoje(t)).map(t => t.id);
  if (recurringIds.length && state.completionsAvailable) {
    await db.from('task_completions').delete().in('task_id', recurringIds).eq('completed_date', today);
  }
  for (let ci = 0; ci < state.profiles.length; ci++) {
    for (const task of (state.tasks[ci] || [])) {
      if (task.recorrente && tarefaDoneHoje(task)) {
        await db.from('tasks').update({ done: false, done_date: null }).eq('id', task.id);
        task.done = false; task.done_date = null;
        task.completion_dates = (task.completion_dates || []).filter(d => d !== today);
        task.completion_count = task.completion_dates.length;
        task.streak = calcularStreak(task.completion_dates);
      }
    }
  }
  state.history = state.history.filter(h => h.date !== today);

  if (btn) { btn.disabled = false; btn.textContent = btn._origText || '🔄 Resetar rotina diária'; }
  showToast('Rotina do dia resetada! ✅');
  renderParentDashboard();
}

// ── CRIAR TAREFAS ──
let selectedBibCards = [], selectedStarsFabVal = 2, selectedStarsLoteVal = 1, catAtual = 'todos';

function abrirModalTarefas() {
  ['fab-task-child', 'fab-bib-child', 'fab-lote-child'].forEach(id => {
    const sel = document.getElementById(id); if (!sel) return; sel.innerHTML = '';
    state.profiles.forEach((f, i) => { const o = document.createElement('option'); o.value = i; o.textContent = f.emoji + ' ' + f.name; sel.appendChild(o); });
  });
  renderBiblioteca('todos');
  // Reset do preview ao abrir o modal
  renderRewardPreview();
  document.getElementById('modal-tarefas').classList.add('show');
}
function fecharModalTarefas() {
  document.getElementById('modal-tarefas').classList.remove('show');
  selectedBibCards = [];
  document.getElementById('fab-task-name').value      = '';
  document.getElementById('lote-text').value          = '';
  document.getElementById('fab-recorrente').checked   = false;
  document.getElementById('dias-semana-wrap').style.display = 'none';
  // oculta hint de recorrência
  const hint = document.getElementById('rec-hint'); if (hint) hint.classList.remove('show');
}

function switchTab(tab) {
  ['manual', 'biblioteca', 'lote'].forEach(t => {
    document.getElementById('tab-content-' + t).style.display = t === tab ? 'block' : 'none';
    document.getElementById('tab-' + t).classList.toggle('active', t === tab);
  });
}

// FIX 12 — biblioteca com contexto de valor
function renderBiblioteca(cat) {
  const grid = document.getElementById('biblioteca-grid'); grid.innerHTML = '';
  const filtered = cat === 'todos' ? BIBLIOTECA : BIBLIOTECA.filter(t => t.cat === cat);
  filtered.forEach(t => {
    const card = document.createElement('div'); card.className = 'bib-card' + (selectedBibCards.includes(t.nome) ? ' selected' : '');
    card.innerHTML = `<div class="bib-icon">${t.icon}</div><div class="bib-name">${t.nome}</div><div class="bib-stars">${'⭐'.repeat(Math.min(t.stars, 3))} ${t.stars}★</div>`;
    card.onclick = () => { const idx = selectedBibCards.indexOf(t.nome); if (idx >= 0) { selectedBibCards.splice(idx, 1); card.classList.remove('selected'); } else { selectedBibCards.push(t.nome); card.classList.add('selected'); } };
    grid.appendChild(card);
  });
}

function filterCat(el, cat) {
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active'); catAtual = cat; renderBiblioteca(cat);
}

function selectStarsFab(el, val) {
  el.closest('.star-select').querySelectorAll('.star-option').forEach(e => e.classList.remove('selected'));
  el.classList.add('selected');
  selectedStarsFabVal = val;
  // Atualiza o preview de recompensa em tempo real
  renderRewardPreview();
}
function selectStarsLote(el, val) { el.closest('.star-select').querySelectorAll('.star-option').forEach(e => e.classList.remove('selected')); el.classList.add('selected'); selectedStarsLoteVal = val; }

// FIX 8 — microcopy de recorrência
const REC_HINTS = {
  false: '',
  true:  '🔄 Essa missão vai aparecer nos dias selecionados abaixo.',
};
function toggleDiasSemana() {
  const checked = document.getElementById('fab-recorrente').checked;
  document.getElementById('dias-semana-wrap').style.display = checked ? 'block' : 'none';
  const hint = document.getElementById('rec-hint');
  if (hint) { hint.classList.toggle('show', checked); }
}
function toggleDia(btn) { btn.classList.toggle('selected'); }
function getDiasSelecionados() { return Array.from(document.querySelectorAll('.dia-btn.selected')).map(b => b.dataset.dia); }

async function addTaskFab() {
  const name     = document.getElementById('fab-task-name').value.trim();
  const childIdx = parseInt(document.getElementById('fab-task-child').value);
  const time     = document.getElementById('fab-task-time').value;
  const recorrente  = document.getElementById('fab-recorrente').checked;
  const dias_semana = recorrente ? getDiasSelecionados() : [];

  // Ajuste 5: validação com mensagem específica (sem toast genérico)
  if (!name) { showToast('Digite o nome da missão para continuar.'); return; }
  const child = state.profiles[childIdx];
  if (!child) { showToast('Selecione para qual filho é essa missão.'); return; }

  // Ajuste 5: desabilita botão para evitar duplo envio
  const btnCriar = document.querySelector('#tab-content-manual .btn-primary');
  if (btnCriar) { btnCriar.disabled = true; btnCriar._orig = btnCriar.textContent; btnCriar.textContent = 'Criando...'; }

  const { data, error } = await db.from('tasks').insert({
    child_id: child.id, parent_id: state.currentUserId,
    name, time, stars: selectedStarsFabVal,
    icon: iconParaTarefa(name),
    done: false, recorrente, dias_semana
  }).select().single();

  if (btnCriar) { btnCriar.disabled = false; btnCriar.textContent = btnCriar._orig; }

  if (error) {
    // Ajuste 5: erro de servidor com contexto
    showToast('Não foi possível criar a missão. Tente novamente.');
    console.error(error);
    return;
  }

  state.tasks[childIdx].push(normalizarTarefa(data));
  state.metrics.tasksCreated++;
  updateMetrics();
  fecharModalTarefas();
  renderParentDashboard();
  // Ajuste 5: confirma com nome da missão criada
  showToast('"' + name + '" adicionada à rotina de ' + child.name + '! ' + (recorrente ? '🔄' : '✅'));
  // ONBOARDING: primeira missão criada = passo 2 concluído
  if (typeof obAvancar === 'function') obAvancar(2);
}

async function adicionarSelecionadas() {
  const childIdx = parseInt(document.getElementById('fab-bib-child').value);
  const child    = state.profiles[childIdx];
  if (!child) { showToast('Selecione uma criança!'); return; }
  if (!selectedBibCards.length) { showToast('Selecione ao menos uma missão!'); return; }
  showToast('Criando ' + selectedBibCards.length + ' missão(ões)… ⏳');
  let criadas = 0;
  for (const nome of selectedBibCards) {
    const t = BIBLIOTECA.find(b => b.nome === nome); if (!t) continue;
    const { data, error } = await db.from('tasks').insert({ child_id: child.id, parent_id: state.currentUserId, name: t.nome, time: t.time, stars: t.stars, icon: t.icon, done: false, recorrente: false, dias_semana: [] }).select().single();
    if (!error && data) { state.tasks[childIdx].push(normalizarTarefa(data)); criadas++; }
  }
  state.metrics.tasksCreated += criadas; updateMetrics();
  fecharModalTarefas(); renderParentDashboard();
  showToast(criadas + ' tarefa(s) criada(s)! ✅'); // FIX 11
}

async function criarEmLote() {
  const childIdx = parseInt(document.getElementById('fab-lote-child').value);
  const child    = state.profiles[childIdx];
  const texto    = document.getElementById('lote-text').value.trim();
  if (!child) { showToast('Selecione uma criança!'); return; }
  if (!texto) { showToast('Digite ao menos uma missão!'); return; }
  const linhas = texto.split('\n').map(l => l.trim()).filter(l => l);
  showToast('Criando ' + linhas.length + ' missão(ões)… ⏳');
  let criadas = 0;
  for (const nome of linhas) {
    const { data, error } = await db.from('tasks').insert({ child_id: child.id, parent_id: state.currentUserId, name: nome, time: '08:00', stars: selectedStarsLoteVal, icon: iconParaTarefa(nome), done: false, recorrente: false, dias_semana: [] }).select().single();
    if (!error && data) { state.tasks[childIdx].push(normalizarTarefa(data)); criadas++; }
  }
  state.metrics.tasksCreated += criadas; updateMetrics();
  fecharModalTarefas(); renderParentDashboard();
  showToast(criadas + ' tarefa(s) criada(s)! ✅'); // FIX 11
}

// ── METRICS ──
function updateMetrics() {
  const m = state.metrics;
  const el = id => document.getElementById(id);
  const pct = v => Math.min(100, Math.max(8, v * 12)) + '%';
  if (el('m-tasks'))    el('m-tasks').textContent   = m.tasksCompleted + ' conclusões';
  if (el('m-rewards'))  el('m-rewards').textContent = m.rewardsClaimed + ' pedidos';
  if (el('m-created'))  el('m-created').textContent = m.tasksCreated   + ' criadas';
  if (el('kpi-tasks'))  el('kpi-tasks').textContent  = m.tasksCompleted;
  if (el('kpi-rewards'))el('kpi-rewards').textContent= m.rewardsClaimed;
  if (el('kpi-created'))el('kpi-created').textContent= m.tasksCreated;
  if (el('m-tasks-bar'))   el('m-tasks-bar').style.width   = pct(m.tasksCompleted);
  if (el('m-rewards-bar')) el('m-rewards-bar').style.width = pct(m.rewardsClaimed);
  if (el('m-created-bar')) el('m-created-bar').style.width = pct(m.tasksCreated);
}

// ── FEEDBACK ──
function openFeedback() {
  document.getElementById('feedback-form-area').style.display = 'block';
  document.getElementById('feedback-success').classList.remove('show');
  document.getElementById('feedback-modal').classList.add('show');
}
function closeFeedback() {
  document.getElementById('feedback-modal').classList.remove('show');
  state.selectedRating = null;
  document.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('selected'));
  document.querySelectorAll('.diff-tag').forEach(t => t.classList.remove('selected'));
  document.getElementById('feedback-text').value = '';
}
function selectRating(el, val) { document.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('selected')); el.classList.add('selected'); state.selectedRating = val; }
function toggleTag(el) { el.classList.toggle('selected'); }

async function submitFeedback() {
  if (!state.selectedRating) { showToast('Selecione uma avaliação!'); return; }
  const difficulties = Array.from(document.querySelectorAll('.diff-tag.selected')).map(t => t.textContent);
  const text  = document.getElementById('feedback-text').value.trim();
  const emojis = ['', '😞', '😐', '🙂', '😄', '🤩'];
  const fb    = { rating: state.selectedRating, emoji: emojis[state.selectedRating], difficulties, text, time: new Date().toLocaleString('pt-BR') };
  state.feedbacks.push(fb); renderFeedbacksList();
  try { await fetch('https://formspree.io/f/mnjlezpj', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ avaliacao: fb.rating + '/5 ' + fb.emoji, dificuldades: difficulties.join(', ') || 'Nenhuma', comentario: text || 'Sem comentário', horario: fb.time }) }); } catch(e) {}
  document.getElementById('feedback-form-area').style.display = 'none';
  document.getElementById('feedback-success').classList.add('show');
}

function renderFeedbacksList() {
  const list = document.getElementById('feedbacks-list'); if (!list) return; list.innerHTML = '';
  if (!state.feedbacks.length) { list.innerHTML = '<div class="empty-state" style="padding:20px 0"><div class="empty-icon">🗂️</div><p>Nenhum feedback ainda.</p></div>'; return; }
  state.feedbacks.slice().reverse().forEach(fb => {
    const item = document.createElement('div'); item.className = 'history-item'; item.style.cssText = 'padding:14px 0;align-items:flex-start;';
    item.innerHTML = `<div style="font-size:22px">${fb.emoji}</div><div style="flex:1"><div style="font-weight:700;font-size:14px;color:var(--sky)">${'★'.repeat(fb.rating)}</div>${fb.text ? '<div style="font-size:13px;color:var(--text);margin-top:4px">"' + fb.text + '"</div>' : ''}<div style="font-size:11px;color:var(--muted);margin-top:4px">${fb.time}</div></div>`;
    list.appendChild(item);
  });
}

// ══════════════════════════════════════════
// FIX 7 — PIN DO MODO CRIANÇA
// ══════════════════════════════════════════
let _pinBuffer    = '';
let _pinCallback  = null;
let _pinMode      = 'verify'; // 'set' | 'verify'

function _storageGet(key) { try { return localStorage.getItem(key); } catch(e) { return null; } }
function _storageSet(key, val) { try { localStorage.setItem(key, val); } catch(e) {} }

function getPin() { return _storageGet(PIN_KEY); }
function setPin(pin) { _storageSet(PIN_KEY, pin); }

function abrirPinModal(mode, onSuccess) {
  _pinBuffer   = '';
  _pinMode     = mode;
  _pinCallback = onSuccess;
  document.getElementById('pin-error').textContent = '';
  _renderPinDots();
  const title = mode === 'set' ? 'Criar PIN do responsável' : 'PIN do responsável';
  const sub   = mode === 'set'
    ? 'Defina um PIN de 4 dígitos para proteger a área do responsável.'
    : 'Digite o PIN para voltar à área do responsável.';
  document.getElementById('pin-title').textContent = title;
  document.getElementById('pin-sub').textContent   = sub;
  document.getElementById('pin-cancel-btn').style.display = mode === 'set' ? 'none' : '';
  document.getElementById('pin-overlay').classList.add('show');
}
function fecharPinModal() { document.getElementById('pin-overlay').classList.remove('show'); _pinBuffer = ''; }

function _renderPinDots() {
  document.querySelectorAll('.pin-dot').forEach((dot, i) => {
    dot.classList.toggle('filled', i < _pinBuffer.length);
  });
}

function pinKey(val) {
  const err = document.getElementById('pin-error');
  if (val === 'del') {
    _pinBuffer = _pinBuffer.slice(0, -1);
    _renderPinDots(); return;
  }
  if (_pinBuffer.length >= 4) return;
  _pinBuffer += val;
  _renderPinDots();
  if (_pinBuffer.length === 4) {
    setTimeout(() => {
      if (_pinMode === 'set') {
        setPin(_pinBuffer);
        fecharPinModal();
        if (_pinCallback) _pinCallback();
      } else {
        if (_pinBuffer === getPin()) {
          fecharPinModal();
          if (_pinCallback) _pinCallback();
        } else {
          // T7: limpa input e dots após erro — não permite tentativa acumulada
          _pinBuffer = '';
          _renderPinDots();
          err.textContent = 'PIN incorreto. Tente novamente.';
        }
      }
    }, 120);
  }
}

function confirmarSaidaCrianca() {
  const pin = getPin();
  if (!pin) {
    // Primeira vez: define o PIN
    abrirPinModal('set', () => devolverAoResponsavel());
  } else {
    abrirPinModal('verify', () => devolverAoResponsavel());
  }
}

// ── CHILD LOGIN ──
function switchLoginTab(tab) {
  const isResp = tab === 'responsavel';
  document.getElementById('ltab-resp').classList.toggle('active', isResp);
  document.getElementById('ltab-child').classList.toggle('active', !isResp);
  document.getElementById('login-panel-responsavel').style.display = isResp ? 'block' : 'none';
  document.getElementById('login-panel-crianca').style.display     = isResp ? 'none' : 'block';
}

async function entrarComCodigo() {
  const code  = document.getElementById('child-invite-code').value.trim().toUpperCase();
  const err   = document.getElementById('child-code-error');
  if (!code || code.length < 4) { err.classList.add('show'); err.textContent = 'Digite o código de convite.'; return; }
  err.classList.remove('show');
  showToast('Verificando código… ⏳');
  const { data, error } = await db.from('invite_codes').select('*').eq('code', code).maybeSingle();
  if (error || !data) { err.classList.add('show'); err.textContent = 'Código inválido. Peça um novo ao responsável.'; return; }
  showToast('Código válido! Carregando… ⏳');
  await acessarComoCrianca(data.parent_id, data.child_id);
}

async function acessarComoCrianca(parentId, childId) {
  await carregarFilhos(parentId);
  const childIdx = state.profiles.findIndex(p => p.id === childId);
  if (childIdx < 0) { showToast('Criança não encontrada.'); return; }
  state.currentChild  = childIdx;
  state.childSession  = { parentId, childId };
  state.isChildMode   = true;
  // FIX 10 — chave versionada + tratamento de erro
  try { _storageSet(STORAGE_KEY, JSON.stringify({ parentId, childId, childName: state.profiles[childIdx].name, ts: Date.now() })); sessionStorage.setItem('elo_role', 'child'); } catch(e) {}
  if (typeof ativarTemaAventura === 'function') ativarTemaAventura();
  await carregarTarefas(childId, childIdx);
  renderChildHome();
  if (typeof renderStreakUI === 'function') renderStreakUI(calcularStreak(state.tasks[childIdx] || []));
  navTo('screen-child-home');
  showToast('Bem-vindo(a), ' + state.profiles[childIdx].name + '! 🎮');
}

// ── REWARDS MANAGEMENT ──
let emojiRecompensaSelecionado = '🎁';
function selecionarEmojiRecompensa(el, emoji) {
  emojiRecompensaSelecionado = emoji;
  document.querySelectorAll('.rew-emoji-opt').forEach(e => e.classList.remove('selected'));
  el.classList.add('selected');
}
function abrirRewardsMgmt() { renderRewardsMgmtList(); document.getElementById('modal-rewards-mgmt').classList.add('show'); }
function fecharRewardsMgmt() { document.getElementById('modal-rewards-mgmt').classList.remove('show'); }
function renderRewardsMgmtList() {
  const list = document.getElementById('rewards-mgmt-list'); list.innerHTML = '';
  if (!state.rewards.length) { list.innerHTML = '<div class="empty-state" style="padding:16px 0"><div class="empty-icon">🎁</div><p>Nenhuma recompensa</p></div>'; return; }
  state.rewards.forEach((r, i) => {
    const item = document.createElement('div'); item.style.cssText = 'display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid rgba(45,42,110,.5);';
    item.innerHTML = `<div style="font-size:28px">${r.emoji}</div><div style="flex:1"><div style="font-weight:800;font-size:14px;color:var(--text)">${r.name}</div><div style="font-size:12px;color:var(--gold)">⭐ ${r.cost} estrelas</div></div><button data-remover-recompensa="${i}" onclick="removerRecompensa(${i})" style="background:rgba(239,68,68,.12);border:1.5px solid var(--red);color:var(--red);padding:6px 12px;border-radius:8px;font-family:Nunito,sans-serif;font-weight:800;font-size:12px;cursor:pointer;">🗑️</button>`;
    list.appendChild(item);
  });
}
function adicionarRecompensa() {
  const name = document.getElementById('new-reward-name').value.trim();
  const cost = parseInt(document.getElementById('new-reward-cost').value);
  if (!name) { showToast('Digite o nome!'); return; }
  if (!cost || cost < 1) { showToast('Custo inválido!'); return; }
  state.rewards.push({ id: Date.now(), name, cost, emoji: emojiRecompensaSelecionado });
  document.getElementById('new-reward-name').value  = '';
  document.getElementById('new-reward-cost').value  = '10';
  emojiRecompensaSelecionado = '🎁';
  document.querySelectorAll('.rew-emoji-opt').forEach(e => e.classList.remove('selected'));
  const first = document.querySelector('.rew-emoji-opt'); if (first) first.classList.add('selected');
  renderRewardsMgmtList();
  showToast('"' + name + '" adicionada! 🎁'); // FIX 11
  // ONBOARDING: recompensa criada = passo 6 concluído (numeração atualizada: novo passo 5 intercalado)
  if (typeof obAvancar === 'function') obAvancar(6);
}
// removerRecompensa: confirmação inline no botão — sem confirm() nativo.
// Mesmo padrão de excluirFilho: botão muta para "Confirmar remoção" e volta em 4s.
let _removerRecompensaTimer = null;
function removerRecompensa(i) {
  const btn = document.querySelector(`[data-remover-recompensa="${i}"]`);

  if (!btn || !btn.classList.contains('btn-confirming')) {
    if (btn) {
      btn.classList.add('btn-confirming');
      btn._origText = btn.textContent;
      btn.textContent = 'Confirmar remoção';
      clearTimeout(_removerRecompensaTimer);
      _removerRecompensaTimer = setTimeout(() => {
        btn.classList.remove('btn-confirming');
        btn.textContent = btn._origText || '🗑️';
      }, 4000);
    }
    return;
  }

  clearTimeout(_removerRecompensaTimer);
  state.rewards.splice(i, 1);
  renderRewardsMgmtList();
  showToast('Recompensa removida.');
}

// ── GERENCIAR FILHOS ──
let emojiEditSelecionado = '👧';
function selectEmojiEdit(el, emoji) {
  emojiEditSelecionado = emoji;
  document.getElementById('edit-selected-emoji').textContent = 'Selecionado: ' + emoji;
  document.querySelectorAll('#edit-emoji-grid .emoji-pick').forEach(e => e.classList.remove('selected'));
  el.classList.add('selected');
}
function abrirGerenciarFilhos() { renderFilhosMgmtList(); document.getElementById('modal-filhos-mgmt').classList.add('show'); }
function fecharGerenciarFilhos() { document.getElementById('modal-filhos-mgmt').classList.remove('show'); }
function fecharEditarFilho() { document.getElementById('modal-edit-child').classList.remove('show'); }

function renderFilhosMgmtList() {
  const list = document.getElementById('filhos-mgmt-list'); list.innerHTML = '';
  if (!state.profiles.length) {
    // FIX 9 — empty state completo
    list.innerHTML = '<div class="empty-v2"><div class="e2-art">👶</div><div class="e2-title">Nenhum filho cadastrado</div><div class="e2-sub">Adicione o primeiro filho para começar a criar missões de rotina.</div><button class="btn btn-primary" style="max-width:220px;margin:0 auto" onclick="fecharGerenciarFilhos();abrirModalFilho()">Adicionar filho</button></div>';
    return;
  }
  state.profiles.forEach((p, i) => {
    const item = document.createElement('div'); item.style.cssText = 'display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid rgba(45,42,110,.5);';
    item.innerHTML = `<div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#a855f7);display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0">${p.emoji}</div><div style="flex:1"><div style="font-weight:800;font-size:15px;color:var(--text)">${p.name}</div><div style="font-size:12px;color:var(--muted)">${p.age} anos · ⭐ ${p.stars || 0} estrelas</div></div><div style="display:flex;gap:6px"><button onclick="abrirEditarFilho(${i})" style="background:rgba(34,211,238,.1);border:1.5px solid var(--sky);color:var(--sky);padding:7px 12px;border-radius:8px;font-family:Nunito,sans-serif;font-weight:800;font-size:12px;cursor:pointer">✏️</button><button data-excluir-filho="${i}" onclick="excluirFilho(${i})" style="background:rgba(239,68,68,.1);border:1.5px solid var(--red);color:var(--red);padding:7px 12px;border-radius:8px;font-family:Nunito,sans-serif;font-weight:800;font-size:12px;cursor:pointer">🗑️</button></div>`;
    list.appendChild(item);
  });
}

function abrirEditarFilho(i) {
  const p = state.profiles[i];
  document.getElementById('edit-child-id').value   = p.id;
  document.getElementById('edit-child-name').value = p.name;
  document.getElementById('edit-child-age').value  = p.age;
  emojiEditSelecionado = p.emoji;
  document.getElementById('edit-selected-emoji').textContent = 'Selecionado: ' + p.emoji;
  document.querySelectorAll('#edit-emoji-grid .emoji-pick').forEach(e => e.classList.toggle('selected', e.textContent.trim() === p.emoji));
  document.getElementById('modal-edit-child').classList.add('show');
}
async function salvarEdicaoFilho() {
  const id    = document.getElementById('edit-child-id').value;
  const nome  = document.getElementById('edit-child-name').value.trim();
  const idade = parseInt(document.getElementById('edit-child-age').value);
  if (!nome || !idade) { showToast('Preencha nome e idade!'); return; }
  showToast('Salvando… ⏳');
  const { error } = await db.from('children').update({ name: nome, age: idade, emoji: emojiEditSelecionado }).eq('id', id);
  if (error) { showToast('Erro ao salvar.'); console.error(error); return; }
  const idx = state.profiles.findIndex(p => p.id === id);
  if (idx >= 0) { state.profiles[idx].name = nome; state.profiles[idx].age = idade; state.profiles[idx].emoji = emojiEditSelecionado; }
  fecharEditarFilho(); renderFilhosMgmtList(); renderProfiles();
  showToast(nome + ' atualizado! ✅'); // FIX 11
}
// excluirFilho: confirmação inline — o botão muta para "Confirmar exclusão".
// Sem double-tap oculto. Sem confirm() nativo. O usuário vê claramente o que vai acontecer.
// Timer de 4s restaura o botão caso o usuário desista.
let _excluirFilhoTimer = null;

async function excluirFilho(i) {
  const p = state.profiles[i]; if (!p) return;
  const btn = document.querySelector(`[data-excluir-filho="${i}"]`);

  // Primeiro clique: botão entra em modo de confirmação
  if (!btn || !btn.classList.contains('btn-confirming')) {
    if (btn) {
      btn.classList.add('btn-confirming');
      btn._origText = btn.textContent;
      btn.textContent = 'Confirmar exclusão';
      // Restaura automaticamente se não confirmar em 4s
      clearTimeout(_excluirFilhoTimer);
      _excluirFilhoTimer = setTimeout(() => {
        btn.classList.remove('btn-confirming');
        btn.textContent = btn._origText || '🗑️';
      }, 4000);
    }
    return;
  }

  // Segundo clique no botão já em modo confirming: executa
  clearTimeout(_excluirFilhoTimer);
  if (btn) { btn.classList.remove('btn-confirming'); btn.disabled = true; btn.textContent = 'Excluindo...'; }
  const { error } = await db.from('children').delete().eq('id', p.id);
  if (error) {
    if (btn) { btn.disabled = false; btn.textContent = btn._origText || '🗑️'; }
    showToast('Não foi possível excluir. Tente novamente.');
    console.error(error); return;
  }
  state.profiles.splice(i, 1); state.tasks.splice(i, 1);
  renderFilhosMgmtList(); renderProfiles();
  showToast(p.name + ' removido(a) com sucesso.');
}

// ── TOAST ──
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ── KEYBOARD ──
document.addEventListener('keydown', e => {
  if (e.key === 'Enter')  { const active = document.querySelector('.screen.active')?.id; if (active === 'screen-login') doLogin(); if (active === 'screen-register') doRegister(); }
  if (e.key === 'Escape') { closeFeedback(); closeReward(); fecharModalFilho(); fecharModalTarefas(); fecharPinModal(); }
});

// ── INIT ──
db.auth.getSession().then(async ({ data }) => {
  if (data.session) {
    showToast('Sessão ativa, carregando… ⏳');
    await carregarContextoUsuario(data.session.user);
    await carregarTodasTarefas();
    renderParentDashboard();
    navTo('screen-parent');
    return;
  }
  // FIX 10 — chave versionada
  try {
    const saved = _storageGet(STORAGE_KEY);
    if (saved) {
      const sess = JSON.parse(saved);
      const dias = (Date.now() - sess.ts) / (1000 * 60 * 60 * 24);
      if (dias < 90 && sess.parentId && sess.childId) {
        showToast('Olá de novo, ' + sess.childName + '! 🎮');
        await acessarComoCrianca(sess.parentId, sess.childId);
        return;
      } else { _storageSet(STORAGE_KEY, null); }
    }
  } catch(e) {}
});

function sairComoCrianca() {
  try { _storageSet(STORAGE_KEY, null); sessionStorage.removeItem('elo_role'); } catch(e) {}
  state.currentChild = null; state.childSession = null; state.isChildMode = false;
  state.profiles = []; state.tasks = [];
  if (typeof desativarTemaAventura === 'function') desativarTemaAventura();
  navTo('screen-login');
}

// ══════════════════════════════════════════
// ONBOARDING
// ══════════════════════════════════════════
// verificarOnboarding: substituído pelo onboarding por ação em js/onboarding.js.
// Mantido como stub para não quebrar a chamada em renderParentDashboard.
function verificarOnboarding() {
  // Delegado para obRenderBanner() em onboarding.js
  if (typeof obRenderBanner === 'function') obRenderBanner();
}
// onboardingNext: stub de compatibilidade — modal legado desativado no HTML.
function onboardingNext() {}

// ══════════════════════════════════════════
// FIX 6 — ABAS DO PAINEL (unificadas)
// ══════════════════════════════════════════
let _parentTabAtual = 'hoje';
function switchParentTab(tab) {
  _parentTabAtual = tab;
  document.querySelectorAll('.parent-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.parent-tab-pane').forEach(p => p.classList.remove('active'));
  const pane = document.getElementById('pane-' + tab); if (pane) pane.classList.add('active');
  if (tab === 'filhos')      renderFilhosNaAba();
  if (tab === 'recompensas') renderRecompensasNaAba();
  if (tab === 'aprovar')     renderAprovacoes();
}

function renderAprovacoes() {
  const aList = document.getElementById('approval-list'); if (!aList) return; aList.innerHTML = '';
  if (!state.pendingApprovals.length) {
    // FIX 9 — empty state completo
    aList.innerHTML = '<div class="empty-v2"><div class="e2-art">✅</div><div class="e2-title">Nenhum pedido pendente</div><div class="e2-sub">Quando uma criança solicitar uma recompensa, o pedido aparece aqui para você aprovar ou recusar.</div></div>';
    return;
  }
  state.pendingApprovals.forEach((a, i) => {
    const card = document.createElement('div'); card.className = 'approval-card';
    card.innerHTML = `<div style="font-size:28px">${a.emoji}</div><div class="approval-info"><div class="approval-name">${a.reward}</div><div class="approval-child">${a.child} · ⭐ ${a.cost}</div></div><div class="approval-actions"><button style="background:var(--green);color:#fff;" onclick="approveReward(${i})">✓ Aprovar</button><button style="background:var(--red);color:#fff;" onclick="rejectReward(${i})">✗</button></div>`;
    aList.appendChild(card);
  });
}

function renderFilhosNaAba() {
  const wrap = document.getElementById('filhos-lista-painel'); if (!wrap) return; wrap.innerHTML = '';
  if (!state.profiles.length) {
    // FIX 9
    wrap.innerHTML = '<div class="empty-v2"><div class="e2-art">👶</div><div class="e2-title">Nenhum filho cadastrado</div><div class="e2-sub">Adicione o primeiro filho para começar a criar missões de rotina.</div><button class="btn btn-primary" style="max-width:220px;margin:0 auto" onclick="abrirModalFilho()">Adicionar filho</button></div>';
    return;
  }
  state.profiles.forEach((p, i) => {
    const tasks = state.tasks[i] || [];
    const ativas = tasks.filter(tarefaAtivaHoje);
    const done   = ativas.filter(tarefaDoneHoje).length;
    const pct    = ativas.length ? Math.round(done / ativas.length * 100) : 0;
    const item   = document.createElement('div'); item.style.cssText = 'display:flex;align-items:center;gap:14px;background:var(--card);border:1.5px solid var(--border);border-radius:16px;padding:13px 15px;margin-bottom:8px;';
    item.innerHTML = `<div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#a855f7);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">${p.emoji}</div><div style="flex:1"><div style="font-weight:800;font-size:14px;color:var(--text)">${p.name}</div><div style="font-size:11px;color:var(--muted)">${p.age} anos · ⭐ ${p.stars || 0} estrelas</div><div style="background:rgba(255,255,255,.06);border-radius:4px;height:3px;margin-top:5px;overflow:hidden"><div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--sky),var(--purple));border-radius:4px"></div></div><div style="font-size:10px;color:var(--muted);margin-top:2px">${done}/${ativas.length} missões hoje</div></div><button onclick="convidarCriancaIdx(${i})" style="background:rgba(34,211,238,.08);border:1.5px solid rgba(34,211,238,.3);color:var(--sky);padding:6px 10px;border-radius:8px;font-size:11px;font-weight:800;cursor:pointer">✉️</button>`;
    wrap.appendChild(item);
  });
}

function renderRecompensasNaAba() {
  const wrap = document.getElementById('rewards-painel-lista'); if (!wrap) return; wrap.innerHTML = '';
  if (!state.rewards.length) {
    // FIX 9
    wrap.innerHTML = '<div class="empty-v2"><div class="e2-art">🎁</div><div class="e2-title">Nenhuma recompensa definida</div><div class="e2-sub">Crie recompensas para motivar as crianças a concluir as missões.</div><button class="btn btn-primary" style="max-width:220px;margin:0 auto" onclick="abrirRewardsMgmt()">Criar recompensa</button></div>';
    return;
  }
  state.rewards.forEach(r => {
    const item = document.createElement('div'); item.style.cssText = 'display:flex;align-items:center;gap:12px;background:var(--card);border:1.5px solid var(--border);border-radius:12px;padding:12px 14px;';
    item.innerHTML = `<div style="font-size:26px">${r.emoji}</div><div style="flex:1"><div style="font-weight:800;font-size:13px;color:var(--text)">${r.name}</div><div style="font-size:11px;color:var(--gold)">⭐ ${r.cost} estrelas</div></div>`;
    wrap.appendChild(item);
  });
}

async function convidarCriancaIdx(childIdx) {
  const child = state.profiles[childIdx]; if (!child) return;
  const code  = 'ELO-' + Math.random().toString(36).slice(2, 7).toUpperCase();
  showToast('Gerando código… ⏳');
  const { error } = await db.from('invite_codes').insert({ code, parent_id: state.currentUserId, child_id: child.id, used: false });
  if (error) { showToast('Erro ao gerar código.'); return; }
  document.getElementById('convite-code-display').textContent = code;
  document.getElementById('convite-child-name').textContent   = '👶 Criança: ' + child.name;
  document.getElementById('modal-convite').classList.add('show');
}

// ── RESUMO SEMANAL ──
// ── HOME GAMIFICADA ───────────────────────────────────────────
// Substitui renderResumoSemanal. Três funções independentes:
// renderHomeHoje, renderHomeSemana, renderHomeMeta.
// Chamadas por renderParentDashboard após qualquer atualização de estado.

// ── UTILITÁRIOS DE CÁLCULO ────────────────────────────────────
function calcularMissoesHoje() {
  const allTasks  = state.tasks.flat();
  const ativas    = allTasks.filter(tarefaAtivaHoje);
  const concluidas= ativas.filter(tarefaDoneHoje);
  const proxima   = ativas.find(t => !tarefaDoneHoje(t));
  return { total: ativas.length, done: concluidas.length, proxima };
}

function calcularDadosSemana() {
  const hoje  = new Date();
  const dias  = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const semana = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(hoje); d.setDate(hoje.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    semana.push({ key, label: dias[d.getDay()], count: 0, isHoje: i === 0, isFuturo: i < 0, esperadoDia: 0 });
  }
  // isFuturo real: slots gerados vão de i=6 (mais antigo) até i=0 (hoje), nenhum é futuro
  // mas a janela de 7 dias vai do passado até hoje. Dias após hoje não estão no array.
  // Marcamos isFuturo como false para todos (correto: array só tem passado + hoje).

  let totalSemana = 0;
  state.tasks.flat().forEach(t => {
    (t.completion_dates || []).forEach(dt => {
      const slot = semana.find(s => s.key === dt);
      if (slot) { slot.count++; totalSemana++; }
    });
    if (t.done_date) {
      const slot = semana.find(s => s.key === t.done_date);
      if (slot && !(t.completion_dates || []).includes(t.done_date)) { slot.count++; totalSemana++; }
    }
  });

  // Streak: dias consecutivos com ao menos 1 missão (regressivo a partir de hoje)
  let streak = 0;
  for (let i = semana.length - 1; i >= 0; i--) {
    if (semana[i].count > 0) streak++;
    else break;
  }

  // Total esperado na semana + esperado por dia
  const dayNames = ['dom','seg','ter','qua','qui','sex','sab'];
  let esperado = 0;
  state.tasks.flat().forEach(t => {
    if (!t.recorrente) {
      // Tarefa única: conta 1 no total e adiciona ao dia de hoje (estimativa)
      esperado += 1;
      const slotHoje = semana.find(s => s.isHoje);
      if (slotHoje) slotHoje.esperadoDia += 1;
      return;
    }
    semana.forEach(slot => {
      const slotDay = dayNames[new Date(slot.key + 'T12:00:00').getDay()];
      const previsto = !t.dias_semana || !t.dias_semana.length
        ? true
        : t.dias_semana.includes(slotDay);
      if (previsto) { esperado++; slot.esperadoDia++; }
    });
  });

  const pct = esperado > 0 ? Math.min(100, Math.round(totalSemana / esperado * 100)) : 0;
  return { semana, totalSemana, esperado, pct, streak };
}

// ── ALTERNÂNCIA DIA / SEMANA no card de progresso ────────────
let _progressoTab = 'dia'; // 'dia' | 'semana'

function switchProgressoTab(tab) {
  _progressoTab = tab;

  // Atualiza estado visual dos botões
  document.getElementById('ptab-dia')   ?.classList.toggle('active', tab === 'dia');
  document.getElementById('ptab-semana')?.classList.toggle('active', tab === 'semana');

  // Mostra / oculta os painéis
  const hojeEl   = document.getElementById('hoje-body');
  const semanaEl = document.getElementById('semana-body');
  if (hojeEl)   hojeEl.style.display   = tab === 'dia'    ? '' : 'none';
  if (semanaEl) semanaEl.style.display  = tab === 'semana' ? '' : 'none';

  // Renderiza o conteúdo da aba selecionada
  if (tab === 'dia')    renderHomeHoje();
  if (tab === 'semana') renderHomeSemana();
}

// Renderiza a aba que estiver ativa (chamada pelo dashboard ao atualizar dados)
function renderProgressoTabAtual() {
  if (_progressoTab === 'semana') renderHomeSemana();
  else renderHomeHoje();
}

// ── VER MISSÕES (botão do card Hoje) ─────────────────────────
// Se há um filho: entra direto no modo criança.
// Se há múltiplos: rola para a seção "Passar o celular para".
function obVerMissoes() {
  if (!state.profiles.length) return;
  if (state.profiles.length === 1) {
    passarParaCrianca(0);
  } else {
    // Rola suavemente até a seção de cards de filhos
    const el = document.getElementById('label-passar-celular');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// ── CARD HOJE ─────────────────────────────────────────────────
function renderHomeHoje() {
  const el = document.getElementById('hoje-body');
  if (!el) return;

  if (!state.profiles.length) {
    el.innerHTML = '<div class="hoje-vazia">Adicione um filho para ver o progresso de hoje.</div>';
    return;
  }

  const { total, done, proxima } = calcularMissoesHoje();
  const { streak } = calcularDadosSemana();

  if (total === 0) {
    el.innerHTML = `
      <div class="hoje-vazia">Nenhuma missão programada para hoje.</div>
      <button class="btn btn-primary" style="margin-top:10px;padding:9px 16px;font-size:13px" onclick="abrirModalTarefas()">
        + Criar missão
      </button>`;
    return;
  }

  const pct      = Math.round(done / total * 100);
  const completo = done === total;

  // Próxima missão ou mensagem de conclusão
  let proximaHtml = '';
  if (completo) {
    proximaHtml = `<div class="hoje-completo">🎉 Todas as missões de hoje concluídas!</div>`;
  } else if (proxima) {
    const icon = proxima.icon || iconParaTarefa(proxima.name);
    proximaHtml = `
      <div style="font-size:11px;font-weight:700;color:var(--muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:.4px">Próxima missão</div>
      <div class="proxima-missao">
        <span class="proxima-missao-icon">${icon}</span>
        <span class="proxima-missao-name">${proxima.name}</span>
        <span class="proxima-missao-stars">${'⭐'.repeat(Math.min(proxima.stars,3))} ${proxima.stars}</span>
      </div>`;
  }

  // Streak — mesmo dado exibido na visão Semana, aqui em formato compacto
  const streakHtml = `<div class="semana-streak-row" style="margin-top:12px">
    🔥 Sequência atual: <strong>${streak}</strong> dia${streak !== 1 ? 's' : ''}
  </div>`;

  el.innerHTML = `
    <div class="hoje-count">${done} <span>de ${total} missões</span></div>
    <div class="hoje-progress-bar">
      <div class="hoje-progress-fill ${completo ? 'completo' : ''}" style="width:${pct}%"></div>
    </div>
    ${proximaHtml}
    ${streakHtml}`;
}

// ── CARD SEMANA ───────────────────────────────────────────────
function renderHomeSemana() {
  const el = document.getElementById('semana-body');
  if (!el) return;

  // Estado vazio: sem filho
  if (!state.profiles.length) {
    el.innerHTML = '<div class="hoje-vazia">Adicione um filho para acompanhar o progresso.</div>';
    return;
  }

  const { semana, totalSemana, esperado, pct, streak } = calcularDadosSemana();

  // Estado vazio: sem missões criadas
  if (esperado === 0) {
    el.innerHTML = `
      <div class="hoje-vazia">Nenhuma missão criada ainda. Crie a primeira missão para começar o progresso.</div>
      <button class="btn btn-primary" style="margin-top:10px;padding:9px 16px;font-size:13px" onclick="abrirModalTarefas()">+ Criar missão</button>`;
    return;
  }

  // 1. Barra geral da semana
  const geralHtml = `
    <div class="semana-header">
      <span class="semana-total">${totalSemana}</span>
      <span class="semana-label">de ${esperado} missões concluídas</span>
      <span class="semana-pct">${pct}%</span>
    </div>
    <div class="semana-progress-bar" style="margin-bottom:14px">
      <div class="semana-progress-fill" style="width:${pct}%"></div>
    </div>`;

  // 2. Barras por dia
  // Todos os slots nessa janela são passados ou hoje (não há futuro no array de 7 dias).
  // Usamos isHoje para identificar o dia atual; slots com index > todayIdx não existem nesse array.
  const todayIdx = semana.findIndex(s => s.isHoje);

  const diasHtml = semana.map((s, i) => {
    const isFuturo = i > todayIdx; // não ocorre nessa lógica mas protege contra mudança futura

    if (isFuturo || s.esperadoDia === 0) {
      // Dia futuro ou sem missão prevista
      const cor = 'color:var(--muted);opacity:.45';
      return `<div class="semana-dia-row">
        <span class="semana-dia-row-label" style="${s.isHoje ? 'color:var(--text);font-weight:800' : cor}">${s.label}</span>
        <span class="semana-dia-row-bar-wrap" style="opacity:.3">
          <span class="semana-dia-row-bar-fill" style="width:0%"></span>
        </span>
        <span class="semana-dia-row-count" style="${cor}">—</span>
      </div>`;
    }

    const diaPct  = Math.min(100, Math.round(s.count / s.esperadoDia * 100));
    const diaFill = s.count >= s.esperadoDia ? 'var(--green)' : s.count > 0 ? 'var(--gold)' : 'rgba(255,255,255,.12)';
    const labelStyle = s.isHoje ? 'color:var(--text);font-weight:800' : 'color:var(--muted)';

    return `<div class="semana-dia-row">
      <span class="semana-dia-row-label" style="${labelStyle}">${s.label}</span>
      <span class="semana-dia-row-bar-wrap">
        <span class="semana-dia-row-bar-fill" style="width:${diaPct}%;background:${diaFill}"></span>
      </span>
      <span class="semana-dia-row-count" style="${s.isHoje ? 'color:var(--text);font-weight:800' : 'color:var(--muted)'}">${s.count}/${s.esperadoDia}</span>
    </div>`;
  }).join('');

  // 3. Streak
  const streakHtml = `<div class="semana-streak-row">
    🔥 Sequência atual: <strong>${streak}</strong> dia${streak !== 1 ? 's' : ''}
  </div>`;

  // Mensagem de ação quando não há nada concluído ainda
  const textoVazioHtml = totalSemana === 0
    ? `<div style="font-size:12px;color:var(--muted);margin-bottom:10px">Nenhuma missão concluída ainda. Comece hoje para iniciar o progresso.</div>`
    : '';

  el.innerHTML = `${geralHtml}${textoVazioHtml}<div class="semana-dias-lista">${diasHtml}</div>${streakHtml}`;
}

// ── CARD META ─────────────────────────────────────────────────
// Exibe apenas quando houver uma meta semanal configurada explicitamente.
// Por enquanto, sem campo de meta configurável no app, o card fica oculto.
// Quando state.weeklyGoal for implementado, este bloco será ativado.
function renderHomeMeta() {
  const cardEl = document.getElementById('card-meta');
  if (!cardEl) return;
  // Sem meta configurada → oculta o card para não exibir recompensa aleatória
  cardEl.style.display = 'none';
}

// ── PREVIEW DE ESTRELAS no modal de missão ───────────────────
// Mostra apenas as estrelas — tipos adicionais de recompensa
// foram removidos pois não são persistidos no Supabase ainda.
function renderRewardPreview() {
  const starsEl = document.getElementById('rp-stars');
  if (!starsEl) return;
  const s = selectedStarsFabVal;
  starsEl.textContent = s >= 5
    ? '🌟 ' + s + ' estrelas'
    : '⭐'.repeat(s) + ' ' + s + ' estrela' + (s > 1 ? 's' : '');
}

// ── STUB: renderResumoSemanal mantido para compatibilidade ────
// Pode ser chamado por código antigo. Delega para renderHomeSemana.
async function renderResumoSemanal() {
  renderHomeSemana();
}

function devolverAoResponsavel() {
  db.auth.getSession().then(async ({ data }) => {
    if (data.session) {
      try { _storageSet(STORAGE_KEY, null); sessionStorage.removeItem('elo_role'); } catch(e) {}
      state.currentChild = null; state.childSession = null; state.isChildMode = false;
      if (typeof desativarTemaAventura === 'function') desativarTemaAventura();
      showToast('Voltando ao painel… 👋');
      await carregarContextoUsuario(data.session.user);
      await carregarTodasTarefas();
      renderParentDashboard();
      navTo('screen-parent');
    } else { sairComoCrianca(); }
  });
}

async function passarParaCrianca(childIdx) {
  const child = state.profiles[childIdx]; if (!child) return;
  // Ajuste 6: removido confirm() nativo — bloqueava UI e era visualmente inconsistente.
  // A intenção fica clara pelo botão "▶" no card do filho.
  state.currentChild = childIdx;
  state.childSession = { parentId: state.currentUserId, childId: child.id };
  state.isChildMode  = true;
  try {
    _storageSet(STORAGE_KEY, JSON.stringify({ parentId: state.currentUserId, childId: child.id, childName: child.name, ts: Date.now() }));
    sessionStorage.setItem('elo_role', 'child');
  } catch(e) {}
  if (typeof ativarTemaAventura === 'function') ativarTemaAventura();
  showToast('Vai lá, ' + child.name + '! 🚀');
  await carregarTarefas(child.id, childIdx);
  renderChildHome();
  if (typeof renderStreakUI === 'function') renderStreakUI(calcularStreak(state.tasks[childIdx] || []));
  navTo('screen-child-home');
  // ONBOARDING: entrou no modo criança = passo 3 concluído, inicia passo 4
  if (typeof obAvancar === 'function') obAvancar(3);
}

function renderChildSwitchCards() {
  const wrap    = document.getElementById('child-switch-cards');
  const emptyEl = document.getElementById('parent-empty-state');
  if (!wrap) return;
  wrap.innerHTML = '';
  if (!state.profiles.length) {
    wrap.style.display = 'none';
    // FIX 9 — empty state completo
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }
  wrap.style.display = 'flex';
  if (emptyEl) emptyEl.style.display = 'none';
  state.profiles.forEach((p, i) => {
    const tasks  = state.tasks[i] || [];
    const ativas = tasks.filter(tarefaAtivaHoje);
    const done   = ativas.filter(tarefaDoneHoje).length;
    const pct    = ativas.length ? Math.round(done / ativas.length * 100) : 0;
    const card   = document.createElement('div'); card.style.cssText = 'display:flex;align-items:center;gap:14px;background:var(--card);border:1.5px solid rgba(45,42,110,.6);border-radius:16px;padding:14px 16px;cursor:pointer;transition:border-color .2s;';
    card.onmouseenter = () => card.style.borderColor = 'var(--primary)';
    card.onmouseleave = () => card.style.borderColor = 'rgba(45,42,110,.6)';
    card.innerHTML = `<div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#a855f7);display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0">${p.emoji}</div><div style="flex:1"><div style="font-weight:800;font-size:15px;color:var(--text)">${p.name}</div><div style="font-size:12px;color:var(--muted);margin-top:2px">${p.age} anos · ⭐ ${p.stars || 0} estrelas</div><div style="margin-top:6px;background:rgba(255,255,255,.06);border-radius:6px;height:4px;overflow:hidden"><div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--sky),var(--purple));border-radius:6px;transition:width .4s"></div></div><div style="font-size:11px;color:var(--muted);margin-top:3px">${done}/${ativas.length} missões hoje (${pct}%)</div></div><div style="font-size:22px">▶</div>`;
    card.onclick = () => passarParaCrianca(i);
    wrap.appendChild(card);
  });
}

function renderParentGreeting() {
  const greetEl = document.getElementById('parent-greeting-name');
  const dateEl  = document.getElementById('parent-greeting-date');
  if (!greetEl) return;
  const hora     = new Date().getHours();
  const saudacao = hora < 12 ? 'Bom dia ☀️' : hora < 18 ? 'Boa tarde 🌤️' : 'Boa noite 🌙';
  greetEl.textContent = saudacao + ' 👋';
  if (dateEl) { const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }); dateEl.textContent = hoje.charAt(0).toUpperCase() + hoje.slice(1); }
}

// trocarUsuario: mesmo padrão de confirmação inline do excluirFilho.
// O botão muta para "Confirmar saída" — sem double-tap invisível.
let _trocarUsuarioTimer = null;
function trocarUsuario() {
  const btn = document.getElementById('btn-logout-resp');

  if (!btn || !btn.classList.contains('btn-confirming')) {
    if (btn) {
      btn.classList.add('btn-confirming');
      btn._origText = btn.textContent;
      btn.textContent = 'Confirmar saída';
      clearTimeout(_trocarUsuarioTimer);
      _trocarUsuarioTimer = setTimeout(() => {
        btn.classList.remove('btn-confirming');
        btn.textContent = btn._origText || '↩ Trocar de perfil';
      }, 4000);
    }
    return;
  }

  clearTimeout(_trocarUsuarioTimer);
  sairComoCrianca();
}
function applyProfilesUi() {
  const btnAdmin  = document.getElementById('btn-admin');
  const btnLogout = document.getElementById('btn-logout-resp');
  if (state.isChildMode) {
    if (btnAdmin) btnAdmin.style.display = 'none';
    if (btnLogout) { btnLogout.textContent = '↩ Trocar de perfil'; btnLogout.onclick = trocarUsuario; }
  } else {
    if (btnAdmin)  btnAdmin.style.display  = isMaster() ? 'block' : 'none';
    if (btnLogout) { btnLogout.textContent = 'Sair da conta ↪'; btnLogout.onclick = doLogout; }
  }
}
