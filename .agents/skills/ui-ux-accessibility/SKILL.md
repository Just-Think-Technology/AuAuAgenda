---
name: ui-ux-accessibility
description: Use ao construir telas, formulários, calendário, agenda diária, tabelas, diálogos e componentes visuais.
---

# UI, UX e acessibilidade

## Direção
Interface clara, profissional, responsiva e focada em operação rápida. Priorize leitura da agenda, hierarquia visual, consistência e baixa fricção para tutores e equipe.

## Padrões
- Reutilize componentes e tokens existentes; se o projeto já usa shadcn/ui, Tailwind e Lucide, mantenha essa base.
- Não introduza outra biblioteca de componentes sem necessidade comprovada.
- Formulários devem ter labels, instruções e erros junto ao campo.
- Botões devem indicar ações claras; evitar ícones isolados sem nome acessível.
- Estados obrigatórios: carregando, vazio, erro, sucesso, desabilitado e confirmação para ações destrutivas.
- Agenda diária deve apresentar data explícita, horários legíveis, status distinguíveis sem depender apenas de cor e ações contextuais.
- No celular, priorize cartões/linhas compactas e controles utilizáveis com toque; não force tabelas largas.
- Use formatos locais em pt-BR para datas, horas e moeda, mantendo valores internos tipados.
- Evite animações que atrasem tarefas operacionais; respeite `prefers-reduced-motion`.

## Acessibilidade
- HTML semântico e ordem de foco previsível.
- Diálogos com foco gerenciado e fechamento acessível.
- Contraste adequado, navegação por teclado e foco visível.
- Campos com `autocomplete` adequado quando aplicável.
- Não use placeholder como substituto de label.
- Status devem incluir texto ou ícone com nome acessível, além de cor.

## Agenda
- Mostrar claramente data, hora, pet, tutor, serviço e status conforme permissões.
- Não expor telefone, e-mail ou observações privadas em locais públicos.
- Atualizações de status devem ter feedback e tratamento de falha.
- Evitar refresh completo se uma atualização local segura for suficiente; manter servidor como fonte de verdade.
