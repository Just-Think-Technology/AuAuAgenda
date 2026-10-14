---
name: nextjs-fullstack
description: Use ao criar ou refatorar páginas, ações, rotas, carregamento de dados ou a migração de frontend/backend para Next.js unificado.
---

# Next.js full-stack

## Modelo
- App Router como sistema de rotas.
- Server Components por padrão; `use client` apenas no menor limite necessário.
- Server Actions para mutações internas originadas pela aplicação.
- Route Handlers para webhooks, APIs externas ou contratos HTTP explícitos.
- Acesso a dados e regras de negócio no servidor; Client Components recebem somente os dados necessários.

## Estratégia de renderização
- SSR não significa que toda a aplicação deve ser dinâmica. Escolha renderização por rota/dado conforme personalização, cache e atualidade exigida.
- Agenda e disponibilidade precisam refletir dados atuais e não podem usar cache público que exponha dados privados ou mostre horários obsoletos.
- Dados públicos estáveis podem ser armazenados em cache com invalidação explícita.
- Use `loading.tsx`, `error.tsx` e boundaries quando melhorarem a experiência.
- Não use `useEffect` como substituto padrão para carregamento inicial de dados.

## Camadas recomendadas
1. UI e rotas (`app`, `components`).
2. Casos de uso/domínio (regras de agendamento, permissões, status).
3. DAL/repositórios server-only (Prisma e consultas).
4. Banco de dados.

Mantenha regras importantes fora de componentes de UI. Use `import 'server-only'` em módulos server-only quando compatível com a configuração do projeto.

## Server Actions
- Validar payload no servidor com a biblioteca de validação já adotada ou uma escolha documentada.
- Obter identidade da sessão no servidor; nunca aceitar `userId` como prova de identidade.
- Autorizar cada recurso individualmente, não apenas verificar se há sessão.
- Retornar resultados tipados e mensagens seguras.
- Revalidar/invalidate cache após mutações quando aplicável.
- Não expor stack traces nem objetos de erro internos.

## Migração frontend + backend
- Primeiro inventariar todas as chamadas HTTP, cookies, tokens, CORS, upload, e-mail, cron jobs, webhooks e tarefas externas.
- Migrar por domínio/fluxo, mantendo compatibilidade temporária quando necessário.
- Substituir chamadas do browser à API interna por Server Actions ou leituras server-side adequadas.
- Migrar autenticação sem invalidar sessões/dados inadvertidamente.
- Reimplementar uploads e e-mails com limites, validação e proteção adequados.
- Só remover os serviços antigos após paridade funcional, testes e verificação dos dados.
- Não importar código Express inteiro para dentro de uma Server Action. Reutilize regras de domínio, adaptando contratos conscientemente.

## Performance
- Evite waterfalls de consultas; paralelize leituras independentes com cuidado.
- Selecione apenas campos necessários.
- Use paginação em listas grandes.
- Não tornar um componente client-side só para facilitar uma consulta.
- Evite cache compartilhado para dados de usuário.
