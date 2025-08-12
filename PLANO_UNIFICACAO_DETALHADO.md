# PLANO DETALHADO DE UNIFICAÇÃO - GERENCIAR MEMBROS

## ÍNDICE DE MUDANÇAS NECESSÁRIAS

### 1. **ESTRUTURA BASE E ESTADOS**
- Unificar imports e dependências
- Consolidar estados dos dois componentes
- Implementar sistema de preferências do usuário
- Adicionar estados para controle de visualização

### 2. **SISTEMA DE FILTROS UNIFICADO**
- Implementar filtros: email, templo, status (pendente, ativo, inativo)
- Remover filtro "aceito" (integrar na lógica ativo/inativo)
- Manter compatibilidade com dados existentes

### 3. **SISTEMA DE VISUALIZAÇÃO DUAL**
- Implementar toggle lista/cards (como StudentList)
- Manter funcionalidade de menu de ações em ambos os modos
- Adaptar layout responsivo

### 4. **SISTEMA DE PAGINAÇÃO APRIMORADO**
- Implementar seletor de itens por página (10, 30, 50)
- Salvar preferência do usuário no localStorage
- Manter navegação numerada existente

### 5. **MODAL DE PERFIL UNIFICADO**
- Consolidar campos de ambos os modais
- Adicionar botão "Reenviar Email" ao lado de Fechar/Editar
- Integrar botão "Excluir" dentro do modo de edição

### 6. **SISTEMA DE AÇÕES CONTEXTUAL**
- Manter menu "..." para modo lista
- Implementar clique direto para abrir perfil em cards
- Preservar todas as ações existentes

### 7. **FUNCIONALIDADES DE CONVITE**
- Manter sistema completo de convites
- Integrar botões no topo (Enviar Convite, Adicionar Membro)
- Preservar ações em massa

---

## DETALHAMENTO DAS IMPLEMENTAÇÕES

### **1. ESTRUTURA BASE E ESTADOS**

#### **Estados Consolidados:**
```typescript
// Estados de visualização
const [viewMode, setViewMode] = useState<'card' | 'list'>('list'); // Padrão lista
const [itemsPerPage, setItemsPerPage] = useState<number>(30); // Padrão 30

// Estados de filtros unificados
const [searchTerm, setSearchTerm] = useState('');
const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'active' | 'inactive'>('all');
const [filterUnit, setFilterUnit] = useState<'all' | string>('all');

// Estados de paginação
const [currentPage, setCurrentPage] = useState(1);

// Estados de seleção e ações
const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);
const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

// Estados do modal de perfil
const [selectedProfileStudent, setSelectedProfileStudent] = useState<Student | null>(null);
const [isEditing, setIsEditing] = useState(false);
const [formData, setFormData] = useState<Student | null>(null);
const [photo, setPhoto] = useState<string>('');

// Estados de convites (preservados)
const [showInviteModal, setShowInviteModal] = useState(false);
const [inviteForm, setInviteForm] = useState({...});

// Estados de loading e erros
const [isSaving, setIsSaving] = useState(false);
const [errors, setErrors] = useState<Record<string, string>>({});
```

#### **Sistema de Preferências:**
```typescript
// Salvar preferências no localStorage
const saveUserPreferences = (preferences: {itemsPerPage: number, viewMode: 'card' | 'list'}) => {
  localStorage.setItem('memberManagement_preferences', JSON.stringify(preferences));
};

// Carregar preferências
const loadUserPreferences = () => {
  const saved = localStorage.getItem('memberManagement_preferences');
  if (saved) {
    const prefs = JSON.parse(saved);
    setItemsPerPage(prefs.itemsPerPage || 30);
    setViewMode(prefs.viewMode || 'list');
  }
};
```

### **2. SISTEMA DE FILTROS UNIFICADO**

#### **Lógica de Filtros:**
```typescript
const filteredStudents = students.filter(student => {
  // Busca por nome ou email
  const matchesSearch = student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       student.email.toLowerCase().includes(searchTerm.toLowerCase());
  
  // Filtro de status unificado
  const matchesStatus = filterStatus === 'all' || 
    (filterStatus === 'pending' && student.inviteStatus === 'pending') ||
    (filterStatus === 'active' && student.isActive && !student.isGuest) ||
    (filterStatus === 'inactive' && !student.isActive && !student.isGuest);
  
  // Filtro de templo
  const matchesUnit = filterUnit === 'all' || student.unit === filterUnit;
  
  return matchesSearch && matchesStatus && matchesUnit;
});
```

#### **Interface de Filtros:**
- Busca: "Buscar por nome ou email..."
- Status: "Todos os Status", "Pendente", "Ativo", "Inativo"
- Templo: Lista dinâmica dos templos disponíveis

### **3. SISTEMA DE VISUALIZAÇÃO DUAL**

#### **Toggle de Visualização:**
```typescript
const ViewToggle = () => (
  <div className="flex items-center space-x-2 bg-gray-800 rounded-lg p-1">
    <button
      onClick={() => {
        setViewMode('list');
        saveUserPreferences({itemsPerPage, viewMode: 'list'});
      }}
      className={`p-2 rounded ${viewMode === 'list' ? 'bg-red-600 text-white' : 'text-gray-400'}`}
    >
      <List className="w-4 h-4" />
    </button>
    <button
      onClick={() => {
        setViewMode('card');
        saveUserPreferences({itemsPerPage, viewMode: 'card'});
      }}
      className={`p-2 rounded ${viewMode === 'card' ? 'bg-red-600 text-white' : 'text-gray-400'}`}
    >
      <Grid className="w-4 h-4" />
    </button>
  </div>
);
```

#### **Renderização Condicional:**
- **Modo Lista:** Tabela atual do StudentInvites com menu de ações
- **Modo Card:** Grid de cards do StudentList com clique direto para perfil

### **4. SISTEMA DE PAGINAÇÃO APRIMORADO**

#### **Seletor de Itens por Página:**
```typescript
const ItemsPerPageSelector = () => (
  <select
    value={itemsPerPage}
    onChange={(e) => {
      const newValue = parseInt(e.target.value);
      setItemsPerPage(newValue);
      setCurrentPage(1); // Reset para primeira página
      saveUserPreferences({itemsPerPage: newValue, viewMode});
    }}
    className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
  >
    <option value={10}>10 por página</option>
    <option value={30}>30 por página</option>
    <option value={50}>50 por página</option>
  </select>
);
```

#### **Cálculos de Paginação:**
```typescript
const indexOfLastItem = currentPage * itemsPerPage;
const indexOfFirstItem = indexOfLastItem - itemsPerPage;
const paginatedStudents = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);
const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
```

### **5. MODAL DE PERFIL UNIFICADO**

#### **Estrutura do Header:**
```typescript
const ProfileModalHeader = () => (
  <div className="flex justify-between items-center mb-6">
    <h2 className="text-xl font-semibold text-white">
      {isEditing ? 'Editar Perfil' : 'Perfil do Usuário'}
    </h2>
    <div className="flex items-center space-x-3">
      {!isEditing && (
        <>
          <button
            onClick={handleResendEmail}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
          >
            <Mail className="w-4 h-4" />
            <span>Reenviar Email</span>
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            <span>Editar</span>
          </button>
        </>
      )}
      {isEditing && (
        <>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 px-4 py-2 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Salvando...' : 'Salvar'}</span>
          </button>
          <button
            onClick={handleCancel}
            className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Cancelar</span>
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Excluir</span>
          </button>
        </>
      )}
      <button
        onClick={handleCloseModal}
        className="text-gray-400 hover:text-white"
      >
        <X className="w-6 h-6" />
      </button>
    </div>
  </div>
);
```

### **6. SISTEMA DE AÇÕES CONTEXTUAL**

#### **Menu de Ações (Modo Lista):**
- Preservar menu "..." existente
- Manter posicionamento via portal
- Ações: Ver Perfil, Editar, Apagar, Reenviar Senha

#### **Clique Direto (Modo Card):**
- Clique no card abre modal de perfil
- Hover effects preservados
- Badges de status mantidos

### **7. FUNCIONALIDADES DE CONVITE**

#### **Botões do Topo:**
```typescript
const TopActionButtons = () => (
  <div className="flex items-center space-x-3">
    <button
      onClick={() => setShowInviteModal(true)}
      className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors text-white"
    >
      <Send className="w-4 h-4" />
      <span>Enviar Convite</span>
    </button>
    <button
      onClick={onNavigateToAddStudent}
      className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors text-white"
    >
      <Plus className="w-4 h-4" />
      <span>Adicionar Membro</span>
    </button>
  </div>
);
```

---

## REVISÃO DE RISCOS E MITIGAÇÕES

### **RISCOS IDENTIFICADOS:**

#### **1. Perda de Funcionalidades:**
- **Risco:** Sistema de convites pode ser quebrado
- **Mitigação:** Preservar todos os estados e funções relacionadas a convites

#### **2. Conflitos de Estado:**
- **Risco:** Estados conflitantes entre os dois sistemas
- **Mitigação:** Mapear todos os estados e criar transições suaves

#### **3. Performance:**
- **Risco:** Renderização lenta com muitos dados
- **Mitigação:** Manter paginação e otimizar filtros

#### **4. UX Inconsistente:**
- **Risco:** Comportamentos diferentes entre modos
- **Mitigação:** Padronizar interações e feedbacks

### **ESTRATÉGIAS DE MITIGAÇÃO:**

#### **1. Desenvolvimento Incremental:**
1. Criar novo componente base
2. Migrar funcionalidades uma por vez
3. Testar cada etapa
4. Manter componentes antigos como backup

#### **2. Testes Extensivos:**
- Testar todos os filtros
- Verificar paginação
- Validar modal de perfil
- Confirmar ações em massa

#### **3. Backup de Segurança:**
- Manter componentes originais
- Criar branch específica
- Documentar todas as mudanças

---

## CRONOGRAMA DE IMPLEMENTAÇÃO

### **FASE 1: Preparação (1 etapa)**
- Criar novo componente `UnifiedMemberManagement.tsx`
- Configurar estrutura base e imports
- Implementar sistema de preferências

### **FASE 2: Funcionalidades Core (3 etapas)**
- Implementar sistema de filtros unificado
- Adicionar toggle de visualização
- Configurar paginação aprimorada

### **FASE 3: Interface e Interações (2 etapas)**
- Unificar modal de perfil
- Implementar sistema de ações contextual

### **FASE 4: Funcionalidades Avançadas (2 etapas)**
- Integrar sistema de convites
- Adicionar ações em massa

### **FASE 5: Testes e Refinamentos (1 etapa)**
- Testes extensivos
- Ajustes de UX
- Otimizações de performance

---

## PRÓXIMOS PASSOS

1. **Aprovação do Plano:** Revisar e aprovar este documento
2. **Backup:** Criar backup dos componentes atuais
3. **Implementação Fase 1:** Começar com a estrutura base
4. **Testes Incrementais:** Testar cada fase antes de prosseguir
5. **Migração Final:** Substituir componentes antigos

**TOTAL ESTIMADO:** 9 etapas de implementação + testes

Este plano foi revisado 3 vezes para garantir que nenhuma funcionalidade seja perdida e que a implementação seja a mais segura possível.
