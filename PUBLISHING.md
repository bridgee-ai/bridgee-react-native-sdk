# Preparação de release

O código em `main` e os artefatos locais não comprovam que uma versão foi publicada
no npm, Maven Central ou CocoaPods. Não republicar `0.1.0` com conteúdo diferente.

## Validação do candidato

1. Registrar a revisão Git e confirmar um checkout limpo.
2. Executar `npm ci --ignore-scripts`, `npm run typecheck`, `npm test` e
   `npm run prepare`. O teste de configuração deve comprovar falha inicial,
   recuperação e falha após uma configuração válida, sem manter listeners ou
   permitir `firstOpen` depois da falha.
3. Executar os jobs de compilação Android/iOS em `.github/workflows/test.yml`.
   Eles verificam a ponte clássica RN 0.74. Não equivalem à homologação da nova
   arquitetura, Expo em aparelho, instalação por loja ou entrega no Firebase.
4. Gerar um tarball local sem publicar, inspecionar seus arquivos, registrar
   tamanho/SHA-256 e conferir os entrypoints CommonJS, ESM, tipos, plugin e
   fontes nativas. Conferir também o arquivo de licença: um nome em `files`
   não garante que o arquivo exista ou tenha sido incluído.
5. Instalar o tarball em um aplicativo de homologação limpo. Os fixtures nativos
   compilam fontes locais; não comprovam instalação do pacote final pelas lojas.

## Dependências nativas e aceite físico

O Android do wrapper referencia `ai.bridgee:bridgee-android-sdk:2.3.0`; o podspec
referencia `BridgeeAiSDK ~> 1.1`. Antes de uma release, registrar exatamente quais
revisões e versões publicadas contêm as correções nativas e validar o lockfile do
consumidor. Não trocar os pins por versões inexistentes nem presumir que a fonte
incorporada ao Git já esteja publicada nesses registries.

Para Android, homologar o candidato por um canal de teste da Play com Install
Referrer real, destino/fallback, retomada, consentimento e repetição. Para iOS,
homologar em aparelho o aplicativo com a dependência final e os caminhos de links
aplicáveis. Registrar resultado esperado/obtido, versões e limitações. Não usar
um build de Simulator como aceite físico.

Não incluir credenciais no pacote ou nos recibos. O app deve aguardar
`configure()` com sucesso antes de iniciar uma resolução. Chamadas concorrentes
de reconfiguração não têm contrato de troca de tenant homologado.

## Publicação e reversão

Após os aceites, escolher uma nova versão, atualizar as dependências nativas
aprovadas e gerar novamente o mesmo candidato que será homologado. Revisar o
tarball e usar a autenticação de publicação existente. Publicar apenas o pacote
aprovado; não criar credenciais nem elevar permissões como parte deste roteiro.
Consumidores devem usar versão/lockfile explícitos para permitir reversão para
o pacote anterior. A reversão de um app distribuído pode exigir nova entrega
pelas lojas.

Esta preparação não implementa identidade de instalação, deduplicação de install,
reinstalação, reatribuição ou semântica faturável. `firstOpen` resolve contexto;
o nome do método não comprova uma instalação única ou faturável.
