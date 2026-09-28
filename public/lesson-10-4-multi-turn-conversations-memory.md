# LICAO 10.4: Multi-turn Conversations & Memory - Estado, Relevancia e Continuidade

Aprenda a manter conversas longas com Claude sem explodir tokens: historico, resumo, memoria de aprendizagem, relevance filtering e persistencia segura.

## Objetivos da licao

- Persistir conversas por aula, usuario e objetivo de aprendizagem.
- Distinguir historico recente, resumo de conversa e memoria duradoura.
- Selecionar mensagens relevantes antes de chamar Claude.
- Implementar resumo incremental para reduzir tokens.
- Guardar memoria pedagogica sem armazenar dados sensiveis desnecessarios.
- Projetar UX de continuidade entre sessoes.

## Contexto do modulo

Claude AI Integration neste curso nao e uma aula sobre brincar com chatbot. O objetivo e construir uma integracao de engenharia de software para uma plataforma educacional real. Isso significa conectar Claude a requisitos de produto, seguranca, observabilidade, custo, experiencia de usuario, dados de aluno e evolucao de modelos. A plataforma Harness IA precisa de um tutor que responda com clareza, mas tambem precisa de um sistema que possa ser mantido por uma equipe.

A documentacao oficial da Anthropic muda com o tempo, especialmente modelos, precos, limites e recursos beta. Por isso, os exemplos desta licao usam IDs atuais como configuracao e ensinam a centralizar essas escolhas. A habilidade que importa nao e decorar um preco; e construir uma arquitetura em que preco, modelo, prompt e politica possam mudar sem reescrever a plataforma.

## SECAO 1: POR QUE MULTI-TURN E DIFICIL

Conversas longas precisam de estado, nao de transcricao infinita. O historico recente preserva continuidade imediata; o resumo preserva decisoes e duvidas abertas; a memoria pedagogica preserva padroes duradouros, como conceitos em que o aluno ainda tropeça. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A memoria deve ser pequena, util e governavel. Guardar tudo parece conveniente, mas aumenta custo, risco de privacidade e chance de contexto irrelevante contaminar respostas futuras. Uma boa memoria pode ser explicada ao aluno e revisada pela equipe. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

O erro mais comum e comecar pela chamada de API e deixar arquitetura para depois. Em uma plataforma educacional, a pergunta certa e: qual comportamento esperamos quando o aluno esta confuso, quando o contexto da aula esta incompleto, quando a API demora, quando o custo sobe, ou quando a resposta precisa ser auditada por um professor? Essas perguntas moldam o design antes do primeiro token. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Pense no tutor como uma camada entre curriculo, aluno e modelo. O curriculo fornece fonte de verdade; o aluno fornece objetivo, tentativa e duvida; Claude fornece linguagem, adaptacao e raciocinio aplicado. Se uma dessas partes entra sem estrutura, a resposta vira conversa solta. Se entra com contrato, a resposta vira produto. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A implementacao profissional tambem evita magia. Cada prompt tem versao, cada chamada registra usage, cada resposta importante pode ser reproduzida com os mesmos inputs, e cada fallback foi pensado antes do incidente. Isso parece burocratico no prototipo, mas e justamente o que permite escalar para milhares de alunos sem transformar suporte em adivinhacao. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Um bom criterio pratico e perguntar: se a resposta estiver errada, conseguimos descobrir por que? Precisamos saber qual modelo respondeu, qual contexto foi enviado, qual prompt estava ativo, qual rubrica foi usada, quanto custou e qual caminho de fallback ocorreu. Sem esses dados, a equipe apenas observa sintomas. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Tambem existe uma diferenca entre demonstracao e produto. A demonstracao mostra Claude respondendo bonito. O produto garante que a resposta respeita o nivel do aluno, nao vaza chave, nao entrega gabarito indevido, cabe no budget, aparece rapido na interface e gera dados para melhorar o curso. Engenharia de IA mora nessa diferenca. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Antes de publicar qualquer comportamento novo, escreva a politica em linguagem que suporte, professores e engenharia consigam discutir. Se uma regra depende de interpretacao humana, transforme-a em exemplo. Se depende de custo, transforme-a em budget. Se depende de seguranca, transforme-a em validacao e log. Esse habito reduz ambiguidades quando a plataforma cresce. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

### Decisoes praticas

- Mandar toda conversa sempre e simples, caro e eventualmente ruim.
- Memoria nao e transcricao; e um conjunto de fatos uteis, consentidos e revisaveis.
- Relevancia deve considerar aula atual, exercicio atual e objetivo do aluno.
- Resumo incremental precisa preservar decisoes, duvidas abertas e erros recorrentes.
- O aluno deve poder limpar ou revisar memoria quando apropriado.

### Aplicacao na plataforma educacional

Quando aplicamos esta secao ao tutor da Harness IA, a regra e sempre partir de uma pergunta de produto: que aprendizagem queremos melhorar? Se a resposta for "reduzir tempo ate o aluno entender um erro", a integracao precisa privilegiar contexto, feedback claro e baixa latencia. Se a resposta for "avaliar exercicios com consistencia", a integracao precisa privilegiar rubrica, saida estruturada e audibilidade. Se a resposta for "explorar conceitos", a integracao pode ser mais conversacional, mas ainda precisa registrar custo e fontes de contexto.

### Checklist de implementacao

1. Defina o contrato de entrada e saida antes de chamar Claude.
2. Escolha o modelo por tarefa, nao por preferencia generica.
3. Registre prompt version, modelo, usage, latencia e status.
4. Tenha fallback local para manter a aula util em caso de falha.
5. Rode exemplos reais de tutor antes de publicar mudancas.

---

## SECAO 2: ESTADO DE CONVERSA VERSUS MEMORIA DURADOURA

Conversas longas precisam de estado, nao de transcricao infinita. O historico recente preserva continuidade imediata; o resumo preserva decisoes e duvidas abertas; a memoria pedagogica preserva padroes duradouros, como conceitos em que o aluno ainda tropeça. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A memoria deve ser pequena, util e governavel. Guardar tudo parece conveniente, mas aumenta custo, risco de privacidade e chance de contexto irrelevante contaminar respostas futuras. Uma boa memoria pode ser explicada ao aluno e revisada pela equipe. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

O erro mais comum e comecar pela chamada de API e deixar arquitetura para depois. Em uma plataforma educacional, a pergunta certa e: qual comportamento esperamos quando o aluno esta confuso, quando o contexto da aula esta incompleto, quando a API demora, quando o custo sobe, ou quando a resposta precisa ser auditada por um professor? Essas perguntas moldam o design antes do primeiro token. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Pense no tutor como uma camada entre curriculo, aluno e modelo. O curriculo fornece fonte de verdade; o aluno fornece objetivo, tentativa e duvida; Claude fornece linguagem, adaptacao e raciocinio aplicado. Se uma dessas partes entra sem estrutura, a resposta vira conversa solta. Se entra com contrato, a resposta vira produto. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A implementacao profissional tambem evita magia. Cada prompt tem versao, cada chamada registra usage, cada resposta importante pode ser reproduzida com os mesmos inputs, e cada fallback foi pensado antes do incidente. Isso parece burocratico no prototipo, mas e justamente o que permite escalar para milhares de alunos sem transformar suporte em adivinhacao. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Um bom criterio pratico e perguntar: se a resposta estiver errada, conseguimos descobrir por que? Precisamos saber qual modelo respondeu, qual contexto foi enviado, qual prompt estava ativo, qual rubrica foi usada, quanto custou e qual caminho de fallback ocorreu. Sem esses dados, a equipe apenas observa sintomas. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Tambem existe uma diferenca entre demonstracao e produto. A demonstracao mostra Claude respondendo bonito. O produto garante que a resposta respeita o nivel do aluno, nao vaza chave, nao entrega gabarito indevido, cabe no budget, aparece rapido na interface e gera dados para melhorar o curso. Engenharia de IA mora nessa diferenca. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Antes de publicar qualquer comportamento novo, escreva a politica em linguagem que suporte, professores e engenharia consigam discutir. Se uma regra depende de interpretacao humana, transforme-a em exemplo. Se depende de custo, transforme-a em budget. Se depende de seguranca, transforme-a em validacao e log. Esse habito reduz ambiguidades quando a plataforma cresce. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

### Decisoes praticas

- Mandar toda conversa sempre e simples, caro e eventualmente ruim.
- Memoria nao e transcricao; e um conjunto de fatos uteis, consentidos e revisaveis.
- Relevancia deve considerar aula atual, exercicio atual e objetivo do aluno.
- Resumo incremental precisa preservar decisoes, duvidas abertas e erros recorrentes.
- O aluno deve poder limpar ou revisar memoria quando apropriado.

### Aplicacao na plataforma educacional

Quando aplicamos esta secao ao tutor da Harness IA, a regra e sempre partir de uma pergunta de produto: que aprendizagem queremos melhorar? Se a resposta for "reduzir tempo ate o aluno entender um erro", a integracao precisa privilegiar contexto, feedback claro e baixa latencia. Se a resposta for "avaliar exercicios com consistencia", a integracao precisa privilegiar rubrica, saida estruturada e audibilidade. Se a resposta for "explorar conceitos", a integracao pode ser mais conversacional, mas ainda precisa registrar custo e fontes de contexto.

### Checklist de implementacao

1. Defina o contrato de entrada e saida antes de chamar Claude.
2. Escolha o modelo por tarefa, nao por preferencia generica.
3. Registre prompt version, modelo, usage, latencia e status.
4. Tenha fallback local para manter a aula util em caso de falha.
5. Rode exemplos reais de tutor antes de publicar mudancas.

---

## SECAO 3: JANELA DE CONTEXTO E COMPACTACAO

Nesta secao, o objetivo e transformar uma capacidade do modelo em um contrato de produto. A pergunta nao e apenas 'Claude consegue fazer isso?', mas 'a plataforma consegue controlar, medir e evoluir isso sem quebrar a experiencia do aluno?'. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A resposta profissional quase sempre envolve tres camadas: regra de negocio, prompt ou ferramenta que executa a regra, e observabilidade para confirmar se a regra funcionou. Quando uma dessas camadas falta, a integracao fica dificil de depurar. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

O erro mais comum e comecar pela chamada de API e deixar arquitetura para depois. Em uma plataforma educacional, a pergunta certa e: qual comportamento esperamos quando o aluno esta confuso, quando o contexto da aula esta incompleto, quando a API demora, quando o custo sobe, ou quando a resposta precisa ser auditada por um professor? Essas perguntas moldam o design antes do primeiro token. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Pense no tutor como uma camada entre curriculo, aluno e modelo. O curriculo fornece fonte de verdade; o aluno fornece objetivo, tentativa e duvida; Claude fornece linguagem, adaptacao e raciocinio aplicado. Se uma dessas partes entra sem estrutura, a resposta vira conversa solta. Se entra com contrato, a resposta vira produto. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A implementacao profissional tambem evita magia. Cada prompt tem versao, cada chamada registra usage, cada resposta importante pode ser reproduzida com os mesmos inputs, e cada fallback foi pensado antes do incidente. Isso parece burocratico no prototipo, mas e justamente o que permite escalar para milhares de alunos sem transformar suporte em adivinhacao. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Um bom criterio pratico e perguntar: se a resposta estiver errada, conseguimos descobrir por que? Precisamos saber qual modelo respondeu, qual contexto foi enviado, qual prompt estava ativo, qual rubrica foi usada, quanto custou e qual caminho de fallback ocorreu. Sem esses dados, a equipe apenas observa sintomas. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Tambem existe uma diferenca entre demonstracao e produto. A demonstracao mostra Claude respondendo bonito. O produto garante que a resposta respeita o nivel do aluno, nao vaza chave, nao entrega gabarito indevido, cabe no budget, aparece rapido na interface e gera dados para melhorar o curso. Engenharia de IA mora nessa diferenca. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Antes de publicar qualquer comportamento novo, escreva a politica em linguagem que suporte, professores e engenharia consigam discutir. Se uma regra depende de interpretacao humana, transforme-a em exemplo. Se depende de custo, transforme-a em budget. Se depende de seguranca, transforme-a em validacao e log. Esse habito reduz ambiguidades quando a plataforma cresce. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

### Decisoes praticas

- Mandar toda conversa sempre e simples, caro e eventualmente ruim.
- Memoria nao e transcricao; e um conjunto de fatos uteis, consentidos e revisaveis.
- Relevancia deve considerar aula atual, exercicio atual e objetivo do aluno.
- Resumo incremental precisa preservar decisoes, duvidas abertas e erros recorrentes.
- O aluno deve poder limpar ou revisar memoria quando apropriado.

### Aplicacao na plataforma educacional

Quando aplicamos esta secao ao tutor da Harness IA, a regra e sempre partir de uma pergunta de produto: que aprendizagem queremos melhorar? Se a resposta for "reduzir tempo ate o aluno entender um erro", a integracao precisa privilegiar contexto, feedback claro e baixa latencia. Se a resposta for "avaliar exercicios com consistencia", a integracao precisa privilegiar rubrica, saida estruturada e audibilidade. Se a resposta for "explorar conceitos", a integracao pode ser mais conversacional, mas ainda precisa registrar custo e fontes de contexto.

### Checklist de implementacao

1. Defina o contrato de entrada e saida antes de chamar Claude.
2. Escolha o modelo por tarefa, nao por preferencia generica.
3. Registre prompt version, modelo, usage, latencia e status.
4. Tenha fallback local para manter a aula util em caso de falha.
5. Rode exemplos reais de tutor antes de publicar mudancas.

---

## SECAO 4: RELEVANCE FILTERING

Nesta secao, o objetivo e transformar uma capacidade do modelo em um contrato de produto. A pergunta nao e apenas 'Claude consegue fazer isso?', mas 'a plataforma consegue controlar, medir e evoluir isso sem quebrar a experiencia do aluno?'. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A resposta profissional quase sempre envolve tres camadas: regra de negocio, prompt ou ferramenta que executa a regra, e observabilidade para confirmar se a regra funcionou. Quando uma dessas camadas falta, a integracao fica dificil de depurar. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

O erro mais comum e comecar pela chamada de API e deixar arquitetura para depois. Em uma plataforma educacional, a pergunta certa e: qual comportamento esperamos quando o aluno esta confuso, quando o contexto da aula esta incompleto, quando a API demora, quando o custo sobe, ou quando a resposta precisa ser auditada por um professor? Essas perguntas moldam o design antes do primeiro token. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Pense no tutor como uma camada entre curriculo, aluno e modelo. O curriculo fornece fonte de verdade; o aluno fornece objetivo, tentativa e duvida; Claude fornece linguagem, adaptacao e raciocinio aplicado. Se uma dessas partes entra sem estrutura, a resposta vira conversa solta. Se entra com contrato, a resposta vira produto. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A implementacao profissional tambem evita magia. Cada prompt tem versao, cada chamada registra usage, cada resposta importante pode ser reproduzida com os mesmos inputs, e cada fallback foi pensado antes do incidente. Isso parece burocratico no prototipo, mas e justamente o que permite escalar para milhares de alunos sem transformar suporte em adivinhacao. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Um bom criterio pratico e perguntar: se a resposta estiver errada, conseguimos descobrir por que? Precisamos saber qual modelo respondeu, qual contexto foi enviado, qual prompt estava ativo, qual rubrica foi usada, quanto custou e qual caminho de fallback ocorreu. Sem esses dados, a equipe apenas observa sintomas. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Tambem existe uma diferenca entre demonstracao e produto. A demonstracao mostra Claude respondendo bonito. O produto garante que a resposta respeita o nivel do aluno, nao vaza chave, nao entrega gabarito indevido, cabe no budget, aparece rapido na interface e gera dados para melhorar o curso. Engenharia de IA mora nessa diferenca. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Antes de publicar qualquer comportamento novo, escreva a politica em linguagem que suporte, professores e engenharia consigam discutir. Se uma regra depende de interpretacao humana, transforme-a em exemplo. Se depende de custo, transforme-a em budget. Se depende de seguranca, transforme-a em validacao e log. Esse habito reduz ambiguidades quando a plataforma cresce. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

### Decisoes praticas

- Mandar toda conversa sempre e simples, caro e eventualmente ruim.
- Memoria nao e transcricao; e um conjunto de fatos uteis, consentidos e revisaveis.
- Relevancia deve considerar aula atual, exercicio atual e objetivo do aluno.
- Resumo incremental precisa preservar decisoes, duvidas abertas e erros recorrentes.
- O aluno deve poder limpar ou revisar memoria quando apropriado.

### Aplicacao na plataforma educacional

Quando aplicamos esta secao ao tutor da Harness IA, a regra e sempre partir de uma pergunta de produto: que aprendizagem queremos melhorar? Se a resposta for "reduzir tempo ate o aluno entender um erro", a integracao precisa privilegiar contexto, feedback claro e baixa latencia. Se a resposta for "avaliar exercicios com consistencia", a integracao precisa privilegiar rubrica, saida estruturada e audibilidade. Se a resposta for "explorar conceitos", a integracao pode ser mais conversacional, mas ainda precisa registrar custo e fontes de contexto.

### Checklist de implementacao

1. Defina o contrato de entrada e saida antes de chamar Claude.
2. Escolha o modelo por tarefa, nao por preferencia generica.
3. Registre prompt version, modelo, usage, latencia e status.
4. Tenha fallback local para manter a aula util em caso de falha.
5. Rode exemplos reais de tutor antes de publicar mudancas.

---

## SECAO 5: RESUMO INCREMENTAL

Conversas longas precisam de estado, nao de transcricao infinita. O historico recente preserva continuidade imediata; o resumo preserva decisoes e duvidas abertas; a memoria pedagogica preserva padroes duradouros, como conceitos em que o aluno ainda tropeça. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A memoria deve ser pequena, util e governavel. Guardar tudo parece conveniente, mas aumenta custo, risco de privacidade e chance de contexto irrelevante contaminar respostas futuras. Uma boa memoria pode ser explicada ao aluno e revisada pela equipe. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

O erro mais comum e comecar pela chamada de API e deixar arquitetura para depois. Em uma plataforma educacional, a pergunta certa e: qual comportamento esperamos quando o aluno esta confuso, quando o contexto da aula esta incompleto, quando a API demora, quando o custo sobe, ou quando a resposta precisa ser auditada por um professor? Essas perguntas moldam o design antes do primeiro token. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Pense no tutor como uma camada entre curriculo, aluno e modelo. O curriculo fornece fonte de verdade; o aluno fornece objetivo, tentativa e duvida; Claude fornece linguagem, adaptacao e raciocinio aplicado. Se uma dessas partes entra sem estrutura, a resposta vira conversa solta. Se entra com contrato, a resposta vira produto. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A implementacao profissional tambem evita magia. Cada prompt tem versao, cada chamada registra usage, cada resposta importante pode ser reproduzida com os mesmos inputs, e cada fallback foi pensado antes do incidente. Isso parece burocratico no prototipo, mas e justamente o que permite escalar para milhares de alunos sem transformar suporte em adivinhacao. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Um bom criterio pratico e perguntar: se a resposta estiver errada, conseguimos descobrir por que? Precisamos saber qual modelo respondeu, qual contexto foi enviado, qual prompt estava ativo, qual rubrica foi usada, quanto custou e qual caminho de fallback ocorreu. Sem esses dados, a equipe apenas observa sintomas. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Tambem existe uma diferenca entre demonstracao e produto. A demonstracao mostra Claude respondendo bonito. O produto garante que a resposta respeita o nivel do aluno, nao vaza chave, nao entrega gabarito indevido, cabe no budget, aparece rapido na interface e gera dados para melhorar o curso. Engenharia de IA mora nessa diferenca. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Antes de publicar qualquer comportamento novo, escreva a politica em linguagem que suporte, professores e engenharia consigam discutir. Se uma regra depende de interpretacao humana, transforme-a em exemplo. Se depende de custo, transforme-a em budget. Se depende de seguranca, transforme-a em validacao e log. Esse habito reduz ambiguidades quando a plataforma cresce. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

### Decisoes praticas

- Mandar toda conversa sempre e simples, caro e eventualmente ruim.
- Memoria nao e transcricao; e um conjunto de fatos uteis, consentidos e revisaveis.
- Relevancia deve considerar aula atual, exercicio atual e objetivo do aluno.
- Resumo incremental precisa preservar decisoes, duvidas abertas e erros recorrentes.
- O aluno deve poder limpar ou revisar memoria quando apropriado.

### Aplicacao na plataforma educacional

Quando aplicamos esta secao ao tutor da Harness IA, a regra e sempre partir de uma pergunta de produto: que aprendizagem queremos melhorar? Se a resposta for "reduzir tempo ate o aluno entender um erro", a integracao precisa privilegiar contexto, feedback claro e baixa latencia. Se a resposta for "avaliar exercicios com consistencia", a integracao precisa privilegiar rubrica, saida estruturada e audibilidade. Se a resposta for "explorar conceitos", a integracao pode ser mais conversacional, mas ainda precisa registrar custo e fontes de contexto.

### Checklist de implementacao

1. Defina o contrato de entrada e saida antes de chamar Claude.
2. Escolha o modelo por tarefa, nao por preferencia generica.
3. Registre prompt version, modelo, usage, latencia e status.
4. Tenha fallback local para manter a aula util em caso de falha.
5. Rode exemplos reais de tutor antes de publicar mudancas.

---

## SECAO 6: MEMORIA PEDAGOGICA DO ALUNO

Um tutor de IA precisa diagnosticar antes de responder. Se o aluno pergunta 'por que meu hook roda duas vezes?', a resposta muda conforme o codigo, o nivel do aluno e a licao atual. Contexto curricular e tentativa do aluno sao tao importantes quanto a pergunta em linguagem natural. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Guardrails bons nao sao muros cegos. Eles canalizam ajuda: recusam entregar gabarito completo quando isso prejudica a atividade, mas oferecem um proximo passo concreto. O aluno deve sentir que recebeu orientacao, nao que foi bloqueado por uma regra abstrata. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

O erro mais comum e comecar pela chamada de API e deixar arquitetura para depois. Em uma plataforma educacional, a pergunta certa e: qual comportamento esperamos quando o aluno esta confuso, quando o contexto da aula esta incompleto, quando a API demora, quando o custo sobe, ou quando a resposta precisa ser auditada por um professor? Essas perguntas moldam o design antes do primeiro token. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Pense no tutor como uma camada entre curriculo, aluno e modelo. O curriculo fornece fonte de verdade; o aluno fornece objetivo, tentativa e duvida; Claude fornece linguagem, adaptacao e raciocinio aplicado. Se uma dessas partes entra sem estrutura, a resposta vira conversa solta. Se entra com contrato, a resposta vira produto. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A implementacao profissional tambem evita magia. Cada prompt tem versao, cada chamada registra usage, cada resposta importante pode ser reproduzida com os mesmos inputs, e cada fallback foi pensado antes do incidente. Isso parece burocratico no prototipo, mas e justamente o que permite escalar para milhares de alunos sem transformar suporte em adivinhacao. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Um bom criterio pratico e perguntar: se a resposta estiver errada, conseguimos descobrir por que? Precisamos saber qual modelo respondeu, qual contexto foi enviado, qual prompt estava ativo, qual rubrica foi usada, quanto custou e qual caminho de fallback ocorreu. Sem esses dados, a equipe apenas observa sintomas. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Tambem existe uma diferenca entre demonstracao e produto. A demonstracao mostra Claude respondendo bonito. O produto garante que a resposta respeita o nivel do aluno, nao vaza chave, nao entrega gabarito indevido, cabe no budget, aparece rapido na interface e gera dados para melhorar o curso. Engenharia de IA mora nessa diferenca. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Antes de publicar qualquer comportamento novo, escreva a politica em linguagem que suporte, professores e engenharia consigam discutir. Se uma regra depende de interpretacao humana, transforme-a em exemplo. Se depende de custo, transforme-a em budget. Se depende de seguranca, transforme-a em validacao e log. Esse habito reduz ambiguidades quando a plataforma cresce. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

### Decisoes praticas

- Mandar toda conversa sempre e simples, caro e eventualmente ruim.
- Memoria nao e transcricao; e um conjunto de fatos uteis, consentidos e revisaveis.
- Relevancia deve considerar aula atual, exercicio atual e objetivo do aluno.
- Resumo incremental precisa preservar decisoes, duvidas abertas e erros recorrentes.
- O aluno deve poder limpar ou revisar memoria quando apropriado.

### Aplicacao na plataforma educacional

Quando aplicamos esta secao ao tutor da Harness IA, a regra e sempre partir de uma pergunta de produto: que aprendizagem queremos melhorar? Se a resposta for "reduzir tempo ate o aluno entender um erro", a integracao precisa privilegiar contexto, feedback claro e baixa latencia. Se a resposta for "avaliar exercicios com consistencia", a integracao precisa privilegiar rubrica, saida estruturada e audibilidade. Se a resposta for "explorar conceitos", a integracao pode ser mais conversacional, mas ainda precisa registrar custo e fontes de contexto.

### Checklist de implementacao

1. Defina o contrato de entrada e saida antes de chamar Claude.
2. Escolha o modelo por tarefa, nao por preferencia generica.
3. Registre prompt version, modelo, usage, latencia e status.
4. Tenha fallback local para manter a aula util em caso de falha.
5. Rode exemplos reais de tutor antes de publicar mudancas.

---

## SECAO 7: ARQUITETURA DE CHAT PERSISTENTE

Nesta secao, o objetivo e transformar uma capacidade do modelo em um contrato de produto. A pergunta nao e apenas 'Claude consegue fazer isso?', mas 'a plataforma consegue controlar, medir e evoluir isso sem quebrar a experiencia do aluno?'. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A resposta profissional quase sempre envolve tres camadas: regra de negocio, prompt ou ferramenta que executa a regra, e observabilidade para confirmar se a regra funcionou. Quando uma dessas camadas falta, a integracao fica dificil de depurar. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

O erro mais comum e comecar pela chamada de API e deixar arquitetura para depois. Em uma plataforma educacional, a pergunta certa e: qual comportamento esperamos quando o aluno esta confuso, quando o contexto da aula esta incompleto, quando a API demora, quando o custo sobe, ou quando a resposta precisa ser auditada por um professor? Essas perguntas moldam o design antes do primeiro token. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Pense no tutor como uma camada entre curriculo, aluno e modelo. O curriculo fornece fonte de verdade; o aluno fornece objetivo, tentativa e duvida; Claude fornece linguagem, adaptacao e raciocinio aplicado. Se uma dessas partes entra sem estrutura, a resposta vira conversa solta. Se entra com contrato, a resposta vira produto. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A implementacao profissional tambem evita magia. Cada prompt tem versao, cada chamada registra usage, cada resposta importante pode ser reproduzida com os mesmos inputs, e cada fallback foi pensado antes do incidente. Isso parece burocratico no prototipo, mas e justamente o que permite escalar para milhares de alunos sem transformar suporte em adivinhacao. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Um bom criterio pratico e perguntar: se a resposta estiver errada, conseguimos descobrir por que? Precisamos saber qual modelo respondeu, qual contexto foi enviado, qual prompt estava ativo, qual rubrica foi usada, quanto custou e qual caminho de fallback ocorreu. Sem esses dados, a equipe apenas observa sintomas. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Tambem existe uma diferenca entre demonstracao e produto. A demonstracao mostra Claude respondendo bonito. O produto garante que a resposta respeita o nivel do aluno, nao vaza chave, nao entrega gabarito indevido, cabe no budget, aparece rapido na interface e gera dados para melhorar o curso. Engenharia de IA mora nessa diferenca. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Antes de publicar qualquer comportamento novo, escreva a politica em linguagem que suporte, professores e engenharia consigam discutir. Se uma regra depende de interpretacao humana, transforme-a em exemplo. Se depende de custo, transforme-a em budget. Se depende de seguranca, transforme-a em validacao e log. Esse habito reduz ambiguidades quando a plataforma cresce. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

### Decisoes praticas

- Mandar toda conversa sempre e simples, caro e eventualmente ruim.
- Memoria nao e transcricao; e um conjunto de fatos uteis, consentidos e revisaveis.
- Relevancia deve considerar aula atual, exercicio atual e objetivo do aluno.
- Resumo incremental precisa preservar decisoes, duvidas abertas e erros recorrentes.
- O aluno deve poder limpar ou revisar memoria quando apropriado.

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

### Modelo de dados para conversas

Separa mensagens brutas, resumo e memoria pedagogica.

```typescript
type Conversation = {
  id: string;
  userId: string;
  lessonId: string;
  summary: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type ConversationMessage = {
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  tokenEstimate: number;
  createdAt: Date;
};
```

### Selecao de contexto recente

Inclui mensagens recentes ate um budget de tokens.

```typescript
export function selectRecentMessages(messages: ConversationMessage[], budget = 5000) {
  const selected: ConversationMessage[] = [];
  let total = 0;

  for (const msg of [...messages].reverse()) {
    if (total + msg.tokenEstimate > budget) break;
    selected.push(msg);
    total += msg.tokenEstimate;
  }

  return selected.reverse();
}
```

### Resumo incremental

Compacta trechos antigos sem perder estado pedagogico.

```typescript
export async function summarizeConversation(input: {
  oldSummary: string | null;
  messagesToCompact: ConversationMessage[];
}) {
  const content = input.messagesToCompact.map((m) => `${m.role}: ${m.content}`).join("\n");
  const response = await anthropic.messages.create({
    model: CLAUDE_MODELS.fast,
    max_tokens: 700,
    temperature: 0,
    system: "Summarize tutoring conversation state. Preserve misconceptions, decisions, open questions, and promised next steps.",
    messages: [{ role: "user", content: `<old_summary>${input.oldSummary ?? ""}</old_summary><new_messages>${content}</new_messages>` }],
  });
  return textFrom(response);
}
```

### Memoria pedagogica revisavel

Armazena sinais uteis sem guardar informacao sensivel.

```typescript
export async function updateLearnerMemory(userId: string, signal: {
  concept: string;
  status: "struggling" | "improving" | "mastered";
  evidence: string;
}) {
  await db.learnerMemory.upsert({
    where: { userId_concept: { userId, concept: signal.concept } },
    create: { userId, ...signal },
    update: { status: signal.status, evidence: signal.evidence, updatedAt: new Date() },
  });
}
```

### Montagem final de mensagens multi-turn

Combina system prompt, resumo, memoria e mensagens recentes.

```typescript
export function buildClaudeMessages(input: {
  summary?: string | null;
  memory: string[];
  recent: ConversationMessage[];
  question: string;
}) {
  const context = `<conversation_summary>${input.summary ?? "None"}</conversation_summary>
<learner_memory>${input.memory.join("\n") || "None"}</learner_memory>`;

  return [
    { role: "user" as const, content: context },
    ...input.recent.map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: input.question },
  ];
}
```


---

## Quiz

### Questao 1

**Pergunta:** Por que nao enviar todo o historico sempre?

**Resposta esperada:** Porque aumenta custo, latencia, risco de confusao e pode estourar a janela de contexto.

### Questao 2

**Pergunta:** Qual diferenca entre resumo e memoria?

**Resposta esperada:** Resumo representa a conversa; memoria representa fatos pedagogicos duradouros sobre o aluno.

### Questao 3

**Pergunta:** O que relevance filtering deve priorizar?

**Resposta esperada:** Aula atual, exercicio atual, duvidas abertas e mensagens que mudam a resposta.

### Questao 4

**Pergunta:** Quando compactar mensagens?

**Resposta esperada:** Quando o historico antigo ultrapassa budget ou deixa de ser necessario em detalhe.

### Questao 5

**Pergunta:** Qual risco de memoria permanente?

**Resposta esperada:** Guardar dados sensiveis, errados ou sem consentimento; por isso precisa revisao e limpeza.

### Questao 6

**Pergunta:** O que um bom resumo preserva?

**Resposta esperada:** Misconceptions, decisoes, tentativas, proximos passos e contexto essencial.


---

## Exercicio pratico com gabarito

### Enunciado

Implemente persistencia de conversa que seleciona mensagens recentes, inclui resumo e atualiza memoria pedagogica quando o aluno melhora.

### Entregaveis

- Codigo TypeScript server-side.
- Prompt ou contrato estruturado quando aplicavel.
- Logs ou metricas minimas.
- Pelo menos tres testes: sucesso, falha recuperavel e entrada invalida.
- Pequeno README explicando trade-offs.

### Gabarito esperado

O gabarito contem tabelas Conversation, Message e LearnerMemory, seletor por budget, summarizer com Claude rapido, builder de mensagens, endpoint de chat e teste que prova que conversas longas ficam abaixo do limite configurado.

### Criterios de avaliacao

1. A solucao nao expoe API key ao navegador.
2. O codigo trata erro e custo explicitamente.
3. A resposta do tutor e util para aprendizagem, nao apenas tecnicamente correta.
4. O formato de saida e validavel pela aplicacao.
5. O design permite trocar modelo, prompt e budget por configuracao.

## Fechamento

Ao terminar esta licao, voce deve conseguir explicar nao apenas como chamar Claude, mas como transformar essa chamada em uma parte confiavel da Harness IA. A integracao madura combina prompt engineering, arquitetura server-side, observabilidade, seguranca e criterio pedagogico. Esse e o salto de API demo para produto educacional.
