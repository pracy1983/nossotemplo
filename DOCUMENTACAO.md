# Documentação do Projeto "Nosso Templo"

## 1. Visão Geral
O aplicativo "Nosso Templo" é uma plataforma de gerenciamento de alunos, eventos e presença voltada para administradores e membros da comunidade. A aplicação está sendo desenvolvida com:

- **Frontend**: React + TypeScript
- **Estilo**: Tailwind CSS
- **Bundler**: Vite
- **Autenticação**: Supabase
- **Gerenciamento de Estado**: Zustand
- **Roteamento**: React Router

## 2. Mapeamento de Funcionalidades

| Requisito | Status | Observações |
|-----------|--------|-------------|
| **1. Tela de Login** | ✅ Implementado | Componente `LoginForm` existente |
| **2. Painel ADM** | 🚧 Parcial | Páginas básicas criadas (`Dashboard`, `Attendance`, etc) |
| **3. Lista de Alunos** | 🚧 Parcial | Componente `StudentCard` e `StudentFilters` existentes |
| **4. Adicionar Aluno** | ❌ Pendente | - |
| **5. Gerenciar ADMs** | ❌ Pendente | - |
| **6. Eventos** | 🚧 Parcial | Página `Events` e componente `EventCalendar` existentes |
| **7. Marcar Presença** | 🚧 Parcial | Página `Attendance` e componente `AttendanceCalendar` existentes |
| **8. Estatísticas** | ❌ Pendente | - |
| **9. Perfil do Aluno** | ❌ Pendente | - |
| **10. Painel do Aluno** | ❌ Pendente | - |

## 3. Estrutura de Pastas

```
src/
├── components/          # Componentes reutilizáveis
│   ├── AdminLayout.tsx
│   ├── AttendanceCalendar.tsx
│   ├── EventCalendar.tsx
│   ├── ImportForm.tsx
│   ├── ImportPreview.tsx
│   ├── LoadingScreen.tsx
│   ├── LoginForm.tsx
│   ├── StudentCard.tsx
│   └── StudentFilters.tsx
├── hooks/               # Custom hooks
│   ├── useAuth.ts       # Autenticação
│   └── useStudents.ts   # Gerenciamento de alunos
├── lib/                 # Bibliotecas e utilitários
│   ├── auth.ts          # Lógica de autenticação
│   └── supabase.ts      # Configuração do Supabase
├── pages/               # Páginas da aplicação
│   ├── admin/           # Área administrativa
│   │   ├── Attendance.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Events.tsx
│   │   ├── ImportStudents.tsx
│   │   ├── Statistics.tsx
│   │   └── StudentsList.tsx
│   └── student/         # Área do aluno
│       └── Profile.tsx
├── routes/              # Configuração de rotas
│   ├── index.tsx
│   └── PrivateRoute.tsx # Rota protegida
├── store/               # Gerenciamento de estado
│   └── authStore.ts     # Estado de autenticação
├── types/               # Tipos TypeScript
│   ├── database.ts      # Tipos do banco de dados
│   └── index.ts
└── utils/               # Utilitários
    ├── csv.ts           # Processamento de CSV
    └── sheets.ts        # Integração com planilhas
```

## 4. Componentes Existentes

### LoginForm
- Implementa a tela de login
- Integrado com Supabase para autenticação
- Validação básica de campos

### AdminLayout
- Layout base para páginas administrativas
- Contém menu lateral e cabeçalho

### StudentCard
- Exibe informações básicas de um aluno
- Suporta diferentes modos de visualização

### EventCalendar
- Exibe eventos em formato de calendário
- Integração básica com Google Calendar

## 5. Integrações

### Supabase
- Autenticação de usuários
- Armazenamento de dados
- Migrações configuradas

### Google APIs
- Integração com Google Calendar
- Chave API configurada no .env

## 6. Próximos Passos

1. Implementar tela de cadastro de alunos
2. Desenvolver funcionalidade de estatísticas
3. Criar perfil do aluno
4. Implementar painel do aluno
5. Adicionar funcionalidade de gerenciamento de ADMs
6. Melhorar integração com Google Calendar
7. Implementar exportação de dados (PDF/CSV)
8. Adicionar testes unitários e de integração
