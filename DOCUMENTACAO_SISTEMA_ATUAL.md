# DOCUMENTAÇÃO COMPLETA DO SISTEMA ATUAL

## ANÁLISE DOS COMPONENTES EXISTENTES

### 1. STUDENTLIST.TSX (Lista de Membros)

#### **Estrutura e Estados:**
- **Imports:** React, Lucide icons, useData context, tipos, constantes, helpers, Modal
- **Estados principais:**
  - `viewMode`: 'card' | 'list' (padrão: 'card')
  - `searchTerm`: string para busca
  - `filterStatus`: 'all' | 'active' | 'inactive' (padrão: 'all')
  - `filterUnit`: 'all' | string (padrão: 'all')
  - `selectedStudent`: Student | null
  - `isEditing`: boolean
  - `isSaving`: boolean
  - `formData`: Partial<Student>
  - `errors`: Record<string, string>
  - `photo`: string

#### **Funcionalidades:**
1. **Visualização:**
   - Modo card (fotos) e lista
   - Filtros por status (ativo/inativo) e unidade
   - Busca por nome
   - Exclui guests da listagem

2. **Modal de Perfil:**
   - Visualização completa do perfil
   - Modo de edição inline
   - Upload de foto
   - Validação de formulário
   - Botões: Editar, Salvar, Cancelar, Excluir

3. **Campos do Modal:**
   - **Informações Pessoais:** Nome, Email, Data Nascimento, Telefone, CPF, RG, Religião, Unidade
   - **Evolução:** Turma, Datas de desenvolvimento, estágio, iniciações
   - **Redes Sociais:** Instagram pessoal e mágicko
   - **Checkboxes:** Fundador, Ativo, Administrador (apenas em edição)

#### **Layout e Estilo:**
- Grid responsivo (1-4 colunas)
- Cards com foto, nome, templo, status
- Badge para fundador
- Cores: verde (ativo), vermelho (inativo)
- Modal em 3 colunas (foto + informações)

---

### 2. STUDENTINVITES.TSX (Gerenciar Membros)

#### **Estrutura e Estados:**
- **Imports:** React, createPortal, Lucide icons, useData, tipos, constantes, helpers, email service, toast, Modal
- **Estados principais:**
  - `filteredStudents`: Student[]
  - `showInviteModal`: boolean
  - `searchTerm`: string
  - `filterStatus`: 'all' | 'pending' | 'accepted' | 'expired'
  - `filterUnit`: 'all' | string
  - `selectedStudents`: Set<string> (seleção múltipla)
  - `currentPage`: number
  - `itemsPerPage`: 10 (fixo)
  - `selectedProfileStudent`: Student | null
  - `isEditing`: boolean
  - `formData`: Student | null
  - `photo`: string
  - `actionMenuOpenId`: string | null
  - `menuPos`: {top, left} | null

#### **Funcionalidades:**
1. **Gerenciamento de Convites:**
   - Modal para enviar convites
   - Geração de links únicos
   - Envio de emails
   - Status: pendente, aceito, expirado

2. **Visualização:**
   - Apenas modo lista (tabela)
   - Paginação (10 itens por página)
   - Seleção múltipla com checkboxes
   - Menu de ações (...) por linha

3. **Menu de Ações:**
   - Ver Perfil
   - Editar
   - Apagar
   - Reenviar Senha
   - Posicionamento dinâmico via portal

4. **Modal de Perfil:**
   - Mesmo layout do StudentList
   - Campos completos (após sincronização recente)
   - Botões: Fechar, Editar, Salvar, Cancelar

5. **Ações em Massa:**
   - Aprovar múltiplos
   - Rejeitar múltiplos
   - Enviar emails em massa

#### **Layout e Estilo:**
- Tabela com colunas: Nome, Email, Templo, Status, Data, Ações
- Paginação numerada
- Menu dropdown posicionado dinamicamente
- Status com cores: amarelo (pendente), verde (aceito), vermelho (expirado)

---

## DIFERENÇAS IDENTIFICADAS

### **Funcionalidades Exclusivas:**

#### StudentList:
- Modo de visualização card/lista
- Filtro por status ativo/inativo
- Botão "Adicionar Aluno"
- Validação robusta de formulário
- Tratamento de erros detalhado

#### StudentInvites:
- Sistema de convites completo
- Paginação
- Seleção múltipla
- Menu de ações contextual
- Ações em massa
- Reenvio de senhas
- Portal para menus

### **Diferenças de Implementação:**
1. **Estados:** StudentInvites tem mais estados para gerenciamento complexo
2. **Filtros:** Diferentes tipos de status
3. **Navegação:** StudentList sem paginação, StudentInvites com paginação
4. **Interação:** StudentList clique direto, StudentInvites menu de ações
5. **Validação:** StudentList mais robusta
6. **Feedback:** StudentList usa alerts, StudentInvites usa toast

---

## ANÁLISE DE DEPENDÊNCIAS

### **Contextos e Hooks:**
- `useData()`: students, updateStudent, deleteStudent, turmas, temples, addStudent
- `useState`, `useEffect`
- `createPortal` (apenas StudentInvites)

### **Serviços Externos:**
- `sendInviteEmail` (apenas StudentInvites)
- `toast` (apenas StudentInvites)

### **Utilitários:**
- Validação: validateCPF, validateEmail
- Formatação: formatCPF, formatPhone, formatDate
- Geração: generateId, generateTempPassword (StudentInvites)

### **Componentes:**
- Modal (comum)
- Ícones Lucide (diferentes conjuntos)

---

## TIPOS E INTERFACES

### **Student Interface (completa):**
```typescript
interface Student {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  birthDate: string;
  cpf?: string;
  rg?: string;
  religion?: string;
  unit: string;
  turmaId?: string;
  photo?: string;
  isActive: boolean;
  isFounder: boolean;
  isAdmin: boolean;
  isGuest: boolean;
  role: 'admin' | 'collaborator' | 'student';
  lastActivity?: string;
  acceptsImageTerms: boolean;
  // Evolução
  developmentStartDate?: string;
  internshipStartDate?: string;
  magistInitiationDate?: string;
  notEntryDate?: string;
  masterMagusInitiationDate?: string;
  // Redes sociais
  instagramPersonal?: string;
  instagramMagicko?: string;
  // Endereço
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  howFoundTemple?: string;
  // Convite
  inviteStatus?: 'pending' | 'accepted' | 'expired';
  inviteToken?: string;
  invitedAt?: string;
  invitedBy?: string;
  tempPassword?: string;
}
```

### **Tipos Específicos:**
- `ViewMode`: 'card' | 'list'
- `FilterStatus`: 'all' | 'active' | 'inactive' (StudentList) | 'all' | 'pending' | 'accepted' | 'expired' (StudentInvites)
- `FilterUnit`: 'all' | string

---

## FLUXOS DE DADOS

### **StudentList:**
1. Carrega students do contexto
2. Filtra por isGuest = false
3. Aplica filtros de busca, status, unidade
4. Renderiza em card ou lista
5. Clique abre modal de perfil
6. Edição inline no modal
7. Salva via updateStudent

### **StudentInvites:**
1. Carrega students do contexto
2. Filtra por inviteStatus/inviteToken
3. Aplica filtros e paginação
4. Renderiza tabela com ações
5. Menu contextual para ações
6. Modal de perfil separado
7. Ações em massa disponíveis

---

## PONTOS CRÍTICOS IDENTIFICADOS

### **Potenciais Problemas na Unificação:**
1. **Estados conflitantes:** Diferentes tipos de filtros
2. **Lógica de filtros:** isGuest vs inviteStatus
3. **Paginação:** Presente apenas em StudentInvites
4. **Seleção múltipla:** Apenas StudentInvites
5. **Menu de ações:** Portal vs modal direto
6. **Validação:** Diferentes níveis de robustez
7. **Feedback:** Alert vs Toast
8. **Dependências:** createPortal, emailService, toast

### **Dados que podem ser perdidos:**
1. **Funcionalidade de convites completa**
2. **Sistema de paginação**
3. **Seleção múltipla e ações em massa**
4. **Menu contextual posicionado**
5. **Reenvio de senhas**
6. **Validações específicas**
7. **Estados de loading e erro**

---

## CONCLUSÃO DA ANÁLISE

O sistema atual possui duas abordagens distintas mas complementares:
- **StudentList:** Foco na visualização e edição individual
- **StudentInvites:** Foco no gerenciamento em massa e convites

A unificação requer cuidado especial para preservar todas as funcionalidades enquanto cria uma interface coesa e intuitiva.
