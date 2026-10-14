---
name: booking-scheduling
description: Use ao implementar disponibilidade, criação, remarcação, cancelamento ou operação de agendamentos.
---

# Agendamento e agenda

## Fonte da verdade
O servidor e o banco são a fonte da verdade para disponibilidade, duração, preço aplicável e status. O navegador apenas apresenta opções e solicita operações.

## Criar agendamento
1. Validar sessão e titularidade do pet.
2. Confirmar que o serviço existe e está ativo.
3. Confirmar que o serviço é compatível com espécie/porte quando essa regra estiver configurada.
4. Calcular a duração e o horário final no servidor.
5. Validar horário de funcionamento, bloqueios, antecedência e política de cancelamento configurada.
6. Verificar conflitos com agendamentos que ocupem recursos/horários incompatíveis.
7. Criar o agendamento atomicamente e retornar confirmação.

## Tempo e fuso
- Definir o fuso do estabelecimento explicitamente; não depender do fuso do processo.
- Armazenar instantes de forma consistente e converter para o fuso do pet shop ao exibir/calcular horários.
- Validar datas passadas e mudanças de horário de verão quando relevantes.
- Usar intervalos semiabertos `[início, fim)` para evitar conflito artificial entre atendimentos consecutivos.

## Ciclo de vida
- Centralizar status permitidos e transições.
- Validar transições no servidor; por exemplo, não permitir concluir um agendamento cancelado.
- Registrar `createdAt`/`updatedAt` e, se o produto exigir auditoria, quem alterou o status.
- Definir claramente quem pode cancelar/remarcar e até quando.
- Evitar exclusão física como substituto de cancelamento.

## Agenda diária da gestão
- Data local explícita, ordenação por início e filtros necessários.
- Exibir apenas campos operacionais necessários.
- Tratar dias sem agendamentos, falhas de consulta e atualização concorrente.
- Ao alterar status, confirmar sucesso ou explicar que a alteração não foi aplicada.
- Testar limites do dia, serviços de durações diferentes, sobreposição e duas reservas concorrentes.
