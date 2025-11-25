# Configuração do Firebase Storage

Este documento explica como configurar o Firebase Storage para a funcionalidade de upload de imagens e PDFs.

## 1. Ativar Firebase Storage no Console

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. No menu lateral, clique em **Storage**
4. Clique em **Começar**
5. Aceite as configurações padrão e clique em **Concluir**

## 2. Configurar Regras de Segurança

Após ativar o Storage, você precisa configurar as regras de segurança. No Firebase Console:

1. Vá para **Storage** > **Rules**
2. Cole as seguintes regras:

```
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Função helper para verificar se o usuário é admin
    function isAdmin() {
      return request.auth != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Função helper para verificar se o usuário tem acesso ao servidor
    function hasServerAccess(serverId) {
      return request.auth != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.serverAccess.hasAny([serverId]);
    }
    
    // Regras para arquivos de servidores
    match /servers/{serverId}/{allPaths=**} {
      // Qualquer usuário autenticado pode ler (download)
      allow read: if request.auth != null;
      
      // Apenas admins ou usuários com acesso ao servidor podem escrever (upload/delete)
      allow write: if isAdmin() || hasServerAccess(serverId);
    }
    
    // Negar acesso a outros caminhos por padrão
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

3. Clique em **Publicar**

## 3. Estrutura de Pastas

Os arquivos serão organizados da seguinte forma:

```
/servers/
  /{serverId}/
    banner.webp          # Imagem de banner (1200x400px)
    icon.webp            # Ícone do servidor (256x256px)
    /documents/
      {timestamp}_{nome_original}.pdf
```

## 4. Configurações Importantes

### Tamanhos Máximos de Arquivo

- **Imagens (banner/icon):** 5MB
- **Documentos (PDFs):** 10MB

### Formatos Aceitos

- **Imagens:** JPEG, PNG, WebP (convertido automaticamente para WebP)
- **Documentos:** PDF apenas

### Processamento de Imagens

As imagens são automaticamente:
- Redimensionadas para o tamanho correto
- Convertidas para WebP (melhor compressão)
- Otimizadas com qualidade 85%

## 5. Quotas do Firebase Storage

### Plano Spark (Free)
- **Storage:** 5GB
- **Download:** 1GB/dia
- **Upload:** 1GB/dia

### Plano Blaze (Pay-as-you-go)
- **Storage:** $0.026/GB/mês
- **Download:** $0.12/GB
- **Upload:** $0.12/GB

## 6. Monitoramento de Uso

Para monitorar o uso do Storage:

1. Acesse **Storage** > **Usage**
2. Verifique:
   - Total de armazenamento usado
   - Tráfego de download/upload
   - Número de operações

## 7. Backup e Manutenção

### Backup Manual

Os arquivos podem ser baixados via Firebase Console ou usando o Firebase CLI:

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Baixar todos os arquivos
gsutil -m cp -r gs://YOUR-BUCKET-NAME/servers ./backup/
```

### Limpeza de Arquivos Órfãos

Se um documento for removido do Firestore mas o arquivo permanecer no Storage, você pode criar um script de limpeza:

```typescript
// scripts/clean-orphaned-files.ts
import { adminDb, adminStorage } from '@/lib/firebase-admin';

async function cleanOrphanedFiles() {
  const bucket = adminStorage().bucket();
  const [files] = await bucket.getFiles({ prefix: 'servers/' });
  
  for (const file of files) {
    // Verificar se o serverId ainda existe
    // Deletar se não existir
  }
}
```

## 8. Troubleshooting

### Erro: "Permission denied"

- Verifique se as regras de segurança estão publicadas
- Confirme que o usuário está autenticado
- Verifique se o usuário tem `isAdmin: true` ou o serverId em `serverAccess`

### Erro: "Quota exceeded"

- Verifique o uso no console
- Considere fazer upgrade para o plano Blaze
- Implemente limpeza de arquivos antigos

### Upload lento

- Considere implementar upload direto do cliente (sem passar pelo servidor)
- Use compressão de imagens antes do upload
- Verifique a velocidade de internet do usuário

## 9. Segurança Adicional

### Validação no Backend

A API já implementa validação de:
- Tipo MIME
- Tamanho do arquivo
- Autenticação e autorização
- Nomes de arquivo seguros

### Recomendações

1. **Nunca confie apenas nas regras do Storage** - sempre valide no backend
2. **Sanitize nomes de arquivo** - remova caracteres especiais
3. **Limite taxa de upload** - previna abuso
4. **Escaneie arquivos** - considere adicionar verificação de vírus para produção
5. **Use CDN** - Firebase Storage já tem CDN integrado

## 10. URLs de Acesso

Os arquivos podem ser acessados de duas formas:

### URLs Públicas (Recomendado)
```
https://storage.googleapis.com/{BUCKET_NAME}/servers/{serverId}/banner.webp
```

### Signed URLs (Com expiração)
```javascript
const [url] = await fileRef.getSignedUrl({
  action: 'read',
  expires: Date.now() + 1000 * 60 * 60 * 24 * 365, // 1 ano
});
```

A implementação atual usa **URLs públicas** com `makePublic()` para melhor performance de cache.

---

## Próximos Passos

Após configurar o Storage:

1. ✅ Teste o upload de uma imagem banner
2. ✅ Teste o upload de um ícone
3. ✅ Teste o upload de um PDF
4. ✅ Verifique se os arquivos aparecem no Storage Console
5. ✅ Teste a remoção de arquivos
6. ✅ Verifique as permissões com diferentes usuários

## Suporte

Se encontrar problemas, verifique:
- Logs do servidor (console do Node.js)
- Logs do Firebase (Firebase Console > Functions > Logs)
- Network tab do navegador (DevTools)
