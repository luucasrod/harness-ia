# LICAO 10.6: Production Deployment - Monitoring, Custos, Compliance, API Keys e Paralelismo

Coloque a integracao Claude em producao com governanca: ambientes, rotacao de chaves, dashboards, budgets, compliance, chamadas paralelas e playbooks operacionais.

## Objetivos da licao

- Configurar API keys por ambiente sem vazamento em logs ou frontend.
- Criar dashboards de custo, tokens, latencia, erro e qualidade.
- Definir budgets por usuario, turma, modulo e workspace.
- Aplicar principios de privacidade para dados educacionais.
- Executar chamadas paralelas com limite de concorrencia e agregacao segura.
- Planejar upgrades de modelo com canary, evals e rollback.

## Contexto do modulo

Claude AI Integration neste curso nao e uma aula sobre brincar com chatbot. O objetivo e construir uma integracao de engenharia de software para uma plataforma educacional real. Isso significa conectar Claude a requisitos de produto, seguranca, observabilidade, custo, experiencia de usuario, dados de aluno e evolucao de modelos. A plataforma Harness IA precisa de um tutor que responda com clareza, mas tambem precisa de um sistema que possa ser mantido por uma equipe.

A documentacao oficial da Anthropic muda com o tempo, especialmente modelos, precos, limites e recursos beta. Por isso, os exemplos desta licao usam IDs atuais como configuracao e ensinam a centralizar essas escolhas. A habilidade que importa nao e decorar um preco; e construir uma arquitetura em que preco, modelo, prompt e politica possam mudar sem reescrever a plataforma.

## SECAO 1: DO PROTOTIPO AO SISTEMA OPERACIONAL

Nesta secao, o objetivo e transformar uma capacidade do modelo em um contrato de produto. A pergunta nao e apenas 'Claude consegue fazer isso?', mas 'a plataforma consegue controlar, medir e evoluir isso sem quebrar a experiencia do aluno?'. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A resposta profissional quase sempre envolve tres camadas: regra de negocio, prompt ou ferramenta que executa a regra, e observabilidade para confirmar se a regra funcionou. Quando uma dessas camadas falta, a integracao fica dificil de depurar. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

O erro mais comum e comecar pela chamada de API e deixar arquitetura para depois. Em uma plataforma educacional, a pergunta certa e: qual comportamento esperamos quando o aluno esta confuso, quando o contexto da aula esta incompleto, quando a API demora, quando o custo sobe, ou quando a resposta precisa ser auditada por um professor? Essas perguntas moldam o design antes do primeiro token. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Pense no tutor como uma camada entre curriculo, aluno e modelo. O curriculo fornece fonte de verdade; o aluno fornece objetivo, tentativa e duvida; Claude fornece linguagem, adaptacao e raciocinio aplicado. Se uma dessas partes entra sem estrutura, a resposta vira conversa solta. Se entra com contrato, a resposta vira produto. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A implementacao profissional tambem evita magia. Cada prompt tem versao, cada chamada registra usage, cada resposta importante pode ser reproduzida com os mesmos inputs, e cada fallback foi pensado antes do incidente. Isso parece burocratico no prototipo, mas e justamente o que permite escalar para milhares de alunos sem transformar suporte em adivinhacao. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Um bom criterio pratico e perguntar: se a resposta estiver errada, conseguimos descobrir por que? Precisamos saber qual modelo respondeu, qual contexto foi enviado, qual prompt estava ativo, qual rubrica foi usada, quanto custou e qual caminho de fallback ocorreu. Sem esses dados, a equipe apenas observa sintomas. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Tambem existe uma diferenca entre demonstracao e produto. A demonstracao mostra Claude respondendo bonito. O produto garante que a resposta respeita o nivel do aluno, nao vaza chave, nao entrega gabarito indevido, cabe no budget, aparece rapido na interface e gera dados para melhorar o curso. Engenharia de IA mora nessa diferenca. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Antes de publicar qualquer comportamento novo, escreva a politica em linguagem que suporte, professores e engenharia consigam discutir. Se uma regra depende de interpretacao humana, transforme-a em exemplo. Se depende de custo, transforme-a em budget. Se depende de seguranca, transforme-a em validacao e log. Esse habito reduz ambiguidades quando a plataforma cresce. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

### Decisoes praticas

- Producao exige controles economicos tanto quanto controles tecnicos.
- Segredos precisam de rotacao, escopo minimo e auditoria.
- Chamadas paralelas aceleram avaliacao, mas multiplicam custo e rate limit.
- Compliance comeca minimizando dados enviados ao modelo.
- Upgrade de modelo e mudanca de comportamento; trate como release de produto.

### Aplicacao na plataforma educacional

Quando aplicamos esta secao ao tutor da Harness IA, a regra e sempre partir de uma pergunta de produto: que aprendizagem queremos melhorar? Se a resposta for "reduzir tempo ate o aluno entender um erro", a integracao precisa privilegiar contexto, feedback claro e baixa latencia. Se a resposta for "avaliar exercicios com consistencia", a integracao precisa privilegiar rubrica, saida estruturada e audibilidade. Se a resposta for "explorar conceitos", a integracao pode ser mais conversacional, mas ainda precisa registrar custo e fontes de contexto.

### Checklist de implementacao

1. Defina o contrato de entrada e saida antes de chamar Claude.
2. Escolha o modelo por tarefa, nao por preferencia generica.
3. Registre prompt version, modelo, usage, latencia e status.
4. Tenha fallback local para manter a aula util em caso de falha.
5. Rode exemplos reais de tutor antes de publicar mudancas.

---

## SECAO 2: AMBIENTES E SEGREDOS

A fronteira mais importante e entre cliente e servidor. O navegador pode iniciar a experiencia, mas a chamada para Claude deve acontecer em uma rota server-side, server action, worker ou backend dedicado. Isso protege a chave, permite aplicar rate limit por usuario e cria um ponto unico para logs, budgets e politicas. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Em producao, a configuracao precisa permitir rotacao sem deploy emergencial. Use variaveis de ambiente, secret manager e nomes de modelo configuraveis. Evite espalhar `claude-sonnet-5-5` por componentes de UI; a UI deve pedir uma tarefa, e a camada de IA decide qual modelo atende essa tarefa. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

O erro mais comum e comecar pela chamada de API e deixar arquitetura para depois. Em uma plataforma educacional, a pergunta certa e: qual comportamento esperamos quando o aluno esta confuso, quando o contexto da aula esta incompleto, quando a API demora, quando o custo sobe, ou quando a resposta precisa ser auditada por um professor? Essas perguntas moldam o design antes do primeiro token. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Pense no tutor como uma camada entre curriculo, aluno e modelo. O curriculo fornece fonte de verdade; o aluno fornece objetivo, tentativa e duvida; Claude fornece linguagem, adaptacao e raciocinio aplicado. Se uma dessas partes entra sem estrutura, a resposta vira conversa solta. Se entra com contrato, a resposta vira produto. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A implementacao profissional tambem evita magia. Cada prompt tem versao, cada chamada registra usage, cada resposta importante pode ser reproduzida com os mesmos inputs, e cada fallback foi pensado antes do incidente. Isso parece burocratico no prototipo, mas e justamente o que permite escalar para milhares de alunos sem transformar suporte em adivinhacao. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Um bom criterio pratico e perguntar: se a resposta estiver errada, conseguimos descobrir por que? Precisamos saber qual modelo respondeu, qual contexto foi enviado, qual prompt estava ativo, qual rubrica foi usada, quanto custou e qual caminho de fallback ocorreu. Sem esses dados, a equipe apenas observa sintomas. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Tambem existe uma diferenca entre demonstracao e produto. A demonstracao mostra Claude respondendo bonito. O produto garante que a resposta respeita o nivel do aluno, nao vaza chave, nao entrega gabarito indevido, cabe no budget, aparece rapido na interface e gera dados para melhorar o curso. Engenharia de IA mora nessa diferenca. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Antes de publicar qualquer comportamento novo, escreva a politica em linguagem que suporte, professores e engenharia consigam discutir. Se uma regra depende de interpretacao humana, transforme-a em exemplo. Se depende de custo, transforme-a em budget. Se depende de seguranca, transforme-a em validacao e log. Esse habito reduz ambiguidades quando a plataforma cresce. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

### Decisoes praticas

- Producao exige controles economicos tanto quanto controles tecnicos.
- Segredos precisam de rotacao, escopo minimo e auditoria.
- Chamadas paralelas aceleram avaliacao, mas multiplicam custo e rate limit.
- Compliance comeca minimizando dados enviados ao modelo.
- Upgrade de modelo e mudanca de comportamento; trate como release de produto.

### Aplicacao na plataforma educacional

Quando aplicamos esta secao ao tutor da Harness IA, a regra e sempre partir de uma pergunta de produto: que aprendizagem queremos melhorar? Se a resposta for "reduzir tempo ate o aluno entender um erro", a integracao precisa privilegiar contexto, feedback claro e baixa latencia. Se a resposta for "avaliar exercicios com consistencia", a integracao precisa privilegiar rubrica, saida estruturada e audibilidade. Se a resposta for "explorar conceitos", a integracao pode ser mais conversacional, mas ainda precisa registrar custo e fontes de contexto.

### Checklist de implementacao

1. Defina o contrato de entrada e saida antes de chamar Claude.
2. Escolha o modelo por tarefa, nao por preferencia generica.
3. Registre prompt version, modelo, usage, latencia e status.
4. Tenha fallback local para manter a aula util em caso de falha.
5. Rode exemplos reais de tutor antes de publicar mudancas.

---

## SECAO 3: MONITORAMENTO DE QUALIDADE, CUSTO E LATENCIA

Modelo e custo devem ser tratados como parte do design da feature. Uma explicacao curta durante a aula pode usar um modelo rapido; uma revisao de projeto final pode justificar um modelo mais caro; uma avaliacao em massa talvez precise batch, cache ou fila. Essa escolha deve aparecer no codigo como politica explicita. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Tokens sao a unidade operacional da integracao. Eles afetam preco, latencia, rate limit e qualidade, porque contexto demais pode diluir a pergunta. Um tutor serio mede input, output, cache hit quando aplicavel, custo estimado e valor pedagogico entregue. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

O erro mais comum e comecar pela chamada de API e deixar arquitetura para depois. Em uma plataforma educacional, a pergunta certa e: qual comportamento esperamos quando o aluno esta confuso, quando o contexto da aula esta incompleto, quando a API demora, quando o custo sobe, ou quando a resposta precisa ser auditada por um professor? Essas perguntas moldam o design antes do primeiro token. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Pense no tutor como uma camada entre curriculo, aluno e modelo. O curriculo fornece fonte de verdade; o aluno fornece objetivo, tentativa e duvida; Claude fornece linguagem, adaptacao e raciocinio aplicado. Se uma dessas partes entra sem estrutura, a resposta vira conversa solta. Se entra com contrato, a resposta vira produto. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A implementacao profissional tambem evita magia. Cada prompt tem versao, cada chamada registra usage, cada resposta importante pode ser reproduzida com os mesmos inputs, e cada fallback foi pensado antes do incidente. Isso parece burocratico no prototipo, mas e justamente o que permite escalar para milhares de alunos sem transformar suporte em adivinhacao. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Um bom criterio pratico e perguntar: se a resposta estiver errada, conseguimos descobrir por que? Precisamos saber qual modelo respondeu, qual contexto foi enviado, qual prompt estava ativo, qual rubrica foi usada, quanto custou e qual caminho de fallback ocorreu. Sem esses dados, a equipe apenas observa sintomas. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Tambem existe uma diferenca entre demonstracao e produto. A demonstracao mostra Claude respondendo bonito. O produto garante que a resposta respeita o nivel do aluno, nao vaza chave, nao entrega gabarito indevido, cabe no budget, aparece rapido na interface e gera dados para melhorar o curso. Engenharia de IA mora nessa diferenca. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Antes de publicar qualquer comportamento novo, escreva a politica em linguagem que suporte, professores e engenharia consigam discutir. Se uma regra depende de interpretacao humana, transforme-a em exemplo. Se depende de custo, transforme-a em budget. Se depende de seguranca, transforme-a em validacao e log. Esse habito reduz ambiguidades quando a plataforma cresce. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

### Decisoes praticas

- Producao exige controles economicos tanto quanto controles tecnicos.
- Segredos precisam de rotacao, escopo minimo e auditoria.
- Chamadas paralelas aceleram avaliacao, mas multiplicam custo e rate limit.
- Compliance comeca minimizando dados enviados ao modelo.
- Upgrade de modelo e mudanca de comportamento; trate como release de produto.

### Aplicacao na plataforma educacional

Quando aplicamos esta secao ao tutor da Harness IA, a regra e sempre partir de uma pergunta de produto: que aprendizagem queremos melhorar? Se a resposta for "reduzir tempo ate o aluno entender um erro", a integracao precisa privilegiar contexto, feedback claro e baixa latencia. Se a resposta for "avaliar exercicios com consistencia", a integracao precisa privilegiar rubrica, saida estruturada e audibilidade. Se a resposta for "explorar conceitos", a integracao pode ser mais conversacional, mas ainda precisa registrar custo e fontes de contexto.

### Checklist de implementacao

1. Defina o contrato de entrada e saida antes de chamar Claude.
2. Escolha o modelo por tarefa, nao por preferencia generica.
3. Registre prompt version, modelo, usage, latencia e status.
4. Tenha fallback local para manter a aula util em caso de falha.
5. Rode exemplos reais de tutor antes de publicar mudancas.

---

## SECAO 4: COMPLIANCE E DADOS EDUCACIONAIS

Nesta secao, o objetivo e transformar uma capacidade do modelo em um contrato de produto. A pergunta nao e apenas 'Claude consegue fazer isso?', mas 'a plataforma consegue controlar, medir e evoluir isso sem quebrar a experiencia do aluno?'. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A resposta profissional quase sempre envolve tres camadas: regra de negocio, prompt ou ferramenta que executa a regra, e observabilidade para confirmar se a regra funcionou. Quando uma dessas camadas falta, a integracao fica dificil de depurar. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

O erro mais comum e comecar pela chamada de API e deixar arquitetura para depois. Em uma plataforma educacional, a pergunta certa e: qual comportamento esperamos quando o aluno esta confuso, quando o contexto da aula esta incompleto, quando a API demora, quando o custo sobe, ou quando a resposta precisa ser auditada por um professor? Essas perguntas moldam o design antes do primeiro token. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Pense no tutor como uma camada entre curriculo, aluno e modelo. O curriculo fornece fonte de verdade; o aluno fornece objetivo, tentativa e duvida; Claude fornece linguagem, adaptacao e raciocinio aplicado. Se uma dessas partes entra sem estrutura, a resposta vira conversa solta. Se entra com contrato, a resposta vira produto. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A implementacao profissional tambem evita magia. Cada prompt tem versao, cada chamada registra usage, cada resposta importante pode ser reproduzida com os mesmos inputs, e cada fallback foi pensado antes do incidente. Isso parece burocratico no prototipo, mas e justamente o que permite escalar para milhares de alunos sem transformar suporte em adivinhacao. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Um bom criterio pratico e perguntar: se a resposta estiver errada, conseguimos descobrir por que? Precisamos saber qual modelo respondeu, qual contexto foi enviado, qual prompt estava ativo, qual rubrica foi usada, quanto custou e qual caminho de fallback ocorreu. Sem esses dados, a equipe apenas observa sintomas. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Tambem existe uma diferenca entre demonstracao e produto. A demonstracao mostra Claude respondendo bonito. O produto garante que a resposta respeita o nivel do aluno, nao vaza chave, nao entrega gabarito indevido, cabe no budget, aparece rapido na interface e gera dados para melhorar o curso. Engenharia de IA mora nessa diferenca. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Antes de publicar qualquer comportamento novo, escreva a politica em linguagem que suporte, professores e engenharia consigam discutir. Se uma regra depende de interpretacao humana, transforme-a em exemplo. Se depende de custo, transforme-a em budget. Se depende de seguranca, transforme-a em validacao e log. Esse habito reduz ambiguidades quando a plataforma cresce. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

### Decisoes praticas

- Producao exige controles economicos tanto quanto controles tecnicos.
- Segredos precisam de rotacao, escopo minimo e auditoria.
- Chamadas paralelas aceleram avaliacao, mas multiplicam custo e rate limit.
- Compliance comeca minimizando dados enviados ao modelo.
- Upgrade de modelo e mudanca de comportamento; trate como release de produto.

### Aplicacao na plataforma educacional

Quando aplicamos esta secao ao tutor da Harness IA, a regra e sempre partir de uma pergunta de produto: que aprendizagem queremos melhorar? Se a resposta for "reduzir tempo ate o aluno entender um erro", a integracao precisa privilegiar contexto, feedback claro e baixa latencia. Se a resposta for "avaliar exercicios com consistencia", a integracao precisa privilegiar rubrica, saida estruturada e audibilidade. Se a resposta for "explorar conceitos", a integracao pode ser mais conversacional, mas ainda precisa registrar custo e fontes de contexto.

### Checklist de implementacao

1. Defina o contrato de entrada e saida antes de chamar Claude.
2. Escolha o modelo por tarefa, nao por preferencia generica.
3. Registre prompt version, modelo, usage, latencia e status.
4. Tenha fallback local para manter a aula util em caso de falha.
5. Rode exemplos reais de tutor antes de publicar mudancas.

---

## SECAO 5: CHAMADAS PARALELAS COM CONTROLE

Chamadas paralelas sao uma ferramenta de throughput, nao um convite para remover limites. Avaliar vinte tentativas ao mesmo tempo pode melhorar tempo total, mas tambem consome tokens, rate limit e dinheiro em rajada. Por isso, paralelismo precisa de fila, concorrencia maxima e agregacao de falhas. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Monitoramento de IA deve juntar engenharia e produto: latencia, erro e custo explicam operacao; score de feedback, taxa de fallback e melhoria em tentativas explicam aprendizagem. Um dashboard util mostra ambos, porque uma feature barata que ensina mal ainda e uma feature ruim. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

O erro mais comum e comecar pela chamada de API e deixar arquitetura para depois. Em uma plataforma educacional, a pergunta certa e: qual comportamento esperamos quando o aluno esta confuso, quando o contexto da aula esta incompleto, quando a API demora, quando o custo sobe, ou quando a resposta precisa ser auditada por um professor? Essas perguntas moldam o design antes do primeiro token. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Pense no tutor como uma camada entre curriculo, aluno e modelo. O curriculo fornece fonte de verdade; o aluno fornece objetivo, tentativa e duvida; Claude fornece linguagem, adaptacao e raciocinio aplicado. Se uma dessas partes entra sem estrutura, a resposta vira conversa solta. Se entra com contrato, a resposta vira produto. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A implementacao profissional tambem evita magia. Cada prompt tem versao, cada chamada registra usage, cada resposta importante pode ser reproduzida com os mesmos inputs, e cada fallback foi pensado antes do incidente. Isso parece burocratico no prototipo, mas e justamente o que permite escalar para milhares de alunos sem transformar suporte em adivinhacao. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Um bom criterio pratico e perguntar: se a resposta estiver errada, conseguimos descobrir por que? Precisamos saber qual modelo respondeu, qual contexto foi enviado, qual prompt estava ativo, qual rubrica foi usada, quanto custou e qual caminho de fallback ocorreu. Sem esses dados, a equipe apenas observa sintomas. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Tambem existe uma diferenca entre demonstracao e produto. A demonstracao mostra Claude respondendo bonito. O produto garante que a resposta respeita o nivel do aluno, nao vaza chave, nao entrega gabarito indevido, cabe no budget, aparece rapido na interface e gera dados para melhorar o curso. Engenharia de IA mora nessa diferenca. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Antes de publicar qualquer comportamento novo, escreva a politica em linguagem que suporte, professores e engenharia consigam discutir. Se uma regra depende de interpretacao humana, transforme-a em exemplo. Se depende de custo, transforme-a em budget. Se depende de seguranca, transforme-a em validacao e log. Esse habito reduz ambiguidades quando a plataforma cresce. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

### Decisoes praticas

- Producao exige controles economicos tanto quanto controles tecnicos.
- Segredos precisam de rotacao, escopo minimo e auditoria.
- Chamadas paralelas aceleram avaliacao, mas multiplicam custo e rate limit.
- Compliance comeca minimizando dados enviados ao modelo.
- Upgrade de modelo e mudanca de comportamento; trate como release de produto.

### Aplicacao na plataforma educacional

Quando aplicamos esta secao ao tutor da Harness IA, a regra e sempre partir de uma pergunta de produto: que aprendizagem queremos melhorar? Se a resposta for "reduzir tempo ate o aluno entender um erro", a integracao precisa privilegiar contexto, feedback claro e baixa latencia. Se a resposta for "avaliar exercicios com consistencia", a integracao precisa privilegiar rubrica, saida estruturada e audibilidade. Se a resposta for "explorar conceitos", a integracao pode ser mais conversacional, mas ainda precisa registrar custo e fontes de contexto.

### Checklist de implementacao

1. Defina o contrato de entrada e saida antes de chamar Claude.
2. Escolha o modelo por tarefa, nao por preferencia generica.
3. Registre prompt version, modelo, usage, latencia e status.
4. Tenha fallback local para manter a aula util em caso de falha.
5. Rode exemplos reais de tutor antes de publicar mudancas.

---

## SECAO 6: BATCHES E TAREFAS ASSINCRO NAS

Chamadas paralelas sao uma ferramenta de throughput, nao um convite para remover limites. Avaliar vinte tentativas ao mesmo tempo pode melhorar tempo total, mas tambem consome tokens, rate limit e dinheiro em rajada. Por isso, paralelismo precisa de fila, concorrencia maxima e agregacao de falhas. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Monitoramento de IA deve juntar engenharia e produto: latencia, erro e custo explicam operacao; score de feedback, taxa de fallback e melhoria em tentativas explicam aprendizagem. Um dashboard util mostra ambos, porque uma feature barata que ensina mal ainda e uma feature ruim. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

O erro mais comum e comecar pela chamada de API e deixar arquitetura para depois. Em uma plataforma educacional, a pergunta certa e: qual comportamento esperamos quando o aluno esta confuso, quando o contexto da aula esta incompleto, quando a API demora, quando o custo sobe, ou quando a resposta precisa ser auditada por um professor? Essas perguntas moldam o design antes do primeiro token. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Pense no tutor como uma camada entre curriculo, aluno e modelo. O curriculo fornece fonte de verdade; o aluno fornece objetivo, tentativa e duvida; Claude fornece linguagem, adaptacao e raciocinio aplicado. Se uma dessas partes entra sem estrutura, a resposta vira conversa solta. Se entra com contrato, a resposta vira produto. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A implementacao profissional tambem evita magia. Cada prompt tem versao, cada chamada registra usage, cada resposta importante pode ser reproduzida com os mesmos inputs, e cada fallback foi pensado antes do incidente. Isso parece burocratico no prototipo, mas e justamente o que permite escalar para milhares de alunos sem transformar suporte em adivinhacao. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Um bom criterio pratico e perguntar: se a resposta estiver errada, conseguimos descobrir por que? Precisamos saber qual modelo respondeu, qual contexto foi enviado, qual prompt estava ativo, qual rubrica foi usada, quanto custou e qual caminho de fallback ocorreu. Sem esses dados, a equipe apenas observa sintomas. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Tambem existe uma diferenca entre demonstracao e produto. A demonstracao mostra Claude respondendo bonito. O produto garante que a resposta respeita o nivel do aluno, nao vaza chave, nao entrega gabarito indevido, cabe no budget, aparece rapido na interface e gera dados para melhorar o curso. Engenharia de IA mora nessa diferenca. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Antes de publicar qualquer comportamento novo, escreva a politica em linguagem que suporte, professores e engenharia consigam discutir. Se uma regra depende de interpretacao humana, transforme-a em exemplo. Se depende de custo, transforme-a em budget. Se depende de seguranca, transforme-a em validacao e log. Esse habito reduz ambiguidades quando a plataforma cresce. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

### Decisoes praticas

- Producao exige controles economicos tanto quanto controles tecnicos.
- Segredos precisam de rotacao, escopo minimo e auditoria.
- Chamadas paralelas aceleram avaliacao, mas multiplicam custo e rate limit.
- Compliance comeca minimizando dados enviados ao modelo.
- Upgrade de modelo e mudanca de comportamento; trate como release de produto.

### Aplicacao na plataforma educacional

Quando aplicamos esta secao ao tutor da Harness IA, a regra e sempre partir de uma pergunta de produto: que aprendizagem queremos melhorar? Se a resposta for "reduzir tempo ate o aluno entender um erro", a integracao precisa privilegiar contexto, feedback claro e baixa latencia. Se a resposta for "avaliar exercicios com consistencia", a integracao precisa privilegiar rubrica, saida estruturada e audibilidade. Se a resposta for "explorar conceitos", a integracao pode ser mais conversacional, mas ainda precisa registrar custo e fontes de contexto.

### Checklist de implementacao

1. Defina o contrato de entrada e saida antes de chamar Claude.
2. Escolha o modelo por tarefa, nao por preferencia generica.
3. Registre prompt version, modelo, usage, latencia e status.
4. Tenha fallback local para manter a aula util em caso de falha.
5. Rode exemplos reais de tutor antes de publicar mudancas.

---

## SECAO 7: RUNBOOKS, UPGRADES E GOVERNANCA

Nesta secao, o objetivo e transformar uma capacidade do modelo em um contrato de produto. A pergunta nao e apenas 'Claude consegue fazer isso?', mas 'a plataforma consegue controlar, medir e evoluir isso sem quebrar a experiencia do aluno?'. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A resposta profissional quase sempre envolve tres camadas: regra de negocio, prompt ou ferramenta que executa a regra, e observabilidade para confirmar se a regra funcionou. Quando uma dessas camadas falta, a integracao fica dificil de depurar. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

O erro mais comum e comecar pela chamada de API e deixar arquitetura para depois. Em uma plataforma educacional, a pergunta certa e: qual comportamento esperamos quando o aluno esta confuso, quando o contexto da aula esta incompleto, quando a API demora, quando o custo sobe, ou quando a resposta precisa ser auditada por um professor? Essas perguntas moldam o design antes do primeiro token. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Pense no tutor como uma camada entre curriculo, aluno e modelo. O curriculo fornece fonte de verdade; o aluno fornece objetivo, tentativa e duvida; Claude fornece linguagem, adaptacao e raciocinio aplicado. Se uma dessas partes entra sem estrutura, a resposta vira conversa solta. Se entra com contrato, a resposta vira produto. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A implementacao profissional tambem evita magia. Cada prompt tem versao, cada chamada registra usage, cada resposta importante pode ser reproduzida com os mesmos inputs, e cada fallback foi pensado antes do incidente. Isso parece burocratico no prototipo, mas e justamente o que permite escalar para milhares de alunos sem transformar suporte em adivinhacao. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Um bom criterio pratico e perguntar: se a resposta estiver errada, conseguimos descobrir por que? Precisamos saber qual modelo respondeu, qual contexto foi enviado, qual prompt estava ativo, qual rubrica foi usada, quanto custou e qual caminho de fallback ocorreu. Sem esses dados, a equipe apenas observa sintomas. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Tambem existe uma diferenca entre demonstracao e produto. A demonstracao mostra Claude respondendo bonito. O produto garante que a resposta respeita o nivel do aluno, nao vaza chave, nao entrega gabarito indevido, cabe no budget, aparece rapido na interface e gera dados para melhorar o curso. Engenharia de IA mora nessa diferenca. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Antes de publicar qualquer comportamento novo, escreva a politica em linguagem que suporte, professores e engenharia consigam discutir. Se uma regra depende de interpretacao humana, transforme-a em exemplo. Se depende de custo, transforme-a em budget. Se depende de seguranca, transforme-a em validacao e log. Esse habito reduz ambiguidades quando a plataforma cresce. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

### Decisoes praticas

- Producao exige controles economicos tanto quanto controles tecnicos.
- Segredos precisam de rotacao, escopo minimo e auditoria.
- Chamadas paralelas aceleram avaliacao, mas multiplicam custo e rate limit.
- Compliance comeca minimizando dados enviados ao modelo.
- Upgrade de modelo e mudanca de comportamento; trate como release de produto.

### Aplicacao na plataforma educacional

Quando aplicamos esta secao ao tutor da Harness IA, a regra e sempre partir de uma pergunta de produto: que aprendizagem queremos melhorar? Se a resposta for "reduzir tempo ate o aluno entender um erro", a integracao precisa privilegiar contexto, feedback claro e baixa latencia. Se a resposta for "avaliar exercicios com consistencia", a integracao precisa privilegiar rubrica, saida estruturada e audibilidade. Se a resposta for "explorar conceitos", a integracao pode ser mais conversacional, mas ainda precisa registrar custo e fontes de contexto.

### Checklist de implementacao

1. Defina o contrato de entrada e saida antes de chamar Claude.
2. Escolha o modelo por tarefa, nao por preferencia generica.
3. Registre prompt version, modelo, usage, latencia e status.
4. Tenha fallback local para manter a aula util em caso de falha.
5. Rode exemplos reais de tutor antes de publicar mudancas.


---

## Exemplos TypeScript

### Configuracao por ambiente

Separa modelos, budgets e chaves sem alterar codigo.

```typescript
export const aiConfig = {
  env: process.env.APP_ENV ?? "development",
  anthropicKey: process.env.ANTHROPIC_API_KEY!,
  tutorModel: process.env.CLAUDE_TUTOR_MODEL ?? "claude-sonnet-5-5",
  evaluatorModel: process.env.CLAUDE_EVALUATOR_MODEL ?? "claude-opus-5-5",
  monthlyBudgetUsd: Number(process.env.AI_MONTHLY_BUDGET_USD ?? 500),
  perUserDailyBudgetUsd: Number(process.env.AI_USER_DAILY_BUDGET_USD ?? 2),
};
```

### Budget guard antes da chamada

Bloqueia chamadas antes de gerar custo excessivo.

```typescript
export async function assertBudgetAvailable(userId: string, estimatedUsd: number) {
  const [userSpend, orgSpend] = await Promise.all([
    db.aiUsage.sum({ where: { userId, createdAt: today() }, field: "costUsd" }),
    db.aiUsage.sum({ where: { createdAt: thisMonth() }, field: "costUsd" }),
  ]);

  if (userSpend + estimatedUsd > aiConfig.perUserDailyBudgetUsd) {
    throw new Error("AI_DAILY_USER_BUDGET_EXCEEDED");
  }
  if (orgSpend + estimatedUsd > aiConfig.monthlyBudgetUsd) {
    throw new Error("AI_MONTHLY_BUDGET_EXCEEDED");
  }
}
```

### Chamadas paralelas com limite

Avalia varias respostas sem saturar rate limit.

```typescript
import pLimit from "p-limit";

const limit = pLimit(3);

export async function evaluateManyAttempts(attempts: StudentAttempt[]) {
  const jobs = attempts.map((attempt) =>
    limit(async () => {
      await assertBudgetAvailable(attempt.userId, 0.03);
      return evaluateAttemptWithClaude(attempt);
    }),
  );

  const results = await Promise.allSettled(jobs);
  return results.map((r, index) => ({
    attemptId: attempts[index].id,
    status: r.status,
    value: r.status === "fulfilled" ? r.value : null,
  }));
}
```

### Logs de uso para dashboard

Normaliza eventos para BI, alertas e suporte.

```typescript
export async function logAiUsage(event: {
  userId: string;
  lessonId: string;
  model: string;
  promptVersion: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number | null;
  latencyMs: number;
  status: "success" | "fallback" | "error";
}) {
  await db.aiUsage.create({ data: { ...event, createdAt: new Date() } });
}
```

### Canary de modelo

Envia pequena parcela do trafego para modelo novo e compara qualidade.

```typescript
export function chooseModelForRequest(userId: string) {
  const hash = stableHash(userId);
  const canaryPercent = Number(process.env.CLAUDE_CANARY_PERCENT ?? 0);
  if (hash % 100 < canaryPercent) {
    return process.env.CLAUDE_CANARY_MODEL ?? aiConfig.tutorModel;
  }
  return aiConfig.tutorModel;
}

export async function releaseGate() {
  const metrics = await getCanaryMetrics();
  return metrics.quality >= 0.98 && metrics.errorRate < 0.01 && metrics.costIncrease < 0.15;
}
```


---

## Quiz

### Questao 1

**Pergunta:** Por que chamada paralela exige limite de concorrencia?

**Resposta esperada:** Porque sem limite voce consome rate limit e budget muito rapido.

### Questao 2

**Pergunta:** O que monitorar alem de erro?

**Resposta esperada:** Custo, tokens, latencia, qualidade, fallback rate, prompt version e modelo.

### Questao 3

**Pergunta:** Qual e a primeira regra de compliance com dados de aluno?

**Resposta esperada:** Enviar apenas o minimo necessario para a finalidade educacional.

### Questao 4

**Pergunta:** Como fazer upgrade de modelo com seguranca?

**Resposta esperada:** Canary pequeno, evals, comparacao de custo/qualidade e rollback rapido.

### Questao 5

**Pergunta:** Por que separar API keys por ambiente?

**Resposta esperada:** Para reduzir blast radius e impedir que teste consuma budget ou dados de producao.

### Questao 6

**Pergunta:** Quando usar batch ou job assincro no lugar de request interativo?

**Resposta esperada:** Para avaliacao em massa, relatorios e tarefas que nao precisam responder na hora.


---

## Exercicio pratico com gabarito

### Enunciado

Desenhe e implemente o esqueleto de producao: env vars, budget guard, logging, paralelismo limitado, dashboard de metricas e canary de modelo.

### Entregaveis

- Codigo TypeScript server-side.
- Prompt ou contrato estruturado quando aplicavel.
- Logs ou metricas minimas.
- Pelo menos tres testes: sucesso, falha recuperavel e entrada invalida.
- Pequeno README explicando trade-offs.

### Gabarito esperado

O gabarito contem configuracao por ambiente, segredo server-only, assertBudgetAvailable, logAiUsage, evaluateManyAttempts com p-limit, metricas agregadas, canary por hash de usuario, checklist de compliance e runbook de incidente.

### Criterios de avaliacao

1. A solucao nao expoe API key ao navegador.
2. O codigo trata erro e custo explicitamente.
3. A resposta do tutor e util para aprendizagem, nao apenas tecnicamente correta.
4. O formato de saida e validavel pela aplicacao.
5. O design permite trocar modelo, prompt e budget por configuracao.

## Fechamento

Ao terminar esta licao, voce deve conseguir explicar nao apenas como chamar Claude, mas como transformar essa chamada em uma parte confiavel da Harness IA. A integracao madura combina prompt engineering, arquitetura server-side, observabilidade, seguranca e criterio pedagogico. Esse e o salto de API demo para produto educacional.
