# LICAO 10.5: Error Handling & Resilience - Rate Limits, Timeouts, Retries e Fallbacks

Transforme chamadas a Claude em uma dependencia confiavel: trate 429, 500, 504, 529, timeouts, cancelamento, idempotencia, filas e degradacao elegante.

## Objetivos da licao

- Classificar erros recuperaveis, permanentes e de produto.
- Implementar retry com exponential backoff, jitter e respeito a retry-after.
- Usar timeouts e cancelamento para proteger UX e custo.
- Limitar concorrencia por usuario, turma e workspace.
- Criar fallback educacional quando Claude esta indisponivel.
- Registrar request IDs, usage, latencia e causa de falhas.

## Contexto do modulo

Claude AI Integration neste curso nao e uma aula sobre brincar com chatbot. O objetivo e construir uma integracao de engenharia de software para uma plataforma educacional real. Isso significa conectar Claude a requisitos de produto, seguranca, observabilidade, custo, experiencia de usuario, dados de aluno e evolucao de modelos. A plataforma Harness IA precisa de um tutor que responda com clareza, mas tambem precisa de um sistema que possa ser mantido por uma equipe.

A documentacao oficial da Anthropic muda com o tempo, especialmente modelos, precos, limites e recursos beta. Por isso, os exemplos desta licao usam IDs atuais como configuracao e ensinam a centralizar essas escolhas. A habilidade que importa nao e decorar um preco; e construir uma arquitetura em que preco, modelo, prompt e politica possam mudar sem reescrever a plataforma.

## SECAO 1: IA COMO DEPENDENCIA EXTERNA

Nesta secao, o objetivo e transformar uma capacidade do modelo em um contrato de produto. A pergunta nao e apenas 'Claude consegue fazer isso?', mas 'a plataforma consegue controlar, medir e evoluir isso sem quebrar a experiencia do aluno?'. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A resposta profissional quase sempre envolve tres camadas: regra de negocio, prompt ou ferramenta que executa a regra, e observabilidade para confirmar se a regra funcionou. Quando uma dessas camadas falta, a integracao fica dificil de depurar. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

O erro mais comum e comecar pela chamada de API e deixar arquitetura para depois. Em uma plataforma educacional, a pergunta certa e: qual comportamento esperamos quando o aluno esta confuso, quando o contexto da aula esta incompleto, quando a API demora, quando o custo sobe, ou quando a resposta precisa ser auditada por um professor? Essas perguntas moldam o design antes do primeiro token. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Pense no tutor como uma camada entre curriculo, aluno e modelo. O curriculo fornece fonte de verdade; o aluno fornece objetivo, tentativa e duvida; Claude fornece linguagem, adaptacao e raciocinio aplicado. Se uma dessas partes entra sem estrutura, a resposta vira conversa solta. Se entra com contrato, a resposta vira produto. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A implementacao profissional tambem evita magia. Cada prompt tem versao, cada chamada registra usage, cada resposta importante pode ser reproduzida com os mesmos inputs, e cada fallback foi pensado antes do incidente. Isso parece burocratico no prototipo, mas e justamente o que permite escalar para milhares de alunos sem transformar suporte em adivinhacao. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Um bom criterio pratico e perguntar: se a resposta estiver errada, conseguimos descobrir por que? Precisamos saber qual modelo respondeu, qual contexto foi enviado, qual prompt estava ativo, qual rubrica foi usada, quanto custou e qual caminho de fallback ocorreu. Sem esses dados, a equipe apenas observa sintomas. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Tambem existe uma diferenca entre demonstracao e produto. A demonstracao mostra Claude respondendo bonito. O produto garante que a resposta respeita o nivel do aluno, nao vaza chave, nao entrega gabarito indevido, cabe no budget, aparece rapido na interface e gera dados para melhorar o curso. Engenharia de IA mora nessa diferenca. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Antes de publicar qualquer comportamento novo, escreva a politica em linguagem que suporte, professores e engenharia consigam discutir. Se uma regra depende de interpretacao humana, transforme-a em exemplo. Se depende de custo, transforme-a em budget. Se depende de seguranca, transforme-a em validacao e log. Esse habito reduz ambiguidades quando a plataforma cresce. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

### Decisoes praticas

- O SDK ja possui retries para falhas transientes, mas a aplicacao ainda precisa de politica propria.
- 429 indica limite; 529 indica sobrecarga; 504 pede streaming ou quebra da tarefa.
- Retry sem jitter pode piorar um incidente.
- Fallback bom preserva aprendizagem mesmo sem IA completa.
- Observabilidade deve permitir responder: quem foi afetado, quanto custou e qual prompt falhou.

### Aplicacao na plataforma educacional

Quando aplicamos esta secao ao tutor da Harness IA, a regra e sempre partir de uma pergunta de produto: que aprendizagem queremos melhorar? Se a resposta for "reduzir tempo ate o aluno entender um erro", a integracao precisa privilegiar contexto, feedback claro e baixa latencia. Se a resposta for "avaliar exercicios com consistencia", a integracao precisa privilegiar rubrica, saida estruturada e audibilidade. Se a resposta for "explorar conceitos", a integracao pode ser mais conversacional, mas ainda precisa registrar custo e fontes de contexto.

### Checklist de implementacao

1. Defina o contrato de entrada e saida antes de chamar Claude.
2. Escolha o modelo por tarefa, nao por preferencia generica.
3. Registre prompt version, modelo, usage, latencia e status.
4. Tenha fallback local para manter a aula util em caso de falha.
5. Rode exemplos reais de tutor antes de publicar mudancas.

---

## SECAO 2: TAXONOMIA DE ERROS DA API

Resiliencia com IA comeca aceitando que falhas acontecem. Rate limit, sobrecarga, timeout, request grande demais e erro transiente devem ter comportamento de produto definido. O aluno nao precisa conhecer HTTP 529; ele precisa continuar estudando. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Retries devem ser educados: poucas tentativas, backoff exponencial, jitter e respeito a `retry-after`. Sem isso, a plataforma transforma um problema momentaneo em tempestade de requisicoes e ainda gasta budget com chamadas que nao deveriam acontecer. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

O erro mais comum e comecar pela chamada de API e deixar arquitetura para depois. Em uma plataforma educacional, a pergunta certa e: qual comportamento esperamos quando o aluno esta confuso, quando o contexto da aula esta incompleto, quando a API demora, quando o custo sobe, ou quando a resposta precisa ser auditada por um professor? Essas perguntas moldam o design antes do primeiro token. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Pense no tutor como uma camada entre curriculo, aluno e modelo. O curriculo fornece fonte de verdade; o aluno fornece objetivo, tentativa e duvida; Claude fornece linguagem, adaptacao e raciocinio aplicado. Se uma dessas partes entra sem estrutura, a resposta vira conversa solta. Se entra com contrato, a resposta vira produto. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A implementacao profissional tambem evita magia. Cada prompt tem versao, cada chamada registra usage, cada resposta importante pode ser reproduzida com os mesmos inputs, e cada fallback foi pensado antes do incidente. Isso parece burocratico no prototipo, mas e justamente o que permite escalar para milhares de alunos sem transformar suporte em adivinhacao. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Um bom criterio pratico e perguntar: se a resposta estiver errada, conseguimos descobrir por que? Precisamos saber qual modelo respondeu, qual contexto foi enviado, qual prompt estava ativo, qual rubrica foi usada, quanto custou e qual caminho de fallback ocorreu. Sem esses dados, a equipe apenas observa sintomas. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Tambem existe uma diferenca entre demonstracao e produto. A demonstracao mostra Claude respondendo bonito. O produto garante que a resposta respeita o nivel do aluno, nao vaza chave, nao entrega gabarito indevido, cabe no budget, aparece rapido na interface e gera dados para melhorar o curso. Engenharia de IA mora nessa diferenca. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Antes de publicar qualquer comportamento novo, escreva a politica em linguagem que suporte, professores e engenharia consigam discutir. Se uma regra depende de interpretacao humana, transforme-a em exemplo. Se depende de custo, transforme-a em budget. Se depende de seguranca, transforme-a em validacao e log. Esse habito reduz ambiguidades quando a plataforma cresce. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

### Decisoes praticas

- O SDK ja possui retries para falhas transientes, mas a aplicacao ainda precisa de politica propria.
- 429 indica limite; 529 indica sobrecarga; 504 pede streaming ou quebra da tarefa.
- Retry sem jitter pode piorar um incidente.
- Fallback bom preserva aprendizagem mesmo sem IA completa.
- Observabilidade deve permitir responder: quem foi afetado, quanto custou e qual prompt falhou.

### Aplicacao na plataforma educacional

Quando aplicamos esta secao ao tutor da Harness IA, a regra e sempre partir de uma pergunta de produto: que aprendizagem queremos melhorar? Se a resposta for "reduzir tempo ate o aluno entender um erro", a integracao precisa privilegiar contexto, feedback claro e baixa latencia. Se a resposta for "avaliar exercicios com consistencia", a integracao precisa privilegiar rubrica, saida estruturada e audibilidade. Se a resposta for "explorar conceitos", a integracao pode ser mais conversacional, mas ainda precisa registrar custo e fontes de contexto.

### Checklist de implementacao

1. Defina o contrato de entrada e saida antes de chamar Claude.
2. Escolha o modelo por tarefa, nao por preferencia generica.
3. Registre prompt version, modelo, usage, latencia e status.
4. Tenha fallback local para manter a aula util em caso de falha.
5. Rode exemplos reais de tutor antes de publicar mudancas.

---

## SECAO 3: RETRIES COM BACKOFF E JITTER

Nesta secao, o objetivo e transformar uma capacidade do modelo em um contrato de produto. A pergunta nao e apenas 'Claude consegue fazer isso?', mas 'a plataforma consegue controlar, medir e evoluir isso sem quebrar a experiencia do aluno?'. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A resposta profissional quase sempre envolve tres camadas: regra de negocio, prompt ou ferramenta que executa a regra, e observabilidade para confirmar se a regra funcionou. Quando uma dessas camadas falta, a integracao fica dificil de depurar. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

O erro mais comum e comecar pela chamada de API e deixar arquitetura para depois. Em uma plataforma educacional, a pergunta certa e: qual comportamento esperamos quando o aluno esta confuso, quando o contexto da aula esta incompleto, quando a API demora, quando o custo sobe, ou quando a resposta precisa ser auditada por um professor? Essas perguntas moldam o design antes do primeiro token. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Pense no tutor como uma camada entre curriculo, aluno e modelo. O curriculo fornece fonte de verdade; o aluno fornece objetivo, tentativa e duvida; Claude fornece linguagem, adaptacao e raciocinio aplicado. Se uma dessas partes entra sem estrutura, a resposta vira conversa solta. Se entra com contrato, a resposta vira produto. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A implementacao profissional tambem evita magia. Cada prompt tem versao, cada chamada registra usage, cada resposta importante pode ser reproduzida com os mesmos inputs, e cada fallback foi pensado antes do incidente. Isso parece burocratico no prototipo, mas e justamente o que permite escalar para milhares de alunos sem transformar suporte em adivinhacao. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Um bom criterio pratico e perguntar: se a resposta estiver errada, conseguimos descobrir por que? Precisamos saber qual modelo respondeu, qual contexto foi enviado, qual prompt estava ativo, qual rubrica foi usada, quanto custou e qual caminho de fallback ocorreu. Sem esses dados, a equipe apenas observa sintomas. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Tambem existe uma diferenca entre demonstracao e produto. A demonstracao mostra Claude respondendo bonito. O produto garante que a resposta respeita o nivel do aluno, nao vaza chave, nao entrega gabarito indevido, cabe no budget, aparece rapido na interface e gera dados para melhorar o curso. Engenharia de IA mora nessa diferenca. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Antes de publicar qualquer comportamento novo, escreva a politica em linguagem que suporte, professores e engenharia consigam discutir. Se uma regra depende de interpretacao humana, transforme-a em exemplo. Se depende de custo, transforme-a em budget. Se depende de seguranca, transforme-a em validacao e log. Esse habito reduz ambiguidades quando a plataforma cresce. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

### Decisoes praticas

- O SDK ja possui retries para falhas transientes, mas a aplicacao ainda precisa de politica propria.
- 429 indica limite; 529 indica sobrecarga; 504 pede streaming ou quebra da tarefa.
- Retry sem jitter pode piorar um incidente.
- Fallback bom preserva aprendizagem mesmo sem IA completa.
- Observabilidade deve permitir responder: quem foi afetado, quanto custou e qual prompt falhou.

### Aplicacao na plataforma educacional

Quando aplicamos esta secao ao tutor da Harness IA, a regra e sempre partir de uma pergunta de produto: que aprendizagem queremos melhorar? Se a resposta for "reduzir tempo ate o aluno entender um erro", a integracao precisa privilegiar contexto, feedback claro e baixa latencia. Se a resposta for "avaliar exercicios com consistencia", a integracao precisa privilegiar rubrica, saida estruturada e audibilidade. Se a resposta for "explorar conceitos", a integracao pode ser mais conversacional, mas ainda precisa registrar custo e fontes de contexto.

### Checklist de implementacao

1. Defina o contrato de entrada e saida antes de chamar Claude.
2. Escolha o modelo por tarefa, nao por preferencia generica.
3. Registre prompt version, modelo, usage, latencia e status.
4. Tenha fallback local para manter a aula util em caso de falha.
5. Rode exemplos reais de tutor antes de publicar mudancas.

---

## SECAO 4: TIMEOUTS E ABORT CONTROLLER

Resiliencia com IA comeca aceitando que falhas acontecem. Rate limit, sobrecarga, timeout, request grande demais e erro transiente devem ter comportamento de produto definido. O aluno nao precisa conhecer HTTP 529; ele precisa continuar estudando. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Retries devem ser educados: poucas tentativas, backoff exponencial, jitter e respeito a `retry-after`. Sem isso, a plataforma transforma um problema momentaneo em tempestade de requisicoes e ainda gasta budget com chamadas que nao deveriam acontecer. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

O erro mais comum e comecar pela chamada de API e deixar arquitetura para depois. Em uma plataforma educacional, a pergunta certa e: qual comportamento esperamos quando o aluno esta confuso, quando o contexto da aula esta incompleto, quando a API demora, quando o custo sobe, ou quando a resposta precisa ser auditada por um professor? Essas perguntas moldam o design antes do primeiro token. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Pense no tutor como uma camada entre curriculo, aluno e modelo. O curriculo fornece fonte de verdade; o aluno fornece objetivo, tentativa e duvida; Claude fornece linguagem, adaptacao e raciocinio aplicado. Se uma dessas partes entra sem estrutura, a resposta vira conversa solta. Se entra com contrato, a resposta vira produto. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A implementacao profissional tambem evita magia. Cada prompt tem versao, cada chamada registra usage, cada resposta importante pode ser reproduzida com os mesmos inputs, e cada fallback foi pensado antes do incidente. Isso parece burocratico no prototipo, mas e justamente o que permite escalar para milhares de alunos sem transformar suporte em adivinhacao. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Um bom criterio pratico e perguntar: se a resposta estiver errada, conseguimos descobrir por que? Precisamos saber qual modelo respondeu, qual contexto foi enviado, qual prompt estava ativo, qual rubrica foi usada, quanto custou e qual caminho de fallback ocorreu. Sem esses dados, a equipe apenas observa sintomas. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Tambem existe uma diferenca entre demonstracao e produto. A demonstracao mostra Claude respondendo bonito. O produto garante que a resposta respeita o nivel do aluno, nao vaza chave, nao entrega gabarito indevido, cabe no budget, aparece rapido na interface e gera dados para melhorar o curso. Engenharia de IA mora nessa diferenca. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Antes de publicar qualquer comportamento novo, escreva a politica em linguagem que suporte, professores e engenharia consigam discutir. Se uma regra depende de interpretacao humana, transforme-a em exemplo. Se depende de custo, transforme-a em budget. Se depende de seguranca, transforme-a em validacao e log. Esse habito reduz ambiguidades quando a plataforma cresce. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

### Decisoes praticas

- O SDK ja possui retries para falhas transientes, mas a aplicacao ainda precisa de politica propria.
- 429 indica limite; 529 indica sobrecarga; 504 pede streaming ou quebra da tarefa.
- Retry sem jitter pode piorar um incidente.
- Fallback bom preserva aprendizagem mesmo sem IA completa.
- Observabilidade deve permitir responder: quem foi afetado, quanto custou e qual prompt falhou.

### Aplicacao na plataforma educacional

Quando aplicamos esta secao ao tutor da Harness IA, a regra e sempre partir de uma pergunta de produto: que aprendizagem queremos melhorar? Se a resposta for "reduzir tempo ate o aluno entender um erro", a integracao precisa privilegiar contexto, feedback claro e baixa latencia. Se a resposta for "avaliar exercicios com consistencia", a integracao precisa privilegiar rubrica, saida estruturada e audibilidade. Se a resposta for "explorar conceitos", a integracao pode ser mais conversacional, mas ainda precisa registrar custo e fontes de contexto.

### Checklist de implementacao

1. Defina o contrato de entrada e saida antes de chamar Claude.
2. Escolha o modelo por tarefa, nao por preferencia generica.
3. Registre prompt version, modelo, usage, latencia e status.
4. Tenha fallback local para manter a aula util em caso de falha.
5. Rode exemplos reais de tutor antes de publicar mudancas.

---

## SECAO 5: RATE LIMITS, FILAS E CONCORRENCIA

Resiliencia com IA comeca aceitando que falhas acontecem. Rate limit, sobrecarga, timeout, request grande demais e erro transiente devem ter comportamento de produto definido. O aluno nao precisa conhecer HTTP 529; ele precisa continuar estudando. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Retries devem ser educados: poucas tentativas, backoff exponencial, jitter e respeito a `retry-after`. Sem isso, a plataforma transforma um problema momentaneo em tempestade de requisicoes e ainda gasta budget com chamadas que nao deveriam acontecer. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

O erro mais comum e comecar pela chamada de API e deixar arquitetura para depois. Em uma plataforma educacional, a pergunta certa e: qual comportamento esperamos quando o aluno esta confuso, quando o contexto da aula esta incompleto, quando a API demora, quando o custo sobe, ou quando a resposta precisa ser auditada por um professor? Essas perguntas moldam o design antes do primeiro token. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Pense no tutor como uma camada entre curriculo, aluno e modelo. O curriculo fornece fonte de verdade; o aluno fornece objetivo, tentativa e duvida; Claude fornece linguagem, adaptacao e raciocinio aplicado. Se uma dessas partes entra sem estrutura, a resposta vira conversa solta. Se entra com contrato, a resposta vira produto. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A implementacao profissional tambem evita magia. Cada prompt tem versao, cada chamada registra usage, cada resposta importante pode ser reproduzida com os mesmos inputs, e cada fallback foi pensado antes do incidente. Isso parece burocratico no prototipo, mas e justamente o que permite escalar para milhares de alunos sem transformar suporte em adivinhacao. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Um bom criterio pratico e perguntar: se a resposta estiver errada, conseguimos descobrir por que? Precisamos saber qual modelo respondeu, qual contexto foi enviado, qual prompt estava ativo, qual rubrica foi usada, quanto custou e qual caminho de fallback ocorreu. Sem esses dados, a equipe apenas observa sintomas. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Tambem existe uma diferenca entre demonstracao e produto. A demonstracao mostra Claude respondendo bonito. O produto garante que a resposta respeita o nivel do aluno, nao vaza chave, nao entrega gabarito indevido, cabe no budget, aparece rapido na interface e gera dados para melhorar o curso. Engenharia de IA mora nessa diferenca. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Antes de publicar qualquer comportamento novo, escreva a politica em linguagem que suporte, professores e engenharia consigam discutir. Se uma regra depende de interpretacao humana, transforme-a em exemplo. Se depende de custo, transforme-a em budget. Se depende de seguranca, transforme-a em validacao e log. Esse habito reduz ambiguidades quando a plataforma cresce. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

### Decisoes praticas

- O SDK ja possui retries para falhas transientes, mas a aplicacao ainda precisa de politica propria.
- 429 indica limite; 529 indica sobrecarga; 504 pede streaming ou quebra da tarefa.
- Retry sem jitter pode piorar um incidente.
- Fallback bom preserva aprendizagem mesmo sem IA completa.
- Observabilidade deve permitir responder: quem foi afetado, quanto custou e qual prompt falhou.

### Aplicacao na plataforma educacional

Quando aplicamos esta secao ao tutor da Harness IA, a regra e sempre partir de uma pergunta de produto: que aprendizagem queremos melhorar? Se a resposta for "reduzir tempo ate o aluno entender um erro", a integracao precisa privilegiar contexto, feedback claro e baixa latencia. Se a resposta for "avaliar exercicios com consistencia", a integracao precisa privilegiar rubrica, saida estruturada e audibilidade. Se a resposta for "explorar conceitos", a integracao pode ser mais conversacional, mas ainda precisa registrar custo e fontes de contexto.

### Checklist de implementacao

1. Defina o contrato de entrada e saida antes de chamar Claude.
2. Escolha o modelo por tarefa, nao por preferencia generica.
3. Registre prompt version, modelo, usage, latencia e status.
4. Tenha fallback local para manter a aula util em caso de falha.
5. Rode exemplos reais de tutor antes de publicar mudancas.

---

## SECAO 6: FALLBACKS PEDAGOGICOS

Um tutor de IA precisa diagnosticar antes de responder. Se o aluno pergunta 'por que meu hook roda duas vezes?', a resposta muda conforme o codigo, o nivel do aluno e a licao atual. Contexto curricular e tentativa do aluno sao tao importantes quanto a pergunta em linguagem natural. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Guardrails bons nao sao muros cegos. Eles canalizam ajuda: recusam entregar gabarito completo quando isso prejudica a atividade, mas oferecem um proximo passo concreto. O aluno deve sentir que recebeu orientacao, nao que foi bloqueado por uma regra abstrata. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

O erro mais comum e comecar pela chamada de API e deixar arquitetura para depois. Em uma plataforma educacional, a pergunta certa e: qual comportamento esperamos quando o aluno esta confuso, quando o contexto da aula esta incompleto, quando a API demora, quando o custo sobe, ou quando a resposta precisa ser auditada por um professor? Essas perguntas moldam o design antes do primeiro token. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Pense no tutor como uma camada entre curriculo, aluno e modelo. O curriculo fornece fonte de verdade; o aluno fornece objetivo, tentativa e duvida; Claude fornece linguagem, adaptacao e raciocinio aplicado. Se uma dessas partes entra sem estrutura, a resposta vira conversa solta. Se entra com contrato, a resposta vira produto. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A implementacao profissional tambem evita magia. Cada prompt tem versao, cada chamada registra usage, cada resposta importante pode ser reproduzida com os mesmos inputs, e cada fallback foi pensado antes do incidente. Isso parece burocratico no prototipo, mas e justamente o que permite escalar para milhares de alunos sem transformar suporte em adivinhacao. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Um bom criterio pratico e perguntar: se a resposta estiver errada, conseguimos descobrir por que? Precisamos saber qual modelo respondeu, qual contexto foi enviado, qual prompt estava ativo, qual rubrica foi usada, quanto custou e qual caminho de fallback ocorreu. Sem esses dados, a equipe apenas observa sintomas. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Tambem existe uma diferenca entre demonstracao e produto. A demonstracao mostra Claude respondendo bonito. O produto garante que a resposta respeita o nivel do aluno, nao vaza chave, nao entrega gabarito indevido, cabe no budget, aparece rapido na interface e gera dados para melhorar o curso. Engenharia de IA mora nessa diferenca. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Antes de publicar qualquer comportamento novo, escreva a politica em linguagem que suporte, professores e engenharia consigam discutir. Se uma regra depende de interpretacao humana, transforme-a em exemplo. Se depende de custo, transforme-a em budget. Se depende de seguranca, transforme-a em validacao e log. Esse habito reduz ambiguidades quando a plataforma cresce. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

### Decisoes praticas

- O SDK ja possui retries para falhas transientes, mas a aplicacao ainda precisa de politica propria.
- 429 indica limite; 529 indica sobrecarga; 504 pede streaming ou quebra da tarefa.
- Retry sem jitter pode piorar um incidente.
- Fallback bom preserva aprendizagem mesmo sem IA completa.
- Observabilidade deve permitir responder: quem foi afetado, quanto custou e qual prompt falhou.

### Aplicacao na plataforma educacional

Quando aplicamos esta secao ao tutor da Harness IA, a regra e sempre partir de uma pergunta de produto: que aprendizagem queremos melhorar? Se a resposta for "reduzir tempo ate o aluno entender um erro", a integracao precisa privilegiar contexto, feedback claro e baixa latencia. Se a resposta for "avaliar exercicios com consistencia", a integracao precisa privilegiar rubrica, saida estruturada e audibilidade. Se a resposta for "explorar conceitos", a integracao pode ser mais conversacional, mas ainda precisa registrar custo e fontes de contexto.

### Checklist de implementacao

1. Defina o contrato de entrada e saida antes de chamar Claude.
2. Escolha o modelo por tarefa, nao por preferencia generica.
3. Registre prompt version, modelo, usage, latencia e status.
4. Tenha fallback local para manter a aula util em caso de falha.
5. Rode exemplos reais de tutor antes de publicar mudancas.

---

## SECAO 7: OBSERVABILIDADE DE INCIDENTES

Nesta secao, o objetivo e transformar uma capacidade do modelo em um contrato de produto. A pergunta nao e apenas 'Claude consegue fazer isso?', mas 'a plataforma consegue controlar, medir e evoluir isso sem quebrar a experiencia do aluno?'. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A resposta profissional quase sempre envolve tres camadas: regra de negocio, prompt ou ferramenta que executa a regra, e observabilidade para confirmar se a regra funcionou. Quando uma dessas camadas falta, a integracao fica dificil de depurar. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

O erro mais comum e comecar pela chamada de API e deixar arquitetura para depois. Em uma plataforma educacional, a pergunta certa e: qual comportamento esperamos quando o aluno esta confuso, quando o contexto da aula esta incompleto, quando a API demora, quando o custo sobe, ou quando a resposta precisa ser auditada por um professor? Essas perguntas moldam o design antes do primeiro token. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Pense no tutor como uma camada entre curriculo, aluno e modelo. O curriculo fornece fonte de verdade; o aluno fornece objetivo, tentativa e duvida; Claude fornece linguagem, adaptacao e raciocinio aplicado. Se uma dessas partes entra sem estrutura, a resposta vira conversa solta. Se entra com contrato, a resposta vira produto. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A implementacao profissional tambem evita magia. Cada prompt tem versao, cada chamada registra usage, cada resposta importante pode ser reproduzida com os mesmos inputs, e cada fallback foi pensado antes do incidente. Isso parece burocratico no prototipo, mas e justamente o que permite escalar para milhares de alunos sem transformar suporte em adivinhacao. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Um bom criterio pratico e perguntar: se a resposta estiver errada, conseguimos descobrir por que? Precisamos saber qual modelo respondeu, qual contexto foi enviado, qual prompt estava ativo, qual rubrica foi usada, quanto custou e qual caminho de fallback ocorreu. Sem esses dados, a equipe apenas observa sintomas. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Tambem existe uma diferenca entre demonstracao e produto. A demonstracao mostra Claude respondendo bonito. O produto garante que a resposta respeita o nivel do aluno, nao vaza chave, nao entrega gabarito indevido, cabe no budget, aparece rapido na interface e gera dados para melhorar o curso. Engenharia de IA mora nessa diferenca. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Antes de publicar qualquer comportamento novo, escreva a politica em linguagem que suporte, professores e engenharia consigam discutir. Se uma regra depende de interpretacao humana, transforme-a em exemplo. Se depende de custo, transforme-a em budget. Se depende de seguranca, transforme-a em validacao e log. Esse habito reduz ambiguidades quando a plataforma cresce. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

### Decisoes praticas

- O SDK ja possui retries para falhas transientes, mas a aplicacao ainda precisa de politica propria.
- 429 indica limite; 529 indica sobrecarga; 504 pede streaming ou quebra da tarefa.
- Retry sem jitter pode piorar um incidente.
- Fallback bom preserva aprendizagem mesmo sem IA completa.
- Observabilidade deve permitir responder: quem foi afetado, quanto custou e qual prompt falhou.

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

### Wrapper resiliente

Centraliza tratamento de erro em uma funcao reutilizavel.

```typescript
export async function callClaudeWithPolicy<T>(operation: () => Promise<T>): Promise<T> {
  let attempt = 0;
  let lastError: unknown;

  while (attempt < 3) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isRetryableClaudeError(error)) throw error;
      const retryAfter = readRetryAfterSeconds(error);
      const delayMs = retryAfter ? retryAfter * 1000 : backoffWithJitter(attempt);
      await sleep(delayMs);
      attempt += 1;
    }
  }

  throw lastError;
}
```

### Backoff com jitter

Evita que varios workers tentem novamente no mesmo milissegundo.

```typescript
export function backoffWithJitter(attempt: number) {
  const base = 300;
  const cap = 8_000;
  const exponential = Math.min(cap, base * 2 ** attempt);
  const jitter = Math.floor(Math.random() * exponential * 0.4);
  return exponential + jitter;
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
```

### Timeout por AbortController

Cancela chamada longa antes que a experiencia do aluno quebre.

```typescript
export async function withTimeout<T>(promiseFactory: (signal: AbortSignal) => Promise<T>, ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await promiseFactory(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

const result = await withTimeout(
  (signal) => anthropic.messages.create({ model: CLAUDE_MODELS.tutor, max_tokens: 800, messages }, { signal }),
  30_000,
);
```

### Fila com concorrencia por usuario

Impede que um aluno dispare dez chamadas caras em paralelo.

```typescript
import PQueue from "p-queue";

const queues = new Map<string, PQueue>();

export function queueForUser(userId: string) {
  if (!queues.has(userId)) {
    queues.set(userId, new PQueue({ concurrency: 1, interval: 10_000, intervalCap: 6 }));
  }
  return queues.get(userId)!;
}

export function enqueueTutorCall<T>(userId: string, task: () => Promise<T>) {
  return queueForUser(userId).add(task);
}
```

### Fallback educacional

Responde com material local quando a API esta indisponivel.

```typescript
export async function safeTutorAnswer(input: TutorInput) {
  try {
    return await enqueueTutorCall(input.userId, () => callClaudeTutor(input));
  } catch (error) {
    await logAiFailure({ userId: input.userId, lessonId: input.lessonId, error });
    const lesson = await loadLessonContext(input.lessonId);
    return {
      mode: "fallback",
      text: `Nao consegui acionar o tutor agora. Enquanto isso, revise: ${lesson.objectives.slice(0, 3).join("; ")}. Tente escrever sua duvida em uma frase especifica e envie novamente.`,
    };
  }
}
```


---

## Quiz

### Questao 1

**Pergunta:** Qual erro normalmente indica rate limit?

**Resposta esperada:** HTTP 429 com rate_limit_error e, quando aplicavel, retry-after.

### Questao 2

**Pergunta:** Qual erro indica sobrecarga temporaria da API?

**Resposta esperada:** HTTP 529 overloaded_error.

### Questao 3

**Pergunta:** Por que respeitar retry-after?

**Resposta esperada:** Porque a API informa quando nova tentativa tem chance de sucesso; tentar antes desperdiça limite.

### Questao 4

**Pergunta:** Por que usar fila por usuario?

**Resposta esperada:** Para controlar custo, prevenir spam e manter ordem pedagogica das respostas.

### Questao 5

**Pergunta:** Quando preferir streaming a request normal?

**Resposta esperada:** Em tarefas longas ou com max_tokens alto, reduzindo timeout e melhorando feedback.

### Questao 6

**Pergunta:** O que logar em falhas?

**Resposta esperada:** Request ID, userId, lessonId, modelo, latencia, tipo de erro, tentativa e prompt version.


---

## Exercicio pratico com gabarito

### Enunciado

Crie uma funcao callTutorResilient com timeout, retry, fila por usuario, fallback local e logs estruturados.

### Entregaveis

- Codigo TypeScript server-side.
- Prompt ou contrato estruturado quando aplicavel.
- Logs ou metricas minimas.
- Pelo menos tres testes: sucesso, falha recuperavel e entrada invalida.
- Pequeno README explicando trade-offs.

### Gabarito esperado

O gabarito tem wrapper com retry limitado, jitter, leitura de retry-after, AbortController, PQueue por usuario, fallback baseado na licao local, logging com requestId e testes simulando 429, 529, timeout e sucesso.

### Criterios de avaliacao

1. A solucao nao expoe API key ao navegador.
2. O codigo trata erro e custo explicitamente.
3. A resposta do tutor e util para aprendizagem, nao apenas tecnicamente correta.
4. O formato de saida e validavel pela aplicacao.
5. O design permite trocar modelo, prompt e budget por configuracao.

## Fechamento

Ao terminar esta licao, voce deve conseguir explicar nao apenas como chamar Claude, mas como transformar essa chamada em uma parte confiavel da Harness IA. A integracao madura combina prompt engineering, arquitetura server-side, observabilidade, seguranca e criterio pedagogico. Esse e o salto de API demo para produto educacional.
