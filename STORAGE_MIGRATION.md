# 🚀 Migração de Imagens para Supabase Storage

Este guia descreve como migrar todas as imagens locais (467MB) do projeto para o Supabase Storage, otimizando performance e reduzindo o tamanho do repositório.

## 📋 Pré-requisitos

- [ ] Supabase project configurado
- [ ] Variáveis de ambiente definidas no `.env.local`
- [ ] Node.js e npm instalados
- [ ] Conexão estável com internet

## 🛠️ Preparação

### 1. Verificar Variáveis de Ambiente

Certifique-se que estas variáveis estejam definidas:

```bash
# .env.local
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 2. Exportar Variáveis para Scripts

```bash
export VITE_SUPABASE_URL="https://asvthljuwtgfnenvcqqi.supabase.co"
export VITE_SUPABASE_ANON_KEY="your_anon_key_here"
```

## 🚀 Executar Migração

### Opção 1: Migração Automática (Recomendado)

```bash
# Executa todo o processo automaticamente
./scripts/run-image-migration.sh
```

### Opção 2: Migração Manual

```bash
# 1. Configurar Storage no Supabase
# Execute o SQL em supabase/storage-setup.sql no dashboard

# 2. Executar migração
npm run storage:migrate

# 3. Testar aplicação
npm run build
npm run preview

# 4. Limpar assets (após verificação)
rm -rf src/assets
```

## 📊 O que a Migração Faz

### 🔄 Processo Detalhado

1. **Backup**: Cria backup do estado atual do banco
2. **Storage Setup**: Configura bucket e políticas no Supabase
3. **Upload**: Envia todas as 961 imagens para o Storage
4. **Database Update**: Atualiza URLs no banco de dados
5. **Verificação**: Testa carregamento das imagens
6. **Limpeza**: Remove arquivos locais (opcional)

### 📈 Benefícios

- ✅ **Performance**: CDN global automático
- ✅ **Espaço**: Remove 467MB do repositório
- ✅ **Confiabilidade**: Backup e redundância automáticos
- ✅ **Otimização**: Transformações de imagem on-demand
- ✅ **URLs**: Links públicos consistentes

## 🔧 Componentes Criados

### `ArtworkImage` - Componente Inteligente

```tsx
import { ArtworkImage } from '@/components/ArtworkImage';

// Uso básico
<ArtworkImage 
  src={artwork.imageUrl} 
  alt={artwork.title} 
/>

// Versões especializadas
<ArtworkThumbnail src={url} alt="thumb" />
<ArtworkHeroImage src={url} alt="hero" />
<ResponsiveArtworkImage src={url} alt="responsive" />
```

### `storage.ts` - Utilitários

```ts
import { uploadImageToStorage, isStorageUrl } from '@/lib/storage';

// Upload de nova imagem
const result = await uploadImageToStorage(file);

// Verificar tipo de URL
if (isStorageUrl(imageUrl)) {
  // É do Storage
} else if (isLocalAsset(imageUrl)) {
  // É asset local
}
```

## 📁 Estrutura de Arquivos

```
scripts/
├── migrate-images-to-storage.js    # Script principal de migração
├── run-image-migration.sh          # Script completo automatizado
supabase/
├── storage-setup.sql               # Configuração do Storage
src/
├── components/ArtworkImage.tsx     # Componente de imagem inteligente
├── lib/storage.ts                  # Utilitários do Storage
├── lib/supabase-data.ts           # Atualizado para Storage URLs
```

## 🧪 Verificação

### Durante o Desenvolvimento

O componente `ArtworkImage` mostra indicadores visuais:
- 🟢 **S** = Supabase Storage
- 🟡 **L** = Local Asset
- 🔵 **E** = External URL

### Testes de Verificação

```bash
# Verificar imagens migradas
npm run dev

# Build de produção
npm run build

# Visualizar estatísticas
curl "$VITE_SUPABASE_URL/rest/v1/storage_stats" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY"
```

## 🆘 Solução de Problemas

### Erro: "Bucket not found"

```sql
-- Execute no Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public)
VALUES ('artwork-images', 'artwork-images', true);
```

### Imagens não carregam

1. Verificar CORS no Supabase
2. Verificar políticas RLS
3. Verificar URLs no banco

### Migração falhou

```bash
# Restaurar backup
node -e "
const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('backups/pre-migration-*.json'));
// Restaurar URLs originais no banco
"
```

## 📱 URLs de Exemplo

### Antes (Local)
```
/src/assets/image-123.jpg
```

### Depois (Storage)
```
https://xxx.supabase.co/storage/v1/object/public/artwork-images/image-123-timestamp-random.jpg
```

## 🎯 Próximos Passos

Após a migração bem-sucedida:

1. **Commit** as alterações
2. **Deploy** para produção  
3. **Monitorar** performance
4. **Configurar** transformações de imagem (opcional)
5. **Implementar** upload de novas imagens via dashboard

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs de migração
2. Consulte o arquivo `migration-log.json`
3. Restaure o backup se necessário
4. Execute migração parcial se necessário

---

✨ **Resultado Final**: Aplicação mais rápida, repositório menor e imagens servidas via CDN global!