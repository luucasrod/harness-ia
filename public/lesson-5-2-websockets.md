# LIÇÃO 5.2: WebSockets - Real-time em Escala

## SEÇÃO 1: INTRODUÇÃO (6 minutos)

### O Problema Real

Sua plataforma educacional mostra o progresso de um aluno em tempo real. Um aluno completa uma aula, e:
- O painel dele atualiza **imediatamente**
- Os pais/mentores veem a atualização **sem recarregar a página**
- Analytics registra o evento **no mesmo instante**

Com HTTP puro, isso não é possível. HTTP é **request-response**: cliente pede, servidor responde. O servidor **não pode iniciar comunicação**. Para "tempo real", você precisa fazer polling (perguntar a cada segundo "atualizou?"), que é caro e lento.

WebSocket resolve isso: é uma **conexão bidirecional persistente** entre cliente e servidor. Qualquer um pode enviar mensagens a qualquer hora.

### Por Que WebSocket É Arquitetura, Não Feature

WebSocket traz novos desafios:
- **Escala:** 1000 usuários online = 1000 conexões TCP abertas. Seu servidor aguenta?
- **Consistência:** Dois usuários veem o mesmo progresso? 
- **Falhas:** Quando WebSocket cai, como o cliente se reconecta?
- **Broadcasting:** Como enviar uma mensagem para 1000 clientes?

### Objetivo da Lição

Nesta aula, você vai entender:
- HTTP vs WebSocket: quando usar cada um
- Padrões de real-time: eventos, pub/sub, state sync
- Escala horizontal com múltiplos servidores
- Tratamento de falhas e reconexão
- Broadcasting e salas (rooms)

---

## SEÇÃO 2: HTTP VS WEBSOCKET (10 minutos)

### Request-Response (HTTP)

```
Cliente                                 Servidor
  |
  |--- GET /progress/user/123 -------->  |
  |                                      | Query banco
  |<---- 200 OK {progress: 45} --------- |
  |
  | (espera 1 segundo)
  |
  |--- GET /progress/user/123 -------->  |
  |                                      | Query banco (novamente!)
  |<---- 200 OK {progress: 45} --------- |
```

**Problema:** Polling frequente = muitas requisições = CPU desperdiçada = latência

### Bidirecional (WebSocket)

```
Cliente                              Servidor
  |
  |===== ws://api.example.com =====>  |
  |       (handshake HTTP)             |
  |<===== 101 Switching Protocols ===  |
  |
  |       (conexão bidirecional TCP)
  |
  | (espera por evento no servidor)
  |
  |<===== {type: "progress", value: 45} === |
  |
  |<===== {type: "progress", value: 50} === |
  |
  |===== {type: "answer", questionId: "q1"} ===> |
```

**Vantagem:** Servidor pode enviar a qualquer hora. Latência real (ms, não segundos)

### Trade-offs

| Aspecto | HTTP | WebSocket |
|---|---|---|
| Latência | 100-500ms (polling) | 1-10ms (push) |
| Conexões | Stateless, eficiente | Stateful, mais CPU |
| Escala | Horizontal fácil | Complexo (state) |
| Browser | Nativo | Nativo (HTML5) |
| Debugging | Simples (cacheable) | Difícil (stateful) |
| Quando usar | Leitura frequente | Notificações urgentes |

---

## SEÇÃO 3: PADRÕES REAL-TIME (14 minutos)

### Padrão 1: Eventos Simples

Cliente escuta eventos. Servidor publica.

```typescript
// Cliente (TypeScript/React)
useEffect(() => {
  const socket = new WebSocket('wss://api.example.com/ws');
  
  socket.addEventListener('open', () => {
    console.log('Conectado');
  });
  
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    
    if (message.type === 'LessonCompleted') {
      setProgress(message.payload.progress);
      showNotification(`Aula completada! ${message.payload.progress}%`);
    }
  });
  
  return () => socket.close();
}, []);
```

```typescript
// Servidor (Node.js/Express)
import WebSocket from 'ws';

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('Client connected');
  
  // Quando um evento importante acontece
  eventBus.on('LessonCompleted', (event) => {
    ws.send(JSON.stringify({
      type: 'LessonCompleted',
      payload: event
    }));
  });
  
  ws.on('close', () => console.log('Client disconnected'));
});
```

**Simples, mas:** Broadcasting para múltiplos clientes é manual.

### Padrão 2: Pub/Sub (Publish/Subscribe)

Clientes se inscrevem em "canais". Qualquer mensagem no canal vai para todos.

```typescript
// Cliente
socket.emit('subscribe', { channel: 'progress:user:123' });
socket.on('progress:user:123', (message) => {
  setProgress(message.percentage);
});

// Servidor
const io = new SocketIO(server);

io.on('connection', (socket) => {
  socket.on('subscribe', ({ channel }) => {
    socket.join(channel); // Entra em "sala" do Socket.IO
  });
  
  // Qualquer serviço pode publicar
  const publish = (channel, message) => {
    io.to(channel).emit(channel, message);
  };
  
  // Quando aluno completa aula
  eventBus.on('LessonCompleted', (event) => {
    publish(`progress:user:${event.userId}`, {
      percentage: event.percentage,
      timestamp: new Date()
    });
  });
});
```

**Benefício:** N clientes inscritos = 1 publicação para todos

### Padrão 3: State Sync

Servidor mantém estado completo. Clientes sincronizam ao conectar e após mudanças.

```typescript
// Cliente se conecta, recebe estado inteiro
socket.on('connect', () => {
  socket.emit('sync', { userId: 'user123' });
});

socket.on('state', (state) => {
  setProgress(state.progress);
  setCompletedLessons(state.completedLessons);
  setQuotaRemaining(state.quotaRemaining);
});

// Quando servidor muda algo
eventBus.on('UserStateChanged', (event) => {
  io.to(`user:${event.userId}`).emit('state', event.newState);
});
```

**Uso:** Garantir que cliente sempre tem estado correto

---

## SEÇÃO 4: ESCALA HORIZONTAL (12 minutos)

### Problema: Múltiplos Servidores

```
Servidor 1 (WebSocket port 8080)
  └─ Cliente A conectado
  
Servidor 2 (WebSocket port 8081)
  └─ Cliente B conectado

Se Cliente A publica evento:
  Servidor 1 recebe mensagem
  Servidor 2 NÃO recebe
  Cliente B não vê evento ❌
```

### Solução: Message Broker (Redis Pub/Sub)

```typescript
// Servidor 1
const redis = new Redis();

socket.on('message', (message) => {
  // 1. Processa localmente
  handleMessage(message);
  
  // 2. Publica para TODOS os servidores via Redis
  redis.publish('global-chat', JSON.stringify({
    userId: socket.userId,
    message,
    timestamp: Date.now()
  }));
});

// Todos os servidores escutam Redis
redis.subscribe('global-chat');
redis.on('message', (channel, message) => {
  const data = JSON.parse(message);
  
  // Envia para clientes locais conectados no servidor
  io.to(`user:${data.userId}`).emit('message', data);
});
```

**Resultado:** Evento em qualquer servidor → todos os clientes veem

### Arquitetura Distribuída Completa

```
Clientes (navegadores)
    |
    | WebSocket (TCP persistente)
    |
Servidores (Node.js)
    | |
    | | Socket.IO com Redis adapter
    |_|
    |
Redis (pub/sub + sesões)
    |
PostgreSQL (dados persistentes)
```

---

## SEÇÃO 5: FALHAS E RECONEXÃO (10 minutos)

### Cenário: WebSocket Cai

```typescript
// ❌ INGÊNUO: Sem tratamento
socket.addEventListener('close', () => {
  console.log('Desconectado');
  // ... e pronto, cliente fica offline
});

// ✅ RESILIENTE: Reconexão com backoff exponencial
class ResillientWebSocket {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000; // 1 segundo
  
  connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = new WebSocket(url);
      
      this.socket.addEventListener('open', () => {
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        console.log('Reconectado!');
        resolve();
      });
      
      this.socket.addEventListener('close', () => {
        this.attemptReconnect(url, resolve, reject);
      });
      
      this.socket.addEventListener('error', reject);
    });
  }
  
  private attemptReconnect(url: string, resolve: any, reject: any): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      reject(new Error('Max reconnection attempts exceeded'));
      return;
    }
    
    this.reconnectAttempts++;
    console.log(`Reconectando em ${this.reconnectDelay}ms (tentativa ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect(url).catch(e => {
        this.attemptReconnect(url, resolve, reject);
      });
    }, this.reconnectDelay);
    
    // Backoff exponencial: 1s, 2s, 4s, 8s... até 60s
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 60000);
  }
}
```

### Sincronização Após Reconexão

```typescript
socket.addEventListener('open', async () => {
  // Ao reconectar, sincroniza estado com servidor
  const serverState = await fetch('/api/sync/current-state').then(r => r.json());
  
  // Se client tem mudanças não enviadas, resync
  const localChanges = getLocalPendingChanges();
  if (localChanges.length > 0) {
    socket.send(JSON.stringify({
      type: 'sync-pending',
      changes: localChanges
    }));
  }
  
  // Atualiza UI com estado correto
  setState(serverState);
});
```

---

## SEÇÃO 6: BROADCAST E ROOMS (8 minutos)

```typescript
// Socket.IO: Broadcast para todos
socket.on('lesson-completed', (data) => {
  // Envia para TODOS os clientes
  io.emit('notification', {
    type: 'lesson-completed',
    userId: data.userId,
    lessonId: data.lessonId
  });
});

// Broadcast para sala (ex: só alunos de uma classe)
socket.on('join-class', (classId) => {
  socket.join(`class:${classId}`);
});

socket.on('lesson-completed', (data) => {
  // Envia só para alunos da classe
  io.to(`class:${data.classId}`).emit('notification', data);
});

// Broadcast para todos EXCETO o remetente
socket.on('typing', (message) => {
  socket.broadcast.emit('user-typing', {
    userId: socket.userId,
    message
  });
});
```

---

## Resumo

Real-time é essencial para plataformas educacionais modernas. WebSocket resolve a latência de HTTP polling. Mas traz complexidade: estado persistente, escala distribuída, falhas de rede.

Padrões existem (eventos simples, pub/sub, state sync). Redis como message broker resolve escala. Reconexão com backoff exponencial resolve falhas.

Na próxima lição, veremos como processar **eventos assíncronos** em escala usando **Message Queues**.

---

### Pontos-Chave

1. **WebSocket é bidirecional** — servidor pode enviar sem esperar pedido
2. **HTTP polling é caro** — muitas requisições vazias
3. **Escala horizontal precisa de Redis** — múltiplos servidores precisam sincronizar
4. **Reconexão é obrigatória** — redes falham
5. **Eventos e pub/sub organizam comunicação** — senão fica caos
