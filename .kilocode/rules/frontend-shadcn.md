---
trigger: glob
globs: "frontend/src/**/*.tsx"
---

# Regras para componentes shadcn

- Use componentes do shadcn (ex: `Button`, `Card`, `Dialog`) importando de `@/components/ui/...`.
- Nunca reinvente botões ou inputs – prefira os componentes prontos.
- A estilização deve usar classes do Tailwind CSS (via `cn()` e variantes).
- Para formulários, use `react-day-picker` para datas, `react-hook-form` (se houver).
- Lazy loading obrigatório para páginas.
