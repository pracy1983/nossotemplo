# Sistema de Gerenciamento Nosso Templo
## Especificações Técnicas Completas

### 1. VISÃO GERAL

**Aplicação:** Sistema de Gerenciamento de Alunos e Eventos
**Nome:** Nosso Templo
**Público:** Administradores e Alunos da comunidade
**Idioma:** Português
**Tema:** Estilo Netflix (fundo preto, texto branco, detalhes vermelhos)

### 2. ARQUITETURA TÉCNICA

**Frontend:**
- React 18 com TypeScript
- Tailwind CSS para estilização
- Lucide React para ícones
- Vite como bundler
- Context API para gerenciamento de estado

**Estrutura de Componentes:**
```
src/
├── components/
│   ├── common/
│   │   ├── Layout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── Calendar.tsx
│   │   └── Modal.tsx
│   ├── auth/
│   │   └── LoginForm.tsx
│   ├── admin/
│   │   ├── Dashboard.tsx
│   │   ├── StudentList.tsx
│   │   ├── AddStudent.tsx
│   │   ├── ManageAdmins.tsx
│   │   ├── Events.tsx
│   │   ├── AttendanceMarker.tsx
│   │   └── Statistics.tsx
│   └── student/
│       └── StudentProfile.tsx
├── contexts/
│   ├── AuthContext.tsx
│   └── DataContext.tsx
├── types/
│   └── index.ts
├── utils/
│   ├── constants.ts
│   └── helpers.ts
└── data/
    └── mockData.ts
```

### 3. SISTEMA DE AUTENTICAÇÃO

**Tipos de Usuário:**
- Administrador: Acesso completo ao sistema
- Aluno: Acesso apenas ao próprio perfil

**Credenciais Padrão:**
- Admin: paularacy@gmail.com / adm@123
- Alunos: email individual / senha própria

**Fluxo de Login:**
1. Validação de email/senha
2. Identificação do tipo de usuário
3. Redirecionamento para painel apropriado

### 4. ESTRUTURA DE DADOS

#### 4.1 Entidade Aluno
```typescript
interface Student {
  id: string
  photo?: string
  fullName: string
  birthDate: string
  cpf: string
  rg: string
  email: string
  phone: string
  religion: string
  unit: 'SP' | 'BH'
  developmentStartDate?: string
  internshipStartDate?: string
  magistInitiationDate?: string
  notEntryDate?: string
  masterMagusInitiationDate?: string
  isFounder: boolean
  isActive: boolean
  inactiveSince?: string
  lastActivity?: string
  attendance: AttendanceRecord[]
  isAdmin: boolean
  isGuest: boolean
}
```

#### 4.2 Entidade Evento
```typescript
interface Event {
  id: string
  title: string
  date: string
  time: string
  description: string
  location: string
  unit: 'SP' | 'BH'
  attendees: string[]
}
```

#### 4.3 Entidade Presença
```typescript
interface AttendanceRecord {
  date: string
  type: 'development' | 'work' | 'monthly' | 'event'
  eventId?: string
}
```

### 5. FUNCIONALIDADES DETALHADAS

#### 5.1 Painel Administrativo
- Dashboard com calendário de eventos
- Navegação lateral com todas as opções
- Botão de logout sempre visível
- Legendas de cores para tipos de eventos

#### 5.2 Gestão de Alunos
**Lista de Alunos:**
- Filtros: Unidade (SP/BH/Todos), Status (Ativo/Inativo/Todos)
- Busca por nome (radical)
- Visualização: Lista ou Cards
- Cards: Foto 3x4, nome, unidade, status
- Lista: Foto pequena, nome, unidade, status
- Membros inativos >3 meses ficam "apagados" visualmente

**Adicionar/Editar Aluno:**
- Upload de foto com ferramenta de crop (3x4)
- Todos os campos pessoais e datas específicas
- Checkbox para Fundador
- Botões: Editar, Salvar, Excluir, Reenviar Senha
- Validação automática de status (ativo/inativo)

#### 5.3 Sistema de Presença
**Calendário Individual:**
- Visualização mensal com destaque no dia atual
- Tipos de presença com cores específicas:
  - Desenvolvimento: Bolinha amarela
  - Trabalho: Bolinha azul claro
  - Mensalidade: Bolinha verde
  - Evento: Bolinha roxa
- Clique no dia abre dropdown de opções
- Apenas ADMs podem marcar presença

**Marcação de Presença:**
- Busca por nome/telefone/email
- Importação via foto com IA (OpenAI)
- Processamento automático de listas de presença
- Gestão de convidados
- Adição automática ou manual

#### 5.4 Gestão de Eventos
- Calendário principal com todos os eventos
- Adição manual de eventos
- Importação do Google Agenda
- Lista de eventos com filtros
- Edição em lote com opção de exclusão

#### 5.5 Sistema de Relatórios
**Estatísticas Principais:**
- Membros ativos/inativos (gráfico pizza)
- Presença por tipo de evento (gráfico barras)
- Mensalidades pagas/inadimplentes (gráfico linha)
- Lista de eventos realizados
- Resumo de convidados

**Filtros Disponíveis:**
- Intervalo de datas
- Tipo de membro
- Unidade (Templo)
- Tipo de atividade

**Exportação:**
- Formatos: PDF e CSV
- Relatórios por categoria

### 6. REGRAS DE NEGÓCIO

#### 6.1 Status de Atividade
- **Ativo:** Padrão para novos alunos
- **Inativo:** Automaticamente após 3 meses sem atividade
- **Atividade:** Qualquer presença em desenvolvimento, trabalho, mensalidade ou evento
- **Manual:** ADMs podem alterar status manualmente

#### 6.2 Tipos de Membros
- **Aluno:** Membro regular com todas as obrigações
- **Convidado:** Sem obrigatoriedade de frequência
- **Fundador:** Marcação especial visível na foto

#### 6.3 Permissões
- **ADM:** Acesso total, podem marcar presença, gerenciar eventos
- **Aluno:** Apenas visualização do próprio perfil
- **Edição limitada:** Alunos não podem editar datas específicas

### 7. INTERFACE E UX

#### 7.1 Tema Visual
- **Cores principais:**
  - Fundo: Preto (#000000)
  - Texto: Branco (#FFFFFF)
  - Detalhes: Vermelho (#DC2626)
  - Sucesso: Verde (#10B981)
  - Aviso: Amarelo (#F59E0B)
  - Info: Azul (#3B82F6)

#### 7.2 Responsividade
- Mobile first design
- Breakpoints: 768px (tablet), 1024px (desktop)
- Componentes adaptáveis
- Navegação otimizada para touch

#### 7.3 Transições
- Animações suaves entre páginas
- Hover states em todos os elementos interativos
- Loading states para operações assíncronas
- Feedback visual imediato

### 8. COMPONENTES ESPECÍFICOS

#### 8.1 Calendário
- Componente reutilizável
- Suporte a múltiplas visualizações
- Integração com eventos e presença
- Navegação mensal/anual

#### 8.2 Upload de Foto
- Drag & drop
- Ferramenta de crop integrada
- Preview em tempo real
- Validação de formato e tamanho

#### 8.3 Filtros e Busca
- Componente de busca universal
- Filtros combinados
- Resultados em tempo real
- Histórico de buscas

### 9. INTEGRAÇÕES

#### 9.1 OpenAI (Processamento de Imagens)
- API para reconhecimento de texto em fotos
- Extração de nomes, datas e tipos de evento
- Validação automática de dados

#### 9.2 Google Calendar
- Importação de eventos
- Sincronização bidirecional
- Autenticação OAuth

#### 9.3 Sistema de Email
- Redefinição de senhas
- Notificações automáticas
- Templates personalizados

### 10. FLUXOS PRINCIPAIS

#### 10.1 Fluxo de Login
1. Usuário insere email/senha
2. Sistema valida credenciais
3. Identifica tipo de usuário
4. Redireciona para painel apropriado

#### 10.2 Fluxo de Cadastro de Aluno
1. ADM acessa "Adicionar Aluno"
2. Preenche formulário completo
3. Upload e crop da foto
4. Sistema gera senha temporária
5. Envia email de boas-vindas

#### 10.3 Fluxo de Marcação de Presença
1. ADM seleciona data no calendário
2. Busca aluno ou importa foto
3. Seleciona tipo de atividade
4. Confirma presença
5. Sistema atualiza registro

### 11. VALIDAÇÕES E SEGURANÇA

#### 11.1 Validações de Entrada
- CPF: Validação algorítmica
- Email: Formato válido
- Datas: Formato DD/MM/AAAA
- Telefone: Padrão brasileiro

#### 11.2 Controle de Acesso
- Autenticação obrigatória
- Sessões com timeout
- Proteção de rotas por tipo de usuário
- Logs de auditoria

### 12. PERFORMANCE

#### 12.1 Otimizações
- Lazy loading de componentes
- Virtualização de listas grandes
- Cache de dados frequentemente acessados
- Compressão de imagens

#### 12.2 Métricas
- Tempo de carregamento < 3s
- First Contentful Paint < 1.5s
- Suporte offline básico

Esta especificação serve como base para o desenvolvimento completo do sistema Nosso Templo, garantindo que todas as funcionalidades sejam implementadas conforme os requisitos estabelecidos.