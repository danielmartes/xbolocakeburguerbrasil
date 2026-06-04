# Plano de Implementação: Sistema de Pagamento API Cakto

Vou implementar uma integração com a API da Cakto para gerenciar a autenticação e o redirecionamento para o checkout. Como a página atual é um arquivo HTML estático (`body.html`), adicionarei a lógica no arquivo de rota principal para lidar com o processo de pagamento.

## Passos

1. **Configuração de Credenciais**:
   - Solicitar ao usuário `client_id` e `client_secret` da Cakto (ou orientar como adicionar aos segredos).
   - Criar uma Edge Function ou um endpoint no servidor para lidar com a troca de tokens de forma segura, evitando expor o `client_secret` no navegador.

2. **Backend (Edge Function / Server Function)**:
   - Criar `src/server/cakto.ts` para centralizar a comunicação com a API Cakto.
   - Implementar função para obter o token OAuth2.
   - Implementar função para buscar a URL de checkout de uma oferta específica.

3. **Frontend (Integração)**:
   - Modificar `src/routes/index.tsx` para interceptar cliques nos botões de compra.
   - Adicionar um pequeno script no `body.html` ou gerenciar via React para redirecionar o usuário para a página de checkout da Cakto ao clicar em "Quero acessar agora" ou "Quero aprender agora".

4. **Fluxo do Usuário**:
   - Usuário clica no botão -> Chamada para o servidor -> Servidor obtém token -> Servidor busca oferta/checkout -> Retorna URL -> Redireciona usuário.

## Detalhes Técnicos
- **Endpoint de Token**: `https://api.cakto.com.br/public_api/token/`
- **Endpoint de Ofertas**: `https://api.cakto.com.br/public_api/offers/`
- **Segurança**: As chaves serão armazenadas como segredos de ambiente (`CAKTO_CLIENT_ID`, `CAKTO_CLIENT_SECRET`).

Preciso das suas chaves de API (`client_id` e `client_secret`) para configurar a integração. Você pode fornecê-las ou adicioná-las manualmente nas configurações do projeto.
