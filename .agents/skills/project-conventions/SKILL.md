---
name: project-conventions
description: Use em qualquer tarefa de desenvolvimento para manter convenções, consistência e fluxo de trabalho no AuAuAgenda.
---

# Convenções do projeto

## Antes de editar
- Leia `AGENTS.md`, esta skill e as skills específicas da tarefa.
- Inspecione o código real, convenções existentes e versões das dependências.
- Procure usos de componentes, tipos, validações e utilitários antes de criar duplicatas.
- Faça um plano curto quando a mudança cruzar rotas, autenticação e banco.

## Código
- TypeScript estrito; prefira tipos inferidos e explícitos onde ajudam contratos.
- Nomes de funções e variáveis em inglês, salvo padrão consistente já estabelecido; texto de interface em português do Brasil.
- Evite funções genéricas enormes e abstrações prematuras.
- Centralize constantes de domínio, permissões e status.
- Use tratamento de erro explícito e mensagens seguras.
- Não ignore erros com `catch` vazio.
- Não altere dependências sem explicar o motivo e verificar compatibilidade.

## Git e alterações
- Não apagar arquivos antigos apenas por parecerem obsoletos.
- Não reformatar arquivos não relacionados.
- Nunca incluir `.env`, credenciais, dumps ou dados pessoais em commits.
- Para refatorações grandes, trabalhar por fatias verticais e manter o sistema compilável.
- Atualizar documentação quando a arquitetura ou o fluxo de configuração mudar.

## Entrega de cada tarefa
Resuma:
1. O que foi alterado e por quê.
2. Arquivos/áreas afetadas.
3. Comandos de validação executados e resultados reais.
4. Migrações ou variáveis de ambiente necessárias.
5. Riscos, limitações e próximos passos.
