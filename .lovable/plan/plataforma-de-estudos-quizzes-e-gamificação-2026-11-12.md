# Plataforma de Estudos, Quizzes e Gamificação

Evolução do protótipo para um app real com Lovable Cloud (banco, login, arquivos). Por ser grande, será entregue em 4 etapas, cada uma utilizável ao final.

## Etapa 1 — Base, login e trilhas
- Cadastro/login com confirmação por e-mail real (link/código enviado à caixa de entrada).
- Perfil com nome e avatar (upload de foto ou avatar gerado com cores/emoji).
- Papéis: aluno e admin (o primeiro admin será sua conta).
- Matérias iniciais: Português, Matemática, Física, Química, Inglês.
- Cada matéria tem tópicos/aulas: texto teórico, vídeo incorporado (YouTube), PDF (ler no navegador e baixar) e quiz de 10 questões.
- Pontos do quiz somam ao perfil (1ª tentativa de cada quiz conta, para evitar farm).
- Lista geral de atividades em ordem sequencial; perguntas podem ter imagem no topo.

## Etapa 2 — Painel do admin
- Editor estilo "Quiz Party Creator": criar/editar matérias, aulas, perguntas, alternativas, imagens, vídeos e PDFs.
- Personalização das cores do tema (aplicada para todos).

## Etapa 3 — Comunidade e gamificação
- Ranking com pódio dos 3 líderes.
- Reações com emojis e comentários curtos (até 280 caracteres) em aulas e quizzes.
- Denúncias de jogadores e comentários; fila no painel admin para arquivar ou banir.
- Espaço do usuário (estilo "Space Path Creator"): criar quizzes/projetos próprios como rascunho privado ou publicar para a comunidade.

## Etapa 4 — Chat
- Grupo Geral aberto em tempo real.
- Grupos personalizados com pessoas selecionadas.
- Mensagens diretas só após a outra pessoa aceitar o pedido.
- Usuários banidos perdem acesso ao chat e comentários.

## Visual
Visual moderno e próprio (não genérico), inspirado nas cores azuis do protótipo, com modo claro/escuro.

## Detalhes técnicos
- TanStack Start + Lovable Cloud (Postgres com RLS, Auth, Storage para imagens/PDFs/avatares, Realtime para chat).
- Papéis em tabela separada `user_roles` com função `has_role`.
- Pontuação calculada no servidor (server function) para impedir trapaça.
