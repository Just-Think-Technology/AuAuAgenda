# AuAu Agenda

Agendamento de banho, tosa e serviços relacionados para pet shops. Um único projeto Next.js (App Router) com duas áreas:

- **Cliente** (`/cliente`): cadastra pets (com porte), escolhe um serviço compatível, vê horários livres e agenda, remarca ou cancela.
- **Gestão** (`/gestao`): agenda do dia com filtros, atualização de status, catálogo de serviços, clientes e configuração do pet shop (estações simultâneas, intervalo entre horários e expediente).

## Stack

Next.js 16, React 19, TypeScript estrito, Tailwind 4 + shadcn/ui, Prisma 7 com PostgreSQL (`@prisma/adapter-pg`), sessão JWT em cookie HttpOnly. Gerenciador de pacotes: **pnpm**.

## Como rodar

```bash
cp .env.example .env      # preencha DATABASE_URL, DIRECT_URL e JWT_SECRET
pnpm install              # também roda `prisma generate`
pnpm db:migrate:deploy    # aplica as migrações
pnpm dev                  # http://localhost:3000
```

| Script | O que faz |
| --- | --- |
| `pnpm dev` / `pnpm build` / `pnpm start` | Next.js |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Testes das regras de domínio (`node --test`, Node 24+) |
| `pnpm db:migrate:dev` | Cria uma nova migração em desenvolvimento |
| `pnpm db:migrate:deploy` | Aplica migrações pendentes |
| `pnpm db:studio` | Prisma Studio |

### Modo demonstração (`MOCKS=true`)

Para apresentar o produto sem PostgreSQL, defina `MOCKS=true` no `.env` (e `JWT_SECRET` com um valor aleatório). Os dados ficam **somente no navegador** (`localStorage`); cada visitante vê e altera a própria cópia.

```bash
MOCKS=true JWT_SECRET="$(openssl rand -base64 48)" pnpm dev
```

- Cliente: login por telefone em `/` (mesmo fluxo visual).
- Gestão: `/gestao` (sem sessão redireciona para `/gestao/entrar`) — botão **Entrar na gestão** (sem e-mail/senha na tela).

Credenciais fixas de demo existem só no código (`lib/demo/constants.ts`) para referência de quem mantém o projeto; quem testa o produto não precisa delas.

Em **produção**, mantenha `MOCKS=false` (padrão) e configure `DATABASE_URL` normalmente.

## Organização

```
app/
  (customer)/cliente/…     área do cliente (layout exige papel "client")
  (management)/gestao/…    área de gestão (layout exige papel "admin")
  actions/                 Server Actions: validam a entrada e a permissão e chamam os casos de uso
  session/                 redireciona para a área certa ou encerra sessão expirada
components/                UI por funcionalidade (booking, customer, management, pets) e ui/ genérica
lib/
  domain/                  regras puras e testadas: disponibilidade, fuso, status, elegibilidade, telefone
  use-cases/               orquestração (transações, regras + dados)
  dal/                     acesso ao banco com seleção explícita de campos (server-only)
  server/                  Prisma, sessão, usuário atual, rate limit (server-only)
  validation/              leitura e validação de FormData
prisma/                    schema e migrações
```

O fluxo de dependência é `app → use-cases → domain + dal → banco`. Páginas são Server Components; Client Components só aparecem em formulários e diálogos interativos.

## Regras de agenda

- Cada serviço tem duração, preço opcional e portes/espécies atendidos (lista vazia = todos).
- O pet shop tem `capacity` estações simultâneas, um intervalo entre horários e o expediente de cada dia da semana, tudo no fuso configurado (`America/Sao_Paulo` por padrão).
- Horário, duração, estação e preço são sempre calculados no servidor. A sobreposição numa mesma estação é bloqueada também no banco, por uma *exclusion constraint* (`btree_gist`). Em caso de corrida o agendamento é refeito em outra estação livre ou recusado com mensagem clara.
- Status: Agendado → Confirmado → Em atendimento → Concluído, além de Cancelado e Não compareceu. O cliente só cancela ou remarca antes do início, enquanto o agendamento está Agendado ou Confirmado.

## Banco de dados

As migrações em `prisma/migrations`:

- `0_init` representa o schema original da clínica (linha de base).
- `1_petshop_booking` adiciona serviços, porte e observações do pet, telefone do cliente, configurações do pet shop, expediente e os novos campos de agendamento. Também cria a extensão `btree_gist`, a restrição de não sobreposição e os dados iniciais do expediente.
- `2_phone_login` torna e-mail, senha e data de nascimento opcionais e impede que duas contas ativas compartilhem o mesmo telefone. A migração falha se já existirem telefones duplicados entre contas ativas.
- `3_auth_hardening` adiciona rate limit compartilhado no Postgres e `session_version` para revogar JWTs antigos.
- `4_drop_phone_otp` remove a tabela de desafio SMS (login do cliente volta a ser só telefone).
- `5_client_identity` troca a chave do tutor de CPF para `client_id`, exige nome e telefone, e remove e-mail, senha, clínica (`doctor`, `specialty`, `recipe`, `vaccine`) e a recuperação de senha. Conta ativa sem telefone interrompe a migração. Conta já excluída sem telefone sai junto com os pets e agendamentos dela.

**Banco já existente (produção):** o schema original já está aplicado, então marque a linha de base antes de aplicar o resto. Faça um backup antes.

```bash
pnpm exec prisma migrate resolve --applied 0_init
pnpm db:migrate:deploy
```

No Supabase, confirme que a extensão `btree_gist` pode ser criada pelo usuário da conexão `DIRECT_URL` (ela está disponível por padrão).

Agendamentos antigos da clínica permanecem no banco e não aparecem na nova agenda, porque não têm serviço associado.

### Acesso

O cliente entra em `/` com o telefone. Se o número é novo, o servidor cria a conta e abre a sessão; se já existe, entra na mesma conta. Pets e agendamentos continuam ligados a essa conta. A sessão do cliente fica no cookie `pet-connect:token` e pode ser revogada ao sair ou ao trocar o telefone.

A gestão abre em `/gestao`. O cookie é outro, `pet-connect:admin`, e dura 24 horas. Se ele não existir ou já tiver vencido, a mesma rota pede e-mail e senha. Sair da gestão não encerra a sessão do cliente, e o contrário também vale.

### Criar um usuário de gestão

Não há cadastro público de administradores. Gere o hash da senha e insira o registro:

```bash
node -e "require('bcryptjs').hash(process.argv[1], 12).then(console.log)" 'senha-forte-aqui'
```

```sql
INSERT INTO admin (name, email, password)
VALUES ('Equipe', 'gestao@exemplo.com', '<hash gerado>');
```

A coluna `password` guarda o hash bcrypt, nunca a senha em texto.

## Variáveis de ambiente

Veja `.env.example`. `API_URL` e `APP_API_KEY` do antigo backend Express não são mais usadas.

## Decisões e pendências

- O backend Express e o frontend separado foram removidos. O histórico original está no repositório `petconnect-uscs/website`.
- O envio de foto do pet foi descontinuado. Fotos antigas com URL HTTPS continuam aparecendo; nos demais casos é usada a imagem da raça.
- O limite de tentativas de login usa a tabela `auth_rate_limit` no Postgres. Em produção (Hostinger ou outro proxy), defina `TRUST_PLATFORM_IP=1` para o app usar `x-real-ip` ou o primeiro IP de `x-forwarded-for`. Sem isso, todas as tentativas compartilham o bucket `unknown` e o limite por IP não isola atacantes.
- A remoção de clientes e serviços é lógica (`deleted_at`), preservando o histórico.
