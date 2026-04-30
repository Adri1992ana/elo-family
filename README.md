# 🔗 ELO Family — com Supabase Backend

## Estrutura

```
elo-family/
├── index.html          ← app completo + modal de filhos
├── css/
│   └── style.css       ← estilos paleta Gamer
├── js/
│   ├── supabase.js     ← ⚠️ configure suas credenciais aqui
│   └── app.js          ← lógica completa com Supabase
└── README.md
```

## ⚠️ Antes de publicar — configure o Supabase

Abra `js/supabase.js` e substitua:

```js
const SUPABASE_URL = 'https://SEU_PROJETO.supabase.co';
const SUPABASE_KEY = 'SUA_CHAVE_ANON_PUBLIC';
```

Encontre esses valores em: **Supabase > Settings > API**

## Subir no GitHub

```bash
git add .
git commit -m "feat: integra Supabase backend"
git push origin main
```

## Versão

Beta v2.0 — com Supabase Auth + PostgreSQL
