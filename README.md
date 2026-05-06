# 🔗 ELO Family — Beta v4

Rotina infantil gamificada com tema gamer dark.

## O que foi corrigido nesta versão

| # | Problema | Correção |
|---|---|---|
| 1 | Tab "Entrar" duplicava o botão "Entrar" | Tab renomeada para "Login" |
| 2 | Sem loading state em login/cadastro | Botão desabilitado + texto "Entrando…" / "Criando conta…" |
| 3 | Validação só via toast, sem indicar campo | Border vermelho + mensagem inline abaixo do input |
| 4 | `bottom-nav` no CSS mas não usado no painel | Removido do CSS do painel de responsável |
| 5 | CTA criar missão sem hierarquia clara | Home: CTA forte · Aba: botão secundário |
| 6 | Navegação híbrida (tabs + bottom nav misturados) | Padrão unificado: tabs no painel do responsável |
| 7 | Modo criança voltava sem validação | PIN simples de 4 dígitos definido pelo responsável |
| 8 | Recorrência sem microcopy | Label explicativo em cada opção |
| 9 | Empty states incompletos | Padrão completo: ícone + título + explicação + CTA |
| 10 | `localStorage` sem versionamento | Chave `elo_child_session_v2` com tratamento de erro |
| 11 | Ações críticas sem feedback consistente | Toast de sucesso/erro em todas as ações |
| 12 | Biblioteca sem contexto de valor | Header explicativo adicionado |

## Perfis de acesso

| Perfil | Acesso |
|---|---|
| 👧 Criança | Dashboard de tarefas, recompensas, rodapé fixo |
| ⚙️ Responsável | Criar tarefas, aprovar recompensas, gerenciar filhos |
| 📊 Admin/Master | Métricas de uso, feedbacks, KPIs do produto |

## Roles no Supabase

- Defina `role = 'master'` ou `is_master = true` na tabela `profiles`.
- Ou adicione o e-mail da master em `MASTER_EMAILS`, dentro de `js/app.js`.

## PIN do modo criança

O responsável define um PIN de 4 dígitos no primeiro acesso ao modo criança.
Esse PIN é pedido ao tentar voltar para a área do responsável a partir da tela da criança.
O PIN é salvo localmente (não no Supabase, por ser MVP).

## Como rodar

1. Clone ou extraia o zip
2. Abra `index.html` no navegador (ou use Live Server no VS Code)
3. As credenciais do Supabase já estão em `js/supabase.js`

## Estrutura

```
elo-family-mvp/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── supabase.js
│   └── app.js
├── supabase-recorrencia.sql
└── README.md
```

## Tecnologias

- HTML + CSS + JS puro (sem framework)
- [Supabase](https://supabase.com) para auth e banco de dados
- Fontes: Nunito + Baloo 2 (Google Fonts)

## Git

```bash
git add .
git commit -m "fix: 12 correções de UX/UI — login, loading, validação, PIN, empty states"
git push origin main
```
