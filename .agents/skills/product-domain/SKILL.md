---
name: product-domain
description: Use ao alterar requisitos, fluxos, entidades, nomenclatura ou regras de negócio do AuAuAgenda para banho e tosa.
---

# Domínio do produto

## Objetivo
Priorizar a operação de pet shops de banho e tosa, não a rotina de uma clínica veterinária.

## Personas e áreas
- **Cliente/tutor:** gerencia seu perfil e pets, consulta serviços e agenda um atendimento.
- **Gestor/atendente:** acompanha a agenda diária e administra os agendamentos.
- Não assuma que tosadores, caixas ou múltiplos níveis de equipe precisam de contas distintas sem requisito confirmado.

## Vocabulário
Prefira: pet shop, tutor/cliente, pet, serviço, banho, tosa, agenda, agendamento, horário disponível, status do atendimento.
Avalie substituir: médico/doutor, consulta, especialidade, receita, vacina e prontuário por conceitos próprios do pet shop. Não faça substituições cegas em todo o código: rastreie dependências, telas, banco e dados legados.

## Fluxo básico do cliente
1. Autenticar-se ou cadastrar-se conforme fluxo atual.
2. Selecionar um pet cadastrado ou cadastrar um novo.
3. Escolher um serviço elegível para aquele pet.
4. Consultar horários disponíveis calculados no servidor.
5. Confirmar o agendamento e receber uma confirmação clara.
6. Consultar próximos agendamentos e seu status; cancelar/remarcar somente conforme política definida.

## Fluxo básico da gestão
1. Abrir a agenda do dia por padrão.
2. Filtrar por data e, se necessário, por status/serviço.
3. Ver horário, pet, tutor, serviço e observações operacionais necessárias.
4. Atualizar status com validação de transições.
5. Identificar conflitos, cancelamentos e horários indisponíveis.

## Status sugeridos
Defina uma enumeração central e documentada. Ponto de partida: `SCHEDULED`, `CONFIRMED`, `IN_SERVICE`, `COMPLETED`, `CANCELED`, `NO_SHOW`. Ajuste aos fluxos reais e planeje migração dos status antigos.

## Não presumir
Pagamento online, estoque, comissões, recorrência automática, múltiplas filiais, chat, lembretes por WhatsApp ou marketplace. Proponha como evolução separada, não como parte implícita do escopo.

## Antes de concluir
Verifique se a solução resolve um problema de cliente ou gestão, se usa a linguagem do pet shop e se não mantém conceitos médicos sem motivo.
