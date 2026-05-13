# Plano de Implementação: Seleção Múltipla de Bairros

## Objetivo
Permitir seleção de múltiplos bairros no formulário de localização, com suporte completo no frontend e backend.

## Análise Atual
- **Frontend**: LocationForm.tsx usa Select single para bairro (string única)
- **Backend**: locationCatalog.neighborhood é VARCHAR(100) - string única
- **Services**: Tratam bairro como string única

## Plano de Implementação

### Fase 1: Backend (Alta Prioridade)
1. **Schema Migration**
   - Alterar locationCatalog.neighborhood: VARCHAR → JSON array
   - Criar migration Drizzle
   - Atualizar tipos TypeScript

2. **Services Update**
   - createLocation: aceitar array de bairros
   - updateLocation: tratar array de bairros
   - Manter compatibilidade com string única (transição)

3. **Validation**
   - Atualizar Zod schemas para array de strings
   - Validação de backend para array não vazio

### Fase 2: Frontend (Alta Prioridade)
4. **Component Creation**
   - MultiSelectNeighborhood component
   - UI com shadcn/ui + react-select
   - Funcionalidades: busca, seleção múltipla, remoção

5. **Form Integration**
   - Substituir Select por MultiSelectNeighborhood
   - Atualizar estado form.neighborhood: string → string[]
   - Validação de frontend

6. **Types Update**
   - LocationPayload.neighborhood: string → string[]
   - Location.neighborhood: string → string[]
   - API calls ajustados

### Fase 3: Suporte (Média Prioridade)
7. **Migration Script**
   - Converter dados existentes: string → array[1]
   - Backup e rollback strategy

8. **Display Updates**
   - LocationList: mostrar array de bairros
   - Survey locations: display múltiplos bairros

### Fase 4: Testes (Média Prioridade)
9. **E2E Testing**
   - Testar criação com múltiplos bairros
   - Testar edição de locais existentes
   - Testar migração de dados

10. **Documentation**
    - Atualizar exemplos e docs
    - Guia de migração para devs

## Considerações Técnicas
- **Performance**: Debounce na busca, virtualização se >100 bairros
- **UX**: Mobile-friendly, accessibility, loading states
- **Compatibilidade**: Aceitar ambos formatos durante transição
- **Validação**: Limite máximo de bairros (ex: 10)

## Riscos
- Migração pode quebrar dados → Mitigação: script cuidadoso + backup
- Performance com muitas opções → Mitigação: lazy loading
- Complexidade no frontend → Mitigação: componente reutilizável

## Dependencies
- Shadcn/ui components já disponíveis
- React-select ou similar para multi-select
- Drizzle migration tools
- Zod validation já configurado