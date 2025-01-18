# Documentação de Design do Projeto "Nosso Templo"

## 1. Sistema de Design

### Princípios
- **Simplicidade**: Interface limpa e intuitiva
- **Consistência**: Padrões visuais uniformes
- **Acessibilidade**: Contraste adequado e navegação clara
- **Responsividade**: Adaptação a diferentes dispositivos

## 2. Esquema de Cores

### Paleta Principal
- **Primária**: #2563EB (Azul vibrante)
- **Secundária**: #1E40AF (Azul escuro)
- **Acentuação**: #F59E0B (Laranja)

### Neutros
- **Fundo**: #F8FAFC (Branco suave)
- **Texto**: #1E293B (Cinza escuro)
- **Bordas**: #E2E8F0 (Cinza claro)

### Estados
- **Sucesso**: #10B981 (Verde)
- **Erro**: #EF4444 (Vermelho)
- **Aviso**: #F59E0B (Laranja)
- **Info**: #3B82F6 (Azul claro)

## 3. Tipografia

### Fontes
- **Principal**: Inter (Sans-serif)
- **Monospace**: JetBrains Mono (Códigos)

### Escala
- **H1**: 2.5rem (40px)
- **H2**: 2rem (32px)
- **H3**: 1.75rem (28px)
- **H4**: 1.5rem (24px)
- **Parágrafo**: 1rem (16px)
- **Pequeno**: 0.875rem (14px)

### Pesos
- **Regular**: 400
- **Medium**: 500
- **Semi-bold**: 600
- **Bold**: 700

## 4. Espaçamento

### Escala
- **Base**: 4px
- **XS**: 4px
- **S**: 8px
- **M**: 16px
- **L**: 24px
- **XL**: 32px
- **XXL**: 48px

### Aplicação
- **Padding**: M (16px)
- **Margin**: L (24px)
- **Gap**: S (8px)

## 5. Componentes Visuais

### Botões
- **Primário**: Fundo azul, texto branco, borda arredondada
- **Secundário**: Borda azul, fundo transparente
- **Tamanhos**: Pequeno (32px), Médio (40px), Grande (48px)

### Cards
- **Fundo**: Branco
- **Sombra**: 0 1px 3px rgba(0,0,0,0.12)
- **Borda**: 1px sólida #E2E8F0
- **Radius**: 8px

### Formulários
- **Inputs**: Altura 40px, padding 12px
- **Labels**: 14px, peso 500
- **Placeholder**: Cor #94A3B8

## 6. Layout

### Grid
- **Colunas**: 12
- **Gutter**: 24px
- **Breakpoints**:
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px

### Estrutura
- **Header**: Altura fixa 64px
- **Sidebar**: Largura 240px (Desktop)
- **Conteúdo**: Espaçamento interno 24px
- **Footer**: Altura 80px

## 7. Animações e Transições

### Durações
- **Rápida**: 150ms
- **Média**: 300ms
- **Lenta**: 500ms

### Efeitos
- **Hover**: Escurecimento 10%
- **Foco**: Sombra azul
- **Ativo**: Escala 95%

## 8. Responsividade

### Breakpoints
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

### Padrões
- Mobile-first
- Colapso de sidebar em mobile
- Menu hambúrguer abaixo de 1024px
- Ajuste automático de tamanhos de fonte
