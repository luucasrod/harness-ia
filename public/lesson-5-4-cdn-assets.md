# LIÇÃO 5.4: CDN & Assets - Distribuição Global

## SEÇÃO 1: INTRODUÇÃO (6 minutos)

### O Problema Real

Sua plataforma está no Brasil. Um aluno na Austrália acessa uma aula com vídeo de 100MB. Request vai de Sidney até São Paulo (~9000 km), baixa 100MB via roteador intercontinental, volta para Sidney. Latência: 500-1000ms. Download: 20 segundos.

Mesmo vídeo, armazenado em servidor CDN em Sydney: latência 50ms, download 5 segundos. 4x mais rápido.

### Por Que CDN É Arquitetura

- **Latência:** Usuários percebem cada 100ms de atraso
- **Custos:** Banda internacional é cara
- **Escala:** Um servidor não aguenta 100 mil downloads simultâneos de um vídeo
- **Resiliência:** Se data center cai, CDN fornece fallback

### Objetivo da Lição

Nesta aula, você vai entender:
- Como CDN funciona: edge servers, origins, invalidação
- Cache headers: browser cache vs CDN cache
- Versionamento de assets
- Estratégias de distribuição por tipo (estático vs dinâmico)

---

## SEÇÃO 2: CDN FUNDAMENTALS (12 minutos)

### Como Funciona

```
Usuário em Sydney            Servidor CDN Sydney
      ↓                             ↓
   Request                   (edge server)
      |                             |
      |←--- 50ms ---latência --- |
      |                             |
      |← Servidor é originário     |
      |  do Brasil? Não tem        |
      |  vídeo. Vai buscar         |
      |  origem (São Paulo)
      |
Servidor Origin (São Paulo)
    ↓
    Vídeo 100MB
    ↑
CDN Sydney
    ↓
Usuário recebe

Próximas requisições:
Usuário → CDN Sydney (cache hit) ✅ 50ms
```

### Tipos de Cache

```
Browser Cache (cliente)
  ↓ (expires: 1 hour)
  X
CDN Edge Cache (CloudFlare/Akamai)
  ↓ (expires: 1 day)
  X
Origin (seu servidor)
  ↓ (fonte da verdade)
```

### Cache Headers: Controlando Cada Nível

```typescript
// Arquivo estático: versão nunca muda
// Ex: app.abc123.js (hash do build como versão)
app.get('/app.abc123.js', (req, res) => {
  res.set({
    'Cache-Control': 'public, max-age=31536000', // 1 ano
    'Content-Type': 'application/javascript'
  });
  res.sendFile('app.abc123.js');
});
// Browser: cache por 1 ano
// CDN: cache por 1 ano
// Se versão muda, novo hash = novo URL

// Conteúdo dinâmico (pode mudar)
// Ex: /api/progress → sempre diferente
app.get('/api/progress/:userId', (req, res) => {
  res.set({
    'Cache-Control': 'private, max-age=60, must-revalidate',
    'Vary': 'Authorization'
  });
  const progress = db.getProgress(req.params.userId);
  res.json(progress);
});
// Browser: cache por 60s (privado = não compartilha entre usuários)
// CDN: cache por 60s (mas Vary: Authorization = considera autorização)
// Após 60s, revalida (ETag check)

// Conteúdo que nunca muda
// Ex: /lessons/1.1/content (aula é versionada, URL é permanente)
app.get('/lessons/:lessonId/content', (req, res) => {
  res.set({
    'Cache-Control': 'public, immutable, max-age=31536000',
    'ETag': `W/"${crypto.createHash('md5').update(content).digest('hex')}"`
  });
  res.json(lessonContent);
});
// Browser + CDN: cache 1 ano
// immutable = nunca vai mudar, sem need de revalidar
```

---

## SEÇÃO 3: VERSIONAMENTO E INVALIDAÇÃO (10 minutos)

### Problema: Conteúdo Cacheado Fica Desatualizado

```
Versão 1 (2024-01-01):
GET /lessons/1 → CDN cache 1 dia
   "Conteúdo é..."

Versão 2 (2024-01-02):
GET /lessons/1 → CDN cache ainda tem versão 1!
   Usuário vê versão antiga por até 1 dia ❌
```

### Estratégia 1: URL Versionamento (Cache Busting)

```typescript
// ✅ MELHOR: Versão no URL, cache 1 ano
app.get('/lessons/:lessonId/v:version/content', (req, res) => {
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  
  const content = db.getLesson(req.params.lessonId, req.params.version);
  res.json(content);
});

// Usage:
// v1: /lessons/1/v1/content
// v2: /lessons/1/v2/content
// 
// URL mudou = novo cache = sempre fresco
// Versão antiga fica em cache (usuários antigos veem v1, novo acesso vê v2)
```

### Estratégia 2: Hash de Conteúdo

```typescript
// Hash do build: abc123def456
app.get('/app.abc123def456.js', (req, res) => {
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.sendFile('dist/app.abc123def456.js');
});

// Quando você rebuild, hash muda:
// antes: /app.oldHash123.js
// depois: /app.newHash456.js

// HTML referencia sempre o novo hash:
// <script src="/app.abc123def456.js"></script>
```

### Estratégia 3: CDN Purging (Invalidação)

```typescript
// Quando editor atualiza conteúdo
async updateLessonContent(lessonId: string, newContent: string): Promise<void> {
  // 1. Atualiza banco
  await db.updateLesson(lessonId, newContent);
  
  // 2. Invalida CDN (purge cache)
  const cdnClient = new CloudflareClient();
  await cdnClient.purgeCache([
    `/lessons/${lessonId}/content`,
    `/lessons/${lessonId}/v*/content` // Invalida todas as versões
  ]);
  
  // 3. Proxima requisição vai ao origin, não CDN
}
```

---

## SEÇÃO 4: ESTRATÉGIAS POR TIPO (10 minutos)

```typescript
// ESTÁTICO: JS, CSS, imagens (nunca muda)
app.use('/static', express.static('public/static', {
  setHeaders: (res, path) => {
    res.set({
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Expires': new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toUTCString()
    });
  }
}));

// CONTEÚDO: Aulas, exercícios (muda raramente)
app.get('/lessons/:lessonId', (req, res) => {
  res.set('Cache-Control', 'public, max-age=86400'); // 1 dia
  const lesson = db.getLesson(req.params.lessonId);
  res.json(lesson);
});

// DINÂMICO: Progresso, feedback (muda por usuário)
app.get('/api/progress/:userId', (req, res) => {
  res.set({
    'Cache-Control': 'private, max-age=60', // 1 min, só cliente
    'Vary': 'Authorization, User-ID' // CDN: considere autorização
  });
  const progress = db.getProgress(req.params.userId);
  res.json(progress);
});

// VIDEO STREAMING: Hls/DASH (dividido em chunks)
app.get('/videos/:videoId/segment-:num.ts', (req, res) => {
  // Cada segmento é imutável
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.sendFile(`videos/${req.params.videoId}/segment-${req.params.num}.ts`);
});
```

---

## SEÇÃO 5: IMPLEMENTAÇÃO COMPLETA (12 minutos)

```typescript
// Arquivo: services/asset-delivery.ts
import CloudflareClient from 'cloudflare';

class AssetDeliveryService {
  private cdnClient = new CloudflareClient();
  
  // Setup: Configure headers por rota
  setupCaching(app: Express): void {
    // Estático: versão no nome
    app.get('/assets/:hash/*', (req, res, next) => {
      res.set({
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*'
      });
      next();
    });
    
    // Dinâmico: revalidar
    app.get('/api/progress/:userId', (req, res, next) => {
      res.set({
        'Cache-Control': 'private, max-age=300',
        'Vary': 'Authorization'
      });
      next();
    });
  }
  
  // Quando conteúdo é publicado
  async publishLesson(lesson: Lesson): Promise<void> {
    // 1. Salva
    await db.lessons.save(lesson);
    
    // 2. Gera versão
    const version = await this.versionLesson(lesson.id);
    
    // 3. Invalida CDN
    await this.cdnClient.purgeCache([
      `/lessons/${lesson.id}`,
      `/api/lessons/${lesson.id}`
    ]);
    
    // 4. Publica evento
    await eventBus.publish('lesson.published', {
      lessonId: lesson.id,
      version
    });
  }
  
  // ETag: revalidação eficiente
  computeETag(content: string): string {
    return crypto.createHash('md5').update(content).digest('hex');
  }
  
  handleConditionalRequest(req: Request, content: string, res: Response): boolean {
    const etag = this.computeETag(content);
    
    if (req.headers['if-none-match'] === etag) {
      // Cliente tem versão recente
      res.status(304).end(); // Not Modified
      return true;
    }
    
    res.set('ETag', etag);
    return false;
  }
}
```

---

## Resumo

CDN reduz latência e custo distribuindo conteúdo perto dos usuários. Cache headers controlam onde e quanto cachear. Versionamento evita servir conteúdo desatualizado.

Padrão: URL versionado para estático (1 ano), ETags para dinâmico (revalidação), purging para crítico.

Na próxima lição, veremos como **monitorar** tudo isso usando **observabilidade**.

---

### Pontos-Chave

1. **CDN = replicação geográfica** — reduze latência drasticamente
2. **Cache headers controlam tudo** — browser, CDN, origem
3. **Versionamento no URL** — cache forever, URL muda se versão muda
4. **Estático vs Dinâmico** — estratégias diferentes
5. **ETag** — revalidação eficiente sem re-download
