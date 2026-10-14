---
name: testing-quality
description: Use ao criar testes, revisar alterações ou validar funcionalidades e migrações.
---

# Testes e qualidade

## Prioridade de testes
- Regras de domínio: duração, disponibilidade, conflitos e transições de status.
- Autorização: cliente não acessa dados de outro cliente; gestão exige permissão.
- Validação: campos ausentes, inválidos, datas passadas e serviço inativo.
- Fluxos: agendar, visualizar, cancelar/remarcar conforme política e atualizar status na gestão.
- Interface: carregamento, vazio, erro, confirmação e acessibilidade básica.
- Migração: preservar relações e dados legados.

## Cenários mínimos de agendamento
- Horário disponível aceito.
- Horário fora do expediente recusado.
- Sobreposição recusada, inclusive em requisições concorrentes.
- Pet que não pertence ao cliente recusado.
- Serviço inexistente/inativo recusado.
- Transição de status inválida recusada.
- Fuso horário e limites de dia corretos.

## Execução
- Consulte scripts reais em `package.json`; não invente comandos.
- Execute lint, typecheck, testes e build disponíveis.
- Se não houver testes automatizados, informe isso e faça validações manuais reproduzíveis.
- Nunca declare testes aprovados sem resultado real.
- Não mascarar falhas com `any`, desativação de regras ou testes frágeis.
