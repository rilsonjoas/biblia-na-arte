# 🗂️ Configuração Manual do Supabase Storage

Como a criação de buckets via API requer permissões especiais, siga estes passos para configurar manualmente no Supabase Dashboard.

## 📋 Passo a Passo

### 1. Acesse o Supabase Dashboard

1. Vá para [supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Selecione o projeto `biblia-na-arte`

### 2. Criar o Bucket de Storage

1. No menu lateral, clique em **"Storage"**
2. Clique no botão **"New bucket"**
3. Configure o bucket:
   - **Name**: `artwork-images`
   - **Public bucket**: ✅ **Ativado**
   - **File size limit**: `50 MB`
   - **Allowed MIME types**: 
     ```
     image/jpeg
     image/png
     image/webp
     image/gif
     ```

### 3. Configurar Políticas RLS

1. Ainda na página de Storage, clique na aba **"Policies"**
2. Clique em **"New policy"**
3. Crie as seguintes políticas:

#### Política 1: Leitura Pública
- **Name**: `Allow public read access to artwork images`
- **Operation**: `SELECT`
- **Target roles**: `public`
- **Policy definition**:
  ```sql
  bucket_id = 'artwork-images'
  ```

#### Política 2: Upload Autenticado
- **Name**: `Allow authenticated upload to artwork images`
- **Operation**: `INSERT`
- **Target roles**: `authenticated`
- **Policy definition**:
  ```sql
  bucket_id = 'artwork-images'
  ```

#### Política 3: Update Autenticado
- **Name**: `Allow authenticated update of artwork images`
- **Operation**: `UPDATE`
- **Target roles**: `authenticated`
- **Policy definition**:
  ```sql
  bucket_id = 'artwork-images'
  ```

#### Política 4: Delete Autenticado
- **Name**: `Allow authenticated delete of artwork images`
- **Operation**: `DELETE`
- **Target roles**: `authenticated`
- **Policy definition**:
  ```sql
  bucket_id = 'artwork-images'
  ```

### 4. Executar SQL Adicional

1. Vá para **"SQL Editor"**
2. Execute o seguinte SQL:

```sql
-- Criar view de estatísticas
CREATE OR REPLACE VIEW storage_stats AS
SELECT 
  bucket_id,
  COUNT(*) as total_files,
  SUM((metadata->>'size')::bigint) as total_size_bytes,
  ROUND(SUM((metadata->>'size')::bigint) / 1024.0 / 1024.0, 2) as total_size_mb,
  MIN(created_at) as first_upload,
  MAX(created_at) as last_upload
FROM storage.objects
WHERE bucket_id = 'artwork-images'
GROUP BY bucket_id;

-- Conceder permissões
GRANT SELECT ON storage_stats TO anon;
GRANT SELECT ON storage_stats TO authenticated;

-- Função helper para URLs
CREATE OR REPLACE FUNCTION get_storage_url(bucket_name text, file_path text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN concat(
    current_setting('app.settings.supabase_url', true),
    '/storage/v1/object/public/',
    bucket_name,
    '/',
    file_path
  );
END;
$$;
```

## ✅ Verificação

Para verificar se tudo está funcionando:

```bash
# Testar acesso ao storage
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

supabase.storage.getBucket('artwork-images')
  .then(({ data, error }) => {
    if (error) console.log('❌ Error:', error.message);
    else console.log('✅ Bucket found:', data.name);
  });
"
```

## 🚀 Executar Migração

Após configurar o Storage:

```bash
# Testar com poucas imagens
VITE_SUPABASE_URL="https://asvthljuwtgfnenvcqqi.supabase.co" \
VITE_SUPABASE_ANON_KEY="your_key_here" \
node scripts/test-migration.js

# Se o teste passar, executar migração completa
./scripts/run-image-migration.sh
```

## 📊 URLs Resultantes

Após a migração, suas imagens terão URLs como:

```
https://asvthljuwtgfnenvcqqi.supabase.co/storage/v1/object/public/artwork-images/image-name-timestamp-random.jpg
```

Essas URLs são:
- ✅ **Públicas** - Acessíveis sem autenticação
- ✅ **CDN** - Entregues via CDN global
- ✅ **Otimizadas** - Suporte a transformações
- ✅ **Rápidas** - Cache automático

---

⚡ **Próximo passo**: Após configurar o Storage, volte e execute a migração!