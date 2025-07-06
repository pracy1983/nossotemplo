/**
 * Mock implementation of Supabase client for use when the real client is not available
 * This is used as a fallback when the Supabase connection fails
 */

// Interface para o cliente mock
export interface MockSupabaseClient {
  from: (table: string) => any;
  auth: {
    getUser: () => Promise<{ data: { user: any } | null; error: any }>;
    signInWithPassword: (credentials: { email: string; password: string }) => Promise<{ data: any; error: any }>;
    signOut: () => Promise<{ error: any }>;
    setSession: (session: { access_token: string; refresh_token?: string }) => Promise<{ data: any; error: any }>;
    updateUser: (attributes: { password?: string }) => Promise<{ data: any; error: any }>;
  };
}

/**
 * Cria um cliente mock do Supabase para uso quando o cliente real não está disponível
 */
export function createMockClient(): MockSupabaseClient {
  console.warn('Usando cliente Supabase MOCK - os dados não serão persistidos');
  
  // Dados em memória para simulação
  const mockData = {
    students: [
      {
        id: 'mock-admin-id',
        full_name: 'Paula Racy - Administrador',
        birth_date: '1990-01-01',
        email: 'paularacy@gmail.com',
        unit: 'SP',
        is_admin: true,
        is_active: true,
        is_guest: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    events: [],
    attendance_records: [
      {
        id: 'mock-attendance-1',
        student_id: 'mock-admin-id',
        event_id: 'mock-event-1',
        date: new Date().toISOString().split('T')[0],
        present: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
  };
  
  return {
    from: (table: string) => ({
      select: (columns?: string) => {
        console.log(`[MOCK] SELECT ${columns || '*'} FROM ${table}`);
        const query = {
          data: mockData[table as keyof typeof mockData] || [],
          error: null,
          count: mockData[table as keyof typeof mockData]?.length || 0,
          
          // Implementação do método order
          order: (column: string, options?: { ascending?: boolean }) => {
            console.log(`[MOCK] ORDER BY ${column} ${options?.ascending ? 'ASC' : 'DESC'}`);
            return query;
          },
          
          // Implementação do método limit
          limit: (count: number) => {
            console.log(`[MOCK] LIMIT ${count}`);
            return query;
          },
          
          // Implementação do método eq
          eq: (column: string, value: any) => {
            console.log(`[MOCK] WHERE ${column} = ${value}`);
            const eqResult = {
              // Método order diretamente no resultado do eq
              order: (orderColumn: string, options?: { ascending?: boolean }) => {
                console.log(`[MOCK] ORDER BY ${orderColumn} ${options?.ascending ? 'ASC' : 'DESC'}`);
                // Implementação completa que retorna um objeto com todos os métodos necessários
                const filteredData = mockData[table as keyof typeof mockData]?.filter((item: any) => {
                  return item && item[column] !== undefined && item[column] == value;
                }) || [];
                
                // Simular uma promise resolvida com os dados filtrados
                return {
                  then: (callback: (result: { data: any, error: null }) => any) => {
                    return Promise.resolve(callback({
                      data: filteredData,
                      error: null
                    }));
                  },
                  catch: (callback: (error: any) => any) => {
                    return Promise.resolve().catch(callback);
                  }
                };
              },
              select: (nestedColumns?: string) => {
                console.log(`[MOCK] SELECT ${nestedColumns || '*'} FROM ${table} WHERE ${column} = ${value}`);
                const filteredData = mockData[table as keyof typeof mockData]?.filter((item: any) => {
                  return item && item[column] !== undefined && item[column] == value;
                }) || [];
                
                const nestedQuery = {
                  data: filteredData,
                  error: null,
                  order: (orderColumn: string, options?: { ascending?: boolean }) => {
                    console.log(`[MOCK] ORDER BY ${orderColumn} ${options?.ascending ? 'ASC' : 'DESC'}`);
                    return nestedQuery;
                  },
                  limit: (count: number) => {
                    console.log(`[MOCK] LIMIT ${count}`);
                    return nestedQuery;
                  },
                  single: () => {
                    console.log(`[MOCK] LIMIT 1 (single)`);
                    
                    // Se estiver buscando um estudante pelo email
                    if (table === 'students' && column === 'email') {
                      const email = value.toString();
                      const isAdmin = email === 'paularacy@gmail.com' || email.includes('admin') || email.includes('paula');
                      
                      return Promise.resolve({
                        data: {
                          id: isAdmin ? 'mock-admin-id' : 'mock-student-id-' + Date.now(),
                          full_name: isAdmin ? 'Paula Racy - Administrador' : 'Estudante Mock',
                          birth_date: '1990-01-01',
                          email: email,
                          unit: 'SP',
                          is_admin: isAdmin,
                          is_active: true,
                          is_guest: false,
                          created_at: new Date().toISOString(),
                          updated_at: new Date().toISOString()
                        },
                        error: null
                      });
                    }
                    
                    // Se estiver buscando registros de presença pelo student_id
                    if (table === 'attendance_records' && column === 'student_id') {
                      if (filteredData.length > 0) {
                        return Promise.resolve({
                          data: filteredData[0], // Retorna o primeiro registro para single()
                          error: null
                        });
                      }
                    }
                    
                    return Promise.resolve({ data: null, error: null });
                  }
                };
                return nestedQuery;
              },
              single: () => {
                console.log(`[MOCK] SELECT * FROM ${table} WHERE ${column} = ${value} LIMIT 1`);
                
                // Se estiver buscando um estudante pelo email
                if (table === 'students' && column === 'email') {
                  const email = value.toString();
                  const isAdmin = email === 'paularacy@gmail.com' || email.includes('admin') || email.includes('paula');
                  
                  return Promise.resolve({
                    data: {
                      id: isAdmin ? 'mock-admin-id' : 'mock-student-id-' + Date.now(),
                      full_name: isAdmin ? 'Paula Racy - Administrador' : 'Estudante Mock',
                      birth_date: '1990-01-01',
                      email: email,
                      unit: 'SP',
                      is_admin: isAdmin,
                      is_active: true,
                      is_guest: false,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString()
                    },
                    error: null
                  });
                }
                
                return Promise.resolve({ data: null, error: null });
              }
            };
            
            return eqResult;
          }
        };
        
        return query;
      },
      insert: (data: any) => {
        console.log(`[MOCK] INSERT INTO ${table}`, data);
        return Promise.resolve({ data: { ...data, id: 'mock-id-' + Date.now() }, error: null });
      },
      update: (data: any) => {
        console.log(`[MOCK] UPDATE ${table}`, data);
        return Promise.resolve({ data, error: null });
      },
      delete: () => {
        console.log(`[MOCK] DELETE FROM ${table}`);
        return Promise.resolve({ data: null, error: null });
      }
    }),
    auth: {
      getUser: async () => {
        console.log('[MOCK] Auth.getUser()');
        return {
          data: { user: null },
          error: null
        };
      },
      signInWithPassword: async (credentials: { email: string; password: string }) => {
        console.log('[MOCK] Auth.signInWithPassword', credentials.email);
        const user = mockData.students.find(s => s.email === credentials.email);
        
        if (user) {
          return {
            data: {
              user: {
                id: user.id,
                email: user.email,
                user_metadata: {
                  full_name: user.full_name,
                  is_admin: user.is_admin
                }
              }
            },
            error: null
          };
        }
        
        return {
          data: null,
          error: {
            message: 'Invalid login credentials'
          }
        };
      },
      signOut: async () => {
        console.log('[MOCK] Auth.signOut()');
        return { error: null };
      },
      setSession: async (session: { access_token: string; refresh_token?: string }) => {
        console.log('[MOCK] Auth.setSession', session);
        return {
          data: {
            session: {
              access_token: session.access_token,
              refresh_token: session.refresh_token || '',
              user: {
                id: 'mock-user-id',
                email: 'mock@example.com'
              }
            }
          },
          error: null
        };
      },
      updateUser: async (attributes: { password?: string }) => {
        console.log('[MOCK] Auth.updateUser', attributes);
        return {
          data: {
            user: {
              id: 'mock-user-id',
              email: 'mock@example.com'
            }
          },
          error: null
        };
      }
    }
  };
}
