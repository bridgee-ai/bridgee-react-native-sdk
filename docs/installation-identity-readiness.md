# Identidade de instalação: revisão técnica de 29/10/2026

Estado: especificação pendente de decisões; nenhuma migração ou API de install
foi implantada por esta revisão. Não comprova unicidade de instalação.

Premissa operacional informada pelo usuário: install faturável é o match na
plataforma enviado ao GA4 do cliente. A ligação funcional match → GA4 é uma
premissa desta revisão e não foi reaberta ou reauditada. As decisões abaixo
tratam identidade, unicidade, reinstalação, reatribuição e reconciliação; não
alteram esse critério comercial nem comprovam homologação física dos SDKs.

## O que o código implementa

- Android: `BridgeeSDK.firstOpen` resolve Install Referrer e match. Não persiste
  uma identidade de instalação nem um recibo de entrega entre reinícios.
- iOS: `BridgeeSDK.firstOpen(with:completion:)` resolve match por URLSession.
  Não possui ledger persistente de instalação/entrega. O wrapper RN encaminha
  essas chamadas e não acrescenta esse ledger.
- API: `MatchQueryDTO` recebe metadata/política; `MatchService.match` publica
  resultados de consultas. A migration `v1.0.3--matches.sql` tem chave primária
  UUID para cada registro, sem unicidade tenant/app/install. Repetir uma consulta
  não comprova reenvio da mesma instalação.
- O UUID de visita usado em `DashboardRoutingService` e o recibo de clique do
  Dashboard deduplicam a retentativa de resolução daquela visita. Não são uma
  identidade persistente de instalação. `bfpid` também não deve ser promovido
  automaticamente de fingerprint de clique a identidade de instalação.

## Regras já verificáveis

Consentimento negado não inicia match pela entrada com política explícita;
atribuição Google nativa pode ser preservada sem resolução Bridgee; Firebase
continua responsável por `first_open`. Os testes de entrega dos três SDKs cobrem
essas regras. As entradas legadas continuam disponíveis e exigem que o app
controle quando pode chamá-las. Esses testes não testam um ledger inexistente.

## Matriz necessária antes da implementação

| Caso | Contrato a aprovar e evidência futura |
| --- | --- |
| Primeira execução autorizada | Definir geração, persistência e escopo do identificador. Provar sobrevivência a reinício normal sem usar identificadores pessoais como chave. |
| Mesmo ID em tenants ou apps distintos | Isolar por tenant/app autorizado no servidor. Definir como o app é autenticado e associado às credenciais; um app ID arbitrário no corpo não basta. |
| Resposta perdida / chamadas simultâneas | Persistir a mesma operação antes de enviar. Definir identidade da operação e resultado imutável; testar disputa transacional e reenvio após reinício. |
| Mesmo ID com conteúdo divergente | Definir campos imutáveis, equivalência canônica e resposta ao conflito. Não reutilizar silenciosamente um ID para outra operação. |
| Reinstalação / restauração de backup | Decidir se inicia nova instalação e como tratar dados restaurados, Android Auto Backup e Keychain. UUID local isolado não resolve essa decisão. |
| Reatribuição / campanha nova | Definir janela, prioridade e se altera instalação ou cria um evento de reatribuição. Não tratar um novo match como instalação faturável. |
| Offline / falha de entrega | Definir fila persistente, TTL, backoff, limites e estados recebido/atribuído/entregue. Testar crash entre persistência e envio sem duplicar efeito. |
| Consentimento revogado | Definir cancelamento de fila, retenção e eventual exclusão. Testar que não há nova transmissão depois da revogação. |
| Orgânico / match ausente | Definir registro e possibilidade de atualização posterior. Resposta vazia/404 atual não significa ledger de install concluído. |
| Cobrança | Preservar o critério informado: match na plataforma enviado ao GA4 do cliente. Definir unicidade, contestação e reconciliação diante de reenvio, reinstalação e reatribuição. Nenhuma regra comercial foi alterada nesta revisão. |

Não fixar retenção, janela ou RPO por analogia com os recibos de clique de 48h.
Também não guardar IDs no Keychain ou alterar backup do app antes de decidir a
semântica de reinstalação e privacidade.

## Próxima entrega verificável

Depois das decisões, implementar contrato versionado, autenticação tenant/app,
restrição única transacional e fila persistente nos SDKs. Executar testes reais
de concorrência/rollback no banco e crash/restart nos clientes, além da matriz
em aparelho. Publicar o resultado por etapa: fonte, build, pacote, dispositivo,
integração e aceite são evidências diferentes. Não modificar `/match` ou migrar
produção apenas para preencher esta matriz.
