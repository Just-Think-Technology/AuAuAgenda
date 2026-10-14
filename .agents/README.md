# Stack de agentes — AuAuAgenda

Esta pasta padroniza a evolução do AuAuAgenda de um sistema voltado a clínicas veterinárias para uma plataforma de agendamento e gestão de banho e tosa.

## Como instalar
1. Extraia o arquivo ZIP na raiz do repositório existente.
2. Confirme que a pasta `.agents/` ficou ao lado de `frontend/` e `backend/` (ou da estrutura atual do projeto).
3. Leia primeiro `AGENTS.md`.
4. Use as skills em `.agents/skills/` conforme o tipo de tarefa.

> Esta entrega contém instruções, padrões e skills para orientar a implementação. Ela não migra nem apaga automaticamente o código existente.

## Direção arquitetural
- Aplicação unificada em Next.js App Router, TypeScript e React.
- Renderização no servidor por padrão (Server Components / SSR quando adequado).
- Client Components apenas para interações que realmente precisem de estado do navegador.
- Chamadas client-to-server usando Server Actions para mutações internas e Route Handlers quando uma API HTTP pública/integração for necessária.
- Prisma como camada de acesso a dados, preservando o PostgreSQL existente até uma decisão explícita de migração.
- Separação lógica por domínio dentro da aplicação, sem manter serviços frontend/backend independentes como destino arquitetural.

## Skills
- `product-domain`: regras de negócio e linguagem do produto.
- `nextjs-fullstack`: arquitetura Next.js full-stack e estratégia de migração.
- `ui-ux-accessibility`: interface responsiva, acessível e consistente.
- `data-prisma`: modelagem de dados, Prisma e migrações seguras.
- `auth-security`: autenticação, autorização, validação e segurança.
- `booking-scheduling`: disponibilidade e regras de agendamento.
- `testing-quality`: testes e critérios de aceite.
- `project-conventions`: convenções gerais e fluxo de trabalho.
