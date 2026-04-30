
// ══════════════════════════════════════════
// RECORRÊNCIA DE TAREFAS
// ══════════════════════════════════════════

function toggleDiasSemana() {
  const chk = document.getElementById('fab-recorrente');
  const wrap = document.getElementById('dias-semana-wrap');
  wrap.style.display = chk.checked ? 'block' : 'none';
}

function toggleDia(btn) {
  btn.classList.toggle('selected');
}

function getDiasSelecionados() {
  const btns = document.querySelectorAll('.dia-btn.selected');
  return Array.from(btns).map(b => b.dataset.dia);
}

function getDiaAtual() {
  const dias = ['dom','seg','ter','qua','qui','sex','sab'];
  return dias[new Date().getDay()];
}

function tarefaAtivaHoje(task) {
  if (!task.recorrente) return true; // tarefas únicas sempre aparecem
  if (!task.dias_semana || task.dias_semana.length === 0) return true;
  return task.dias_semana.includes(getDiaAtual());
}

function tarefaDoneHoje(task) {
  if (!task.done) return false;
  if (!task.done_date) return task.done;
  const hoje = new Date().toISOString().split('T')[0];
  return task.done_date === hoje;
}

async function resetTarefasRotina() {
  if (!confirm('Resetar todas as tarefas de rotina para "não feitas" hoje?')) return;
  showToast('Resetando rotina... ⏳');

  for (let ci = 0; ci < state.profiles.length; ci++) {
    const tasks = state.tasks[ci] || [];
    for (const task of tasks) {
      if (task.recorrente && task.done) {
        await db.from('tasks').update({ done: false, done_date: null }).eq('id', task.id);
        task.done = false;
        task.done_date = null;
      }
    }
  }

  showToast('Rotina resetada! ✅');
  renderParentDashboard();
}


// ══════════════════════════════════════════
// BIBLIOTECA DE TAREFAS
// ══════════════════════════════════════════
const BIBLIOTECA = [
  { nome: 'Escovar os dentes',    icon: '🪥', stars: 1, cat: 'higiene', time: '07:30' },
  { nome: 'Tomar banho',          icon: '🚿', stars: 2, cat: 'higiene', time: '18:00' },
  { nome: 'Lavar as mãos',        icon: '🧼', stars: 1, cat: 'higiene', time: '12:00' },
  { nome: 'Pentear o cabelo',     icon: '💇', stars: 1, cat: 'higiene', time: '07:45' },
  { nome: 'Fazer a lição',        icon: '📝', stars: 3, cat: 'escola',  time: '15:00' },
  { nome: 'Arrumar a mochila',    icon: '🎒', stars: 2, cat: 'escola',  time: '21:00' },
  { nome: 'Ler por 20 minutos',   icon: '📚', stars: 3, cat: 'escola',  time: '16:00' },
  { nome: 'Estudar para a prova', icon: '📖', stars: 5, cat: 'escola',  time: '15:30' },
  { nome: 'Arrumar o quarto',     icon: '🛏️', stars: 2, cat: 'casa',    time: '08:00' },
  { nome: 'Guardar brinquedos',   icon: '🧸', stars: 1, cat: 'casa',    time: '19:00' },
  { nome: 'Ajudar a mesa',        icon: '🍽️', stars: 2, cat: 'casa',    time: '12:00' },
  { nome: 'Varrer o quarto',      icon: '🧹', stars: 2, cat: 'casa',    time: '09:00' },
  { nome: 'Beber água',           icon: '💧', stars: 1, cat: 'saude',   time: '10:00' },
  { nome: 'Fazer exercício',      icon: '🏃', stars: 3, cat: 'saude',   time: '17:00' },
  { nome: 'Dormir cedo',          icon: '😴', stars: 2, cat: 'saude',   time: '21:00' },
  { nome: 'Comer frutas',         icon: '🍎', stars: 1, cat: 'saude',   time: '14:00' },
];

let selectedBibCards = [];
let selectedStarsFabVal = 2;
let selectedStarsLoteVal = 1;
let catAtual = 'todos';

function abrirModalTarefas() {
  // Populate selects with real children
  ['fab-task-child','fab-bib-child','fab-lote-child'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    sel.innerHTML = '';
    state.profiles.forEach((filho, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = filho.emoji + ' ' + filho.name;
      sel.appendChild(opt);
    });
  });
  renderBiblioteca('todos');
  document.getElementById('modal-tarefas').classList.add('show');
}

function fecharModalTarefas() {
  document.getElementById('modal-tarefas').classList.remove('show');
  selectedBibCards = [];
  document.getElementById('fab-task-name').value = '';
  document.getElementById('lote-text').value = '';
}

function switchTab(tab) {
  ['manual','biblioteca','lote'].forEach(t => {
    document.getElementById('tab-content-' + t).style.display = t === tab ? 'block' : 'none';
    document.getElementById('tab-' + t).classList.toggle('active', t === tab);
  });
}

function filterCat(el, cat) {
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  catAtual = cat;
  renderBiblioteca(cat);
}

function renderBiblioteca(cat) {
  const grid = document.getElementById('biblioteca-grid');
  grid.innerHTML = '';
  const filtered = cat === 'todos' ? BIBLIOTECA : BIBLIOTECA.filter(t => t.cat === cat);
  filtered.forEach((t, i) => {
    const card = document.createElement('div');
    card.className = 'bib-card' + (selectedBibCards.includes(t.nome) ? ' selected' : '');
    card.innerHTML = `<div class="bib-icon">${t.icon}</div><div class="bib-name">${t.nome}</div><div class="bib-stars">${'⭐'.repeat(Math.min(t.stars,3))} ${t.stars}★</div>`;
    card.onclick = () => toggleBibCard(card, t);
    grid.appendChild(card);
  });
}

function toggleBibCard(card, t) {
  const idx = selectedBibCards.indexOf(t.nome);
  if (idx >= 0) {
    selectedBibCards.splice(idx, 1);
    card.classList.remove('selected');
  } else {
    selectedBibCards.push(t.nome);
    card.classList.add('selected');
  }
}

async function adicionarSelecionadas() {
  const childIdx = parseInt(document.getElementById('fab-bib-child').value);
  const child = state.profiles[childIdx];
  if (!child) { showToast('Selecione uma criança!'); return; }
  if (selectedBibCards.length === 0) { showToast('Selecione ao menos uma tarefa!'); return; }

  showToast(`Criando ${selectedBibCards.length} tarefas... ⏳`);
  let criadas = 0;

  for (const nome of selectedBibCards) {
    const t = BIBLIOTECA.find(b => b.nome === nome);
    if (!t) continue;
    const { data, error } = await db.from('tasks').insert({
      child_id: child.id, parent_id: state.currentUserId,
      name: t.nome, time: t.time, stars: t.stars, icon: t.icon, done: false
    }).select().single();
    if (!error && data) {
      state.tasks[childIdx].push({ id: data.id, name: data.name, time: data.time, stars: data.stars, icon: data.icon, done: false });
      criadas++;
    }
  }

  state.metrics.tasksCreated += criadas;
  updateMetrics();
  fecharModalTarefas();
  renderParentDashboard();
  showToast(`${criadas} tarefa(s) criada(s)! ✅`);
}

async function criarEmLote() {
  const childIdx = parseInt(document.getElementById('fab-lote-child').value);
  const child = state.profiles[childIdx];
  const texto = document.getElementById('lote-text').value.trim();
  if (!child) { showToast('Selecione uma criança!'); return; }
  if (!texto) { showToast('Digite ao menos uma tarefa!'); return; }

  const linhas = texto.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  showToast(`Criando ${linhas.length} tarefas... ⏳`);
  const icons = ['📌','🎯','✨','🌟','🔥','💡','🎨','🧩'];
  let criadas = 0;

  for (const nome of linhas) {
    const icon = icons[Math.floor(Math.random() * icons.length)];
    const { data, error } = await db.from('tasks').insert({
      child_id: child.id, parent_id: state.currentUserId,
      name: nome, time: '08:00', stars: selectedStarsLoteVal, icon, done: false
    }).select().single();
    if (!error && data) {
      state.tasks[childIdx].push({ id: data.id, name: data.name, time: data.time, stars: data.stars, icon: data.icon, done: false });
      criadas++;
    }
  }

  state.metrics.tasksCreated += criadas;
  updateMetrics();
  fecharModalTarefas();
  renderParentDashboard();
  showToast(`${criadas} tarefa(s) criada(s)! ✅`);
}

function selectStarsFab(el, val) {
  el.closest('.star-select').querySelectorAll('.star-option').forEach(e => e.classList.remove('selected'));
  el.classList.add('selected');
  selectedStarsFabVal = val;
}

function selectStarsLote(el, val) {
  el.closest('.star-select').querySelectorAll('.star-option').forEach(e => e.classList.remove('selected'));
  el.classList.add('selected');
  selectedStarsLoteVal = val;
}

async function addTaskFab() {
  const name      = document.getElementById('fab-task-name').value.trim();
  const childIdx  = parseInt(document.getElementById('fab-task-child').value);
  const time      = document.getElementById('fab-task-time').value;
  const recorrente = document.getElementById('fab-recorrente').checked;
  const dias_semana = recorrente ? getDiasSelecionados() : [];

  if (!name) { showToast('Digite o nome da tarefa!'); return; }
  const icons = ['📌','🎯','✨','🌟','🔥','💡','🎨','🧩'];
  const icon  = icons[Math.floor(Math.random() * icons.length)];
  const child = state.profiles[childIdx];
  if (!child) { showToast('Selecione uma criança!'); return; }
  showToast('Criando tarefa... ⏳');

  const { data, error } = await db.from('tasks').insert({
    child_id: child.id, parent_id: state.currentUserId,
    name, time, stars: selectedStarsFabVal, icon, done: false,
    recorrente, dias_semana
  }).select().single();

  if (error) { showToast('Erro ao criar. Tente novamente.'); console.error(error); return; }

  state.tasks[childIdx].push({
    id: data.id, name: data.name, time: data.time,
    stars: data.stars, icon: data.icon, done: false,
    recorrente: data.recorrente, dias_semana: data.dias_semana || [],
    done_date: null
  });
  state.metrics.tasksCreated++;
  updateMetrics();
  document.getElementById('fab-task-name').value = '';
  document.getElementById('fab-recorrente').checked = false;
  document.getElementById('dias-semana-wrap').style.display = 'none';
  fecharModalTarefas();
  renderParentDashboard();
  showToast(`Tarefa "${name}" criada! ${recorrente ? '🔄' : '✅'}`);
}

// Update selectEmoji to handle selected class on emoji-pick spans

// ══════════════════════════════════════════
// TOGGLE SENHA
// ══════════════════════════════════════════
function toggleSenha(inputId, btn) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁️';
  }
}

// ══════════════════════════════════════════
// STATE
// ══════════════════════════════════════════
const state = {
  currentChild: null,
  currentUserId: null,
  selectedStars: 2,
  selectedRating: null,
  feedbacks: [],
  metrics: { tasksCompleted: 0, rewardsClaimed: 0, tasksCreated: 0 },
  profiles: [],
  tasks: [],
  rewards: [
    { id: 1, name: 'Sorvete especial',       emoji: '🍦', cost: 10 },
    { id: 2, name: 'Jogar 30 min extra',     emoji: '🎮', cost: 8  },
    { id: 3, name: 'Escolher jantar',         emoji: '🍕', cost: 15 },
    { id: 4, name: 'Cinema no fim de semana', emoji: '🎬', cost: 25 },
    { id: 5, name: 'Dormir mais tarde',       emoji: '🌙', cost: 12 },
    { id: 6, name: 'Adesivo especial',        emoji: '⭐', cost: 5  },
  ],
  pendingApprovals: [],
  history: []
};

// ══════════════════════════════════════════
// NAV
// ══════════════════════════════════════════
function navTo(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
  window.scrollTo(0, 0);
}

function navParent() {
  renderParentDashboard();
  navTo('screen-parent');
}

// ══════════════════════════════════════════
// AUTH — LOGIN com Supabase
// ══════════════════════════════════════════
async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value;
  const err   = document.getElementById('login-error');

  if (!email || !pass) {
    err.classList.add('show');
    err.textContent = 'Preencha e-mail e senha.';
    return;
  }

  err.classList.remove('show');
  showToast('Entrando... ⏳');

  const { data, error } = await db.auth.signInWithPassword({
    email: email,
    password: pass
  });

  if (error) {
    err.classList.add('show');
    err.textContent = 'E-mail ou senha incorretos.';
    return;
  }

  showToast('Login realizado! 👋');
  await carregarFilhos(data.user.id);
  renderProfiles();
  navTo('screen-profiles');
}

// ══════════════════════════════════════════
// AUTH — CADASTRO com Supabase
// ══════════════════════════════════════════
async function doRegister() {
  const name  = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass  = document.getElementById('reg-pass').value;
  const pass2 = document.getElementById('reg-pass2').value;
  const terms = document.getElementById('chk-terms').checked;
  const lgpd  = document.getElementById('chk-lgpd').checked;
  const err   = document.getElementById('reg-error');

  if (!name || !email || !pass || !pass2) {
    err.textContent = 'Preencha todos os campos.';
    err.classList.add('show'); return;
  }
  if (pass.length < 8 || !/[0-9]/.test(pass) || !/[A-Z]/.test(pass)) {
    err.textContent = 'Senha fraca: mín. 8 chars, 1 número, 1 maiúscula.';
    err.classList.add('show'); return;
  }
  if (pass !== pass2) {
    err.textContent = 'As senhas não coincidem.';
    err.classList.add('show'); return;
  }
  if (!terms || !lgpd) {
    err.textContent = 'Aceite os termos e o consentimento LGPD.';
    err.classList.add('show'); return;
  }

  err.classList.remove('show');
  showToast('Criando conta... ⏳');

  const { data, error } = await db.auth.signUp({
    email: email,
    password: pass
  });

  if (error) {
    err.textContent = 'Erro ao criar conta: ' + error.message;
    err.classList.add('show'); return;
  }

  // Salva o perfil do responsável
  const { error: profileError } = await db
    .from('profiles')
    .insert({
      id: data.user.id,
      full_name: name,
      email: email
    });

  if (profileError) {
    console.error('Erro ao salvar perfil:', profileError);
  }

  showToast('Conta criada! Verifique seu e-mail. 📧');
  setTimeout(() => navTo('screen-login'), 2000);
}

function doForgot() {
  const email = document.getElementById('forgot-email').value.trim();
  if (!email) return;
  db.auth.resetPasswordForEmail(email);
  showToast('E-mail de recuperação enviado! 📧');
  setTimeout(() => navTo('screen-login'), 1500);
}

async function doLogout() {
  await db.auth.signOut();
  state.profiles = [];
  state.tasks = [];
  state.currentUserId = null;
  showToast('Até logo! 👋');
  setTimeout(() => navTo('screen-login'), 800);
}

// ══════════════════════════════════════════
// FILHOS — carregar do banco
// ══════════════════════════════════════════
async function carregarFilhos(userId) {
  state.currentUserId = userId;

  const { data, error } = await db
    .from('children')
    .select('*')
    .eq('parent_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Erro ao carregar filhos:', error);
    return;
  }

  if (data && data.length > 0) {
    state.profiles = data.map(filho => ({
      id:    filho.id,
      name:  filho.name,
      age:   filho.age,
      emoji: filho.emoji,
      color: filho.color,
      stars: filho.stars
    }));
    state.tasks = state.profiles.map(() => []);
  } else {
    state.profiles = [];
    state.tasks = [];
  }
}

// ══════════════════════════════════════════
// FILHOS — cadastrar no banco
// ══════════════════════════════════════════
let emojiSelecionado = '👧';

function selectEmoji(el, emoji) {
  emojiSelecionado = emoji;
  document.getElementById('selected-emoji').textContent = 'Emoji selecionado: ' + emoji;
  document.querySelectorAll('.emoji-pick').forEach(e => e.classList.remove('selected'));
  el.classList.add('selected');
}

function abrirModalFilho() {
  document.getElementById('modal-add-child').classList.add('show');
}

function fecharModalFilho() {
  document.getElementById('modal-add-child').classList.remove('show');
  document.getElementById('child-name').value = '';
  document.getElementById('child-age').value = '';
  emojiSelecionado = '👧';
  document.getElementById('selected-emoji').textContent = 'Emoji selecionado: 👧';
}

async function salvarFilho() {
  const nome  = document.getElementById('child-name').value.trim();
  const idade = parseInt(document.getElementById('child-age').value);

  if (!nome || !idade || idade < 1 || idade > 17) {
    showToast('Preencha nome e idade corretamente!');
    return;
  }

  showToast('Salvando... ⏳');

  const { data, error } = await db
    .from('children')
    .insert({
      parent_id: state.currentUserId,
      name:      nome,
      age:       idade,
      emoji:     emojiSelecionado,
      color:     '#1a1650',
      stars:     0
    })
    .select()
    .single();

  if (error) {
    showToast('Erro ao salvar. Tente novamente.');
    console.error(error);
    return;
  }

  state.profiles.push({
    id: data.id, name: data.name, age: data.age,
    emoji: data.emoji, color: data.color, stars: 0
  });
  state.tasks.push([]);

  fecharModalFilho();
  renderProfiles();
  showToast(`${nome} adicionado(a)! 🎉`);
}

// ══════════════════════════════════════════
// PROFILES — render
// ══════════════════════════════════════════
function renderProfiles() {
  const grid = document.getElementById('profiles-grid');
  grid.innerHTML = '';
  state.profiles.forEach(p => {
    const card = document.createElement('div');
    card.className = 'profile-card';
    card.innerHTML = `
      <div class="profile-avatar" style="background:linear-gradient(135deg,${p.id===state.profiles[0]?.id?'#7c3aed,#a855f7':'#eab308,#ca8a04'})">${p.emoji}</div>
      <div class="profile-name">${p.name}</div>
      <div class="profile-age">${p.age} anos</div>
    `;
    card.onclick = () => selectProfile(p.id);
    grid.appendChild(card);
  });

  const add = document.createElement('div');
  add.className = 'profile-card profile-add';
  add.innerHTML = `<div class="profile-avatar"><span style="font-size:28px;color:var(--sky)">+</span></div><div class="profile-name" style="color:var(--sky)">Adicionar</div>`;
  add.onclick = () => abrirModalFilho();
  grid.appendChild(add);
}

// ══════════════════════════════════════════
// TAREFAS — carregar do banco
// ══════════════════════════════════════════
async function carregarTarefas(childId, childIndex) {
  const { data, error } = await db
    .from('tasks')
    .select('*')
    .eq('child_id', childId)
    .order('time', { ascending: true });

  if (error) {
    console.error('Erro ao carregar tarefas:', error);
    return;
  }

  state.tasks[childIndex] = (data || []).map(t => ({
    id:          t.id,
    name:        t.name,
    time:        t.time,
    stars:       t.stars,
    icon:        t.icon,
    done:        t.done,
    recorrente:  t.recorrente || false,
    dias_semana: t.dias_semana || [],
    done_date:   t.done_date || null
  }));
}

// ══════════════════════════════════════════
// PROFILES — selecionar filho
// ══════════════════════════════════════════
async function selectProfile(id) {
  state.currentChild = state.profiles.findIndex(p => p.id === id);
  showToast('Carregando tarefas... ⏳');
  await carregarTarefas(id, state.currentChild);
  renderChildHome();
  navTo('screen-child-home');
}

// ══════════════════════════════════════════
// CHILD HOME
// ══════════════════════════════════════════
function renderChildHome() {
  const child = state.profiles[state.currentChild];
  const tasks = state.tasks[state.currentChild] || [];

  document.getElementById('child-greeting').textContent = child.name + '! ' + child.emoji;
  const dh = document.getElementById('desktop-child-greeting');
  if (dh) dh.textContent = 'Olá, ' + child.name + '! ' + child.emoji;
  document.getElementById('child-stars').textContent = child.stars;
  document.getElementById('reward-stars').textContent = child.stars;

  const ativas = tasks.filter(t => tarefaAtivaHoje(t));
  const done = ativas.filter(t => tarefaDoneHoje(t)).length;
  document.getElementById('tasks-progress').textContent = `${done}/${ativas.length} feitas`;

  const list = document.getElementById('child-tasks-list');
  list.innerHTML = '';

  // Filter tasks active today
  const rotina = tasks.filter(t => t.recorrente && tarefaAtivaHoje(t));
  const unicas = tasks.filter(t => !t.recorrente);

  if (rotina.length === 0 && unicas.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><p>Nenhuma tarefa por hoje!</p></div>';
    return;
  }

  function renderTaskCard(task) {
    const doneHoje = tarefaDoneHoje(task);
    const card = document.createElement('div');
    card.className = 'task-card' + (doneHoje ? ' done' : '');
    card.innerHTML = `
      <div class="task-icon">${task.icon}</div>
      <div class="task-info">
        <div class="task-name">${task.name}${task.recorrente ? ' <span style="font-size:10px;color:var(--sky);background:#1a1650;padding:2px 6px;border-radius:6px;">🔄</span>' : ''}</div>
        <div class="task-time">⏰ ${task.time}</div>
      </div>
      <div class="task-stars">⭐ ${task.stars}</div>
      <div class="task-check">${doneHoje ? '✓' : ''}</div>
    `;
    if (!doneHoje) card.onclick = () => completeTask(task);
    return card;
  }

  if (rotina.length > 0) {
    const label = document.createElement('div');
    label.className = 'tasks-section-title';
    const doneCnt = rotina.filter(t => tarefaDoneHoje(t)).length;
    label.innerHTML = `🔄 Rotina diária <span>${doneCnt}/${rotina.length}</span>`;
    list.appendChild(label);
    rotina.forEach(t => list.appendChild(renderTaskCard(t)));
  }

  if (unicas.length > 0) {
    const label = document.createElement('div');
    label.className = 'tasks-section-title';
    const doneCnt = unicas.filter(t => tarefaDoneHoje(t)).length;
    label.innerHTML = `📋 Tarefas de hoje <span>${doneCnt}/${unicas.length}</span>`;
    list.appendChild(label);
    unicas.forEach(t => list.appendChild(renderTaskCard(t)));
  }
}

async function completeTask(task) {
  task.done = true;
  const child = state.profiles[state.currentChild];
  child.stars += task.stars;
  state.metrics.tasksCompleted++;

  // Atualiza no banco
  await db
    .from('tasks')
    .update({ done: true })
    .eq('id', task.id);

  // Atualiza estrelas do filho no banco
  await db
    .from('children')
    .update({ stars: child.stars })
    .eq('id', child.id);

  state.history.unshift({
    task: task.name,
    child: child.name,
    stars: task.stars,
    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  });

  document.getElementById('reward-title').textContent = 'Missão completa! 🎉';
  document.getElementById('reward-msg').textContent = `+${task.stars} estrela${task.stars > 1 ? 's' : ''}! Continue assim, ${child.name}!`;
  document.getElementById('reward-overlay').classList.add('show');

  renderChildHome();
  updateMetrics();
}

function closeReward() {
  document.getElementById('reward-overlay').classList.remove('show');
}

function switchChildTab(tab) {
  if (tab === 'home') {
    renderChildHome();
    navTo('screen-child-home');
  } else {
    if (state.currentChild !== null && state.profiles[state.currentChild]) {
      document.getElementById('reward-stars').textContent = state.profiles[state.currentChild].stars;
    }
    renderRewards();
    navTo('screen-child-rewards');
  }
}

// ══════════════════════════════════════════
// REWARDS
// ══════════════════════════════════════════
function renderRewards() {
  const grid = document.getElementById('child-rewards-grid');
  const child = state.profiles[state.currentChild];
  grid.innerHTML = '';
  state.rewards.forEach(r => {
    const canAfford = child.stars >= r.cost;
    const card = document.createElement('div');
    card.className = 'reward-card' + (!canAfford ? ' claimed' : '');
    card.innerHTML = `
      <div class="reward-emoji">${r.emoji}</div>
      <div class="reward-rname">${r.name}</div>
      <div class="reward-cost">⭐ ${r.cost}</div>
    `;
    if (canAfford) card.onclick = () => requestReward(r);
    grid.appendChild(card);
  });
}

function requestReward(r) {
  const child = state.profiles[state.currentChild];
  state.pendingApprovals.push({ reward: r.name, child: child.name, cost: r.cost, emoji: r.emoji });
  state.metrics.rewardsClaimed++;
  updateMetrics();
  showToast(`Pedido de "${r.name}" enviado para aprovação! ⏳`);
  renderRewards();
}

// ══════════════════════════════════════════
// PARENT DASHBOARD
// ══════════════════════════════════════════
function renderParentDashboard() {
  // Atualiza select de filhos com dados reais
  const selectFilho = document.getElementById('new-task-child');
  selectFilho.innerHTML = '';
  state.profiles.forEach((filho, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = filho.emoji + ' ' + filho.name;
    selectFilho.appendChild(opt);
  });

  const allTasks = state.tasks.flat();
  const done = allTasks.filter(t => t.done).length;
  const stars = state.profiles.reduce((a, p) => a + p.stars, 0);

  document.getElementById('stat-completed').textContent = done;
  document.getElementById('stat-stars').textContent = stars;
  document.getElementById('stat-pending').textContent = state.pendingApprovals.length;

  // Approvals
  const aList = document.getElementById('approval-list');
  aList.innerHTML = '';
  if (state.pendingApprovals.length === 0) {
    aList.innerHTML = '<div class="empty-state" style="padding:20px 0;"><div class="empty-icon">✅</div><p>Nenhum pedido pendente</p></div>';
  } else {
    state.pendingApprovals.forEach((a, i) => {
      const card = document.createElement('div');
      card.className = 'approval-card';
      card.innerHTML = `
        <div style="font-size:28px;">${a.emoji}</div>
        <div class="approval-info">
          <div class="approval-name">${a.reward}</div>
          <div class="approval-child">${a.child}</div>
        </div>
        <div class="approval-cost">⭐ ${a.cost}</div>
        <div class="approval-actions">
          <button class="btn btn-green btn-red" style="background:var(--green);padding:8px 14px;font-size:13px;" onclick="approveReward(${i})">✓</button>
          <button class="btn btn-red" onclick="rejectReward(${i})">✗</button>
        </div>
      `;
      aList.appendChild(card);
    });
  }

  // History
  const hList = document.getElementById('history-list');
  hList.innerHTML = '';
  if (state.history.length === 0) {
    hList.innerHTML = '<div style="text-align:center;padding:16px;color:var(--muted);font-size:14px;">Nenhuma tarefa concluída ainda</div>';
  } else {
    state.history.slice(0, 8).forEach(h => {
      const item = document.createElement('div');
      item.className = 'history-item';
      item.innerHTML = `
        <div class="history-dot"></div>
        <div class="history-info">
          <div class="history-task">${h.task}</div>
          <div class="history-meta">${h.child} · ${h.time}</div>
        </div>
        <div class="history-stars">+${h.stars}⭐</div>
      `;
      hList.appendChild(item);
    });
  }
}

function approveReward(i) {
  const a = state.pendingApprovals[i];
  const childIdx = state.profiles.findIndex(p => p.name === a.child);
  if (childIdx >= 0) {
    state.profiles[childIdx].stars = Math.max(0, state.profiles[childIdx].stars - a.cost);
    db.from('children').update({ stars: state.profiles[childIdx].stars }).eq('id', state.profiles[childIdx].id);
  }
  state.pendingApprovals.splice(i, 1);
  showToast(`Recompensa aprovada para ${a.child}! ✅`);
  renderParentDashboard();
}

function rejectReward(i) {
  state.pendingApprovals.splice(i, 1);
  showToast('Pedido recusado.');
  renderParentDashboard();
}

// ══════════════════════════════════════════
// TAREFAS — criar no banco
// ══════════════════════════════════════════
function selectStars(el, val) {
  document.querySelectorAll('.star-option').forEach(e => e.classList.remove('selected'));
  el.classList.add('selected');
  state.selectedStars = val;
}

async function addTask() {
  const name     = document.getElementById('new-task-name').value.trim();
  const childIdx = parseInt(document.getElementById('new-task-child').value);
  const time     = document.getElementById('new-task-time').value;

  if (!name) { showToast('Digite o nome da tarefa!'); return; }

  const icons = ['📌','🎯','✨','🌟','🔥','💡','🎨','🧩'];
  const icon  = icons[Math.floor(Math.random() * icons.length)];
  const child = state.profiles[childIdx];

  if (!child) { showToast('Selecione um filho!'); return; }

  showToast('Criando tarefa... ⏳');

  const { data, error } = await db
    .from('tasks')
    .insert({
      child_id:  child.id,
      parent_id: state.currentUserId,
      name:      name,
      time:      time,
      stars:     state.selectedStars,
      icon:      icon,
      done:      false
    })
    .select()
    .single();

  if (error) {
    showToast('Erro ao criar tarefa. Tente novamente.');
    console.error(error);
    return;
  }

  state.tasks[childIdx].push({
    id: data.id, name: data.name, time: data.time,
    stars: data.stars, icon: data.icon, done: false
  });

  state.metrics.tasksCreated++;
  updateMetrics();
  document.getElementById('new-task-name').value = '';
  showToast(`Tarefa "${name}" criada! ✅`);
  renderParentDashboard();
}

// ══════════════════════════════════════════
// FEEDBACK — Formspree
// ══════════════════════════════════════════
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

function selectRating(el, val) {
  document.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
  state.selectedRating = val;
}

function toggleTag(el) {
  el.classList.toggle('selected');
}

async function submitFeedback() {
  if (!state.selectedRating) { showToast('Selecione uma avaliação!'); return; }

  const difficulties = Array.from(document.querySelectorAll('.diff-tag.selected')).map(t => t.textContent);
  const text = document.getElementById('feedback-text').value.trim();
  const screen = document.querySelector('.screen.active')?.id || 'unknown';
  const emojis = ['','😞','😐','🙂','😄','🤩'];

  const fb = {
    rating: state.selectedRating,
    emoji: emojis[state.selectedRating],
    difficulties,
    text,
    screen,
    time: new Date().toLocaleString('pt-BR')
  };

  state.feedbacks.push(fb);
  renderFeedbacksList();

  // Envia para Formspree
  try {
    await fetch('https://formspree.io/f/mnjlezpj', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        avaliacao:    fb.rating + '/5 ' + fb.emoji,
        dificuldades: difficulties.join(', ') || 'Nenhuma',
        comentario:   text || 'Sem comentário',
        tela:         screen,
        horario:      fb.time
      })
    });
  } catch(e) {
    console.warn('Formspree offline:', e);
  }

  document.getElementById('feedback-form-area').style.display = 'none';
  document.getElementById('feedback-success').classList.add('show');
}

function renderFeedbacksList() {
  const list = document.getElementById('feedbacks-list');
  if (!list) return;
  list.innerHTML = '';
  if (state.feedbacks.length === 0) {
    list.innerHTML = '<div class="empty-state" style="padding:20px 0;"><div class="empty-icon">🗂️</div><p>Nenhum feedback ainda.</p></div>';
    return;
  }
  state.feedbacks.slice().reverse().forEach(fb => {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.style.cssText = 'padding:14px 0;align-items:flex-start;';
    item.innerHTML = `
      <div style="font-size:22px;">${fb.emoji}</div>
      <div style="flex:1;">
        <div style="font-weight:700;font-size:14px;color:var(--sky);">${'★'.repeat(fb.rating)}</div>
        ${fb.difficulties.length ? `<div style="font-size:12px;color:var(--muted);margin:2px 0;">Dificuldades: ${fb.difficulties.join(', ')}</div>` : ''}
        ${fb.text ? `<div style="font-size:13px;color:var(--text);margin-top:4px;">"${fb.text}"</div>` : ''}
        <div style="font-size:11px;color:var(--muted);margin-top:4px;">${fb.screen} · ${fb.time}</div>
      </div>
    `;
    list.appendChild(item);
  });
}

// ══════════════════════════════════════════
// METRICS
// ══════════════════════════════════════════
function updateMetrics() {
  const m = state.metrics;
  const el = (id) => document.getElementById(id);
  if (el('m-tasks'))   el('m-tasks').textContent   = m.tasksCompleted + ' conclusões';
  if (el('m-rewards')) el('m-rewards').textContent = m.rewardsClaimed + ' pedidos';
  if (el('m-created')) el('m-created').textContent = m.tasksCreated   + ' criadas';
}

// ══════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ══════════════════════════════════════════
// KEYBOARD
// ══════════════════════════════════════════
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const active = document.querySelector('.screen.active')?.id;
    if (active === 'screen-login')    doLogin();
    if (active === 'screen-register') doRegister();
  }
  if (e.key === 'Escape') {
    closeFeedback();
    closeReward();
    fecharModalFilho();
  }
});

// ══════════════════════════════════════════
// INIT — verifica sessão ativa ao abrir app
// ══════════════════════════════════════════
db.auth.getSession().then(async ({ data }) => {
  if (data.session) {
    await carregarFilhos(data.session.user.id);
    renderProfiles();
    navTo('screen-profiles');
  }
});
