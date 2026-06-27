# Prompt
Você é um engenheiro de software sênior com conhecimento completo do seguinte stack:

Frontend: React 19, Vite 8, TypeScript estrito, Tailwind CSS 4, shadcn/ui (Radix UI), Redux Toolkit + RTK Query, React Router 7, Recharts, Better Auth.
Backend: Node.js 20, Express 5.2.1, TypeScript estrito, Drizzle ORM, PostgreSQL, BullMQ, Redis, Zod 4.3.6, Better Auth 1.6.5.
Arquivo-chave: `SurveyForm.tsx` (tela de criação/edição de pesquisas).

Preciso que você elabore um PLANO DE IMPLEMENTAÇÃO DETALHADO (somente o plano, sem escrever o código final) para adicionar uma **calculadora interativa de margem de erro** a essa tela de criação de pesquisa.

REQUISITOS DA FUNCIONALIDADE:
1. O usuário pode alternar entre dois modos:
   - Informar o tamanho da amostra → o sistema calcula e exibe a margem de erro.
   - Informar a margem de erro desejada → o sistema calcula e exibe o tamanho mínimo de amostra.
2. Os cálculos devem considerar população infinita (padrão) ou população finita (caso o usuário informe o tamanho da população).
3. Nível de confiança configurável (padrão 95%).
4. Proporção esperada configurável (padrão 50%).
5. Os resultados (tamanho da amostra e margem de erro) precisam ser armazenados no banco de dados e reaproveitados em relatórios posteriores.
6. O formulário de criação de pesquisa (`SurveyForm.tsx`) deve integrar o componente de calculadora de forma orgânica.
7. O backend deve validar e recalcular os valores para garantir consistência antes de persistir.

FÓRMULAS A UTILIZAR:
- Margem de erro (e) a partir do tamanho da amostra (n):
  - População infinita: e = Z * sqrt( p * q / n )
  - População finita (N): e = Z * sqrt( p * q * (N - n) / ( n * (N - 1) ) )
- Tamanho da amostra (n) a partir da margem de erro (e):
  - População infinita: n = ceil( Z² * p * q / e² )
  - População finita: n = ceil( (N * Z² * p * q) / ( (N - 1) * e² + Z² * p * q ) )
- Z para 95% = 1.96; p (proporção) = 0.5 por padrão; q = 1 - p.

RESTRIÇÕES IMPORTANTES:
- O projeto utiliza TypeScript estrito, Zod para validação e Drizzle ORM.
- A calculadora deve ter feedback em tempo real (debounce de ~300ms).
- O design deve seguir o sistema shadcn/ui + Tailwind.
- O plano precisa cobrir tanto o frontend quanto o backend, incluindo alterações no banco (migration) e endpoints necessários.

FORMATO DA RESPOSTA ESPERADA:
Me entregue um PLANO PASSO A PASSO, organizado em seções, com a seguinte estrutura:
1. Alterações no banco de dados (colunas novas, migration).
2. Funções de cálculo utilitárias no backend (arquivo e assinaturas).
3. Esquemas de validação (Zod) e lógica de consistência no servidor.
4. Endpoint(s) de API necessários (rota, payload, resposta).
5. Componente React reutilizável para a calculadora (nome do arquivo, props, estados, integração com os inputs).
6. Integração com `SurveyForm.tsx` (onde inserir, como conectar ao Redux/estado).
7. Ajustes no endpoint de criação/edição da pesquisa.
8. Exibição dos dados de margem/amostra nos relatórios existentes.
9. Observações sobre testes e boas práticas (TypeScript, performance, acessibilidade).

Inclua, quando apropriado, sugestões de nomes de arquivos e referência às bibliotecas específicas do stack (ex: componentes shadcn/ui como `Tabs`, `Input`, `Select`, `Alert`).

NÃO ESCREVA O CÓDIGO PRONTO. Somente o plano de implementação, com detalhes suficientes para que um desenvolvedor possa executar cada etapa.

# Plano de Implementação: Margem de Erro

### OBJETIVO
Implementar uma calculadora interativa de margem de erro na tela de criação/edição de pesquisas (`SurveyForm.tsx`), com suporte a população infinita e finita. O usuário poderá:
- Informar o tamanho da amostra e visualizar a margem de erro resultante.
- Informar a margem de erro desejada e visualizar o tamanho mínimo de amostra necessário.
Ambos os valores (tamanho da amostra e margem de erro) devem ser armazenados no banco de dados (modelo da pesquisa) e disponíveis em relatórios.

### CONTEXTO DO PROJETO
**Frontend:** React 19, Vite 8, TypeScript estrito, Tailwind CSS 4, shadcn/ui (Radix UI), Redux Toolkit + RTK Query, React Router 7, Recharts, Better Auth.  
**Backend:** Node.js v20, Express 5.2.1, TypeScript estrito, Drizzle ORM, PostgreSQL, BullMQ, Redis, Zod 4.3.6, Better Auth 1.6.5.  
**Arquivo-chave atual:** `SurveyForm.tsx` (frontend) gerencia os dados da pesquisa.  
**Banco de dados:** as pesquisas já são persistidas via Drizzle; o schema precisará ser estendido.  
**Acesso:** você tem acesso completo ao repositório.

### REGRAS DE NEGÓCIO (FÓRMULAS)
As fórmulas devem ser implementadas exatamente como abaixo, tanto no backend (cálculo confiável) quanto no frontend (para feedback instantâneo otimista, mas a validação final deve vir do servidor).

**Parâmetros:**
- `Z` = valor crítico da distribuição normal para o nível de confiança desejado (padrão 95% → 1.96).
- `p` = proporção esperada de respostas positivas (padrão 0.5 quando desconhecida).
- `q = 1 - p`
- `n` = tamanho da amostra
- `N` = tamanho da população (opcional, apenas para população finita)
- `e` = margem de erro

**Cálculo da margem de erro (e) a partir de n:**
- População infinita (ou N não fornecido):  
  `e = Z * sqrt( p * q / n )`
- População finita (N conhecido e n relevante):  
  `e = Z * sqrt( p * q * (N - n) / ( n * (N - 1) ) )`

**Cálculo do tamanho da amostra (n) a partir de e:**
- População infinita:  
  `n = (Z² * p * q) / e²`  
  Arredondar para cima.
- População finita:  
  `n = (N * Z² * p * q) / ( (N - 1) * e² + Z² * p * q )`  
  Arredondar para cima.

### PLANO DE IMPLEMENTAÇÃO PASSO A PASSO

#### 1. EXTENSÃO DO ESQUEMA DO BANCO DE DADOS (DRIZZLE)
- Adicionar ao schema da tabela de pesquisas (`surveys`) as seguintes colunas (todas opcionais, exceto quando usadas):
  - `sample_size` – integer (tamanho da amostra informado pelo usuário)
  - `margin_of_error` – real (margem de erro calculada, ex: 0.05 para 5%)
  - `population_size` – integer | null (tamanho da população, para correção finita)
  - `confidence_level` – real (padrão 0.95)
  - `expected_proportion` – real (padrão 0.5)
- Criar a migration correspondente (ex.: `npx drizzle-kit generate`).
- **Atenção:** Manter compatibilidade com pesquisas já existentes (valores nulos tratados como ausência de cálculo).

#### 2. BACKEND – FUNÇÕES UTILITÁRIAS DE CÁLCULO
Criar um novo arquivo `src/lib/survey-calculator.ts` (ou similar) com as seguintes funções puras exportadas:
```typescript
export interface CalculatorParams {
  confidenceLevel: number; // ex: 0.95
  expectedProportion: number; // ex: 0.5
  populationSize?: number; // undefined → infinita
}

export function calcMarginOfError(
  sampleSize: number,
  params: CalculatorParams
): number {
  const Z = getZScore(params.confidenceLevel);
  const p = params.expectedProportion;
  const q = 1 - p;
  if (params.populationSize) {
    // finita
    return Z * Math.sqrt((p * q * (params.populationSize - sampleSize)) / (sampleSize * (params.populationSize - 1)));
  }
  return Z * Math.sqrt((p * q) / sampleSize);
}

export function calcSampleSize(
  marginOfError: number,
  params: CalculatorParams
): number {
  const Z = getZScore(params.confidenceLevel);
  const p = params.expectedProportion;
  const q = 1 - p;
  if (params.populationSize) {
    const N = params.populationSize;
    const numerator = N * Z * Z * p * q;
    const denominator = (N - 1) * marginOfError * marginOfError + Z * Z * p * q;
    return Math.ceil(numerator / denominator);
  }
  const n = (Z * Z * p * q) / (marginOfError * marginOfError);
  return Math.ceil(n);
}

function getZScore(confidence: number): number {
  // Mapeamento simples; para 95% → 1.96, 90% → 1.645, 99% → 2.576
  const map: Record<number, number> = {
    0.90: 1.645,
    0.95: 1.96,
    0.99: 2.576,
  };
  return map[confidence] ?? 1.96;
}
```

#### 3. BACKEND – VALIDAÇÃO COM ZOD

