# LICAO 10.2: Prompt Engineering & System Prompts - Padroes para Tutores Confiaveis

Construa prompts de sistema, few-shot examples, XML tags e contratos de saida para transformar Claude em um tutor consistente, seguro e mensuravel.

## Objetivos da licao

- Escrever system prompts que definem papel, politica pedagogica e limites operacionais.
- Usar XML tags para separar licao, pergunta, tentativa do aluno, rubrica e formato esperado.
- Aplicar few-shot examples sem criar vieses acidentais.
- Pedir explicacoes verificaveis sem solicitar chain-of-thought privado.
- Forcar JSON estruturado quando a plataforma precisa renderizar feedback.
- Criar uma suite de avaliacao para comparar prompts antes de publicar.

## Contexto do modulo

Claude AI Integration neste curso nao e uma aula sobre brincar com chatbot. O objetivo e construir uma integracao de engenharia de software para uma plataforma educacional real. Isso significa conectar Claude a requisitos de produto, seguranca, observabilidade, custo, experiencia de usuario, dados de aluno e evolucao de modelos. A plataforma Harness IA precisa de um tutor que responda com clareza, mas tambem precisa de um sistema que possa ser mantido por uma equipe.

A documentacao oficial da Anthropic muda com o tempo, especialmente modelos, precos, limites e recursos beta. Por isso, os exemplos desta licao usam IDs atuais como configuracao e ensinam a centralizar essas escolhas. A habilidade que importa nao e decorar um preco; e construir uma arquitetura em que preco, modelo, prompt e politica possam mudar sem reescrever a plataforma.

## SECAO 1: PROMPT ENGINEERING COMO ENGENHARIA DE REQUISITOS

Prompt engineering aqui funciona como engenharia de requisitos. O system prompt define papel, prioridade e limites; o template separa contexto e input; os examples mostram o comportamento esperado; os evals dizem se a mudanca melhorou. Sem esses quatro elementos, prompt vira arte oral. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Para a Harness IA, o prompt precisa proteger a pedagogia. A regra nao e 'nunca ajude'; e 'ajude de uma forma que preserve aprendizagem'. Isso significa pedir tentativa, dar pistas progressivas, explicar erros comuns e usar rubrica quando a tarefa for avaliativa. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

O erro mais comum e comecar pela chamada de API e deixar arquitetura para depois. Em uma plataforma educacional, a pergunta certa e: qual comportamento esperamos quando o aluno esta confuso, quando o contexto da aula esta incompleto, quando a API demora, quando o custo sobe, ou quando a resposta precisa ser auditada por um professor? Essas perguntas moldam o design antes do primeiro token. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Pense no tutor como uma camada entre curriculo, aluno e modelo. O curriculo fornece fonte de verdade; o aluno fornece objetivo, tentativa e duvida; Claude fornece linguagem, adaptacao e raciocinio aplicado. Se uma dessas partes entra sem estrutura, a resposta vira conversa solta. Se entra com contrato, a resposta vira produto. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A implementacao profissional tambem evita magia. Cada prompt tem versao, cada chamada registra usage, cada resposta importante pode ser reproduzida com os mesmos inputs, e cada fallback foi pensado antes do incidente. Isso parece burocratico no prototipo, mas e justamente o que permite escalar para milhares de alunos sem transformar suporte em adivinhacao. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Um bom criterio pratico e perguntar: se a resposta estiver errada, conseguimos descobrir por que? Precisamos saber qual modelo respondeu, qual contexto foi enviado, qual prompt estava ativo, qual rubrica foi usada, quanto custou e qual caminho de fallback ocorreu. Sem esses dados, a equipe apenas observa sintomas. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Tambem existe uma diferenca entre demonstracao e produto. A demonstracao mostra Claude respondendo bonito. O produto garante que a resposta respeita o nivel do aluno, nao vaza chave, nao entrega gabarito indevido, cabe no budget, aparece rapido na interface e gera dados para melhorar o curso. Engenharia de IA mora nessa diferenca. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Antes de publicar qualquer comportamento novo, escreva a politica em linguagem que suporte, professores e engenharia consigam discutir. Se uma regra depende de interpretacao humana, transforme-a em exemplo. Se depende de custo, transforme-a em budget. Se depende de seguranca, transforme-a em validacao e log. Esse habito reduz ambiguidades quando a plataforma cresce. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

### Decisoes praticas

- Prompt e uma especificacao executavel; clareza vence truques.
- O system prompt deve explicar o por que das regras, nao apenas listar proibicoes.
- Examples bons cobrem casos normais, casos limite e respostas recusadas.
- Nao peca chain-of-thought; peca resumo, criterios, passos publicos ou justificativa curta.
- Toda mudanca de prompt importante deve rodar contra evals fixos.

### Aplicacao na plataforma educacional

Quando aplicamos esta secao ao tutor da Harness IA, a regra e sempre partir de uma pergunta de produto: que aprendizagem queremos melhorar? Se a resposta for "reduzir tempo ate o aluno entender um erro", a integracao precisa privilegiar contexto, feedback claro e baixa latencia. Se a resposta for "avaliar exercicios com consistencia", a integracao precisa privilegiar rubrica, saida estruturada e audibilidade. Se a resposta for "explorar conceitos", a integracao pode ser mais conversacional, mas ainda precisa registrar custo e fontes de contexto.

### Checklist de implementacao

1. Defina o contrato de entrada e saida antes de chamar Claude.
2. Escolha o modelo por tarefa, nao por preferencia generica.
3. Registre prompt version, modelo, usage, latencia e status.
4. Tenha fallback local para manter a aula util em caso de falha.
5. Rode exemplos reais de tutor antes de publicar mudancas.

---

## SECAO 2: SYSTEM PROMPT: IDENTIDADE, LIMITES E COMPORTAMENTO

Prompt engineering aqui funciona como engenharia de requisitos. O system prompt define papel, prioridade e limites; o template separa contexto e input; os examples mostram o comportamento esperado; os evals dizem se a mudanca melhorou. Sem esses quatro elementos, prompt vira arte oral. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Para a Harness IA, o prompt precisa proteger a pedagogia. A regra nao e 'nunca ajude'; e 'ajude de uma forma que preserve aprendizagem'. Isso significa pedir tentativa, dar pistas progressivas, explicar erros comuns e usar rubrica quando a tarefa for avaliativa. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

O erro mais comum e comecar pela chamada de API e deixar arquitetura para depois. Em uma plataforma educacional, a pergunta certa e: qual comportamento esperamos quando o aluno esta confuso, quando o contexto da aula esta incompleto, quando a API demora, quando o custo sobe, ou quando a resposta precisa ser auditada por um professor? Essas perguntas moldam o design antes do primeiro token. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Pense no tutor como uma camada entre curriculo, aluno e modelo. O curriculo fornece fonte de verdade; o aluno fornece objetivo, tentativa e duvida; Claude fornece linguagem, adaptacao e raciocinio aplicado. Se uma dessas partes entra sem estrutura, a resposta vira conversa solta. Se entra com contrato, a resposta vira produto. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A implementacao profissional tambem evita magia. Cada prompt tem versao, cada chamada registra usage, cada resposta importante pode ser reproduzida com os mesmos inputs, e cada fallback foi pensado antes do incidente. Isso parece burocratico no prototipo, mas e justamente o que permite escalar para milhares de alunos sem transformar suporte em adivinhacao. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Um bom criterio pratico e perguntar: se a resposta estiver errada, conseguimos descobrir por que? Precisamos saber qual modelo respondeu, qual contexto foi enviado, qual prompt estava ativo, qual rubrica foi usada, quanto custou e qual caminho de fallback ocorreu. Sem esses dados, a equipe apenas observa sintomas. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Tambem existe uma diferenca entre demonstracao e produto. A demonstracao mostra Claude respondendo bonito. O produto garante que a resposta respeita o nivel do aluno, nao vaza chave, nao entrega gabarito indevido, cabe no budget, aparece rapido na interface e gera dados para melhorar o curso. Engenharia de IA mora nessa diferenca. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Antes de publicar qualquer comportamento novo, escreva a politica em linguagem que suporte, professores e engenharia consigam discutir. Se uma regra depende de interpretacao humana, transforme-a em exemplo. Se depende de custo, transforme-a em budget. Se depende de seguranca, transforme-a em validacao e log. Esse habito reduz ambiguidades quando a plataforma cresce. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

### Decisoes praticas

- Prompt e uma especificacao executavel; clareza vence truques.
- O system prompt deve explicar o por que das regras, nao apenas listar proibicoes.
- Examples bons cobrem casos normais, casos limite e respostas recusadas.
- Nao peca chain-of-thought; peca resumo, criterios, passos publicos ou justificativa curta.
- Toda mudanca de prompt importante deve rodar contra evals fixos.

### Aplicacao na plataforma educacional

Quando aplicamos esta secao ao tutor da Harness IA, a regra e sempre partir de uma pergunta de produto: que aprendizagem queremos melhorar? Se a resposta for "reduzir tempo ate o aluno entender um erro", a integracao precisa privilegiar contexto, feedback claro e baixa latencia. Se a resposta for "avaliar exercicios com consistencia", a integracao precisa privilegiar rubrica, saida estruturada e audibilidade. Se a resposta for "explorar conceitos", a integracao pode ser mais conversacional, mas ainda precisa registrar custo e fontes de contexto.

### Checklist de implementacao

1. Defina o contrato de entrada e saida antes de chamar Claude.
2. Escolha o modelo por tarefa, nao por preferencia generica.
3. Registre prompt version, modelo, usage, latencia e status.
4. Tenha fallback local para manter a aula util em caso de falha.
5. Rode exemplos reais de tutor antes de publicar mudancas.

---

## SECAO 3: CONTEXTO COM XML TAGS E SEPARACAO DE INSTRUCOES

Prompt engineering aqui funciona como engenharia de requisitos. O system prompt define papel, prioridade e limites; o template separa contexto e input; os examples mostram o comportamento esperado; os evals dizem se a mudanca melhorou. Sem esses quatro elementos, prompt vira arte oral. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Para a Harness IA, o prompt precisa proteger a pedagogia. A regra nao e 'nunca ajude'; e 'ajude de uma forma que preserve aprendizagem'. Isso significa pedir tentativa, dar pistas progressivas, explicar erros comuns e usar rubrica quando a tarefa for avaliativa. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

O erro mais comum e comecar pela chamada de API e deixar arquitetura para depois. Em uma plataforma educacional, a pergunta certa e: qual comportamento esperamos quando o aluno esta confuso, quando o contexto da aula esta incompleto, quando a API demora, quando o custo sobe, ou quando a resposta precisa ser auditada por um professor? Essas perguntas moldam o design antes do primeiro token. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Pense no tutor como uma camada entre curriculo, aluno e modelo. O curriculo fornece fonte de verdade; o aluno fornece objetivo, tentativa e duvida; Claude fornece linguagem, adaptacao e raciocinio aplicado. Se uma dessas partes entra sem estrutura, a resposta vira conversa solta. Se entra com contrato, a resposta vira produto. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A implementacao profissional tambem evita magia. Cada prompt tem versao, cada chamada registra usage, cada resposta importante pode ser reproduzida com os mesmos inputs, e cada fallback foi pensado antes do incidente. Isso parece burocratico no prototipo, mas e justamente o que permite escalar para milhares de alunos sem transformar suporte em adivinhacao. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Um bom criterio pratico e perguntar: se a resposta estiver errada, conseguimos descobrir por que? Precisamos saber qual modelo respondeu, qual contexto foi enviado, qual prompt estava ativo, qual rubrica foi usada, quanto custou e qual caminho de fallback ocorreu. Sem esses dados, a equipe apenas observa sintomas. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Tambem existe uma diferenca entre demonstracao e produto. A demonstracao mostra Claude respondendo bonito. O produto garante que a resposta respeita o nivel do aluno, nao vaza chave, nao entrega gabarito indevido, cabe no budget, aparece rapido na interface e gera dados para melhorar o curso. Engenharia de IA mora nessa diferenca. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Antes de publicar qualquer comportamento novo, escreva a politica em linguagem que suporte, professores e engenharia consigam discutir. Se uma regra depende de interpretacao humana, transforme-a em exemplo. Se depende de custo, transforme-a em budget. Se depende de seguranca, transforme-a em validacao e log. Esse habito reduz ambiguidades quando a plataforma cresce. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

### Decisoes praticas

- Prompt e uma especificacao executavel; clareza vence truques.
- O system prompt deve explicar o por que das regras, nao apenas listar proibicoes.
- Examples bons cobrem casos normais, casos limite e respostas recusadas.
- Nao peca chain-of-thought; peca resumo, criterios, passos publicos ou justificativa curta.
- Toda mudanca de prompt importante deve rodar contra evals fixos.

### Aplicacao na plataforma educacional

Quando aplicamos esta secao ao tutor da Harness IA, a regra e sempre partir de uma pergunta de produto: que aprendizagem queremos melhorar? Se a resposta for "reduzir tempo ate o aluno entender um erro", a integracao precisa privilegiar contexto, feedback claro e baixa latencia. Se a resposta for "avaliar exercicios com consistencia", a integracao precisa privilegiar rubrica, saida estruturada e audibilidade. Se a resposta for "explorar conceitos", a integracao pode ser mais conversacional, mas ainda precisa registrar custo e fontes de contexto.

### Checklist de implementacao

1. Defina o contrato de entrada e saida antes de chamar Claude.
2. Escolha o modelo por tarefa, nao por preferencia generica.
3. Registre prompt version, modelo, usage, latencia e status.
4. Tenha fallback local para manter a aula util em caso de falha.
5. Rode exemplos reais de tutor antes de publicar mudancas.

---

## SECAO 4: FEW-SHOT EXAMPLES PARA CORRIGIR FORMATO E TOM

Prompt engineering aqui funciona como engenharia de requisitos. O system prompt define papel, prioridade e limites; o template separa contexto e input; os examples mostram o comportamento esperado; os evals dizem se a mudanca melhorou. Sem esses quatro elementos, prompt vira arte oral. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Para a Harness IA, o prompt precisa proteger a pedagogia. A regra nao e 'nunca ajude'; e 'ajude de uma forma que preserve aprendizagem'. Isso significa pedir tentativa, dar pistas progressivas, explicar erros comuns e usar rubrica quando a tarefa for avaliativa. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

O erro mais comum e comecar pela chamada de API e deixar arquitetura para depois. Em uma plataforma educacional, a pergunta certa e: qual comportamento esperamos quando o aluno esta confuso, quando o contexto da aula esta incompleto, quando a API demora, quando o custo sobe, ou quando a resposta precisa ser auditada por um professor? Essas perguntas moldam o design antes do primeiro token. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Pense no tutor como uma camada entre curriculo, aluno e modelo. O curriculo fornece fonte de verdade; o aluno fornece objetivo, tentativa e duvida; Claude fornece linguagem, adaptacao e raciocinio aplicado. Se uma dessas partes entra sem estrutura, a resposta vira conversa solta. Se entra com contrato, a resposta vira produto. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A implementacao profissional tambem evita magia. Cada prompt tem versao, cada chamada registra usage, cada resposta importante pode ser reproduzida com os mesmos inputs, e cada fallback foi pensado antes do incidente. Isso parece burocratico no prototipo, mas e justamente o que permite escalar para milhares de alunos sem transformar suporte em adivinhacao. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Um bom criterio pratico e perguntar: se a resposta estiver errada, conseguimos descobrir por que? Precisamos saber qual modelo respondeu, qual contexto foi enviado, qual prompt estava ativo, qual rubrica foi usada, quanto custou e qual caminho de fallback ocorreu. Sem esses dados, a equipe apenas observa sintomas. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Tambem existe uma diferenca entre demonstracao e produto. A demonstracao mostra Claude respondendo bonito. O produto garante que a resposta respeita o nivel do aluno, nao vaza chave, nao entrega gabarito indevido, cabe no budget, aparece rapido na interface e gera dados para melhorar o curso. Engenharia de IA mora nessa diferenca. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Antes de publicar qualquer comportamento novo, escreva a politica em linguagem que suporte, professores e engenharia consigam discutir. Se uma regra depende de interpretacao humana, transforme-a em exemplo. Se depende de custo, transforme-a em budget. Se depende de seguranca, transforme-a em validacao e log. Esse habito reduz ambiguidades quando a plataforma cresce. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

### Decisoes praticas

- Prompt e uma especificacao executavel; clareza vence truques.
- O system prompt deve explicar o por que das regras, nao apenas listar proibicoes.
- Examples bons cobrem casos normais, casos limite e respostas recusadas.
- Nao peca chain-of-thought; peca resumo, criterios, passos publicos ou justificativa curta.
- Toda mudanca de prompt importante deve rodar contra evals fixos.

### Aplicacao na plataforma educacional

Quando aplicamos esta secao ao tutor da Harness IA, a regra e sempre partir de uma pergunta de produto: que aprendizagem queremos melhorar? Se a resposta for "reduzir tempo ate o aluno entender um erro", a integracao precisa privilegiar contexto, feedback claro e baixa latencia. Se a resposta for "avaliar exercicios com consistencia", a integracao precisa privilegiar rubrica, saida estruturada e audibilidade. Se a resposta for "explorar conceitos", a integracao pode ser mais conversacional, mas ainda precisa registrar custo e fontes de contexto.

### Checklist de implementacao

1. Defina o contrato de entrada e saida antes de chamar Claude.
2. Escolha o modelo por tarefa, nao por preferencia generica.
3. Registre prompt version, modelo, usage, latencia e status.
4. Tenha fallback local para manter a aula util em caso de falha.
5. Rode exemplos reais de tutor antes de publicar mudancas.

---

## SECAO 5: RACIOCINIO SEM VAZAR CHAIN-OF-THOUGHT

Nesta secao, o objetivo e transformar uma capacidade do modelo em um contrato de produto. A pergunta nao e apenas 'Claude consegue fazer isso?', mas 'a plataforma consegue controlar, medir e evoluir isso sem quebrar a experiencia do aluno?'. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A resposta profissional quase sempre envolve tres camadas: regra de negocio, prompt ou ferramenta que executa a regra, e observabilidade para confirmar se a regra funcionou. Quando uma dessas camadas falta, a integracao fica dificil de depurar. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

O erro mais comum e comecar pela chamada de API e deixar arquitetura para depois. Em uma plataforma educacional, a pergunta certa e: qual comportamento esperamos quando o aluno esta confuso, quando o contexto da aula esta incompleto, quando a API demora, quando o custo sobe, ou quando a resposta precisa ser auditada por um professor? Essas perguntas moldam o design antes do primeiro token. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Pense no tutor como uma camada entre curriculo, aluno e modelo. O curriculo fornece fonte de verdade; o aluno fornece objetivo, tentativa e duvida; Claude fornece linguagem, adaptacao e raciocinio aplicado. Se uma dessas partes entra sem estrutura, a resposta vira conversa solta. Se entra com contrato, a resposta vira produto. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A implementacao profissional tambem evita magia. Cada prompt tem versao, cada chamada registra usage, cada resposta importante pode ser reproduzida com os mesmos inputs, e cada fallback foi pensado antes do incidente. Isso parece burocratico no prototipo, mas e justamente o que permite escalar para milhares de alunos sem transformar suporte em adivinhacao. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Um bom criterio pratico e perguntar: se a resposta estiver errada, conseguimos descobrir por que? Precisamos saber qual modelo respondeu, qual contexto foi enviado, qual prompt estava ativo, qual rubrica foi usada, quanto custou e qual caminho de fallback ocorreu. Sem esses dados, a equipe apenas observa sintomas. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Tambem existe uma diferenca entre demonstracao e produto. A demonstracao mostra Claude respondendo bonito. O produto garante que a resposta respeita o nivel do aluno, nao vaza chave, nao entrega gabarito indevido, cabe no budget, aparece rapido na interface e gera dados para melhorar o curso. Engenharia de IA mora nessa diferenca. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Antes de publicar qualquer comportamento novo, escreva a politica em linguagem que suporte, professores e engenharia consigam discutir. Se uma regra depende de interpretacao humana, transforme-a em exemplo. Se depende de custo, transforme-a em budget. Se depende de seguranca, transforme-a em validacao e log. Esse habito reduz ambiguidades quando a plataforma cresce. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

### Decisoes praticas

- Prompt e uma especificacao executavel; clareza vence truques.
- O system prompt deve explicar o por que das regras, nao apenas listar proibicoes.
- Examples bons cobrem casos normais, casos limite e respostas recusadas.
- Nao peca chain-of-thought; peca resumo, criterios, passos publicos ou justificativa curta.
- Toda mudanca de prompt importante deve rodar contra evals fixos.

### Aplicacao na plataforma educacional

Quando aplicamos esta secao ao tutor da Harness IA, a regra e sempre partir de uma pergunta de produto: que aprendizagem queremos melhorar? Se a resposta for "reduzir tempo ate o aluno entender um erro", a integracao precisa privilegiar contexto, feedback claro e baixa latencia. Se a resposta for "avaliar exercicios com consistencia", a integracao precisa privilegiar rubrica, saida estruturada e audibilidade. Se a resposta for "explorar conceitos", a integracao pode ser mais conversacional, mas ainda precisa registrar custo e fontes de contexto.

### Checklist de implementacao

1. Defina o contrato de entrada e saida antes de chamar Claude.
2. Escolha o modelo por tarefa, nao por preferencia generica.
3. Registre prompt version, modelo, usage, latencia e status.
4. Tenha fallback local para manter a aula util em caso de falha.
5. Rode exemplos reais de tutor antes de publicar mudancas.

---

## SECAO 6: CONTRATOS DE SAIDA ESTRUTURADA

Nesta secao, o objetivo e transformar uma capacidade do modelo em um contrato de produto. A pergunta nao e apenas 'Claude consegue fazer isso?', mas 'a plataforma consegue controlar, medir e evoluir isso sem quebrar a experiencia do aluno?'. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A resposta profissional quase sempre envolve tres camadas: regra de negocio, prompt ou ferramenta que executa a regra, e observabilidade para confirmar se a regra funcionou. Quando uma dessas camadas falta, a integracao fica dificil de depurar. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

O erro mais comum e comecar pela chamada de API e deixar arquitetura para depois. Em uma plataforma educacional, a pergunta certa e: qual comportamento esperamos quando o aluno esta confuso, quando o contexto da aula esta incompleto, quando a API demora, quando o custo sobe, ou quando a resposta precisa ser auditada por um professor? Essas perguntas moldam o design antes do primeiro token. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Pense no tutor como uma camada entre curriculo, aluno e modelo. O curriculo fornece fonte de verdade; o aluno fornece objetivo, tentativa e duvida; Claude fornece linguagem, adaptacao e raciocinio aplicado. Se uma dessas partes entra sem estrutura, a resposta vira conversa solta. Se entra com contrato, a resposta vira produto. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A implementacao profissional tambem evita magia. Cada prompt tem versao, cada chamada registra usage, cada resposta importante pode ser reproduzida com os mesmos inputs, e cada fallback foi pensado antes do incidente. Isso parece burocratico no prototipo, mas e justamente o que permite escalar para milhares de alunos sem transformar suporte em adivinhacao. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Um bom criterio pratico e perguntar: se a resposta estiver errada, conseguimos descobrir por que? Precisamos saber qual modelo respondeu, qual contexto foi enviado, qual prompt estava ativo, qual rubrica foi usada, quanto custou e qual caminho de fallback ocorreu. Sem esses dados, a equipe apenas observa sintomas. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Tambem existe uma diferenca entre demonstracao e produto. A demonstracao mostra Claude respondendo bonito. O produto garante que a resposta respeita o nivel do aluno, nao vaza chave, nao entrega gabarito indevido, cabe no budget, aparece rapido na interface e gera dados para melhorar o curso. Engenharia de IA mora nessa diferenca. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Antes de publicar qualquer comportamento novo, escreva a politica em linguagem que suporte, professores e engenharia consigam discutir. Se uma regra depende de interpretacao humana, transforme-a em exemplo. Se depende de custo, transforme-a em budget. Se depende de seguranca, transforme-a em validacao e log. Esse habito reduz ambiguidades quando a plataforma cresce. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

### Decisoes praticas

- Prompt e uma especificacao executavel; clareza vence truques.
- O system prompt deve explicar o por que das regras, nao apenas listar proibicoes.
- Examples bons cobrem casos normais, casos limite e respostas recusadas.
- Nao peca chain-of-thought; peca resumo, criterios, passos publicos ou justificativa curta.
- Toda mudanca de prompt importante deve rodar contra evals fixos.

### Aplicacao na plataforma educacional

Quando aplicamos esta secao ao tutor da Harness IA, a regra e sempre partir de uma pergunta de produto: que aprendizagem queremos melhorar? Se a resposta for "reduzir tempo ate o aluno entender um erro", a integracao precisa privilegiar contexto, feedback claro e baixa latencia. Se a resposta for "avaliar exercicios com consistencia", a integracao precisa privilegiar rubrica, saida estruturada e audibilidade. Se a resposta for "explorar conceitos", a integracao pode ser mais conversacional, mas ainda precisa registrar custo e fontes de contexto.

### Checklist de implementacao

1. Defina o contrato de entrada e saida antes de chamar Claude.
2. Escolha o modelo por tarefa, nao por preferencia generica.
3. Registre prompt version, modelo, usage, latencia e status.
4. Tenha fallback local para manter a aula util em caso de falha.
5. Rode exemplos reais de tutor antes de publicar mudancas.

---

## SECAO 7: EVALS PARA PROMPTS DE TUTORIA

Prompt engineering aqui funciona como engenharia de requisitos. O system prompt define papel, prioridade e limites; o template separa contexto e input; os examples mostram o comportamento esperado; os evals dizem se a mudanca melhorou. Sem esses quatro elementos, prompt vira arte oral. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Para a Harness IA, o prompt precisa proteger a pedagogia. A regra nao e 'nunca ajude'; e 'ajude de uma forma que preserve aprendizagem'. Isso significa pedir tentativa, dar pistas progressivas, explicar erros comuns e usar rubrica quando a tarefa for avaliativa. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

O erro mais comum e comecar pela chamada de API e deixar arquitetura para depois. Em uma plataforma educacional, a pergunta certa e: qual comportamento esperamos quando o aluno esta confuso, quando o contexto da aula esta incompleto, quando a API demora, quando o custo sobe, ou quando a resposta precisa ser auditada por um professor? Essas perguntas moldam o design antes do primeiro token. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Pense no tutor como uma camada entre curriculo, aluno e modelo. O curriculo fornece fonte de verdade; o aluno fornece objetivo, tentativa e duvida; Claude fornece linguagem, adaptacao e raciocinio aplicado. Se uma dessas partes entra sem estrutura, a resposta vira conversa solta. Se entra com contrato, a resposta vira produto. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

A implementacao profissional tambem evita magia. Cada prompt tem versao, cada chamada registra usage, cada resposta importante pode ser reproduzida com os mesmos inputs, e cada fallback foi pensado antes do incidente. Isso parece burocratico no prototipo, mas e justamente o que permite escalar para milhares de alunos sem transformar suporte em adivinhacao. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Um bom criterio pratico e perguntar: se a resposta estiver errada, conseguimos descobrir por que? Precisamos saber qual modelo respondeu, qual contexto foi enviado, qual prompt estava ativo, qual rubrica foi usada, quanto custou e qual caminho de fallback ocorreu. Sem esses dados, a equipe apenas observa sintomas. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Tambem existe uma diferenca entre demonstracao e produto. A demonstracao mostra Claude respondendo bonito. O produto garante que a resposta respeita o nivel do aluno, nao vaza chave, nao entrega gabarito indevido, cabe no budget, aparece rapido na interface e gera dados para melhorar o curso. Engenharia de IA mora nessa diferenca. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

Antes de publicar qualquer comportamento novo, escreva a politica em linguagem que suporte, professores e engenharia consigam discutir. Se uma regra depende de interpretacao humana, transforme-a em exemplo. Se depende de custo, transforme-a em budget. Se depende de seguranca, transforme-a em validacao e log. Esse habito reduz ambiguidades quando a plataforma cresce. Para esta licao, documente a decisao como parte do contrato do modulo, porque futuras aulas, novos modelos e novas politicas de custo vao depender dela.

### Decisoes praticas

- Prompt e uma especificacao executavel; clareza vence truques.
- O system prompt deve explicar o por que das regras, nao apenas listar proibicoes.
- Examples bons cobrem casos normais, casos limite e respostas recusadas.
- Nao peca chain-of-thought; peca resumo, criterios, passos publicos ou justificativa curta.
- Toda mudanca de prompt importante deve rodar contra evals fixos.

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

### System prompt pedagogico

Define o papel do tutor e como lidar com exercicios avaliativos.

```typescript
export const HARNESS_TUTOR_SYSTEM = `
You are Harness IA Tutor, a senior software engineering educator.
Your job is to help students learn, not to simply finish graded work for them.

Behavior:
1. Use the provided lesson context as the primary source.
2. Explain with practical TypeScript examples when useful.
3. If the student asks for a final answer to an exercise, guide with hints first.
4. If context is missing, say what is missing and ask one focused question.
5. Never claim a course fact that is not in the supplied context.

Output style:
- Portuguese by default.
- Short sections.
- End with one check-for-understanding question.
`;
```

### Prompt com XML tags

Evita misturar instrucao da aplicacao com texto do aluno.

```typescript
export function buildTutorPrompt(input: {
  lesson: string;
  studentQuestion: string;
  previousAttempt?: string;
}) {
  return `
<task>
Help the student understand the concept. Do not solve graded work directly.
</task>
<lesson_context>
${input.lesson}
</lesson_context>
<student_question>
${input.studentQuestion}
</student_question>
<previous_attempt>
${input.previousAttempt ?? "No attempt yet."}
</previous_attempt>
<response_contract>
Return: explanation, example, next_step_question.
</response_contract>`;
}
```

### Few-shot feedback

Mostra o formato esperado sem depender de descricao abstrata.

```typescript
const FEEDBACK_EXAMPLES = `
<examples>
  <example>
    <student>useEffect roda sempre?</student>
    <good_response>
      Depende do array de dependencias. Sem array, roda apos todo render.
      Com [], roda apos o primeiro render. Com [userId], roda quando userId muda.
      Check: qual dessas opcoes voce usaria para buscar dados de um curso uma vez?
    </good_response>
  </example>
  <example>
    <student>me da a resposta final do quiz</student>
    <good_response>
      Posso te ajudar a chegar nela. Primeiro identifique qual parte do codigo
      controla o estado. O que acontece quando o evento onClick dispara?
    </good_response>
  </example>
</examples>`;
```

### Contrato JSON para feedback renderizavel

Permite UI com cards, highlights e proximos passos.

```typescript
import { z } from "zod";

export const TutorFeedback = z.object({
  summary: z.string(),
  concepts: z.array(z.string()).max(5),
  explanation: z.string(),
  codeExample: z.string().optional(),
  nextQuestion: z.string(),
  confidence: z.enum(["low", "medium", "high"]),
});

export type TutorFeedback = z.infer<typeof TutorFeedback>;

export function parseTutorJson(text: string): TutorFeedback {
  return TutorFeedback.parse(JSON.parse(text));
}
```

### Prompt A/B testavel

Compara duas versoes de prompt com a mesma bateria de casos.

```typescript
type EvalCase = { id: string; lesson: string; question: string; expected: string[] };

export async function runPromptEval(promptVersion: string, cases: EvalCase[]) {
  return Promise.all(
    cases.map(async (c) => {
      const answer = await callTutor({ promptVersion, lesson: c.lesson, question: c.question });
      const passed = c.expected.every((needle) =>
        answer.toLowerCase().includes(needle.toLowerCase()),
      );
      return { caseId: c.id, promptVersion, passed, answer };
    }),
  );
}
```


---

## Quiz

### Questao 1

**Pergunta:** Qual e a funcao principal do system prompt?

**Resposta esperada:** Definir papel, prioridades e limites globais do assistente naquela chamada.

### Questao 2

**Pergunta:** Por que XML tags ajudam?

**Resposta esperada:** Porque separam claramente instrucoes, contexto e input do aluno, reduzindo ambiguidade.

### Questao 3

**Pergunta:** Few-shot examples podem prejudicar?

**Resposta esperada:** Sim; exemplos pouco diversos fazem o modelo copiar padroes indesejados ou ignorar casos limite.

### Questao 4

**Pergunta:** O que pedir no lugar de chain-of-thought?

**Resposta esperada:** Pedir justificativa breve, criterios usados, resumo do raciocinio ou passos publicos verificaveis.

### Questao 5

**Pergunta:** Quando usar saida JSON?

**Resposta esperada:** Quando a UI ou outro servico precisa interpretar a resposta de forma confiavel.

### Questao 6

**Pergunta:** Como saber que um prompt melhorou?

**Resposta esperada:** Rodando evals fixos e comparando taxa de acerto, formato, seguranca, custo e latencia.


---

## Exercicio pratico com gabarito

### Enunciado

Escreva system prompt, template XML, tres examples e contrato JSON para feedback de uma tentativa de exercicio TypeScript.

### Entregaveis

- Codigo TypeScript server-side.
- Prompt ou contrato estruturado quando aplicavel.
- Logs ou metricas minimas.
- Pelo menos tres testes: sucesso, falha recuperavel e entrada invalida.
- Pequeno README explicando trade-offs.

### Gabarito esperado

O gabarito deve conter papel do tutor, regra de nao entregar resposta final, contexto da licao em tag propria, tentativa do aluno em tag propria, rubrica, tres exemplos diversos, schema Zod e um pequeno eval com pelo menos cinco casos.

### Criterios de avaliacao

1. A solucao nao expoe API key ao navegador.
2. O codigo trata erro e custo explicitamente.
3. A resposta do tutor e util para aprendizagem, nao apenas tecnicamente correta.
4. O formato de saida e validavel pela aplicacao.
5. O design permite trocar modelo, prompt e budget por configuracao.

## Fechamento

Ao terminar esta licao, voce deve conseguir explicar nao apenas como chamar Claude, mas como transformar essa chamada em uma parte confiavel da Harness IA. A integracao madura combina prompt engineering, arquitetura server-side, observabilidade, seguranca e criterio pedagogico. Esse e o salto de API demo para produto educacional.
