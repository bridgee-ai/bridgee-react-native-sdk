# Bridgee React Native SDK

[![npm](https://img.shields.io/npm/v/@bridgee-ai/react-native-sdk)](https://www.npmjs.com/package/@bridgee-ai/react-native-sdk)
[![React Native](https://img.shields.io/badge/React%20Native-0.70%2B-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2049%2B-black.svg)](https://expo.dev/)
[![iOS](https://img.shields.io/badge/iOS-14.0%2B-blue.svg)](https://developer.apple.com/ios/)
[![Android](https://img.shields.io/badge/API-21%2B-brightgreen.svg?style=flat)](https://android-arsenal.com/api?level=21)

## 📖 Visão Geral

O **Bridgee React Native SDK** é uma solução completa de atribuição que conecta suas campanhas de marketing aos eventos de instalação e primeira abertura do seu aplicativo React Native. Ele resolve o problema de atribuição precisa em campanhas de aquisição de usuários, integrando-se perfeitamente com provedores de analytics como Firebase Analytics.

Por baixo dos panos, o SDK empacota nossos SDKs nativos [iOS](https://github.com/bridgee-ai/bridgee-ios-sdk) e [Android](https://github.com/bridgee-ai/bridgee-android-sdk), garantindo paridade de comportamento com apps nativos.

### 🎯 Principais Funcionalidades

- **Atribuição Precisa**: Conecta cliques em campanhas com instalações reais
- **Cross-Platform**: Uma única API JavaScript funcionando em iOS e Android
- **Compatível com Expo**: Config plugin incluído para projetos Expo (prebuild)
- **Integração Flexível**: Funciona com qualquer provedor de analytics
- **Helper Firebase Pronto**: `FirebaseAnalyticsProvider` plug-and-play para `@react-native-firebase/analytics`
- **API Promise-Based**: `async/await` idiomático em TypeScript
- **Eventos Automáticos**: Dispara eventos padronizados automaticamente
- **User Properties**: Define propriedades de usuário com dados de atribuição
- **Nova Arquitetura**: Suporte a TurboModules e ao bridge legado

---

## 🚀 Instalação

### Com npm

```sh
npm install @bridgee-ai/react-native-sdk
```

### Com Yarn

```sh
yarn add @bridgee-ai/react-native-sdk
```

### Dependências opcionais (Firebase)

Se você for usar o `FirebaseAnalyticsProvider` (recomendado), instale também:

```sh
npm install @react-native-firebase/app @react-native-firebase/analytics
```

### Passos adicionais por plataforma

#### React Native CLI

```sh
cd ios && pod install && cd ..
```

Depois, rebuild o app (`npx react-native run-ios` / `npx react-native run-android`).

#### Expo

Adicione o config plugin ao seu `app.json`:

```json
{
  "expo": {
    "plugins": ["@bridgee-ai/react-native-sdk"]
  }
}
```

Depois execute:

```sh
npx expo prebuild
npx expo run:ios   # ou run:android
```

> ⚠️ **Expo Go não é suportado** — o SDK inclui código nativo. Use um [development build](https://docs.expo.dev/develop/development-builds/introduction/).

---

## 📱 Projeto de Exemplo

> 🚧 **Em breve**: o projeto de exemplo React Native estará disponível em `bridgee-react-native-example`.
>
> 🔗 **[bridgee-react-native-example](https://github.com/bridgee-ai/bridgee-react-native-example)** *(placeholder)*

O projeto de exemplo incluirá:
- Configuração completa do SDK com Firebase Analytics
- Interface de usuário para testar diferentes cenários
- Suporte a Expo (prebuild) e React Native CLI
- Casos de uso reais de atribuição

Enquanto isso, consulte os exemplos nativos:
- 📱 [bridgee-ios-example](https://github.com/bridgee-ai/bridgee-ios-example)
- 🤖 [bridgee-android-example](https://github.com/bridgee-ai/bridgee-android-example)

---

## 🔧 Configuração Rápida

### 1. Implementar AnalyticsProvider (ou usar o helper Firebase)

A forma mais simples é usar o helper pronto, que integra com `@react-native-firebase/analytics`:

```ts
import { FirebaseAnalyticsProvider } from '@bridgee-ai/react-native-sdk';
```

Prefere outro provedor de analytics (Amplitude, Mixpanel, etc.)? Implemente a interface:

```ts
import type { AnalyticsProvider } from '@bridgee-ai/react-native-sdk';

const myAnalyticsProvider: AnalyticsProvider = {
  logEvent: (name, params) => {
    // Ex.: Amplitude.logEvent(name, params)
  },
  setUserProperty: (name, value) => {
    // Ex.: Amplitude.setUserProperties({ [name]: value })
  },
};
```

### 2. Inicializar o SDK

Chame `configure` cedo no ciclo de vida do app (no componente raiz, em um `useEffect`, ou em um inicializador):

```tsx
import React, { useEffect } from 'react';
import {
  BridgeeSDK,
  FirebaseAnalyticsProvider,
} from '@bridgee-ai/react-native-sdk';

export default function App() {
  useEffect(() => {
    BridgeeSDK.configure({
      provider: FirebaseAnalyticsProvider,
      tenantId: 'seu_tenant_id',      // Tenant ID fornecido pela Bridgee
      tenantKey: 'sua_tenant_key',     // Tenant Key fornecida pela Bridgee
      dryRun: false,                   // false para produção
    }).catch((err) => {
      console.warn('[Bridgee] falha ao configurar:', err);
    });
  }, []);

  return <YourRootComponent />;
}
```

### 3. Registrar Primeira Abertura

No evento de primeira abertura do app:

```ts
import { BridgeeSDK, MatchBundle } from '@bridgee-ai/react-native-sdk';

async function trackFirstOpen() {
  const bundle = new MatchBundle();

  try {
    const utm = await BridgeeSDK.firstOpen(bundle);
    console.log('✅ Atribuição resolvida:');
    console.log('📊 Source:', utm.utm_source);
    console.log('📱 Medium:', utm.utm_medium);
    console.log('🎯 Campaign:', utm.utm_campaign);
  } catch (e) {
    console.error('❌ Erro na atribuição:', e);
  }
}
```

> 💡 **Projeto de Exemplo Completo**: Confira o [bridgee-react-native-example](https://github.com/bridgee-ai/bridgee-react-native-example) *(em breve)* para ver uma implementação completa com interface de usuário e tratamento de callbacks.

---

## 📚 Guia Detalhado

### MatchBundle - Melhorando a Precisão

O `MatchBundle` permite enviar dados adicionais para melhorar a precisão do match:

```ts
import { MatchBundle } from '@bridgee-ai/react-native-sdk';

const bundle = new MatchBundle()
  .withEmail('usuario@email.com')       // Email do usuário
  .withPhone('+5511999999999')          // Telefone do usuário
  .withName('João Silva')               // Nome do usuário
  .withGclid('gclid_value')             // Google Click ID
  .withCustomParam('user_id', '123');   // Parâmetros customizados

const utm = await BridgeeSDK.firstOpen(bundle);
```

### Eventos e Propriedades de Usuário

Quando a atribuição é resolvida, o SDK dispara automaticamente eventos padronizados de atribuição e define propriedades de usuário através do seu `AnalyticsProvider`. Isso garante que os dados de UTM fiquem associados a toda a sessão do usuário na sua ferramenta de analytics (Firebase, Amplitude, etc.), sem que você precise tratar isso manualmente.

### Fire-and-forget

Se não quiser esperar o resultado da atribuição, basta ignorar a Promise:

```ts
BridgeeSDK.firstOpen(new MatchBundle().withEmail(email)).catch(() => {});
```

---

## 🔍 Exemplo Completo

```tsx
import React, { useEffect } from 'react';
import { View, Button } from 'react-native';
import {
  BridgeeSDK,
  MatchBundle,
  FirebaseAnalyticsProvider,
  type UTMData,
} from '@bridgee-ai/react-native-sdk';

class BridgeeManager {
  private static initialized = false;

  static async initialize() {
    if (BridgeeManager.initialized) return;

    await BridgeeSDK.configure({
      provider: FirebaseAnalyticsProvider,
      tenantId: 'seu_tenant_id',
      tenantKey: 'sua_tenant_key',
      dryRun: false,
    });

    BridgeeManager.initialized = true;
  }

  static async trackFirstOpen(opts: {
    name?: string;
    email?: string;
    phone?: string;
  }): Promise<UTMData | null> {
    const bundle = new MatchBundle();
    if (opts.name)  bundle.withName(opts.name);
    if (opts.email) bundle.withEmail(opts.email);
    if (opts.phone) bundle.withPhone(opts.phone);

    // Versão do app como parâmetro customizado
    bundle.withCustomParam('app_version', '1.0.0');

    try {
      const utm = await BridgeeSDK.firstOpen(bundle);
      console.log('✅ Atribuição bem-sucedida!', utm);
      BridgeeManager.handleAttributionSuccess(utm);
      return utm;
    } catch (e) {
      console.error('❌ Erro na atribuição:', e);
      BridgeeManager.handleAttributionError(e);
      return null;
    }
  }

  private static handleAttributionSuccess(_utm: UTMData) {
    // Implementar lógica específica do app
  }

  private static handleAttributionError(_err: unknown) {
    // Implementar tratamento de erro
  }
}

export default function App() {
  useEffect(() => {
    BridgeeManager.initialize().catch(console.warn);
  }, []);

  return (
    <View>
      <Button
        title="Simular First Open"
        onPress={() =>
          BridgeeManager.trackFirstOpen({
            name: 'João',
            email: 'joao@email.com',
          })
        }
      />
    </View>
  );
}
```

---

## ⚙️ Configuração Avançada

### Modo Dry Run

Para testes, você pode habilitar o modo dry run:

```ts
await BridgeeSDK.configure({
  provider: FirebaseAnalyticsProvider,
  tenantId: 'test_tenant',
  tenantKey: 'test_key',
  dryRun: true,
});
```

No modo dry run, o SDK:
- ✅ Executa toda a lógica de atribuição
- ✅ Gera logs detalhados
- ✅ Faz chamadas à API
- ❌ **NÃO** envia eventos para o analytics provider

### Configuração via variáveis de ambiente

Usando [`react-native-config`](https://github.com/luggit/react-native-config) ou [`expo-constants`](https://docs.expo.dev/versions/latest/sdk/constants/):

```ts
// Com react-native-config
import Config from 'react-native-config';

await BridgeeSDK.configure({
  provider: FirebaseAnalyticsProvider,
  tenantId: Config.BRIDGEE_TENANT_ID!,
  tenantKey: Config.BRIDGEE_TENANT_KEY!,
  dryRun: Config.BRIDGEE_DRY_RUN === 'true',
});
```

```ts
// Com Expo
import Constants from 'expo-constants';

const { bridgeeTenantId, bridgeeTenantKey, bridgeeDryRun } =
  Constants.expoConfig?.extra ?? {};

await BridgeeSDK.configure({
  provider: FirebaseAnalyticsProvider,
  tenantId: bridgeeTenantId,
  tenantKey: bridgeeTenantKey,
  dryRun: !!bridgeeDryRun,
});
```

---

## 📋 Requisitos

- **React Native**: 0.70+
- **Node**: 18+
- **iOS**: 14.0+
- **Android API Level**: 21+ (Android 5.0)
- **Android Target SDK**: 34
- **Dependências nativas (automáticas)**:
  - iOS: [`BridgeeAiSDK`](https://cocoapods.org/pods/BridgeeAiSDK) (CocoaPods)
  - Android: [`ai.bridgee:bridgee-android-sdk:2.3.0`](https://central.sonatype.com/artifact/ai.bridgee/bridgee-android-sdk) (Maven Central)
- **Peer dependency opcional**: `@react-native-firebase/analytics` (apenas se usar `FirebaseAnalyticsProvider`)

---

## 🐛 Troubleshooting

### Problemas Comuns

**1. `BridgeeSDK.firstOpen called before configure()`**
```
Solução: Garanta que configure() foi chamado (e sua Promise resolvida) antes de firstOpen().
```

**2. `The package '@bridgee-ai/react-native-sdk' doesn't seem to be linked`**
```
Solução:
- React Native CLI: rode `cd ios && pod install` e rebuild.
- Expo: rode `npx expo prebuild` e use um development build (Expo Go não suporta).
```

**3. `FirebaseAnalyticsProvider requires '@react-native-firebase/analytics'`**
```
Solução: instale o peer dep opcional:
npm install @react-native-firebase/app @react-native-firebase/analytics
```

**4. Eventos não aparecem no Firebase**
```
Solução: Verifique se o modo dry run está desabilitado em produção.
```

**5. Callback não é executado / Promise não resolve**
```
Solução: Verifique a conectividade de rede e as credenciais do tenant.
```

### Logs de Debug

Use os mesmos filtros dos SDKs nativos:

```bash
# Android
adb logcat -s BRIDGEE-SDK

# iOS (Console.app ou Xcode console)
# Filtrar por: [BridgeeSDK]
```

---

## 🔗 Links Úteis

- 📱 [Projeto de Exemplo (em breve)](https://github.com/bridgee-ai/bridgee-react-native-example) — implementação completa com UI *(placeholder)*
- 📦 [npm Package](https://www.npmjs.com/package/@bridgee-ai/react-native-sdk)
- 🤖 [Bridgee Android SDK](https://github.com/bridgee-ai/bridgee-android-sdk)
- 🍎 [Bridgee iOS SDK](https://github.com/bridgee-ai/bridgee-ios-sdk)
- 🐛 [Reportar Issues](https://github.com/bridgee-ai/bridgee-react-native-sdk/issues)
- 💬 [Suporte Técnico](mailto:support@bridgee.ai)

---

**Desenvolvido com ❤️ pela equipe Bridgee.ai**
