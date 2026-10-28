# AuAuAgenda

Agenda de banho, tosa e serviços relacionados para um pet shop. O tutor marca o horário pelo celular ou computador. A equipe vê o dia, acompanha cada atendimento e mantém o catálogo e o expediente.

Um único pet shop. Sem pagamento online, notificação automática ou várias unidades.

## Para quem serve

**Tutor.** Entra com o telefone, cadastra os pets e agenda um serviço compatível com a espécie e o porte. Acompanha o que já marcou, remarca ou cancela enquanto o horário ainda não começou.

**Equipe do pet shop.** Entra com e-mail e senha. Vê a agenda do dia, muda o status do atendimento, cadastra serviços e clientes e define quantos pets podem ser atendidos ao mesmo tempo, o intervalo entre horários e o expediente de cada dia da semana.

Não há cadastro público de administrador. A conta da equipe é criada direto no banco.

## O que cada área faz

### Cliente (`/cliente`)

- **Início.** Próximos agendamentos e avisos quando falta o nome do tutor ou o porte de algum pet.
- **Pets.** Nome, espécie, raça opcional, porte (pequeno, médio ou grande) e observações para o atendimento.
- **Novo agendamento.** Escolhe o pet, um serviço que aceite aquela espécie e aquele porte, um dia dentro dos próximos 60 dias e um horário livre. Pode deixar uma observação.
- **Agendamentos.** Lista o que está marcado e o histórico. Remarcar troca o horário. Cancelar encerra aquele horário.
- **Configurações.** Nome e telefone da conta. O telefone é a identidade do tutor: duas contas ativas não compartilham o mesmo número.

Na primeira vez que um telefone entra, o sistema cria a conta e abre a sessão. Se o número já existe, entra na mesma conta, com os pets e os agendamentos dela.

O tutor só cancela ou remarca enquanto o status é Agendado ou Confirmado e o horário ainda é futuro. Depois que o atendimento começa, a alteração fica com a equipe.

### Gestão (`/gestao`)

- **Agenda do dia.** Atendimentos do dia escolhido, com pet, tutor, serviço, horário e estação. Dá para filtrar e avançar o status.
- **Serviços.** Nome, descrição, duração, preço opcional, espécies e portes atendidos. Lista vazia de espécie ou de porte significa que o serviço aceita todos. Serviço inativo some da marcação do cliente. A exclusão é lógica: o histórico de quem já usou o serviço permanece.
- **Clientes.** Lista de tutores e cadastro de um cliente novo, com pets.
- **Configurações.** Nome do pet shop, fuso horário (padrão `America/Sao_Paulo`), número de estações simultâneas, intervalo entre horários (10, 15, 20, 30 ou 60 minutos) e abertura e fechamento de cada dia da semana. Dia fechado não oferece horário. A capacidade não pode cair abaixo de uma estação que já tenha agendamento futuro.

## Como o horário é escolhido

O pet shop tem um expediente por dia da semana, um intervalo fixo entre inícios de horário e um número de estações. Cada estação atende um pet por vez.

O cliente vê só horários em que o serviço cabe antes do fechamento, o início ainda não passou e existe pelo menos uma estação livre durante toda a duração. A duração, o fim do atendimento, o preço e a estação são calculados no servidor. Dois agendamentos não ocupam a mesma estação no mesmo intervalo. Se duas pessoas marcam o mesmo horário ao mesmo tempo, uma fica na estação livre e a outra recebe uma mensagem de recusa.

Status do atendimento:

| Status | Quem muda | Próximos possíveis |
| --- | --- | --- |
| Agendado | Equipe | Confirmado, Em atendimento, Cancelado, Não compareceu |
| Confirmado | Equipe | Em atendimento, Cancelado, Não compareceu |
| Em atendimento | Equipe | Concluído |
| Concluído, Cancelado, Não compareceu | Ninguém | Encerrado |

O cliente marca e o status inicial é Agendado. A equipe confirma, inicia, conclui, cancela ou registra falta. Concluído, cancelado e falta não voltam para outro status.

Sessões são independentes. Sair da gestão não encerra a sessão do cliente, e o contrário também vale. A sessão da equipe dura 24 horas.

## Como rodar

Requisitos: Node.js, pnpm e PostgreSQL.

```bash
cp .env.example .env      # DATABASE_URL, DIRECT_URL e JWT_SECRET
pnpm install
pnpm db:migrate:deploy
pnpm dev                  # http://localhost:3000
```

`JWT_SECRET` assina o cookie de sessão. Use um valor longo e aleatório.

Para apresentar o produto sem banco, defina `MOCKS=true`. Os dados ficam no `localStorage` do navegador de quem está vendo. Em produção deixe `MOCKS=false` e use o PostgreSQL. Detalhes de migração, usuário de gestão e variáveis estão em [INSTRUCTIONS.md](INSTRUCTIONS.md).

| Comando | Uso |
| --- | --- |
| `pnpm dev` | Servidor de desenvolvimento |
| `pnpm test` | Regras de horário, status, telefone e senha |
| `pnpm typecheck` | TypeScript |
| `pnpm lint` | ESLint |
| `pnpm db:studio` | Prisma Studio |

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Prisma 7 e PostgreSQL. A interface lê dados no servidor. Formulários gravam por Server Actions, que validam a entrada e a permissão antes de alterar o banco.
