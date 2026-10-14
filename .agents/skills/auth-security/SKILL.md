---
name: auth-security
description: Use ao alterar login, sessão, permissões, dados pessoais, Server Actions, uploads ou endpoints.
---

# Autenticação e segurança

## Autorização
- Separar permissões de cliente e gestão no servidor.
- Proteger cada página, ação e consulta; ocultar um botão não é controle de acesso.
- Cliente só acessa pets e agendamentos associados à própria conta.
- Verificar autorização por recurso em cada operação.
- Não confiar em papel, CPF, e-mail ou IDs enviados pelo cliente sem validar a sessão e o vínculo no servidor.

## Sessões e credenciais
- Auditar a implementação atual antes de trocar estratégia de sessão.
- Nunca guardar segredos no código, em variáveis `NEXT_PUBLIC_*` ou no bundle do cliente.
- Usar hash de senha apropriado e comparação segura; não registrar credenciais.
- Definir cookies de sessão com `HttpOnly`, `Secure` em produção, `SameSite` adequado e escopo mínimo.
- Tokens de redefinição devem ser aleatórios, expirarem, ser armazenados com segurança e ser invalidados após uso.
- Aplicar limitação de tentativas onde pertinente e respostas que não facilitem enumeração de contas.

## Entradas e saídas
- Validar e normalizar toda entrada no servidor.
- Tratar conteúdo do usuário como não confiável.
- Uploads: validar tipo real, tamanho, extensão e destino; não permitir execução de conteúdo.
- Não retornar erros internos, SQL, stack traces, secrets ou dados pessoais desnecessários.
- Usar HTTPS em produção e manter dependências atualizadas.

## Next.js
- Server Actions não dispensam autenticação, autorização, validação ou proteção contra abuso.
- Route Handlers devem validar método, origem quando relevante, autenticação e payload.
- Evitar importar módulos server-only no cliente.
- Dados pessoais nunca devem entrar em cache público compartilhado.

## Privacidade
- Coletar apenas os dados necessários para o agendamento e operação.
- Definir retenção e exclusão conforme requisitos legais e operacionais.
- Não adicionar informações clínicas sensíveis sem requisito específico e justificativa.
