# 🔗 ELO Family — Beta v3

Rotina infantil gamificada com tema gamer dark.

## Perfis de acesso

| Perfil | Acesso |
|---|---|
| 👧 Criança | Dashboard de tarefas, recompensas, rodapé fixo |
| ⚙️ Responsável | Criar tarefas, aprovar recompensas, gerenciar filhos |
| 📊 Admin/Master | Métricas de uso, feedbacks, KPIs do produto |

## Roles no Supabase

O app bloqueia a tela de métricas para responsáveis comuns. Para liberar as donas do produto, use uma destas opções:

- Defina `role = 'master'` ou `is_master = true` na tabela `profiles`.
- Ou adicione o e-mail da master em `MASTER_EMAILS`, dentro de `js/app.js`.
- Novas contas criadas pelo app entram como `role: 'parent'` nos metadados do Supabase Auth.

## Recorrência gamificada

A tarefa recorrente agora deve ser tratada como uma missão modelo. Cada conclusão do dia vira um registro em `task_completions`, preservando histórico, pontuação, streak e evolução da criança.

1. Rode `supabase-recorrencia.sql` no SQL Editor do Supabase.
2. O app passa a gravar uma execução por tarefa/criança/data.
3. Se a tabela ainda não existir, o app usa o fallback antigo (`tasks.done` e `tasks.done_date`) para não quebrar a demonstração.
4. O streak é calculado a partir das datas concluídas e aparece nas missões recorrentes.

## Revisão final

- Rodapé infantil fixo com Início e Recompensas.
- FABs alinhados ao frame mobile também em telas desktop.
- Métricas restritas às usuárias master.
- Histórico do dia carregado a partir de `task_completions` quando disponível.
- Proteção contra pontuação duplicada quando uma conclusão já existe para a mesma missão no mesmo dia.

## Tecnologias

- HTML + CSS + JS puro (sem framework)
- [Supabase](https://supabase.com) para auth e banco de dados
- Fontes: Nunito + Baloo 2 (Google Fonts)

## Como rodar

1. Clone o repositório
2. Abra `index.html` no navegador (ou use Live Server no VS Code)
3. As credenciais do Supabase já estão em `js/supabase.js`

## Estrutura

```
elo-family-supabase/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── supabase.js   ← configuração e conexão
│   └── app.js        ← toda a lógica do app
└── README.md
```

## Git

```bash
git add .
git commit -m "feat: redesign gamer dark v3"
git push origin main
```
