# Documentação do Componente StudentInvites

## Visão Geral
O componente `StudentInvites` é responsável pelo gerenciamento de convites de alunos no sistema Nosso Templo. Ele permite visualizar, filtrar e gerenciar convites enviados para novos membros, além de fornecer funcionalidades para adicionar novos alunos e gerenciar perfis existentes.

## Funcionalidades Principais

### 1. Gestão de Convites
- Envio de convites por e-mail
- Geração de links de convite
- Acompanhamento do status dos convites (pendentes, aceitos, expirados)
- Filtros avançados (status, unidade, busca por nome/e-mail)

### 2. Gerenciamento de Alunos
- Visualização em lista ou cards
- Seleção múltipla para ações em lote
- Edição de perfis
- Exclusão de alunos
- Filtros de busca

### 3. Interface do Usuário
- Design responsivo
- Modo claro/escuro
- Modais para ações específicas
- Feedback visual para ações
- Paginação

## Estrutura do Componente

### Estados Principais
```typescript
// Estados de controle de interface
const [viewMode, setViewMode] = useState<ViewMode>('list');
const [searchTerm, setSearchTerm] = useState('');
const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'accepted' | 'expired'>('all');
const [filterUnit, setFilterUnit] = useState<'all' | string>('all');

// Estados de seleção e paginação
const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
const [currentPage, setCurrentPage] = useState(1);
const [itemsPerPage, setItemsPerPage] = useState(10);

// Estados para modais
const [showInviteModal, setShowInviteModal] = useState(false);
const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
const [showSendEmailsModal, setShowSendEmailsModal] = useState(false);

// Estados para gerenciamento de alunos
const [selectedProfileStudent, setSelectedProfileStudent] = useState<Student | null>(null);
const [isEditing, setIsEditing] = useState(false);
const [editingStudent, setEditingStudent] = useState<Student | null>(null);
const [formData, setFormData] = useState<Student | null>(null);
```

### Props
```typescript
interface StudentInvitesProps {
  onNavigateToAddStudent?: () => void;
}
```

## Melhorias Implementadas

### 1. Correções de Tipagem
- Corrigido o tipo `ViewMode` para usar 'cards' ao invés de 'card'
- Adicionadas tipagens faltantes para estados e props
- Melhorada a tipagem das funções de manipulação de eventos

### 2. Substituição de Componentes
- Substituído o componente `Link` por botões com ícones apropriados
- Adicionados ícones do Lucide-react para melhorar a interface
- Implementados tooltips para melhorar a usabilidade

### 3. Remoção de Código Não Utilizado
- Removidas funções não utilizadas:
  - `saveUserPreferences`
  - `StudentCard`
  - `handleBulkApprove`
  - `handleBulkReject`
  - `handleApproveStudent`
  - `handleRejectStudent`
- Removidas importações não utilizadas
- Removidas variáveis não utilizadas

### 4. Melhorias de Estado
- Implementada persistência de preferências no localStorage
- Adicionado suporte para itens por página personalizável
- Melhorado o gerenciamento de estado dos formulários
- Adicionada validação de formulário

### 5. Melhorias na Interface
- Ajustes nos botões de visualização (lista/cards)
- Melhorias na responsividade
- Ajustes nos menus de ação
- Adicionados loaders para feedback visual
- Melhorias na acessibilidade

### 6. Funcionalidades Adicionais
- Adicionada seleção múltipla de alunos
- Implementada paginação personalizável
- Adicionada busca por nome/e-mail
- Implementados filtros avançados
- Adicionada exportação de dados

## Fluxo de Trabalho

### Envio de Convite
1. Usuário clica em "Convidar Novo Membro"
2. Preenche o formulário de convite
3. Escolhe entre enviar por e-mail ou gerar link
4. O sistema valida os dados e envia o convite
5. O status do convite é atualizado em tempo real

### Gerenciamento de Alunos
1. Visualização em lista ou cards
2. Filtragem por status, unidade e busca
3. Seleção múltipla para ações em lote
4. Edição de perfil em modal
5. Exclusão com confirmação

## Dependências
- React 18+
- TypeScript
- Lucide React (ícones)
- Tailwind CSS (estilização)
- React Toastify (notificações)

## Próximas Melhorias
- [ ] Implementar drag and drop para upload de fotos
- [ ] Adicionar suporte a anexos nos convites
- [ ] Implementar histórico de alterações
- [ ] Adicionar relatórios de uso
- [ ] Melhorar acessibilidade

## Notas de Versão

### v1.0.0 (12/08/2025)
- Versão inicial do componente
- Implementação das funcionalidades básicas
- Integração com o contexto de dados

### v1.1.0 (12/08/2025)
- Correções de tipagem
- Melhorias na interface do usuário
- Adicionada persistência de preferências
- Remoção de código não utilizado
