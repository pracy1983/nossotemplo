# Script de Sincronização de Usuários Auth

Este script sincroniza os usuários da tabela `students` com a tabela de autenticação do Supabase.

## O que o script faz

1. Busca todos os emails da tabela `students`
2. Busca todos os usuários do Auth do Supabase
3. Cria usuários Auth para emails que estão em `students` mas não em Auth
4. Atualiza a tabela `students` com o `auth_user_id` para cada usuário criado

## Importante

- O script **NÃO** envia emails com senha para os usuários
- Os convites devem ser enviados manualmente pelo sistema existente
- O script não altera nenhuma lógica ou design existente

## Como usar

### 1. Configurar variáveis de ambiente

Adicione a seguinte linha ao seu arquivo `.env`:

```
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
```

### 2. Executar o script

```bash
node src/scripts/syncAuthUsers.cjs
```

### 3. Verificar o resultado

O script exibirá um resumo da sincronização, incluindo:
- Total de estudantes encontrados
- Total de usuários Auth existentes
- Estudantes sem usuário Auth
- Usuários criados com sucesso
- Falhas na criação (se houver)

## Após a sincronização

Depois que os usuários forem criados no Auth, você pode enviar convites usando a funcionalidade existente no sistema.
