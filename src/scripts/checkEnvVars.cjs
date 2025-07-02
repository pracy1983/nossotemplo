// Script para verificar as variáveis de ambiente relacionadas ao email
require('dotenv').config();

console.log('=== VERIFICAÇÃO DAS VARIÁVEIS DE AMBIENTE ===');
console.log('Verificando variáveis de ambiente relacionadas ao email:');

const requiredVars = [
  'EMAIL_HOST',
  'EMAIL_PORT',
  'EMAIL_USER',
  'EMAIL_PASS',
  'EMAIL_FROM'
];

let missingVars = [];

requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    missingVars.push(varName);
    console.log(`❌ ${varName}: Não configurado`);
  } else {
    // Para variáveis sensíveis, não mostramos o valor completo
    if (varName === 'EMAIL_PASS') {
      console.log(`✅ ${varName}: ******** (configurado)`);
    } else {
      console.log(`✅ ${varName}: ${process.env[varName]}`);
    }
  }
});

if (missingVars.length > 0) {
  console.log('\n⚠️ ATENÇÃO: As seguintes variáveis de ambiente estão faltando:');
  console.log(missingVars.join(', '));
  console.log('\nPor favor, adicione estas variáveis ao seu arquivo .env seguindo o modelo do .env.example');
} else {
  console.log('\n✅ Todas as variáveis de ambiente necessárias estão configuradas!');
}
