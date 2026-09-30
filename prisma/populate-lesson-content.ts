import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type LessonProfile = {
  focus: string;
  concepts: [string, string, string];
  example: string;
  practice: string;
};

const lessonProfiles: Record<string, LessonProfile> = {
  'Claude API Fundamentals - Auth, Models, Streaming, Tokens e Custos': {
    focus: 'integrar a API da Claude em produtos reais com seguranca, previsibilidade e controle de custo',
    concepts: ['autenticacao por chave de API', 'escolha de modelos e limites de contexto', 'streaming, tokens e estimativa de custo'],
    example: 'um endpoint Next.js que recebe a pergunta do aluno, chama o modelo adequado, transmite a resposta em partes e registra consumo por usuario',
    practice: 'defina variaveis de ambiente, valide entrada, limite tamanho do prompt e grave metricas simples de tokens antes de expor a funcionalidade',
  },
  'Prompt Engineering & System Prompts - Padroes para Tutores Confiaveis': {
    focus: 'criar prompts de sistema que orientam comportamento pedagogico sem tornar o tutor rigido ou inseguro',
    concepts: ['papel do system prompt', 'instrucoes verificaveis e criterios de resposta', 'separacao entre contexto, tarefa e restricoes'],
    example: 'um tutor que explica TypeScript, pede tentativa do aluno antes da solucao e recusa atalhos quando a atividade exige raciocinio',
    practice: 'escreva o prompt em camadas, teste perguntas ambiguas, registre falhas e ajuste regras com exemplos positivos e negativos',
  },
  'Building AI Tutors - Contexto, Feedback, Guardrails e Pedagogia': {
    focus: 'transformar um chatbot em tutor capaz de conduzir aprendizagem, avaliar progresso e oferecer feedback util',
    concepts: ['modelo mental do aluno', 'feedback formativo', 'guardrails pedagogicos e de seguranca'],
    example: 'um tutor que identifica lacunas em promises, oferece uma analogia, propoe um exercicio curto e corrige a resposta passo a passo',
    practice: 'modele estados de aprendizagem, mantenha historico resumido e separe feedback tecnico de incentivo para evitar respostas genericas',
  },
  'Multi-turn Conversations & Memory - Estado, Relevancia e Continuidade': {
    focus: 'manter conversas longas coerentes sem enviar contexto excessivo ou guardar informacao desnecessaria',
    concepts: ['estado conversacional', 'resumo de memoria', 'recuperacao seletiva de contexto'],
    example: 'uma sessao de mentoria em que o aluno volta dias depois e o tutor lembra objetivo, dificuldade principal e ultimo exercicio',
    practice: 'armazene fatos estaveis, resuma interacoes antigas, descarte ruido e sempre permita que o usuario corrija memorias imprecisas',
  },
  'Error Handling & Resilience - Rate Limits, Timeouts, Retries e Fallbacks': {
    focus: 'projetar integracoes com IA que continuem utilizaveis quando provedores falham ou ficam lentos',
    concepts: ['timeouts e cancelamento', 'retries com backoff', 'fallbacks e degradacao graciosa'],
    example: 'uma chamada ao modelo que tenta novamente em falha transitoria, retorna mensagem honesta em indisponibilidade e nao duplica cobranca',
    practice: 'classifique erros, defina limites por usuario, registre incidentes e teste artificialmente lentidao, 429 e respostas incompletas',
  },
  'Production Deployment - Monitoring, Custos, Compliance, API Keys e Paralelismo': {
    focus: 'operar funcionalidades de IA em producao com governanca, observabilidade e protecao de credenciais',
    concepts: ['monitoramento de qualidade e latencia', 'orcamento e limites de uso', 'segredos, compliance e concorrencia'],
    example: 'um painel interno que acompanha custo diario, taxa de erro, tempo medio de resposta e usuarios com uso anormal',
    practice: 'configure alertas, rotacione chaves, aplique rate limit por plano e revise logs para remover dados sensiveis antes de persistir',
  },
  'Capstone 11.1 - Project Setup & Architecture (worktree, monorepo, fronteiras)': {
    focus: 'iniciar o projeto final com estrutura clara, fronteiras tecnicas e ambiente reproduzivel',
    concepts: ['worktrees e isolamento de trabalho', 'organizacao de monorepo', 'contratos entre pacotes'],
    example: 'um repositorio com app web, CLI, pacote compartilhado de tipos e pasta de infraestrutura versionada',
    practice: 'defina comandos padrao, configure TypeScript compartilhado, documente decisoes iniciais e mantenha dependencias entre pacotes explicitas',
  },
  'Capstone 11.2 - Building the CLI Tool (init/chat/test/submit)': {
    focus: 'construir uma CLI confiavel para interagir com o tutor, rodar testes e submeter entregas',
    concepts: ['design de comandos', 'validacao de argumentos', 'saida legivel e codigos de erro'],
    example: 'comandos init, chat, test e submit que compartilham configuracao mas possuem responsabilidades independentes',
    practice: 'implemente ajuda contextual, trate falhas de rede, escreva testes de comandos e garanta que a CLI funcione em CI',
  },
  'Capstone 11.3 - Building the Dashboard (Next.js 16, App Router, streaming)': {
    focus: 'criar o dashboard do projeto final com navegacao clara, dados consistentes e respostas em streaming',
    concepts: ['App Router e composicao de telas', 'server components e boundaries', 'streaming de respostas do tutor'],
    example: 'uma pagina de progresso que carrega trilhas no servidor e abre uma conversa com feedback em tempo real',
    practice: 'separe dados de apresentacao, trate estados de loading e erro, e valide comportamento em mobile antes de considerar pronto',
  },
  'Capstone 11.4 - Integration & Deployment (Docker, CI/CD, Vercel)': {
    focus: 'integrar as partes do capstone e publica-las com processo repetivel de build, teste e deploy',
    concepts: ['imagens Docker', 'pipeline de CI/CD', 'variaveis de ambiente em producao'],
    example: 'um fluxo que roda lint, testes, build, migracoes controladas e deploy para preview antes de promover para producao',
    practice: 'automatize verificacoes, mantenha segredos fora do repositorio, documente rollback e teste o ambiente final com dados realistas',
  },
  'Capstone 11.5 - Certificate System & Final Submission (HMAC, PDF, badge)': {
    focus: 'gerar uma entrega final verificavel com certificado, assinatura e evidencia de conclusao',
    concepts: ['assinatura HMAC', 'geracao de PDF', 'badges e verificacao publica'],
    example: 'um certificado que inclui nome, curso, data, hash da submissao e URL de verificacao sem expor dados privados',
    practice: 'assine payloads canonicos, proteja a chave, teste adulteracao do certificado e mantenha uma trilha de auditoria da submissao',
  },
  'Relational Databases & Schema Design': {
    focus: 'modelar dados relacionais com tabelas, chaves e restricoes que expressem regras de negocio',
    concepts: ['entidades e relacionamentos', 'normalizacao', 'chaves primarias, estrangeiras e indices'],
    example: 'um sistema de cursos com usuarios, matriculas, modulos, aulas e progresso mantendo integridade entre registros',
    practice: 'desenhe o diagrama, identifique cardinalidades, escreva constraints antes de otimizar e revise consultas criticas com dados de exemplo',
  },
  'SQL Query Optimization': {
    focus: 'melhorar desempenho de consultas SQL entendendo plano de execucao, indices e volume de dados',
    concepts: ['EXPLAIN e custo de consulta', 'indices compostos', 'filtros, joins e paginacao'],
    example: 'uma listagem de aulas que precisa filtrar por curso, ordenar por modulo e trazer progresso sem varrer tabelas inteiras',
    practice: 'meça antes de alterar, compare planos, evite N+1, limite colunas retornadas e valide impacto de indices em escrita',
  },
  'ORMs (Prisma)': {
    focus: 'usar Prisma como camada de acesso a dados sem perder consciencia sobre SQL, transacoes e performance',
    concepts: ['schema como contrato', 'Prisma Client tipado', 'migrations e transacoes'],
    example: 'uma operacao que cria progresso do aluno, atualiza agregados e evita estados parciais usando $transaction',
    practice: 'modele relacoes com clareza, confira queries geradas, use include/select com intencao e trate erros de constraint explicitamente',
  },
  'NoSQL (MongoDB)': {
    focus: 'entender quando documentos NoSQL simplificam leitura e quando aumentam responsabilidade de consistencia',
    concepts: ['documentos e colecoes', 'modelagem por padrao de acesso', 'consistencia e duplicacao controlada'],
    example: 'um historico de conversa armazenado por sessao para leitura rapida, com resumo e mensagens recentes no mesmo documento',
    practice: 'parta das consultas, controle tamanho dos documentos, planeje indices e defina como corrigir dados duplicados quando mudarem',
  },
  'Migrations — Schema Evolution': {
    focus: 'evoluir o schema de banco sem interromper a aplicacao nem corromper dados existentes',
    concepts: ['migracoes reversiveis', 'deploy em duas fases', 'backfill e compatibilidade'],
    example: 'adicionar um campo obrigatorio de status criando-o como opcional, preenchendo dados antigos e so depois aplicando restricao',
    practice: 'teste migracoes em copia de producao, monitore tempo de lock, separe mudanca de codigo da mudanca destrutiva e documente rollback',
  },
  'Backup & HA (High Availability)': {
    focus: 'proteger dados e manter servico disponivel diante de falhas humanas, tecnicas ou regionais',
    concepts: ['backup e restore', 'replicas e failover', 'RPO e RTO'],
    example: 'um banco com backups diarios, replica de leitura, teste mensal de restauracao e procedimento claro para queda regional',
    practice: 'defina objetivos de recuperacao, automatize backups, valide restauracao regularmente e monitore replicacao antes de confiar nela',
  },
  'Redis & Caching - Padrões e Estratégias': {
    focus: 'usar cache para reduzir latencia e carga sem entregar dados incorretos ao usuario',
    concepts: ['cache-aside', 'TTL e invalidacao', 'chaves e serializacao'],
    example: 'cachear a estrutura de um curso por alguns minutos enquanto progresso individual continua sendo buscado em tempo real',
    practice: 'comece por leituras frequentes, escolha TTL conservador, padronize nomes de chaves e meça hit rate antes de expandir',
  },
  'WebSockets - Real-time em Escala': {
    focus: 'construir experiencias em tempo real com conexoes persistentes e controle de estado no servidor',
    concepts: ['handshake e conexao persistente', 'salas e broadcast', 'reconexao e ordenacao de eventos'],
    example: 'um chat de turma em que mensagens, presenca e notificacoes chegam sem recarregar a pagina',
    practice: 'autentique a conexao, limite eventos por cliente, trate reconexao idempotente e planeje pub/sub quando houver multiplas instancias',
  },
  'Message Queues - Async em Escala': {
    focus: 'desacoplar trabalho lento ou instavel usando filas, consumidores e processamento assíncrono',
    concepts: ['produtores e consumidores', 'retry e dead-letter queue', 'idempotencia'],
    example: 'gerar certificados e enviar emails depois da conclusao do curso sem bloquear a resposta da API',
    practice: 'inclua identificadores unicos, registre tentativas, trate duplicidade e monitore tamanho da fila e idade das mensagens',
  },
  'CDN & Assets - Distribuição Global': {
    focus: 'entregar imagens, scripts e arquivos estaticos com baixa latencia e boa estrategia de cache',
    concepts: ['edge caching', 'cache-control', 'versionamento de assets'],
    example: 'imagens de modulos servidas por CDN com nomes versionados, compressao adequada e invalidacao apenas quando necessario',
    practice: 'otimize tamanho, escolha headers corretos, use fingerprints no build e verifique comportamento em regioes diferentes',
  },
  'Monitoring - Observabilidade em Produção': {
    focus: 'entender o comportamento do sistema em producao por meio de logs, metricas e rastreamento',
    concepts: ['logs estruturados', 'metricas de saude', 'traces e correlacao'],
    example: 'investigar aumento de erro em uma rota de aulas cruzando request id, latencia do banco e versao recem-publicada',
    practice: 'registre contexto util, evite dados sensiveis, defina alertas acionaveis e crie dashboards para jornadas criticas',
  },
  'Estimations - Ferramentas Mentais para Escala': {
    focus: 'estimar ordem de grandeza para tomar decisoes arquiteturais antes de escrever codigo',
    concepts: ['back-of-the-envelope', 'QPS e armazenamento', 'latencia e throughput'],
    example: 'calcular trafego esperado de uma plataforma com cem mil alunos, aulas em video e progresso atualizado a cada interacao',
    practice: 'declare premissas, arredonde numeros, calcule picos, compare com limites conhecidos e revise estimativas com dados reais',
  },
  'Scaling - De Um Servidor a Bilhões de Requisições': {
    focus: 'evoluir arquitetura gradualmente conforme gargalos reais aparecem',
    concepts: ['escala vertical e horizontal', 'balanceamento de carga', 'particionamento e cache'],
    example: 'uma API que começa em um servidor, ganha banco dedicado, cache, replicas e filas conforme cresce',
    practice: 'identifique gargalos com metricas, prefira simplicidade enquanto possivel e adicione componentes quando houver justificativa operacional',
  },
  'Microservices - Arquitetura Distribuída com Propósito': {
    focus: 'avaliar microservices como ferramenta organizacional e tecnica, nao como moda arquitetural',
    concepts: ['fronteiras de dominio', 'comunicacao entre servicos', 'custos de operacao distribuida'],
    example: 'separar pagamentos de aulas apenas quando regras, escala, equipe e requisitos de disponibilidade justificarem independencia',
    practice: 'comece por modularidade interna, defina contratos, monitore chamadas remotas e evite dividir dados antes de entender o dominio',
  },
  'Consistency - CAP Theorem e Modelos Práticos': {
    focus: 'escolher modelos de consistencia adequados para dados, experiencia do usuario e tolerancia a falhas',
    concepts: ['CAP theorem', 'consistencia forte e eventual', 'conflitos e reconciliacao'],
    example: 'progresso de aula pode tolerar atraso curto, mas pagamento e emissao de certificado exigem garantias mais fortes',
    practice: 'classifique dados por criticidade, comunique estados pendentes ao usuario e implemente reconciliacao para operacoes assíncronas',
  },
  'Availability - De 99% a 99.999%': {
    focus: 'compreender o custo real de disponibilidade e projetar sistemas com objetivos mensuraveis',
    concepts: ['SLA, SLO e error budget', 'redundancia', 'degradacao controlada'],
    example: 'manter leitura de aulas disponivel mesmo se o tutor de IA estiver temporariamente fora do ar',
    practice: 'defina jornadas essenciais, elimine pontos unicos de falha, teste failover e acompanhe indisponibilidade em minutos por mes',
  },
  'Case Studies - Google Spanner, Netflix, LinkedIn em Escala': {
    focus: 'extrair principios praticos de sistemas de grande escala sem copiar solucoes fora de contexto',
    concepts: ['consistencia global', 'resiliencia por desenho', 'plataformas internas de engenharia'],
    example: 'comparar Spanner para transacoes globais, Netflix para tolerancia a falhas e LinkedIn para dados de feed e eventos',
    practice: 'identifique o problema original, as restricoes da empresa e quais ideias podem ser adaptadas para um produto menor',
  },
  'Pensamento Estrutural para Engenharia de Software': {
    focus: 'decompor problemas de software em partes compreensiveis, testaveis e alinhadas a objetivos de negocio',
    concepts: ['decomposicao', 'trade-offs', 'restricoes tecnicas e de produto'],
    example: 'transformar a demanda "criar area do aluno" em autenticacao, catalogo, progresso, aulas, suporte e metricas',
    practice: 'liste atores, fluxos, dados, riscos e decisoes reversiveis antes de escolher framework ou escrever componentes',
  },
  'Requisitos, Escopo e Criterios de Aceite': {
    focus: 'converter necessidades vagas em requisitos verificaveis e limites claros de entrega',
    concepts: ['requisitos funcionais e nao funcionais', 'escopo', 'criterios de aceite'],
    example: 'uma historia de login que define validacao, mensagens de erro, tempo de sessao, seguranca e comportamento em falha',
    practice: 'escreva exemplos concretos, negocie o que fica fora, valide ambiguidades cedo e transforme criterios em testes quando possivel',
  },
  'Arquitetura em Camadas e Separacao de Responsabilidades': {
    focus: 'organizar aplicacoes em camadas com responsabilidades claras e dependencia controlada',
    concepts: ['camada de apresentacao', 'dominio e casos de uso', 'infraestrutura e persistencia'],
    example: 'uma rota HTTP que valida entrada, chama um service de negocio e delega persistencia a um repositorio',
    practice: 'evite regras de negocio em componentes visuais, isole acesso externo, use contratos internos e revise acoplamento entre modulos',
  },
  'Qualidade, Manutenibilidade e Revisao Tecnica': {
    focus: 'avaliar codigo pelo custo futuro de entende-lo, testa-lo e modifica-lo com seguranca',
    concepts: ['legibilidade', 'baixo acoplamento', 'code review efetivo'],
    example: 'revisar uma PR procurando nomes claros, responsabilidades pequenas, testes relevantes e riscos de regressao',
    practice: 'prefira comentarios acionaveis, explique o motivo da sugestao, diferencie bloqueios de melhorias e acompanhe padroes recorrentes',
  },
  'Debugging Sistematico e Analise de Causa Raiz': {
    focus: 'investigar falhas com metodo, evidencias e hipoteses testaveis',
    concepts: ['reproducao do problema', 'isolamento de variaveis', 'causa raiz'],
    example: 'um bug de progresso duplicado analisado por logs, dados do banco, concorrencia entre requests e historico de deploy',
    practice: 'registre passos, reduza o caso, teste uma hipotese por vez e acrescente protecoes para impedir que a falha retorne',
  },
  'Fundamentos Modernos de React': {
    focus: 'usar React como modelo declarativo de interface baseado em componentes, estado e composicao',
    concepts: ['componentes e props', 'estado local', 'renderizacao declarativa'],
    example: 'uma lista de aulas que recebe dados, destaca a aula ativa e re-renderiza quando o progresso muda',
    practice: 'mantenha componentes pequenos, derive UI de dados, evite efeitos desnecessarios e nomeie props pela intencao do consumidor',
  },
  'Estado, Eventos e Formularios': {
    focus: 'modelar interacoes de usuario com estado previsivel, validacao clara e feedback imediato',
    concepts: ['estado controlado', 'eventos de usuario', 'validacao de formulario'],
    example: 'um formulario de cadastro que valida email, senha e aceite de termos sem perder dados digitados em erro',
    practice: 'separe estado de campo, erro e envio, desabilite acoes durante submit e mostre mensagens especificas proximas ao problema',
  },
  'Data Fetching e Estados de Carregamento': {
    focus: 'buscar dados de forma confiavel e representar loading, erro, vazio e sucesso sem confundir o usuario',
    concepts: ['fetch no servidor e cliente', 'estados assíncronos', 'revalidacao'],
    example: 'uma pagina de modulo que carrega aulas, mostra skeleton, trata modulo inexistente e atualiza progresso apos completar uma aula',
    practice: 'modele cada estado explicitamente, evite spinners eternos, trate retry e mantenha mensagens de erro uteis para suporte',
  },
  'Componentizacao e Design Systems': {
    focus: 'criar componentes reutilizaveis que preservam consistencia visual e acessibilidade',
    concepts: ['componentes base', 'tokens de design', 'variantes e composicao'],
    example: 'um botao compartilhado com estados de loading, disabled, iconografia e tamanhos padronizados em toda a plataforma',
    practice: 'extraia padroes repetidos, documente variantes, teste navegacao por teclado e evite componentes genericos demais para serem uteis',
  },
  'Performance e Acessibilidade no Frontend': {
    focus: 'entregar interfaces rapidas e inclusivas sem sacrificar clareza de implementacao',
    concepts: ['renderizacao eficiente', 'semantica HTML', 'navegacao por teclado e leitores de tela'],
    example: 'uma pagina de curso que usa imagens otimizadas, headings corretos, foco visivel e evita re-renderizar toda a arvore',
    practice: 'meça Web Vitals, use landmarks semanticos, revise contraste, teste teclado e otimize apenas gargalos observados',
  },
  'Arquitetura de APIs com Node.js': {
    focus: 'estruturar APIs Node.js em torno de contratos HTTP, regras de negocio e operacao previsivel',
    concepts: ['request-response', 'middlewares', 'separacao por camadas'],
    example: 'uma API de cursos que autentica, valida parametros, chama services e retorna respostas padronizadas',
    practice: 'defina rotas por recurso, centralize erros, limite responsabilidades dos handlers e documente codigos de status esperados',
  },
  'Rotas, Controllers e Services no Express': {
    focus: 'separar entrada HTTP, orquestracao e regras de negocio em uma aplicacao Express',
    concepts: ['rotas', 'controllers', 'services e repositories'],
    example: 'um controller de matricula que extrai dados da request e chama um service que valida elegibilidade e persiste a relacao',
    practice: 'mantenha controllers finos, injete dependencias quando fizer sentido, teste services isoladamente e padronize respostas',
  },
  'Validacao, Erros e Contratos de API': {
    focus: 'proteger APIs contra entradas invalidas e comunicar falhas de maneira consistente',
    concepts: ['schemas de validacao', 'erros tipados', 'contratos de resposta'],
    example: 'um endpoint de submissao que rejeita payload incompleto com 400, permissao inadequada com 403 e conflito com 409',
    practice: 'valide na borda, normalize mensagens, inclua codigos internos e mantenha exemplos de contrato sincronizados com testes',
  },
  'Autenticacao e Autorizacao': {
    focus: 'confirmar identidade do usuario e aplicar permissoes corretas em cada acao do sistema',
    concepts: ['sessao e tokens', 'roles e permissoes', 'proteção de rotas'],
    example: 'um aluno pode ver suas aulas, um admin pode editar conteudo e nenhum usuario deve acessar progresso de outra conta',
    practice: 'centralize verificacoes, negue por padrao, audite acoes sensiveis e teste casos de acesso cruzado entre usuarios',
  },
  'Observabilidade e Operacao de APIs': {
    focus: 'operar APIs com visibilidade suficiente para diagnosticar lentidao, erros e comportamento inesperado',
    concepts: ['health checks', 'logs estruturados', 'metricas de endpoint'],
    example: 'um endpoint /health que verifica banco, versao e dependencias essenciais sem expor segredos',
    practice: 'inclua request id, monitore percentis de latencia, acompanhe taxa de erro e crie runbooks para incidentes comuns',
  },
  'Estrategia de Testes para Aplicacoes Web': {
    focus: 'combinar tipos de teste para cobrir riscos reais com custo de manutencao aceitavel',
    concepts: ['piramide de testes', 'risco de negocio', 'testes unitarios, integracao e E2E'],
    example: 'testar calculo de progresso unitariamente, API de conclusao por integracao e jornada de aluno por E2E',
    practice: 'priorize fluxos criticos, evite duplicar cobertura em camadas, mantenha fixtures claras e remova testes que nao protegem comportamento',
  },
  'Testes Unitarios e Mocks Confiaveis': {
    focus: 'testar unidades pequenas com isolamento suficiente sem criar simulacoes que escondem problemas reais',
    concepts: ['unidade de comportamento', 'mocks e stubs', 'assertions significativas'],
    example: 'um service de elegibilidade testado com repositorio fake e casos para aluno ativo, bloqueado e ja matriculado',
    practice: 'mocke fronteiras externas, evite testar implementacao privada, nomeie casos pelo comportamento e cubra erros esperados',
  },
  'Testes de Integracao com Banco e APIs': {
    focus: 'validar fluxos que atravessam banco, regras de negocio e camada HTTP',
    concepts: ['banco de teste', 'fixtures', 'transacoes e limpeza'],
    example: 'criar usuario, matricular em curso, completar aula e verificar progresso persistido pela API',
    practice: 'use dados independentes, limpe estado entre testes, valide status e corpo da resposta e execute em CI com ambiente reproduzivel',
  },
  'Testes End-to-End e Jornada do Usuario': {
    focus: 'verificar jornadas completas do ponto de vista do usuario em um navegador real',
    concepts: ['cenarios criticos', 'seletores estaveis', 'diagnostico de falhas'],
    example: 'um aluno faz login, abre o curso, lê uma aula, conclui atividade e visualiza progresso atualizado no dashboard',
    practice: 'teste poucos fluxos valiosos, espere por sinais da UI, capture screenshots em falha e mantenha massa de dados previsivel',
  },
  'QA Continuo e Prevencao de Regressao': {
    focus: 'integrar qualidade ao ciclo diario de desenvolvimento para detectar regressao cedo',
    concepts: ['pipeline de qualidade', 'checklists', 'monitoramento pos-deploy'],
    example: 'uma PR que roda typecheck, lint, testes, build e uma verificacao manual curta antes de ir para producao',
    practice: 'automatize o repetitivo, revise areas de risco, acompanhe bugs recorrentes e transforme incidentes em testes ou alertas',
  },
  'Principios SOLID na Pratica': {
    focus: 'aplicar SOLID para reduzir acoplamento e tornar mudancas futuras menos arriscadas',
    concepts: ['responsabilidade unica', 'extensibilidade', 'dependencia de abstracoes'],
    example: 'um fluxo de pagamento dividido entre validador, caso de uso, gateway e repositorio, cada um com contrato claro',
    practice: 'refatore por dor real, observe motivos de mudanca, escreva testes antes de mover comportamento e evite abstracoes prematuras',
  },
  'Single Responsibility e Open/Closed': {
    focus: 'identificar responsabilidades misturadas e permitir extensao de comportamento sem alterar codigo estavel',
    concepts: ['motivo unico de mudanca', 'polimorfismo ou composicao', 'estrategias plugaveis'],
    example: 'calcular desconto com estrategias para cupom, plano empresarial e campanha sem editar uma condicional central gigante',
    practice: 'extraia regras que mudam por razoes diferentes, nomeie interfaces pelo uso e mantenha extensoes pequenas e testadas',
  },
  'Liskov, Interface Segregation e Dependency Inversion': {
    focus: 'criar contratos substituiveis, pequenos e dependentes de comportamento essencial',
    concepts: ['substituicao segura', 'interfaces especificas', 'inversao de dependencias'],
    example: 'trocar um provedor de email real por fake em testes sem quebrar expectativas do service que envia notificacoes',
    practice: 'nao force metodos inutilizados, teste contratos compartilhados, injete dependencias nas bordas e evite depender de detalhes concretos',
  },
  'Padroes Criacionais e Estruturais': {
    focus: 'usar padroes para organizar criacao e composicao de objetos quando a complexidade justificar',
    concepts: ['factory', 'adapter', 'decorator'],
    example: 'um adapter que normaliza provedores de pagamento e um decorator que adiciona log sem alterar a implementacao original',
    practice: 'aplique padroes para resolver problemas visiveis, mantenha nomes simples e remova camadas que nao reduzem complexidade',
  },
  'Padroes Comportamentais e Refatoracao': {
    focus: 'organizar variacoes de comportamento e evoluir codigo existente de forma incremental',
    concepts: ['strategy', 'observer', 'command'],
    example: 'um command para concluir aula que tambem publica evento consumido por notificacao, certificado e analytics',
    practice: 'proteja comportamento com testes, extraia uma variacao por vez, compare legibilidade antes e depois e monitore efeitos colaterais',
  },
  'Fundamentos de DevOps e Entrega Continua': {
    focus: 'aproximar desenvolvimento e operacao para entregar mudancas menores, frequentes e confiaveis',
    concepts: ['automacao', 'feedback rapido', 'responsabilidade compartilhada'],
    example: 'um time que usa pipeline, ambiente de preview e metricas de producao para aprender rapidamente sem deploys manuais tensos',
    practice: 'padronize comandos, reduza passos manuais, monitore deploys e trate falhas como oportunidades de melhorar o sistema',
  },
  'Docker: Imagens, Containers e Volumes': {
    focus: 'empacotar aplicacoes com ambiente consistente usando imagens, containers e armazenamento persistente',
    concepts: ['imagem e camada', 'container isolado', 'volumes e redes'],
    example: 'uma API Node em container que usa variaveis de ambiente e grava uploads em volume separado',
    practice: 'use imagens pequenas, copie lockfile antes do codigo, nao grave segredos na imagem e entenda o ciclo de vida dos volumes',
  },
  'Docker Compose para Ambientes Locais': {
    focus: 'orquestrar servicos locais de forma reproduzivel para desenvolvimento e testes',
    concepts: ['servicos', 'dependencias', 'redes e volumes nomeados'],
    example: 'um compose com app, Postgres, Redis e painel de administracao, todos usando nomes de host internos previsiveis',
    practice: 'mantenha configuracao simples, use healthchecks, documente comandos comuns e evite diferencas grandes entre local e CI',
  },
  'Pipelines de CI/CD': {
    focus: 'automatizar verificacoes e publicacao para transformar cada alteracao em uma entrega confiavel',
    concepts: ['etapas de pipeline', 'artefatos', 'gates de qualidade'],
    example: 'um pipeline que instala dependencias, roda lint, typecheck, testes, build, gera artefato e publica preview',
    practice: 'cacheie dependencias com cuidado, falhe cedo, separe deploy de migracao destrutiva e deixe logs suficientes para diagnostico',
  },
  'Deploy, Configuracao e Monitoramento': {
    focus: 'colocar software em producao com configuracao controlada e acompanhamento apos a entrega',
    concepts: ['variaveis de ambiente', 'migracoes em deploy', 'logs, alertas e rollback'],
    example: 'promover uma nova versao verificando build, variaveis, migracao, health check e metricas nos primeiros minutos',
    practice: 'mantenha checklist, versionamento de configuracao, estrategia de rollback e alertas ligados a experiencia real do usuario',
  },
};

function buildDetailedContent(title: string, moduleTitle: string, profile: LessonProfile): string {
  const [firstConcept, secondConcept, thirdConcept] = profile.concepts;

  return `# ${title}

## Introducao

${title} e uma aula sobre ${profile.focus}. Em engenharia de software, este tema deve ser estudado como uma competencia pratica, nao apenas como uma definicao teorica. O objetivo e compreender quais decisoes precisam ser tomadas, quais riscos aparecem quando o sistema cresce e como transformar conhecimento tecnico em escolhas sustentaveis para produto, equipe e operacao.

Dentro do modulo ${moduleTitle}, este assunto funciona como uma peca de base para construir aplicacoes profissionais. Uma solucao simples pode parecer suficiente nos primeiros dias, mas sistemas reais acumulam usuarios, dados, excecoes, integracoes externas e mudancas de requisito. Por isso, a aula enfatiza raciocinio, criterio e capacidade de explicar trade-offs. Saber implementar e importante; saber por que aquela implementacao e adequada para o contexto e o que diferencia trabalho amador de engenharia.

## Conceitos principais

O primeiro conceito central e ${firstConcept}. Ele ajuda a transformar uma ideia ampla em um desenho tecnico verificavel. Na pratica, isso significa observar entradas, saidas, invariantes, limites e consequencias. Um engenheiro nao aceita apenas que algo "funciona"; ele pergunta em quais condicoes funciona, como falha, como sera testado e qual sera o custo de manutencao. Esse olhar evita solucoes acopladas demais, dependentes de conhecimento implicito ou dificeis de diagnosticar quando chegam a producao.

O segundo conceito e ${secondConcept}. Ele aparece quando a aplicacao deixa de ser uma sequencia pequena de arquivos e passa a ter fluxos que atravessam interface, servidor, banco de dados e servicos externos. Nessa etapa, clareza de responsabilidade se torna essencial. Cada parte do sistema deve ter um motivo compreensivel para existir, receber dados em formato esperado e devolver resultados que outras partes consigam usar sem conhecer detalhes internos. Essa separacao melhora testes, revisao de codigo, onboarding de novos desenvolvedores e evolucao incremental.

O terceiro conceito e ${thirdConcept}. Este ponto conecta desenho tecnico com operacao diaria. Software profissional precisa lidar com latencia, falhas parciais, mudancas de contrato, volume maior que o previsto e necessidade de auditoria. Mesmo em projetos pequenos, pensar nesses fatores desde cedo reduz retrabalho. A intencao nao e criar uma arquitetura pesada, mas escolher pontos de extensao saudaveis, manter observabilidade minima e registrar decisoes importantes para que a equipe consiga evoluir sem depender da memoria de uma unica pessoa.

## Exemplos praticos

Um exemplo pratico seria ${profile.example}. Para implementar esse fluxo com qualidade, comece descrevendo o comportamento esperado em linguagem simples. Em seguida, identifique quais dados entram, quais regras precisam ser aplicadas e quais efeitos colaterais podem ocorrer. Se houver chamada externa, banco de dados ou processamento assíncrono, trate esses pontos como fronteiras: valide entrada antes de atravessar a fronteira, registre erros com contexto suficiente e proteja o usuario de detalhes internos que nao ajudam.

Considere tambem um cenario de manutencao. Imagine que, algumas semanas depois, surge uma nova regra de negocio, um limite de escala ou uma exigencia de seguranca. Uma solucao bem estruturada permite alterar a parte relevante sem reescrever todo o fluxo. Por exemplo, voce pode trocar um provedor, acrescentar validacao, criar um teste de regressao ou mover processamento para uma fila mantendo o contrato principal. Essa capacidade de evoluir e um indicador mais forte de qualidade do que a elegancia superficial do codigo no primeiro commit.

Como exercicio, ${profile.practice}. Depois disso, revise sua propria solucao com perguntas objetivas: existe uma responsabilidade misturada? ha um erro silencioso? o nome das funcoes revela intencao? um colega conseguiria testar esse comportamento sem depender de ambiente manual? Essas perguntas criam um ciclo de melhoria continua e aproximam a implementacao de um padrao profissional.

## Resumo

Em resumo, ${title} ensina a tratar software como sistema vivo, sujeito a mudancas, falhas e crescimento. Os conceitos de ${firstConcept}, ${secondConcept} e ${thirdConcept} oferecem uma base para tomar decisoes tecnicas com mais seguranca. Ao aplicar esses principios em exemplos concretos, voce desenvolve criterio para criar solucoes simples quando simplicidade basta e solucoes mais robustas quando o contexto exige. Essa e a essencia de uma pratica de engenharia formal, acessivel e orientada a resultados reais.`;
}

async function main() {
  const lessons = await prisma.lesson.findMany({
    where: { module: { courseId: 1 } },
    include: { module: { select: { title: true, order: true } } },
    orderBy: [{ module: { order: 'asc' } }, { order: 'asc' }],
  });

  if (lessons.length === 0) {
    throw new Error('No lessons found for course 1.');
  }

  const missingProfiles = lessons
    .filter((lesson) => !lessonProfiles[lesson.title])
    .map((lesson) => `${lesson.id}: ${lesson.title}`);

  if (missingProfiles.length > 0) {
    throw new Error(`Missing detailed content profiles:\n${missingProfiles.join('\n')}`);
  }

  let updated = 0;

  for (const lesson of lessons) {
    const content = buildDetailedContent(
      lesson.title,
      lesson.module.title,
      lessonProfiles[lesson.title]
    );
    const wordCount = content.trim().split(/\s+/).length;

    if (wordCount < 500 || wordCount > 800) {
      throw new Error(`Generated content for lesson ${lesson.id} has ${wordCount} words.`);
    }

    await prisma.lesson.update({
      where: { id: lesson.id },
      data: { content },
    });

    updated += 1;
    console.log(`Updated lesson ${lesson.id}: ${lesson.title} (${wordCount} words)`);
  }

  console.log(`Done. Updated ${updated} lessons for course 1.`);
}

main()
  .catch((error) => {
    console.error('Failed to populate detailed lesson content:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
