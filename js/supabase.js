// ====================================================
// CONFIGURAÇÃO DO SUPABASE — ELO Family
// Substitua os valores abaixo com os seus dados reais
// ====================================================

const SUPABASE_URL = 'https://fnavwrzfgblvowzmzpi.supabase.co';
// ↑ Substitua pelo seu Project URL (Supabase > Settings > API)

const SUPABASE_KEY = 'sb_publishable_BCfsak7_Wq8mvFSJ4MFnuA_lSpPqxwL';
// ↑ Substitua pela sua anon public key (Supabase > Settings > API)

// Cria a conexão com o Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Testa a conexão (aparece no console do navegador — F12)
console.log('✅ Supabase conectado com sucesso!');
