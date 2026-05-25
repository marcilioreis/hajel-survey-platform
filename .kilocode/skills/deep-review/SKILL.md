---
name: deep-review
description: Executa uma revisão de código profunda, verificando segurança, performance, estilo e aderência às convenções do projeto.
---

# Deep Code Review Skill

## Objetivo
Realizar uma revisão sistemática de código, considerando:
- Segurança (injeções, autenticação, validação)
- Performance (consultas N+1, uso de índices, cache)
- Estilo e boas práticas (regras do `hajel-core-conventions`)
- Tratamento de erros e edge cases
- Gerenciamento de recursos (conexões, filas, arquivos)

## Fluxo de execução

### Passo 1: Entender o escopo
Peça ao usuário o contexto da mudança (PR, arquivo específico, ou descrição do problema).  
Se não for informado, analise os arquivos modificados recentemente (git diff).

### Passo 2: Revisão de segurança
Utilize o checklist em `security-checklist.md`.  
Para cada item, verifique se o código está vulnerável.

### Passo 3: Revisão de performance
Utilize o guia `performance-patterns.md`.  
Identifique potenciais gargalos (ex: queries sem índice, loops desnecessários, falta de cache).

### Passo 4: Revisão de estilo e convenções
Verifique se o código segue:
- Formatação Prettier (ponto e vírgula, aspas, indentação)
- Regras ESLint (parâmetros com `_`, sem `any`, sem `console.log`)
- Estrutura de camadas (controller → service → db)
- Mensagens de erro em português
- Uso de `lazyPage()` no frontend, evitando `useEffect` desnecessário

### Passo 5: Saída
Gere um relatório estruturado com:
- **Resumo**: principais problemas encontrados
- **Tabela de achados** (arquivo, linha, gravidade, descrição, sugestão)
- **Recomendações finais** (próximos passos, testes sugeridos)

## Exemplo de uso
Usuário: `@deep-review` (sem argumentos) → analisa alterações não commitadas.  
Usuário: `@deep-review #123` → analisa o PR 123 (se integrado com GitHub).  
Usuário: `@deep-review src/modules/surveys/surveys.service.ts` → analisa apenas aquele arquivo.
