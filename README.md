# 🔗 ELO Family — Beta v3

Rotina infantil gamificada com tema gamer dark.

## Perfis de acesso

| Perfil | Acesso |
|---|---|
| 👧 Criança | Dashboard de tarefas, recompensas, rodapé fixo |
| ⚙️ Responsável | Criar tarefas, aprovar recompensas, gerenciar filhos |
| 📊 Admin/Master | Métricas de uso, feedbacks, KPIs do produto |

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
