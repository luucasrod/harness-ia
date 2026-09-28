# LICAO 10.1: Claude API Fundamentals - Auth, Models, Streaming, Tokens e Custos

Aprenda a integrar a Messages API da Claude em uma plataforma educacional real, com autenticacao segura, escolha de modelos, streaming, token budgeting e estimativa de custo.

## Objetivos da licao

- Configurar o SDK TypeScript da Anthropic sem expor API keys ao navegador.
- Escolher modelos Claude por perfil de tarefa: tutor rapido, avaliador cuidadoso e explicador profundo.
- Criar chamadas Messages API com system prompt, mensagens de usuario e limites de resposta.
- Implementar streaming SSE para respostas incrementais em uma aula interativa.
- Estimar tokens, custo e risco de estouro de contexto antes de chamar a API.
- Projetar uma camada de servico reutilizavel para a plataforma educacional.

## Contexto do modulo

Claude AI Integration neste curso nao e uma aula sobre brincar com chatbot. O objetivo e construir uma integracao de engenharia de software para uma plataforma educacional real. Isso significa conectar Claude a requisitos de produto, seguranca, observabilidade, custo, experiencia de usuario, dados de aluno e evolucao de modelos. A plataforma Harness IA precisa de um tutor que responda com clareza, mas tambem precisa de um sistema que possa ser mantido por uma equipe.

A documentacao oficial da Anthropic muda com o tempo, especialmente modelos, precos, limites e recursos beta. Por isso, os exemplos desta licao usam IDs atuais como configuracao e ensinam a centralizar essas escolhas. A habilidade que importa nao e decorar um preco; e construir uma arquitetura em que preco, modelo, prompt e politica possam mudar sem reescrever a plataforma.

## SECAO 1: A PRIMEIRA INTEGRACAO REAL

Nesta secao, o objetivo e transformar uma capacidade do modelo em um contrato de produto. A pergunta nao e apenas 'Claude consegue fazer isso?', mas 'a plataforma consegue controlar, medir e evoluir isso sem quebrar a experiencia do aluno?'. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A resposta profissional quase sempre envolve tres camadas: regra de negocio, prompt ou ferramenta que executa a regra, e observabilidade para confirmar se a regra funcionou. Quando uma dessas camadas falta, a integracao fica dificil de depurar. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

O erro mais comum e comecar pela chamada de API e deixar arquitetura para depois. Em uma plataforma educacional, a pergunta certa e: qual comportamento esperamos quando o aluno esta confuso, quando o contexto da aula esta incompleto, quando a API demora, quando o custo sobe, ou quando a resposta precisa ser auditada por um professor? Essas perguntas moldam o design antes do primeiro token. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Pense no tutor como uma camada entre curriculo, aluno e modelo. O curriculo fornece fonte de verdade; o aluno fornece objetivo, tentativa e duvida; Claude fornece linguagem, adaptacao e raciocinio aplicado. Se uma dessas partes entra sem estrutura, a resposta vira conversa solta. Se entra com contrato, a resposta vira produto. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A implementacao profissional tambem evita magia. Cada prompt tem versao, cada chamada registra usage, cada resposta importante pode ser reproduzida com os mesmos inputs, e cada fallback foi pensado antes do incidente. Isso parece burocratico no prototipo, mas e justamente o que permite escalar para milhares de alunos sem transformar suporte em adivinhacao. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Um bom criterio pratico e perguntar: se a resposta estiver errada, conseguimos descobrir por que? Precisamos saber qual modelo respondeu, qual contexto foi enviado, qual prompt estava ativo, qual rubrica foi usada, quanto custou e qual caminho de fallback ocorreu. Sem esses dados, a equipe apenas observa sintomas. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Tambem existe uma diferenca entre demonstracao e produto. A demonstracao mostra Claude respondendo bonito. O produto garante que a resposta respeita o nivel do aluno, nao vaza chave, nao entrega gabarito indevido, cabe no budget, aparece rapido na interface e gera dados para melhorar o curso. Engenharia de IA mora nessa diferenca. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Antes de publicar qualquer comportamento novo, escreva a politica em linguagem que suporte, professores e engenharia consigam discutir. Se uma regra depende de interpretacao humana, transforme-a em exemplo. Se depende de custo, transforme-a em budget. Se depende de seguranca, transforme-a em validacao e log. Esse habito reduz ambiguidades quando a plataforma cresce. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

### Decisoes praticas

- A API deve viver no servidor; o cliente nunca recebe a chave Anthropic.
- Model IDs mudam com o tempo; isole-os em configuracao versionada.
- Streaming melhora percepcao de latencia e permite cancelar respostas caras.
- O campo usage da resposta deve alimentar custo, analytics e alertas.
- Token budgeting e prompt caching sao decisoes de arquitetura, nao detalhes cosmeticos.

### Aplicacao na plataforma educacional

Quando aplicamos esta secao ao tutor da Harness IA, a regra e sempre partir de uma pergunta de produto: que aprendizagem queremos melhorar? Se a resposta for "reduzir tempo ate o aluno entender um erro", a integracao precisa privilegiar contexto, feedback claro e baixa latencia. Se a resposta for "avaliar exercicios com consistencia", a integracao precisa privilegiar rubrica, saida estruturada e audibilidade. Se a resposta for "explorar conceitos", a integracao pode ser mais conversacional, mas ainda precisa registrar custo e fontes de contexto.

### Checklist de implementacao

1. Defina o contrato de entrada e saida antes de chamar Claude.
2. Escolha o modelo por tarefa, nao por preferencia generica.
3. Registre prompt version, modelo, usage, latencia e status.
4. Tenha fallback local para manter a aula util em caso de falha.
5. Rode exemplos reais de tutor antes de publicar mudancas.

---

## SECAO 2: AUTENTICACAO E CONFIGURACAO SEGURA

Nesta secao, o objetivo e transformar uma capacidade do modelo em um contrato de produto. A pergunta nao e apenas 'Claude consegue fazer isso?', mas 'a plataforma consegue controlar, medir e evoluir isso sem quebrar a experiencia do aluno?'. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A resposta profissional quase sempre envolve tres camadas: regra de negocio, prompt ou ferramenta que executa a regra, e observabilidade para confirmar se a regra funcionou. Quando uma dessas camadas falta, a integracao fica dificil de depurar. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

O erro mais comum e comecar pela chamada de API e deixar arquitetura para depois. Em uma plataforma educacional, a pergunta certa e: qual comportamento esperamos quando o aluno esta confuso, quando o contexto da aula esta incompleto, quando a API demora, quando o custo sobe, ou quando a resposta precisa ser auditada por um professor? Essas perguntas moldam o design antes do primeiro token. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Pense no tutor como uma camada entre curriculo, aluno e modelo. O curriculo fornece fonte de verdade; o aluno fornece objetivo, tentativa e duvida; Claude fornece linguagem, adaptacao e raciocinio aplicado. Se uma dessas partes entra sem estrutura, a resposta vira conversa solta. Se entra com contrato, a resposta vira produto. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A implementacao profissional tambem evita magia. Cada prompt tem versao, cada chamada registra usage, cada resposta importante pode ser reproduzida com os mesmos inputs, e cada fallback foi pensado antes do incidente. Isso parece burocratico no prototipo, mas e justamente o que permite escalar para milhares de alunos sem transformar suporte em adivinhacao. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Um bom criterio pratico e perguntar: se a resposta estiver errada, conseguimos descobrir por que? Precisamos saber qual modelo respondeu, qual contexto foi enviado, qual prompt estava ativo, qual rubrica foi usada, quanto custou e qual caminho de fallback ocorreu. Sem esses dados, a equipe apenas observa sintomas. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Tambem existe uma diferenca entre demonstracao e produto. A demonstracao mostra Claude respondendo bonito. O produto garante que a resposta respeita o nivel do aluno, nao vaza chave, nao entrega gabarito indevido, cabe no budget, aparece rapido na interface e gera dados para melhorar o curso. Engenharia de IA mora nessa diferenca. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Antes de publicar qualquer comportamento novo, escreva a politica em linguagem que suporte, professores e engenharia consigam discutir. Se uma regra depende de interpretacao humana, transforme-a em exemplo. Se depende de custo, transforme-a em budget. Se depende de seguranca, transforme-a em validacao e log. Esse habito reduz ambiguidades quando a plataforma cresce. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

### Decisoes praticas

- A API deve viver no servidor; o cliente nunca recebe a chave Anthropic.
- Model IDs mudam com o tempo; isole-os em configuracao versionada.
- Streaming melhora percepcao de latencia e permite cancelar respostas caras.
- O campo usage da resposta deve alimentar custo, analytics e alertas.
- Token budgeting e prompt caching sao decisoes de arquitetura, nao detalhes cosmeticos.

### Aplicacao na plataforma educacional

Quando aplicamos esta secao ao tutor da Harness IA, a regra e sempre partir de uma pergunta de produto: que aprendizagem queremos melhorar? Se a resposta for "reduzir tempo ate o aluno entender um erro", a integracao precisa privilegiar contexto, feedback claro e baixa latencia. Se a resposta for "avaliar exercicios com consistencia", a integracao precisa privilegiar rubrica, saida estruturada e audibilidade. Se a resposta for "explorar conceitos", a integracao pode ser mais conversacional, mas ainda precisa registrar custo e fontes de contexto.

### Checklist de implementacao

1. Defina o contrato de entrada e saida antes de chamar Claude.
2. Escolha o modelo por tarefa, nao por preferencia generica.
3. Registre prompt version, modelo, usage, latencia e status.
4. Tenha fallback local para manter a aula util em caso de falha.
5. Rode exemplos reais de tutor antes de publicar mudancas.

---

## SECAO 3: MODELOS, ALIASES E ESTRATEGIA DE ESCOLHA

Modelo e custo devem ser tratados como parte do design da feature. Uma explicacao curta durante a aula pode usar um modelo rapido; uma revisao de projeto final pode justificar um modelo mais caro; uma avaliacao em massa talvez precise batch, cache ou fila. Essa escolha deve aparecer no codigo como politica explicita. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Tokens sao a unidade operacional da integracao. Eles afetam preco, latencia, rate limit e qualidade, porque contexto demais pode diluir a pergunta. Um tutor serio mede input, output, cache hit quando aplicavel, custo estimado e valor pedagogico entregue. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

O erro mais comum e comecar pela chamada de API e deixar arquitetura para depois. Em uma plataforma educacional, a pergunta certa e: qual comportamento esperamos quando o aluno esta confuso, quando o contexto da aula esta incompleto, quando a API demora, quando o custo sobe, ou quando a resposta precisa ser auditada por um professor? Essas perguntas moldam o design antes do primeiro token. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Pense no tutor como uma camada entre curriculo, aluno e modelo. O curriculo fornece fonte de verdade; o aluno fornece objetivo, tentativa e duvida; Claude fornece linguagem, adaptacao e raciocinio aplicado. Se uma dessas partes entra sem estrutura, a resposta vira conversa solta. Se entra com contrato, a resposta vira produto. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A implementacao profissional tambem evita magia. Cada prompt tem versao, cada chamada registra usage, cada resposta importante pode ser reproduzida com os mesmos inputs, e cada fallback foi pensado antes do incidente. Isso parece burocratico no prototipo, mas e justamente o que permite escalar para milhares de alunos sem transformar suporte em adivinhacao. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Um bom criterio pratico e perguntar: se a resposta estiver errada, conseguimos descobrir por que? Precisamos saber qual modelo respondeu, qual contexto foi enviado, qual prompt estava ativo, qual rubrica foi usada, quanto custou e qual caminho de fallback ocorreu. Sem esses dados, a equipe apenas observa sintomas. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Tambem existe uma diferenca entre demonstracao e produto. A demonstracao mostra Claude respondendo bonito. O produto garante que a resposta respeita o nivel do aluno, nao vaza chave, nao entrega gabarito indevido, cabe no budget, aparece rapido na interface e gera dados para melhorar o curso. Engenharia de IA mora nessa diferenca. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Antes de publicar qualquer comportamento novo, escreva a politica em linguagem que suporte, professores e engenharia consigam discutir. Se uma regra depende de interpretacao humana, transforme-a em exemplo. Se depende de custo, transforme-a em budget. Se depende de seguranca, transforme-a em validacao e log. Esse habito reduz ambiguidades quando a plataforma cresce. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

### Decisoes praticas

- A API deve viver no servidor; o cliente nunca recebe a chave Anthropic.
- Model IDs mudam com o tempo; isole-os em configuracao versionada.
- Streaming melhora percepcao de latencia e permite cancelar respostas caras.
- O campo usage da resposta deve alimentar custo, analytics e alertas.
- Token budgeting e prompt caching sao decisoes de arquitetura, nao detalhes cosmeticos.

### Aplicacao na plataforma educacional

Quando aplicamos esta secao ao tutor da Harness IA, a regra e sempre partir de uma pergunta de produto: que aprendizagem queremos melhorar? Se a resposta for "reduzir tempo ate o aluno entender um erro", a integracao precisa privilegiar contexto, feedback claro e baixa latencia. Se a resposta for "avaliar exercicios com consistencia", a integracao precisa privilegiar rubrica, saida estruturada e audibilidade. Se a resposta for "explorar conceitos", a integracao pode ser mais conversacional, mas ainda precisa registrar custo e fontes de contexto.

### Checklist de implementacao

1. Defina o contrato de entrada e saida antes de chamar Claude.
2. Escolha o modelo por tarefa, nao por preferencia generica.
3. Registre prompt version, modelo, usage, latencia e status.
4. Tenha fallback local para manter a aula util em caso de falha.
5. Rode exemplos reais de tutor antes de publicar mudancas.

---

## SECAO 4: MESSAGES API COMO CONTRATO PRINCIPAL

Nesta secao, o objetivo e transformar uma capacidade do modelo em um contrato de produto. A pergunta nao e apenas 'Claude consegue fazer isso?', mas 'a plataforma consegue controlar, medir e evoluir isso sem quebrar a experiencia do aluno?'. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A resposta profissional quase sempre envolve tres camadas: regra de negocio, prompt ou ferramenta que executa a regra, e observabilidade para confirmar se a regra funcionou. Quando uma dessas camadas falta, a integracao fica dificil de depurar. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

O erro mais comum e comecar pela chamada de API e deixar arquitetura para depois. Em uma plataforma educacional, a pergunta certa e: qual comportamento esperamos quando o aluno esta confuso, quando o contexto da aula esta incompleto, quando a API demora, quando o custo sobe, ou quando a resposta precisa ser auditada por um professor? Essas perguntas moldam o design antes do primeiro token. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Pense no tutor como uma camada entre curriculo, aluno e modelo. O curriculo fornece fonte de verdade; o aluno fornece objetivo, tentativa e duvida; Claude fornece linguagem, adaptacao e raciocinio aplicado. Se uma dessas partes entra sem estrutura, a resposta vira conversa solta. Se entra com contrato, a resposta vira produto. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A implementacao profissional tambem evita magia. Cada prompt tem versao, cada chamada registra usage, cada resposta importante pode ser reproduzida com os mesmos inputs, e cada fallback foi pensado antes do incidente. Isso parece burocratico no prototipo, mas e justamente o que permite escalar para milhares de alunos sem transformar suporte em adivinhacao. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Um bom criterio pratico e perguntar: se a resposta estiver errada, conseguimos descobrir por que? Precisamos saber qual modelo respondeu, qual contexto foi enviado, qual prompt estava ativo, qual rubrica foi usada, quanto custou e qual caminho de fallback ocorreu. Sem esses dados, a equipe apenas observa sintomas. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Tambem existe uma diferenca entre demonstracao e produto. A demonstracao mostra Claude respondendo bonito. O produto garante que a resposta respeita o nivel do aluno, nao vaza chave, nao entrega gabarito indevido, cabe no budget, aparece rapido na interface e gera dados para melhorar o curso. Engenharia de IA mora nessa diferenca. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Antes de publicar qualquer comportamento novo, escreva a politica em linguagem que suporte, professores e engenharia consigam discutir. Se uma regra depende de interpretacao humana, transforme-a em exemplo. Se depende de custo, transforme-a em budget. Se depende de seguranca, transforme-a em validacao e log. Esse habito reduz ambiguidades quando a plataforma cresce. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

### Decisoes praticas

- A API deve viver no servidor; o cliente nunca recebe a chave Anthropic.
- Model IDs mudam com o tempo; isole-os em configuracao versionada.
- Streaming melhora percepcao de latencia e permite cancelar respostas caras.
- O campo usage da resposta deve alimentar custo, analytics e alertas.
- Token budgeting e prompt caching sao decisoes de arquitetura, nao detalhes cosmeticos.

### Aplicacao na plataforma educacional

Quando aplicamos esta secao ao tutor da Harness IA, a regra e sempre partir de uma pergunta de produto: que aprendizagem queremos melhorar? Se a resposta for "reduzir tempo ate o aluno entender um erro", a integracao precisa privilegiar contexto, feedback claro e baixa latencia. Se a resposta for "avaliar exercicios com consistencia", a integracao precisa privilegiar rubrica, saida estruturada e audibilidade. Se a resposta for "explorar conceitos", a integracao pode ser mais conversacional, mas ainda precisa registrar custo e fontes de contexto.

### Checklist de implementacao

1. Defina o contrato de entrada e saida antes de chamar Claude.
2. Escolha o modelo por tarefa, nao por preferencia generica.
3. Registre prompt version, modelo, usage, latencia e status.
4. Tenha fallback local para manter a aula util em caso de falha.
5. Rode exemplos reais de tutor antes de publicar mudancas.

---

## SECAO 5: STREAMING PARA EXPERIENCIA DE TUTOR

Streaming muda a sensacao do produto. O aluno nao fica olhando para um spinner; ele ve a explicacao nascer, pode interromper e recebe feedback mesmo quando a resposta completa levaria mais tempo. Para tutoria, isso reduz ansiedade e aumenta a percepcao de presenca. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A implementacao precisa tratar eventos parciais, erros no meio do stream e cancelamento. Em SSE, uma resposta pode comecar com HTTP 200 e falhar depois. Portanto, a UI deve distinguir resposta completa, resposta interrompida e fallback. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

O erro mais comum e comecar pela chamada de API e deixar arquitetura para depois. Em uma plataforma educacional, a pergunta certa e: qual comportamento esperamos quando o aluno esta confuso, quando o contexto da aula esta incompleto, quando a API demora, quando o custo sobe, ou quando a resposta precisa ser auditada por um professor? Essas perguntas moldam o design antes do primeiro token. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Pense no tutor como uma camada entre curriculo, aluno e modelo. O curriculo fornece fonte de verdade; o aluno fornece objetivo, tentativa e duvida; Claude fornece linguagem, adaptacao e raciocinio aplicado. Se uma dessas partes entra sem estrutura, a resposta vira conversa solta. Se entra com contrato, a resposta vira produto. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A implementacao profissional tambem evita magia. Cada prompt tem versao, cada chamada registra usage, cada resposta importante pode ser reproduzida com os mesmos inputs, e cada fallback foi pensado antes do incidente. Isso parece burocratico no prototipo, mas e justamente o que permite escalar para milhares de alunos sem transformar suporte em adivinhacao. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Um bom criterio pratico e perguntar: se a resposta estiver errada, conseguimos descobrir por que? Precisamos saber qual modelo respondeu, qual contexto foi enviado, qual prompt estava ativo, qual rubrica foi usada, quanto custou e qual caminho de fallback ocorreu. Sem esses dados, a equipe apenas observa sintomas. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Tambem existe uma diferenca entre demonstracao e produto. A demonstracao mostra Claude respondendo bonito. O produto garante que a resposta respeita o nivel do aluno, nao vaza chave, nao entrega gabarito indevido, cabe no budget, aparece rapido na interface e gera dados para melhorar o curso. Engenharia de IA mora nessa diferenca. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Antes de publicar qualquer comportamento novo, escreva a politica em linguagem que suporte, professores e engenharia consigam discutir. Se uma regra depende de interpretacao humana, transforme-a em exemplo. Se depende de custo, transforme-a em budget. Se depende de seguranca, transforme-a em validacao e log. Esse habito reduz ambiguidades quando a plataforma cresce. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

### Decisoes praticas

- A API deve viver no servidor; o cliente nunca recebe a chave Anthropic.
- Model IDs mudam com o tempo; isole-os em configuracao versionada.
- Streaming melhora percepcao de latencia e permite cancelar respostas caras.
- O campo usage da resposta deve alimentar custo, analytics e alertas.
- Token budgeting e prompt caching sao decisoes de arquitetura, nao detalhes cosmeticos.

### Aplicacao na plataforma educacional

Quando aplicamos esta secao ao tutor da Harness IA, a regra e sempre partir de uma pergunta de produto: que aprendizagem queremos melhorar? Se a resposta for "reduzir tempo ate o aluno entender um erro", a integracao precisa privilegiar contexto, feedback claro e baixa latencia. Se a resposta for "avaliar exercicios com consistencia", a integracao precisa privilegiar rubrica, saida estruturada e audibilidade. Se a resposta for "explorar conceitos", a integracao pode ser mais conversacional, mas ainda precisa registrar custo e fontes de contexto.

### Checklist de implementacao

1. Defina o contrato de entrada e saida antes de chamar Claude.
2. Escolha o modelo por tarefa, nao por preferencia generica.
3. Registre prompt version, modelo, usage, latencia e status.
4. Tenha fallback local para manter a aula util em caso de falha.
5. Rode exemplos reais de tutor antes de publicar mudancas.

---

## SECAO 6: TOKENS, CUSTO E LIMITES OPERACIONAIS

Modelo e custo devem ser tratados como parte do design da feature. Uma explicacao curta durante a aula pode usar um modelo rapido; uma revisao de projeto final pode justificar um modelo mais caro; uma avaliacao em massa talvez precise batch, cache ou fila. Essa escolha deve aparecer no codigo como politica explicita. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Tokens sao a unidade operacional da integracao. Eles afetam preco, latencia, rate limit e qualidade, porque contexto demais pode diluir a pergunta. Um tutor serio mede input, output, cache hit quando aplicavel, custo estimado e valor pedagogico entregue. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

O erro mais comum e comecar pela chamada de API e deixar arquitetura para depois. Em uma plataforma educacional, a pergunta certa e: qual comportamento esperamos quando o aluno esta confuso, quando o contexto da aula esta incompleto, quando a API demora, quando o custo sobe, ou quando a resposta precisa ser auditada por um professor? Essas perguntas moldam o design antes do primeiro token. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Pense no tutor como uma camada entre curriculo, aluno e modelo. O curriculo fornece fonte de verdade; o aluno fornece objetivo, tentativa e duvida; Claude fornece linguagem, adaptacao e raciocinio aplicado. Se uma dessas partes entra sem estrutura, a resposta vira conversa solta. Se entra com contrato, a resposta vira produto. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A implementacao profissional tambem evita magia. Cada prompt tem versao, cada chamada registra usage, cada resposta importante pode ser reproduzida com os mesmos inputs, e cada fallback foi pensado antes do incidente. Isso parece burocratico no prototipo, mas e justamente o que permite escalar para milhares de alunos sem transformar suporte em adivinhacao. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Um bom criterio pratico e perguntar: se a resposta estiver errada, conseguimos descobrir por que? Precisamos saber qual modelo respondeu, qual contexto foi enviado, qual prompt estava ativo, qual rubrica foi usada, quanto custou e qual caminho de fallback ocorreu. Sem esses dados, a equipe apenas observa sintomas. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Tambem existe uma diferenca entre demonstracao e produto. A demonstracao mostra Claude respondendo bonito. O produto garante que a resposta respeita o nivel do aluno, nao vaza chave, nao entrega gabarito indevido, cabe no budget, aparece rapido na interface e gera dados para melhorar o curso. Engenharia de IA mora nessa diferenca. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Antes de publicar qualquer comportamento novo, escreva a politica em linguagem que suporte, professores e engenharia consigam discutir. Se uma regra depende de interpretacao humana, transforme-a em exemplo. Se depende de custo, transforme-a em budget. Se depende de seguranca, transforme-a em validacao e log. Esse habito reduz ambiguidades quando a plataforma cresce. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

### Decisoes praticas

- A API deve viver no servidor; o cliente nunca recebe a chave Anthropic.
- Model IDs mudam com o tempo; isole-os em configuracao versionada.
- Streaming melhora percepcao de latencia e permite cancelar respostas caras.
- O campo usage da resposta deve alimentar custo, analytics e alertas.
- Token budgeting e prompt caching sao decisoes de arquitetura, nao detalhes cosmeticos.

### Aplicacao na plataforma educacional

Quando aplicamos esta secao ao tutor da Harness IA, a regra e sempre partir de uma pergunta de produto: que aprendizagem queremos melhorar? Se a resposta for "reduzir tempo ate o aluno entender um erro", a integracao precisa privilegiar contexto, feedback claro e baixa latencia. Se a resposta for "avaliar exercicios com consistencia", a integracao precisa privilegiar rubrica, saida estruturada e audibilidade. Se a resposta for "explorar conceitos", a integracao pode ser mais conversacional, mas ainda precisa registrar custo e fontes de contexto.

### Checklist de implementacao

1. Defina o contrato de entrada e saida antes de chamar Claude.
2. Escolha o modelo por tarefa, nao por preferencia generica.
3. Registre prompt version, modelo, usage, latencia e status.
4. Tenha fallback local para manter a aula util em caso de falha.
5. Rode exemplos reais de tutor antes de publicar mudancas.

---

## SECAO 7: ARQUITETURA RECOMENDADA PARA HARNESS IA

Nesta secao, o objetivo e transformar uma capacidade do modelo em um contrato de produto. A pergunta nao e apenas 'Claude consegue fazer isso?', mas 'a plataforma consegue controlar, medir e evoluir isso sem quebrar a experiencia do aluno?'. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A resposta profissional quase sempre envolve tres camadas: regra de negocio, prompt ou ferramenta que executa a regra, e observabilidade para confirmar se a regra funcionou. Quando uma dessas camadas falta, a integracao fica dificil de depurar. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

O erro mais comum e comecar pela chamada de API e deixar arquitetura para depois. Em uma plataforma educacional, a pergunta certa e: qual comportamento esperamos quando o aluno esta confuso, quando o contexto da aula esta incompleto, quando a API demora, quando o custo sobe, ou quando a resposta precisa ser auditada por um professor? Essas perguntas moldam o design antes do primeiro token. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Pense no tutor como uma camada entre curriculo, aluno e modelo. O curriculo fornece fonte de verdade; o aluno fornece objetivo, tentativa e duvida; Claude fornece linguagem, adaptacao e raciocinio aplicado. Se uma dessas partes entra sem estrutura, a resposta vira conversa solta. Se entra com contrato, a resposta vira produto. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A implementacao profissional tambem evita magia. Cada prompt tem versao, cada chamada registra usage, cada resposta importante pode ser reproduzida com os mesmos inputs, e cada fallback foi pensado antes do incidente. Isso parece burocratico no prototipo, mas e justamente o que permite escalar para milhares de alunos sem transformar suporte em adivinhacao. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Um bom criterio pratico e perguntar: se a resposta estiver errada, conseguimos descobrir por que? Precisamos saber qual modelo respondeu, qual contexto foi enviado, qual prompt estava ativo, qual rubrica foi usada, quanto custou e qual caminho de fallback ocorreu. Sem esses dados, a equipe apenas observa sintomas. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Tambem existe uma diferenca entre demonstracao e produto. A demonstracao mostra Claude respondendo bonito. O produto garante que a resposta respeita o nivel do aluno, nao vaza chave, nao entrega gabarito indevido, cabe no budget, aparece rapido na interface e gera dados para melhorar o curso. Engenharia de IA mora nessa diferenca. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Antes de publicar qualquer comportamento novo, escreva a politica em linguagem que suporte, professores e engenharia consigam discutir. Se uma regra depende de interpretacao humana, transforme-a em exemplo. Se depende de custo, transforme-a em budget. Se depende de seguranca, transforme-a em validacao e log. Esse habito reduz ambiguidades quando a plataforma cresce. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

### Decisoes praticas

- A API deve viver no servidor; o cliente nunca recebe a chave Anthropic.
- Model IDs mudam com o tempo; isole-os em configuracao versionada.
- Streaming melhora percepcao de latencia e permite cancelar respostas caras.
- O campo usage da resposta deve alimentar custo, analytics e alertas.
- Token budgeting e prompt caching sao decisoes de arquitetura, nao detalhes cosmeticos.

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

### Cliente Anthropic no servidor

Inicializa o SDK apenas no runtime server-side da aplicacao.

```typescript
import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  maxRetries: 2,
  timeout: 45_000,
});

export const CLAUDE_MODELS = {
  tutor: process.env.CLAUDE_TUTOR_MODEL ?? "claude-sonnet-5-5",
  fast: process.env.CLAUDE_FAST_MODEL ?? "claude-haiku-4-5",
  deepReview: process.env.CLAUDE_REVIEW_MODEL ?? "claude-opus-5-5",
} as const;

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY is required on the server");
}
```

### Primeira resposta do tutor

Chamada basica para responder uma duvida de aluno com contexto de licao.

```typescript
import { anthropic, CLAUDE_MODELS } from "./anthropic";

export async function answerLessonQuestion(input: {
  lessonTitle: string;
  lessonExcerpt: string;
  question: string;
}) {
  const message = await anthropic.messages.create({
    model: CLAUDE_MODELS.tutor,
    max_tokens: 900,
    temperature: 0.3,
    system: `You are the Harness IA tutor. Teach clearly, ask one check question, and never fabricate course content.`,
    messages: [
      {
        role: "user",
        content: `<lesson title="${input.lessonTitle}">${input.lessonExcerpt}</lesson>
<question>${input.question}</question>`,
      },
    ],
  });

  return {
    text: message.content.filter((b) => b.type === "text").map((b) => b.text).join("\n"),
    usage: message.usage,
    model: message.model,
  };
}
```

### Streaming para UI de chat

Entrega tokens incrementais para o frontend da plataforma.

```typescript
export async function streamTutorAnswer(question: string) {
  const stream = anthropic.messages.stream({
    model: CLAUDE_MODELS.tutor,
    max_tokens: 1200,
    system: "You are a concise but rigorous software engineering tutor.",
    messages: [{ role: "user", content: question }],
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      process.stdout.write(event.delta.text);
    }
  }

  const finalMessage = await stream.finalMessage();
  return finalMessage.usage;
}
```

### Estimativa simples de custo

Transforma usage em custo usando tabela centralizada e atualizavel.

```typescript
type ModelPrice = { inputPerMTok: number; outputPerMTok: number };

const PRICES_USD: Record<string, ModelPrice> = {
  "claude-sonnet-5-5": { inputPerMTok: 2, outputPerMTok: 10 },
  "claude-opus-5-5": { inputPerMTok: 4, outputPerMTok: 20 },
  "claude-haiku-4-5": { inputPerMTok: 1, outputPerMTok: 5 },
};

export function estimateUsd(model: string, usage: { input_tokens: number; output_tokens: number }) {
  const price = PRICES_USD[model];
  if (!price) return null;
  return (
    (usage.input_tokens / 1_000_000) * price.inputPerMTok +
    (usage.output_tokens / 1_000_000) * price.outputPerMTok
  );
}
```

### Endpoint server-side para tutor

API route que valida entrada e nunca revela segredos ao navegador.

```typescript
import { NextRequest } from "next/server";
import { z } from "zod";

const TutorRequest = z.object({
  lessonId: z.string().min(1),
  question: z.string().min(3).max(4000),
});

export async function POST(req: NextRequest) {
  const body = TutorRequest.parse(await req.json());
  const lesson = await loadLessonContext(body.lessonId);
  const answer = await answerLessonQuestion({
    lessonTitle: lesson.title,
    lessonExcerpt: lesson.excerpt,
    question: body.question,
  });

  await logAiUsage({ lessonId: body.lessonId, ...answer });
  return Response.json(answer);
}
```


---

## Quiz

### Questao 1

**Pergunta:** Por que a chave Anthropic nao deve ir para o browser?

**Resposta esperada:** Porque qualquer usuario poderia extrair a chave e gerar custo ou abuso em nome da organizacao.

### Questao 2

**Pergunta:** Quando streaming vale a pena em um tutor?

**Resposta esperada:** Quando a resposta pode demorar mais que alguns segundos, quando o aluno precisa de feedback progressivo, ou quando se deseja permitir cancelamento.

### Questao 3

**Pergunta:** Qual risco de hardcodar o model ID em vinte arquivos?

**Resposta esperada:** Upgrade, rollback, custo e avaliacao ficam espalhados; uma troca de modelo vira alteracao arriscada.

### Questao 4

**Pergunta:** O que o campo usage permite construir?

**Resposta esperada:** Estimativa de custo, dashboards, alertas de gasto, limites por usuario e analise de prompts caros.

### Questao 5

**Pergunta:** Qual e a diferenca entre max_tokens e janela de contexto?

**Resposta esperada:** max_tokens limita a saida; janela de contexto limita entrada mais saida que o modelo consegue considerar.

### Questao 6

**Pergunta:** Por que usar temperatura baixa em tutor tecnico?

**Resposta esperada:** Para reduzir variacao e priorizar consistencia, explicacao fiel ao conteudo e formato previsivel.


---

## Exercicio pratico com gabarito

### Enunciado

Implemente uma camada server-side que recebe lessonId, pergunta e userId, carrega contexto da licao, chama Claude, registra usage e retorna resposta.

### Entregaveis

- Codigo TypeScript server-side.
- Prompt ou contrato estruturado quando aplicavel.
- Logs ou metricas minimas.
- Pelo menos tres testes: sucesso, falha recuperavel e entrada invalida.
- Pequeno README explicando trade-offs.

### Gabarito esperado

A solucao deve ter Anthropic client server-only, schema Zod de entrada, system prompt do tutor, tabela de modelos em env vars, calculo de custo a partir de usage, log persistente e teste cobrindo pergunta valida, pergunta muito longa e ausencia de API key.

### Criterios de avaliacao

1. A solucao nao expoe API key ao navegador.
2. O codigo trata erro e custo explicitamente.
3. A resposta do tutor e util para aprendizagem, nao apenas tecnicamente correta.
4. O formato de saida e validavel pela aplicacao.
5. O design permite trocar modelo, prompt e budget por configuracao.

## Fechamento

Ao terminar esta licao, voce deve conseguir explicar nao apenas como chamar Claude, mas como transformar essa chamada em uma parte confiavel da Harness IA. A integracao madura combina prompt engineering, arquitetura server-side, observabilidade, seguranca e criterio pedagogico. Esse e o salto de API demo para produto educacional.
