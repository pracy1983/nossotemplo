# PLANO REVISADO DE UNIFICAÇÃO - GERENCIAR MEMBROS

## ABORDAGEM GERAL

Este plano revisado especifica **exatamente** quais elementos serão mantidos de cada componente. A abordagem é:

1. **Base Principal**: Usar o `StudentInvites.tsx` como base principal (Gerenciar Membros)
2. **Adicionar Funcionalidades**: Incorporar elementos específicos do `StudentList.tsx` (Lista de Membros)
3. **Preservar Layout**: Manter o layout, posicionamento e responsividade existentes
4. **Sem Reescrita**: Não reescrever do zero, apenas integrar componentes

---

## DETALHAMENTO ESPECÍFICO POR SEÇÃO

### 1. **ESTRUTURA BASE E LAYOUT**

**MANTER DO GERENCIAR MEMBROS (StudentInvites.tsx):**
- Estrutura principal do componente
- Sistema de paginação numerada (1, 2, 3...)
- Layout responsivo existente
- Todos os imports e dependências
- Todos os estados relacionados a convites
- Sistema de menu de ações (...)

**ADICIONAR DA LISTA DE MEMBROS (StudentList.tsx):**
- Botões de toggle de visualização (Lista/Cards)
- Layout de cards para visualização alternativa
- Lógica de filtro para isActive/isInactive

### 2. **CABEÇALHO E FILTROS**

**MANTER DO GERENCIAR MEMBROS (StudentInvites.tsx):**
- Layout do cabeçalho com título "Gerenciar Membros"
- Botões de ação no topo (Enviar Convite)
- Campo de busca com ícone
- Estrutura dos filtros dropdown
- Responsividade do cabeçalho (flex-col em mobile, flex-row em desktop)

**ADICIONAR DA LISTA DE MEMBROS (StudentList.tsx):**
- Botão "Adicionar Membro" (já existe no StudentInvites)
- Opções de filtro para status ativo/inativo
- Botões de toggle de visualização (Lista/Cards)

### 3. **VISUALIZAÇÃO DE MEMBROS**

**MANTER DO GERENCIAR MEMBROS (StudentInvites.tsx):**
- Tabela completa para modo lista
- Sistema de checkboxes para seleção múltipla
- Menu de ações (...) com posicionamento via portal
- Paginação numerada na parte inferior
- Todas as colunas atuais (Nome, Email, Templo, Status, Data, Ações)

**ADICIONAR DA LISTA DE MEMBROS (StudentList.tsx):**
- Componente `StudentCard` para visualização em cards
- Grid responsivo para cards (1-4 colunas dependendo do tamanho da tela)
- Badge para status (ativo/inativo) e fundador
- Clique direto no card para abrir perfil

### 4. **MODAL DE PERFIL**

**MANTER DO GERENCIAR MEMBROS (StudentInvites.tsx):**
- Estrutura completa do modal já sincronizado
- Todos os campos e seções atuais
- Botões de ação (Fechar, Editar)
- Sistema de edição inline
- Upload de foto

**ADICIONAR DA LISTA DE MEMBROS (StudentList.tsx):**
- Botão "Reenviar Email" ao lado de Fechar/Editar
- Botão "Excluir" dentro do modo de edição

### 5. **SISTEMA DE PAGINAÇÃO**

**MANTER DO GERENCIAR MEMBROS (StudentInvites.tsx):**
- Navegação numerada (1, 2, 3...)
- Botões de próximo/anterior
- Posicionamento na parte inferior

**ADICIONAR (NOVO):**
- Seletor de itens por página (10, 30, 50)
- Salvar preferência no localStorage
- Padrão inicial de 30 itens

### 6. **FUNCIONALIDADES DE CONVITES**

**MANTER DO GERENCIAR MEMBROS (StudentInvites.tsx):**
- Modal de envio de convites completo
- Geração de links
- Envio de emails
- Validação de formulário
- Ações em massa para convites

**MODIFICAR:**
- Atualizar lógica de status: quando aceito, torna-se automaticamente membro ativo

---

## IMPLEMENTAÇÃO TÉCNICA DETALHADA

### **1. MODIFICAÇÃO DOS ESTADOS**

```typescript
// MANTER TODOS OS ESTADOS DO STUDENTINVITES.TSX
// ADICIONAR:

// Estado para controle de visualização (do StudentList)
const [viewMode, setViewMode] = useState<'card' | 'list'>(() => {
  // Carregar preferência do localStorage ou usar 'list' como padrão
  const saved = localStorage.getItem('memberManagement_preferences');
  return saved ? JSON.parse(saved).viewMode || 'list' : 'list';
});

// Modificar itemsPerPage para usar preferência
const [itemsPerPage, setItemsPerPage] = useState<number>(() => {
  // Carregar preferência do localStorage ou usar 30 como padrão
  const saved = localStorage.getItem('memberManagement_preferences');
  return saved ? JSON.parse(saved).itemsPerPage || 30 : 30;
});

// Função para salvar preferências
const saveUserPreferences = () => {
  localStorage.setItem('memberManagement_preferences', JSON.stringify({
    viewMode,
    itemsPerPage
  }));
};
```

### **2. ADIÇÃO DO TOGGLE DE VISUALIZAÇÃO**

```tsx
// ADICIONAR NA SEÇÃO DE FILTROS (após os dropdowns existentes)
<div className="flex items-center ml-4">
  <div className="flex items-center space-x-2 bg-gray-800 rounded-lg p-1">
    <button
      onClick={() => {
        setViewMode('list');
        saveUserPreferences();
      }}
      className={`p-2 rounded ${viewMode === 'list' ? 'bg-red-600 text-white' : 'text-gray-400'}`}
    >
      <List className="w-4 h-4" />
    </button>
    <button
      onClick={() => {
        setViewMode('card');
        saveUserPreferences();
      }}
      className={`p-2 rounded ${viewMode === 'card' ? 'bg-red-600 text-white' : 'text-gray-400'}`}
    >
      <Grid className="w-4 h-4" />
    </button>
  </div>
</div>
```

### **3. ADIÇÃO DO SELETOR DE ITENS POR PÁGINA**

```tsx
// ADICIONAR ANTES DA PAGINAÇÃO NUMERADA
<div className="flex items-center justify-between mt-6">
  <div className="flex items-center space-x-2">
    <span className="text-sm text-gray-400">Itens por página:</span>
    <select
      value={itemsPerPage}
      onChange={(e) => {
        const newValue = parseInt(e.target.value);
        setItemsPerPage(newValue);
        setCurrentPage(1); // Reset para primeira página
        saveUserPreferences();
      }}
      className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
    >
      <option value={10}>10</option>
      <option value={30}>30</option>
      <option value={50}>50</option>
    </select>
  </div>
  
  {/* MANTER A PAGINAÇÃO NUMERADA EXISTENTE */}
</div>
```

### **4. IMPLEMENTAÇÃO DA VISUALIZAÇÃO DUAL**

```tsx
// SUBSTITUIR A RENDERIZAÇÃO DA TABELA POR:
{viewMode === 'list' ? (
  // MANTER A TABELA EXISTENTE DO STUDENTINVITES.TSX
  <table className="w-full border-collapse">
    {/* ... código existente da tabela ... */}
  </table>
) : (
  // ADICIONAR O GRID DE CARDS DO STUDENTLIST.TSX
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {paginatedStudents.map(student => (
      <div
        key={student.id}
        onClick={() => {
          setSelectedProfileStudent(student);
          setFormData(student);
          setPhoto(student.photo || '');
          setIsEditing(false);
          setErrors({});
        }}
        className={`bg-gray-900 rounded-xl p-6 border border-gray-800 cursor-pointer transition-all hover:border-red-600 hover:shadow-lg ${
          !student.isActive ? 'opacity-60' : ''
        }`}
      >
        <div className="flex flex-col items-center space-y-4">
          {/* Photo */}
          <div className="relative">
            <img
              src={student.photo || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop'}
              alt={student.fullName}
              className="w-24 h-32 object-cover rounded-lg"
            />
            {student.isFounder && (
              <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                Fundador
              </div>
            )}
          </div>
          
          {/* Info */}
          <div className="text-center">
            <h3 className="font-semibold text-white mb-1">{student.fullName}</h3>
            <p className="text-gray-400 text-sm">{DEFAULT_TEMPLES[student.unit as keyof typeof DEFAULT_TEMPLES]}</p>
            <div className={`mt-2 w-44 text-center py-1 rounded-full text-xs font-medium ${
              student.isActive
                ? 'bg-green-600/20 text-green-400'
                : 'bg-red-600/20 text-red-400'
            }`}>
              {student.isActive ? 'Ativo' : `Inativo desde ${student.inactiveSince || 'N/A'}`}
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
)}
```

### **5. ADIÇÃO DE BOTÕES AO MODAL DE PERFIL**

```tsx
// MODIFICAR O HEADER DO MODAL DE PERFIL
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
        <button
          onClick={handleCloseModal}
          className="text-gray-400 hover:text-white"
        >
          <X className="w-6 h-6" />
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
  </div>
</div>
```

### **6. MODIFICAÇÃO DA LÓGICA DE FILTROS**

```typescript
// MODIFICAR A LÓGICA DE FILTROS PARA INCLUIR ATIVO/INATIVO
const filteredStudents = students.filter(student => {
  // Busca por nome ou email
  const matchesSearch = student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       student.email.toLowerCase().includes(searchTerm.toLowerCase());
  
  // Filtro de status unificado
  const matchesStatus = filterStatus === 'all' || 
    (filterStatus === 'pending' && student.inviteStatus === 'pending') ||
    (filterStatus === 'active' && student.isActive) ||
    (filterStatus === 'inactive' && !student.isActive);
  
  // Filtro de templo
  const matchesUnit = filterUnit === 'all' || student.unit === filterUnit;
  
  return matchesSearch && matchesStatus && matchesUnit;
});
```

### **7. ADIÇÃO DA FUNÇÃO DE REENVIO DE EMAIL**

```typescript
// ADICIONAR FUNÇÃO DE REENVIO DE EMAIL
const handleResendEmail = async () => {
  if (!selectedProfileStudent) return;
  
  try {
    setIsSaving(true);
    
    // Gerar nova senha temporária
    const tempPassword = generateTempPassword();
    
    // Atualizar o estudante com a nova senha
    const updatedStudent = {
      ...selectedProfileStudent,
      tempPassword: tempPassword
    };
    
    // Atualizar no banco de dados
    await updateStudent(updatedStudent.id, updatedStudent);
    
    // Enviar e-mail com a nova senha
    const inviteUrl = `${window.location.origin}/convite/${updatedStudent.inviteToken || ''}`;
    await sendInviteEmail(updatedStudent.email, inviteUrl, updatedStudent.fullName, tempPassword);
    
    toast.success('Email reenviado com sucesso');
  } catch (error) {
    console.error('Erro ao reenviar email:', error);
    toast.error('Erro ao reenviar email');
  } finally {
    setIsSaving(false);
  }
};
```

---

## VERIFICAÇÃO DE RESPONSIVIDADE

Após análise detalhada, o componente `StudentInvites.tsx` já possui uma estrutura responsiva adequada:

- Uso de `flex-col` em mobile e `flex-row` em desktop
- Tabela com overflow-x para dispositivos menores
- Grid responsivo para cards (quando implementado)

Não será necessário modificar a estrutura responsiva existente, apenas garantir que os novos elementos adicionados sigam o mesmo padrão.

---

## PLANO DE IMPLEMENTAÇÃO

### **ETAPA 1: Preparação**
- Fazer backup do código atual
- Adicionar os estados necessários
- Implementar função de preferências

### **ETAPA 2: Adicionar Toggle de Visualização**
- Adicionar botões de toggle na seção de filtros
- Implementar lógica de salvamento de preferência

### **ETAPA 3: Adicionar Visualização em Cards**
- Copiar componente StudentCard do StudentList
- Implementar renderização condicional

### **ETAPA 4: Adicionar Seletor de Itens por Página**
- Adicionar seletor antes da paginação
- Implementar lógica de mudança e salvamento

### **ETAPA 5: Modificar Modal de Perfil**
- Adicionar botão "Reenviar Email"
- Adicionar botão "Excluir" no modo edição
- Implementar funções necessárias

### **ETAPA 6: Ajustar Lógica de Filtros**
- Modificar opções de filtro
- Atualizar lógica de filtragem

### **ETAPA 7: Testes e Ajustes**
- Testar todas as funcionalidades
- Verificar responsividade
- Ajustar problemas encontrados

---

## CONCLUSÃO

Este plano revisado especifica exatamente quais elementos serão mantidos de cada componente e como será feita a integração. A abordagem é preservar o máximo possível do `StudentInvites.tsx` e adicionar funcionalidades específicas do `StudentList.tsx`, mantendo o layout, posicionamento e responsividade existentes.

Nenhum código será reescrito do zero, apenas integrado. O resultado final será um componente unificado que mantém todas as funcionalidades existentes e adiciona novas, com uma experiência de usuário consistente e intuitiva.
