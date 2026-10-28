# AuAuAgenda — instruções para agentes de desenvolvimento

## 1. Missão do produto
Transformar o sistema atual de clínica veterinária em uma plataforma para pet shops que oferecem banho, tosa e serviços relacionados. O produto possui dois espaços principais:
1. **Área do cliente:** cadastro e gestão dos próprios pets, consulta de serviços, visualização de horários disponíveis, criação e acompanhamento de agendamentos.
2. **Área de gestão:** visão operacional dos agendamentos por dia, consulta dos detalhes necessários para executar cada serviço e atualização do status do atendimento.

Não trate o produto como prontuário médico. Conceitos veterinários existentes devem ser avaliados e substituídos por conceitos operacionais de pet shop quando fizer sentido.

## 2. Arquitetura-alvo
- Um único projeto Next.js com App Router, TypeScript e React, concentrando interface e lógica server-side.
- Não criar ou manter `frontend/` e `backend/` como serviços independentes na arquitetura final.
- Renderizar no servidor por padrão. Use Server Components para leitura e composição inicial de páginas.
- Use Client Components somente para interações que precisem de estado no navegador, APIs do browser, componentes interativos ou atualizações locais.
- Use Server Actions para mutações internas disparadas pela UI, com validação e autorização no servidor.
- Use Route Handlers para webhooks, integrações externas, endpoints consumidos por outros clientes ou APIs HTTP que precisem existir explicitamente.
- Acesso ao banco somente no servidor. Nunca importar Prisma, segredos ou módulos de servidor em Client Components.
- Evitar `useEffect` para carregar dados que possam ser obtidos no servidor.
- Não adicionar uma camada de API HTTP interna desnecessária entre Server Components e banco de dados.
- Manter PostgreSQL e Prisma existentes até que a inspeção do código e uma decisão documentada justifiquem alteração.
- Não introduzir novas bibliotecas sem necessidade concreta; verificar primeiro o que já existe no projeto.

## 3. Organização sugerida
Adapte gradualmente à estrutura real; não mova arquivos em massa sem mapear dependências.

- `app/` — rotas, layouts, páginas, loading/error boundaries e Route Handlers.
- `app/(public)/` — páginas públicas e descoberta de serviços, se necessárias.
- `app/(customer)/` — área autenticada do cliente.
- `app/(management)/` — painel operacional/administrativo.
- `app/actions/` — Server Actions organizadas por domínio.
- `components/ui/` — componentes de UI reutilizáveis.
- `components/<feature>/` — componentes específicos de funcionalidade.
- `lib/` — utilitários compartilhados, validação e configuração.
- `lib/server/` — módulos exclusivamente server-side (banco, sessão, serviços).
- `lib/dal/` — funções de acesso a dados com autorização e seleção explícita de campos.
- `prisma/` — schema e migrações.
- `types/` — tipos compartilhados quando não puderem ser inferidos dos schemas.

Não force essa estrutura se a base atual tiver convenções úteis. Registre desvios importantes.

## 4. Domínios do produto
- **Clientes:** dados de contato e conta.
- **Pets:** nome, espécie, raça opcional, porte, observações operacionais relevantes e vínculo com o tutor.
- **Serviços:** nome, descrição, duração estimada, preço (se aplicável), espécies/portes atendidos e disponibilidade.
- **Agenda:** data, horário, pet, tutor, serviço(s), status, observações e timestamps.
- **Disponibilidade:** horários de funcionamento, duração dos serviços, bloqueios e prevenção de conflito.
- **Gestão:** agenda diária, filtros, detalhes do agendamento e atualização de status.
- **Configuração do pet shop:** nome, fuso horário, horários de funcionamento e políticas de cancelamento, conforme escopo confirmado.

Evite presumir múltiplas unidades, pagamentos online, notificações, recorrência ou marketplace sem requisito explícito.

## 5. Regras obrigatórias
- Antes de implementar, inspecione a estrutura, scripts, dependências, schema Prisma, autenticação e fluxos existentes.
- Preserve funcionalidades válidas e dados existentes. Não remova tabelas ou campos antes de mapear uso e criar plano de migração.
- Não faça alterações destrutivas no banco, nem execute migrações em produção sem autorização explícita.
- Toda mutação deve validar entrada no servidor e verificar identidade/permissão.
- O cliente só pode ver e alterar os próprios dados e agendamentos, segundo as regras do produto.
- Usuários de gestão só podem acessar funções administrativas após autorização explícita.
- Não confie em IDs, preços, status, duração ou permissões enviados pelo navegador.
- Trate datas e horários com fuso horário definido; evite comparar horários em strings ou confiar no fuso implícito do servidor.
- Previna agendamentos sobrepostos por regra server-side e, quando possível, garantias transacionais/índices no banco.
- Nunca exponha segredos, tokens, hashes de senha ou dados pessoais desnecessários em logs/respostas.
- Prefira mudanças pequenas, testáveis e reversíveis.
- Não afirme que build, lint, testes ou migração passaram sem executá-los.

## 6. Processo de trabalho
1. Entenda o fluxo atual e liste os arquivos afetados.
2. Descreva a solução mais simples que respeite esta arquitetura.
3. Identifique impacto no banco, autenticação, rotas e compatibilidade de dados.
4. Implemente em etapas pequenas.
5. Execute os checks disponíveis (lint, typecheck, testes e build).
6. Relate o que mudou, os comandos executados, os resultados e os riscos pendentes.

## 7. Critérios de qualidade
- TypeScript estrito; evitar `any` e casts sem justificativa.
- Componentes acessíveis, responsivos e com estados de carregamento, vazio, erro e sucesso.
- Consultas com seleção explícita de campos e paginação quando apropriado.
- Erros de domínio previsíveis; mensagens ao usuário claras e sem detalhes internos.
- Não duplicar regras de negócio entre UI e servidor.
- Não introduzir CSS inline arbitrário se o projeto já padroniza Tailwind/shadcn.
- Documentar decisões arquiteturais não óbvias.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
