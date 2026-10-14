---
name: data-prisma
description: Use ao alterar schema Prisma, consultas, relações, migrações, seeds ou transações do AuAuAgenda.
---

# Dados e Prisma

## Regras gerais
- Inspecione o schema, versão instalada do Prisma, configuração, migrations e banco antes de propor alterações.
- Preserve PostgreSQL e o provedor/configuração existentes até decisão explícita.
- Não presuma compatibilidade de sintaxe entre versões diferentes do Prisma; siga a versão do repositório.
- Use transações para operações que precisem ser atômicas.
- Selecione campos explicitamente, especialmente para clientes, credenciais e dados pessoais.
- Não retornar `password`, hashes, tokens ou campos internos ao frontend.
- Crie índices para consultas e restrições baseados nos padrões reais de uso, não por especulação.

## Modelagem de agendamentos
Avalie entidades e relações para:
- tutor/cliente;
- pet;
- catálogo de serviços com duração e preço aplicável;
- agendamento com início/fim, status e timestamps;
- horário de funcionamento e bloqueios, se fizerem parte do escopo.
Garanta integridade referencial e defina política para exclusão lógica/física.

## Concorrência e disponibilidade
- A checagem de disponibilidade precisa acontecer no servidor.
- Não confie apenas em desabilitar horários na UI.
- Verifique intervalos sobrepostos usando início/fim e a duração efetiva do serviço.
- Trate duas requisições concorrentes tentando reservar o mesmo intervalo. Use estratégia transacional/constraint compatível com PostgreSQL e documente suas garantias.
- Defina comportamento para serviços com durações diferentes e intervalos de preparação, caso aplicável.

## Migrações
1. Mapear entidades antigas e novas e todos os consumidores.
2. Definir correspondência de dados e valores sem equivalente.
3. Criar migração aditiva sempre que possível.
4. Testar em cópia de desenvolvimento com dados representativos.
5. Validar contagens e integridade antes/depois.
6. Só remover estruturas antigas em fase posterior e com autorização.

Nunca execute `db push`, reset ou migração destrutiva em produção sem aprovação explícita.
