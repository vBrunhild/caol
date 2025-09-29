# Sistema de Gestão CAOL

## Sobre o Projeto

Sistema web de gestão e análise de dados empresariais desenvolvido com React, TypeScript, Node.js e SQLite. O projeto oferece uma interface intuitiva para visualização e análise de métricas de negócio, focando em consultores, clientes e desempenho financeiro.

## Tecnologias Utilizadas

### Frontend
- **React** com TypeScript
- **Material-UI (MUI)** - Interface de usuário
- **Recharts** - Visualização de dados
- **TanStack Query** - Gerenciamento de estado e cache
- **Day.js** - Manipulação de datas

### Backend
- **Node.js** com Express
- **TypeScript**
- **SQLite** - Banco de dados

## Funcionalidades Principais

### 1. Dashboard
- **Visão Geral Mensal**: Métricas consolidadas do mês selecionado
- **KPIs Principais**:
  - Receita total
  - Número de faturas emitidas
  - Ordens de serviço
  - Valor médio por fatura
- **Comparação Temporal**: Indicadores de variação percentual comparando com o mês anterior
- **Destaques do Mês**: Consultor e cliente com melhor desempenho
- **Gráficos Interativos**:
  - Performance dos consultores (gráfico de barras)
  - Top 8 clientes do mês (gráfico de pizza)

### 2. Aba de Consultores
- **Filtros Avançados**:
  - Seleção de período (mês início/fim)
  - Múltipla seleção de consultores
- **Visualizações**:
  - Tabela comparativa mensal entre consultores
  - Gráfico de barras com valores líquidos por mês
  - Linha de referência do custo fixo médio
  - Gráfico de pizza com distribuição total por consultor
- **Detalhamento Individual**:
  - Cards expansíveis por consultor
  - Métricas detalhadas: valor líquido, comissão, custo fixo e lucro
  - Indicador visual de lucro (positivo/negativo)
  - Resumo agregado do período selecionado

### 3. Aba de Clientes
- **Filtros Avançados**:
  - Seleção de período (mês início/fim)
  - Múltipla seleção de clientes
- **Visualizações**:
  - Tabela comparativa mensal entre clientes
  - Destaque do maior valor por mês
  - Gráfico de barras com evolução mensal
  - Gráfico de pizza com distribuição percentual
- **Detalhamento Individual**:
  - Cards expansíveis por cliente
  - Métricas: valor da fatura, impostos e valor líquido
  - Resumo total do período

## Características Técnicas

### Interface de Usuário
- **Design Responsivo**: Adaptável a diferentes tamanhos de tela
- **Tema Claro/Escuro**: Alternância de temas com persistência visual
- **Navegação por Abas**: Interface organizada e intuitiva
- **Carregamento Otimizado**: Estados de loading e mensagens de erro

### Performance
- **Paginação Automática**: Carregamento incremental de dados em lote
- **Cache Inteligente**: TanStack Query para otimização de requisições
- **Queries Otimizadas**: CTEs e agregações no banco de dados

### API REST
- **Endpoints Organizados**:
  - `/api/v1/client` - Gestão de clientes
  - `/api/v1/consultant` - Gestão de consultores
  - `/api/v1/invoice` - Faturas
  - `/api/v1/service-order` - Ordens de serviço
- **Totais Mensais**:
  - `/api/v1/client/monthly-totals`
  - `/api/v1/consultant/monthly-totals`
- **Filtros Flexíveis**: Suporte a múltiplos parâmetros e intervalos de datas
- **Validação de Dados**: Verificação de formatos e parâmetros obrigatórios

## Recursos de Acessibilidade
- Tooltips informativos
- Cores contrastantes
- Indicadores visuais claros
- Componentes semânticos

## Estrutura de Dados

O sistema trabalha com as seguintes entidades principais:
- **Consultores**: Profissionais da empresa com métricas de desempenho
- **Clientes**: Empresas clientes com histórico de faturamento
- **Faturas**: Documentos fiscais com valores e impostos
- **Ordens de Serviço**: Registros de trabalhos realizados
- **Totais Mensais**: Agregações calculadas por período

## Instalação e Execução

Utilizando docker-compose
```bash
docker-compose up
```

## Portas:
- Backend: http://localhost:3000
- Frontend: http://localhost:3001

## Observações

Este é um projeto de demonstração desenvolvido como parte de um processo seletivo, focando em apresentar habilidades em desenvolvimento full-stack, análise de dados e criação de interfaces intuitivas.
