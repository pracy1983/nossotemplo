const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Apenas permitir POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { email } = JSON.parse(event.body);
    
    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email é obrigatório' })
      };
    }

    // Cliente admin com service role key do ambiente do servidor
    const supabaseAdmin = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Buscar usuário pelo email
    const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers();

    if (userError) {
      console.error('Erro ao buscar usuário:', userError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Erro ao buscar usuário na autenticação' })
      };
    }

    // Filtrar usuário pelo email
    const userToDelete = users.find(user => user.email === email);
    
    if (!userToDelete) {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: 'Usuário não encontrado na autenticação' })
      };
    }

    // Excluir usuário
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userToDelete.id);
    
    if (deleteError) {
      console.error('Erro ao excluir usuário:', deleteError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Erro ao excluir usuário da autenticação' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Usuário excluído com sucesso da autenticação' })
    };

  } catch (error) {
    console.error('Erro na função delete-auth-user:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro interno do servidor' })
    };
  }
};
