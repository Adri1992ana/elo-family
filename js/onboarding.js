/* ══════════════════════════════════════════════════════════════
   ELO Family — onboarding.js
   Onboarding guiado por ação: o usuário aprende fazendo.

   FLUXO COMPLETO (ciclo principal de valor):
     Passo 0 → Intro / boas-vindas              (banner painel)
     Passo 1 → Adicionar filho                  (hook: salvarFilho)
     Passo 2 → Criar primeira missão            (hook: addTaskFab)
     Passo 3 → Entrar no modo criança           (hook: passarParaCrianca)
     Passo 4 → Concluir missão                  (hook: completeTask)
     Passo 5 → Voltar para responsável  ← NOVO  (banner criança + obVoltarParaResponsavel)
     Passo 6 → Criar recompensa                 (hook: adicionarRecompensa)
     Passo 7 → Concluído

   STORAGE POR USUÁRIO:
     Chave: "elo_ob_step_${userId}"
     Fallback: "elo_ob_step_anon" quando userId não disponível ainda.

   INTEGRAÇÃO COM app.js (sem alterar assinaturas existentes):
     - obAvancar(n)          chamado pelos hooks após cada ação
     - obRenderBanner()      chamado por verificarOnboarding() no painel
     - obRenderBannerChild() chamado por passarParaCrianca()
     - obVoltarParaResponsavel() chamado pelo CTA do passo 5 (novo)
══════════════════════════════════════════════════════════════ */

// ── CONFIGURAÇÃO: PASSOS DO PAINEL (responsável) ─────────────
// Passos 0, 1, 2, 3 e 6 aparecem no painel (#ob-banner).
// Passos 4 e 5 aparecem no modo criança (#ob-banner-child).
var OB_STEPS_PARENT = {
  0: {
    icon:            '🔗',
    badge:           'Boas-vindas',
    title:           'Vamos montar a primeira rotina gamificada',
    desc:            'Em 6 passos você cria o perfil, define missões, testa com a criança e configura recompensas.',
    cta:             'Começar',
    ctaSecondary:    'Pular configuração',
    progress:        0,
    action:          function() { obAvancar(0); },
    actionSecondary: function() { obSkip(); },
    highlight:       null,
  },
  1: {
    icon:      '👶',
    badge:     'Passo 1 de 6',
    title:     'Adicione seu primeiro filho',
    desc:      'Cadastre a criança que vai usar o app. Ela terá missões e estrelas próprias.',
    cta:       'Adicionar filho',
    progress:  10,
    action:    function() { abrirModalFilho(); },
    highlight: null,
  },
  2: {
    icon:      '⚔️',
    badge:     'Passo 2 de 6',
    title:     'Crie a primeira missão',
    desc:      'Missões são tarefas do dia a dia. Cada uma concluída rende estrelas para a criança.',
    cta:       'Criar missão',
    progress:  25,
    action:    function() { abrirModalTarefas(); },
    highlight: '.btn-criar-missao-hoje',
  },
  3: {
    icon:      '🎮',
    badge:     'Passo 3 de 6',
    title:     'Agora veja como a criança usa o app',
    desc:      'Toque no card do filho abaixo para entrar no modo criança.',
    cta:       null,  // sem CTA — ação é clicar no card do filho
    progress:  40,
    action:    null,
    highlight: '#child-switch-cards',
  },
  // Passos 4 e 5 ficam no modo criança — sem entrada aqui no painel.
  6: {
    icon:      '🎁',
    badge:     'Passo 6 de 6',
    title:     'Crie uma recompensa para seu filho usar as estrelas',
    desc:      'Com estrelas, a criança pode trocar por recompensas que você escolher.',
    cta:       'Criar recompensa',
    progress:  90,
    action:    function() { switchParentTab('recompensas'); setTimeout(function() { abrirRewardsMgmt(); }, 150); },
    highlight: null,
  },
};

// ── CONFIGURAÇÃO: PASSOS DO MODO CRIANÇA ─────────────────────
// Passo 4: concluir missão.
// Passo 5: orientação para voltar ao responsável (NOVO).
var OB_STEPS_CHILD = {
  4: {
    icon:      '⭐',
    badge:     'Passo 4 de 6',
    title:     'Conclua a missão e ganhe estrelas',
    desc:      'Toque na missão abaixo para completar e ver o que acontece!',
    progress:  55,
    cta:       null,  // sem CTA — ação é tocar na tarefa
  },
  5: {
    icon:      '↩️',
    badge:     'Passo 5 de 6',
    title:     'Agora volte para a área do responsável',
    desc:      'Você ganhou estrelas! Volte ao painel do responsável para criar uma recompensa.',
    progress:  72,
    cta:       'Voltar para responsável',
  },
};

// ── STORAGE POR USUÁRIO ──────────────────────────────────────
function obStorageKey() {
  try {
    var uid = (typeof state !== 'undefined' && state.currentUserId) ? state.currentUserId : 'anon';
    return 'elo_ob_step_' + uid;
  } catch(e) { return 'elo_ob_step_anon'; }
}

function obGetStep() {
  try {
    var v = localStorage.getItem(obStorageKey());
    return v !== null ? parseInt(v, 10) : 0; // 0 = intro, usuário novo
  } catch(e) { return 7; } // storage falhou → trata como concluído, não bloqueia
}

function obSetStep(n) {
  try { localStorage.setItem(obStorageKey(), String(n)); } catch(e) {}
}

// Concluído quando chega no passo 7 ou além
function obIsDone() { return obGetStep() >= 7; }

// Migração da chave global legada → chave por usuário
(function obMigrarLegado() {
  try {
    var legado = localStorage.getItem('elo_ob_step');
    if (legado === null) return;
    if (!localStorage.getItem(obStorageKey())) {
      localStorage.setItem(obStorageKey(), legado);
    }
    localStorage.removeItem('elo_ob_step');
  } catch(e) {}
})();

// ── AVANÇAR PASSO ────────────────────────────────────────────
// n = passo recém-concluído. Só avança se for o passo atual esperado.
function obAvancar(n) {
  var current = obGetStep();
  if (obIsDone() || current !== n) return;

  var next = n + 1;
  obSetStep(next);
  obRemoveHighlight();

  if (next >= 7) {
    // Ciclo completo — conclusão aparece no painel (usuário já voltou)
    obMostrarConclusao();
  } else if (next === 4 || next === 5) {
    // Passos 4 e 5 são no modo criança
    setTimeout(obRenderBannerChild, 300);
  } else {
    // Passos do painel (0→1, 2, 3, 6)
    obRenderBanner();
    setTimeout(obRenderBanner, 500);
  }
}

// ── BANNER DO PAINEL (responsável) ───────────────────────────
// Chamado por verificarOnboarding() em app.js a cada renderParentDashboard.
function obRenderBanner() {
  var banner = document.getElementById('ob-banner');
  if (!banner) return;

  var step = obGetStep();

  // Concluído → oculta permanentemente
  if (step >= 7) {
    banner.style.display = 'none';
    obRemoveHighlight();
    return;
  }

  // Passos 4 e 5 são no modo criança → banner do painel fica oculto.
  // Exceção: se o usuário já está no painel com step 5 (voltou sem usar o CTA),
  // avança automaticamente para o step 6 para não travar o fluxo.
  if (step === 4) {
    banner.style.display = 'none';
    return;
  }
  if (step === 5) {
    // Painel ativo + step 5 = usuário voltou sem usar o CTA do onboarding.
    // Avança para o passo de recompensa sem perder o progresso.
    obSetStep(6);
    obRenderBanner();
    return;
  }

  // Auto-avanços: usuário já tinha dados antes do onboarding
  if (step === 1 && typeof state !== 'undefined' && state.profiles && state.profiles.length > 0) {
    obSetStep(2); obRenderBanner(); return;
  }
  if (step === 2 && typeof state !== 'undefined' && state.tasks && state.tasks.flat().length > 0) {
    obSetStep(3); obRenderBanner(); return;
  }

  var cfg = OB_STEPS_PARENT[step];
  if (!cfg) return; // passo sem entrada no painel (4, 5) — não deve chegar aqui

  // Só reconstrói o HTML se o título mudou (evita flicker)
  var titleEl = banner.querySelector('[data-ob-title]');
  if (titleEl && titleEl.textContent === cfg.title) {
    var pf = banner.querySelector('[data-ob-progress]');
    if (pf) pf.style.width = cfg.progress + '%';
    banner.style.display = '';
  } else {
    var ctaHtml = cfg.cta
      ? '<button class="ob-banner-cta" onclick="obAction()">' + cfg.cta + '</button>'
      : '';
    var skipHtml = step > 0
      ? '<button class="ob-banner-skip" onclick="obSkip()">Pular</button>'
      : '';
    var secundarioHtml = (step === 0 && cfg.ctaSecondary)
      ? '<div style="text-align:center;margin-top:10px"><button class="ob-banner-skip" onclick="obSkipFromIntro()" style="font-size:12px">' + cfg.ctaSecondary + '</button></div>'
      : '';

    banner.innerHTML =
      '<div class="ob-banner-header">' +
        '<span class="ob-banner-step-badge">' + cfg.badge + '</span>' +
        '<div class="ob-banner-progress">' +
          '<div class="ob-banner-progress-fill" data-ob-progress style="width:' + cfg.progress + '%"></div>' +
        '</div>' +
        skipHtml +
      '</div>' +
      '<div class="ob-banner-body">' +
        '<span class="ob-banner-icon">' + cfg.icon + '</span>' +
        '<div class="ob-banner-content">' +
          '<div class="ob-banner-title" data-ob-title>' + cfg.title + '</div>' +
          '<div class="ob-banner-desc">' + cfg.desc + '</div>' +
        '</div>' +
        ctaHtml +
      '</div>' +
      secundarioHtml;

    banner.style.display = '';
  }

  obRemoveHighlight();
  if (cfg.highlight) {
    setTimeout(function() {
      var el = document.querySelector(cfg.highlight);
      if (el) el.classList.add('ob-highlight');
    }, 400);
  }
}

// ── BANNER DO MODO CRIANÇA (passos 4 e 5) ────────────────────
// Chamado ao entrar no modo criança e ao avançar do passo 4 para o 5.
function obRenderBannerChild() {
  var banner = document.getElementById('ob-banner-child');
  if (!banner) return;

  var step = obGetStep();

  // Só exibe nos passos 4 e 5
  if (step !== 4 && step !== 5) {
    banner.style.display = 'none';
    return;
  }

  var cfg = OB_STEPS_CHILD[step];
  if (!cfg) return;

  // Constrói o CTA do banner da criança:
  // Passo 4: sem CTA (ação é tocar na tarefa).
  // Passo 5: CTA "Voltar para responsável".
  var ctaChildHtml = cfg.cta
    ? '<button class="ob-banner-cta" onclick="obVoltarParaResponsavel()">' + cfg.cta + '</button>'
    : '';

  // Reconstrói o banner filho a partir dos elementos fixos do HTML.
  // Os ids já existem no index.html; aqui apenas preenchemos os valores.
  document.getElementById('ob-child-badge').textContent         = cfg.badge;
  document.getElementById('ob-child-icon').textContent          = cfg.icon;
  document.getElementById('ob-child-title').textContent         = cfg.title;
  document.getElementById('ob-child-desc').textContent          = cfg.desc;
  document.getElementById('ob-child-progress-fill').style.width = cfg.progress + '%';

  // CTA dinâmico: adiciona ou remove o botão sem mexer na estrutura fixa
  var ctaContainer = document.getElementById('ob-child-cta-wrap');
  if (ctaContainer) {
    ctaContainer.innerHTML = ctaChildHtml;
  }

  banner.style.display = '';

  obRemoveHighlight();
  if (step === 4) {
    // Destaca a primeira tarefa não concluída
    setTimeout(function() {
      var taskCard = document.querySelector('#child-tasks-list .task-card:not(.done)');
      if (taskCard) taskCard.classList.add('ob-highlight');
    }, 600);
  }
}

// ── VOLTAR PARA RESPONSÁVEL (CTA do passo 5) ─────────────────
// Avança o onboarding para o passo 6 e aciona a saída do modo criança.
// Usa devolverAoResponsavel() (app.js) se disponível, senão confirmarSaidaCrianca().
function obVoltarParaResponsavel() {
  // Avança primeiro: quando renderParentDashboard rodar, já estará no passo 6
  obAvancar(5);

  // Usa a função existente de retorno ao responsável.
  // devolverAoResponsavel chama navParent → renderParentDashboard → obRenderBanner (passo 6).
  if (typeof devolverAoResponsavel === 'function') {
    devolverAoResponsavel();
  } else if (typeof confirmarSaidaCrianca === 'function') {
    // Fallback: fluxo com PIN (se PIN já estiver definido, valida; caso contrário, define)
    confirmarSaidaCrianca();
  }
}

// ── AÇÃO DO CTA DO PAINEL ────────────────────────────────────
function obAction() {
  var step = obGetStep();
  if (obIsDone()) return;
  var cfg = OB_STEPS_PARENT[step];
  if (!cfg || !cfg.action) return;
  cfg.action();
}

// Botão "Pular configuração" da intro (passo 0)
function obSkipFromIntro() { obSkip(); }

// ── PULAR TUDO ───────────────────────────────────────────────
function obSkip() {
  obSetStep(7);
  obRemoveHighlight();
  var bp = document.getElementById('ob-banner');
  var bc = document.getElementById('ob-banner-child');
  if (bp) bp.style.display = 'none';
  if (bc) bc.style.display = 'none';
}

// ── HIGHLIGHT ────────────────────────────────────────────────
function obRemoveHighlight() {
  document.querySelectorAll('.ob-highlight').forEach(function(el) {
    el.classList.remove('ob-highlight');
  });
}

// ── CONCLUSÃO ────────────────────────────────────────────────
function obMostrarConclusao() {
  var banner = document.getElementById('ob-banner');
  if (!banner) return;

  banner.style.display = '';
  banner.innerHTML =
    '<div class="ob-complete">' +
      '<div class="ob-complete-icon">🎉</div>' +
      '<div class="ob-complete-title">Pronto, você completou o primeiro ciclo!</div>' +
      '<div class="ob-complete-sub">' +
        'Agora você já sabe criar rotinas, acompanhar missões e usar recompensas.' +
      '</div>' +
      '<button class="ob-banner-cta" onclick="obDismissConclusao()" ' +
        'style="margin-top:4px;width:100%;justify-content:center;display:flex">' +
        'Começar a usar' +
      '</button>' +
    '</div>';

  if (typeof launchConfetti === 'function') launchConfetti(2200);
}

function obDismissConclusao() {
  obSetStep(7);
  var banner = document.getElementById('ob-banner');
  if (banner) banner.style.display = 'none';
}

// ── RENDERIZAÇÃO SEGURA ──────────────────────────────────────
function obTentarRenderizar() {
  var painelAtivo = document.getElementById('screen-parent');
  var filhaAtivo  = document.getElementById('screen-child-home');
  if (painelAtivo && painelAtivo.classList.contains('active')) obRenderBanner();
  if (filhaAtivo  && filhaAtivo.classList.contains('active'))  obRenderBannerChild();
}

document.addEventListener('DOMContentLoaded', function() {
  setTimeout(obTentarRenderizar, 300);
  setTimeout(obTentarRenderizar, 1400);
});

/* ══════════════════════════════════════════════════════════════
   LIMITAÇÕES DE MVP

   1. obVoltarParaResponsavel usa devolverAoResponsavel() como
      caminho principal. Se o PIN ainda não estiver definido,
      devolverAoResponsavel não pede PIN — isso é intencional no
      contexto de onboarding (o responsável está acompanhando).

   2. Se o usuário fechar o app no passo 5 (modo criança) e reabrir
      direto no painel, o step 5 ficará travado: obRenderBanner oculta
      os steps 4 e 5, e obRenderBannerChild não será chamado.
      Solução de MVP: obTentarRenderizar tenta renderizar o banner
      correto conforme a tela ativa. Se o painel for a tela ativa
      e o step for 5, o banner do painel ficará oculto até o usuário
      entrar no modo criança novamente.
      Alternativa aceitável de MVP: pular automaticamente do step 5
      para 6 quando renderParentDashboard rodar com step === 5.
      Isso está implementado no auto-avanço de obRenderBanner.

   3. adicionarSelecionadas e criarEmLote não disparam obAvancar(2).

   4. state.rewards começa com REWARDS_DEFAULT (local). O hook
      adicionarRecompensa avança apenas quando o usuário cria via modal.
══════════════════════════════════════════════════════════════ */
