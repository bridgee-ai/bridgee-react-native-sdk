# Measurement Lab → bridgee-react-native-sdk

Base inspecionada: `272b8590023be25ad2184a9a47f913d13ae32208` (main em 22/09/2026).

[Mapa completo, origem e dependências](https://github.com/bridgee-ai/bridgee-measurement-lab/blob/codex/lab-migration-plan/docs/MIGRACAO_BRIDGEE_AI.md).

## Delta desta rodada

A ponte JS filtra `first_open` e o nome do tenant configurado antes de encaminhar
analytics, inclusive se o app ainda usa a versão nativa anterior. Eventos de
campanha, propriedades e resultado da Promise seguem iguais. Teste executa a
ponte com NativeEventEmitter/native module simulados, sem Firebase ou rede.

## Reaproveitar

Atribuição fica nos SDKs nativos; manter NativeBridgeeSdk, RnAnalyticsProvider,
MatchBundle, FirebaseAnalyticsProvider e plugin Expo. `withCustomParam` e ambas as
pontes já aceitam campos extras, portanto não recriar setters para cada ID.

## Dependências e próximos deltas

1. Native Android/iOS + API-02: definir os mesmos campos opcionais em MatchResponse,
   UTMData e TypeScript; preservar string/case por todas as pontes.
2. Atualizar pins somente após existir release: atualmente Android usa 2.3.0 em
   android/build.gradle e iOS `~> 1.1` no podspec. Não apontar para versão inventada.
3. Expor consentimento e estado de entrega equivalentes aos nativos; não criar
   algoritmo ou segredo de instalação em JS.
4. Testar arquiteturas classic/TurboModule, Expo dev build, provider ausente/falho,
   dryRun, reconfigure e callbacks. O teste JS desta rodada não substitui esses builds.
5. Atualizar bridgee-react-native-example após pacote aprovado; nenhum novo app.

## Release/aceite

Informar retirada de `<tenant>_first_open`. O pacote ainda não garante dedupe de
campanha, native-Google preservation ou bridgee_install_id. Compra continua sob
responsabilidade Firebase; integração de qualidade começa pelo BigQuery.
