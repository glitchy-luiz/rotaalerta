# RotaAlerta 🚦

> App de GPS que **avisa antes de você sair de casa** se há problemas na sua rota de rotina (acidente, obra, metrô parado…), mostrando o atraso, o novo horário de chegada e uma rota alternativa.

Projeto acadêmico da disciplina de Desenvolvimento Mobile, feito com **React Native + TypeScript + Expo + Expo Router**.

- **Autores:**
1. Bruno Otavio Silva De Oliveira RM556196
2. Guilherme Flores Pereira de Almeida RM554948
3. Leonardo Gonçalves Novaes RM554807
4. Luiz Fernando de Aragão Souza RM555561
5. Marcello de Freitas Moreira RM557531

- **Vídeo de demonstração:** _link_

---

## 1. Problema e proposta

Perder tempo no trânsito é um problema diário de estudantes e trabalhadores. Google Maps e Waze mostram o melhor trajeto, mas o usuário normalmente só descobre o problema **quando já está no meio dele**.

**Proposta:** o usuário cadastra suas rotas de rotina (ex.: casa → trabalho, saída às 06:00). O app verifica essas rotas e avisa **antes da saída**, por exemplo:

> *Acidente de carros (Av. dos Estados): atraso médio de 30 min (chegada às 08:30). Rota alternativa pela Av. Y: tempo total de 2 h 10 min (chegada às 08:10).*

**Público-alvo:** jovens adultos, estudantes e trabalhadores que fazem o mesmo trajeto de carro todos os dias.

## 2. Funcionalidades

| Tela | O que faz |
|---|---|
| **Login / Criar conta** | Autenticação por e-mail e senha (Firebase Authentication) |
| **Início** | Mapa de São Paulo com incidentes ativos e card da *próxima rotina* |
| **Minhas rotas** | Lista, exclusão e acesso à verificação de cada rotina |
| **Nova rota** | Nome, origem/destino (busca real de endereços), horário de saída e dias da semana |
| **Verificação da rota** | Detecta problemas, exibe o alerta completo, mapa com rota principal e alternativas e o **modo demonstração** (simular incidente) |
| **Rastreio** | Posição por GPS, tempo restante e chegada prevista. Inclui deslocamento simulado para demonstração |
| **Alertas** | Histórico de alertas salvo no banco de dados |
| **Ajustes** | Dados da conta, botão **Sair**, alto contraste, texto grande e explicação das fontes de dados |

## 3. Dados: o que é real e o que é simulado

| Item | Origem |
|---|---|
| Mapa e GPS | **Real** (`react-native-maps`, `expo-location`) |
| Busca de endereços | **Real** (OpenRouteService Geocoding) |
| Rota principal e alternativas | **Real** (OpenRouteService Directions) |
| Contas de usuário | **Real** (Firebase Authentication) |
| Rotas salvas, alertas e incidentes | **Real**, persistidos no Firebase Firestore, separados por usuário |
| Incidentes de trânsito e seu atraso | **Simulados** (botão "Simular incidente") |

**Por que simular os incidentes?** Não existe API gratuita e confiável de incidentes de trânsito em tempo real para o Brasil. Além disso, o OpenRouteService **não considera trânsito ao vivo**, então os tempos de rota são "sem trânsito". Os incidentes simulados alimentam a lógica própria do app. Em produção, a fonte seria substituída por uma API de tráfego (como TomTom ou HERE) sem alterar a lógica de detecção.

## 4. Como a detecção funciona

Implementada em `src/core/analysis.ts` (lógica pura, sem dependência de React):

1. Busca a rota principal e até 2 alternativas no OpenRouteService.
2. Lê os incidentes ativos do banco. Cada incidente tem posição, raio de influência e atraso em minutos.
3. Um incidente **afeta uma rota** se a menor distância entre ele e a polilinha da rota for menor ou igual ao seu raio (`distanceToPolylineM`, em `src/core/geo.ts`).
4. Atraso = soma dos atrasos dos incidentes sobre a rota principal. Nova chegada = saída + duração + atraso.
5. Para cada alternativa, recalcula tempo e chegada (considerando incidentes que também a afetem) e escolhe a que chega primeiro.
6. A alternativa só é sugerida se economizar pelo menos 1 minuto. Caso contrário, o app recomenda **sair mais cedo**.

No modo demonstração, o incidente simulado é posicionado **sobre a rota principal, no ponto mais distante das alternativas**, para que a alternativa realmente desvie do problema. A análise é recalculada localmente, sem novas chamadas à API.

## 5. Arquitetura

```
src/
├── app/                      # Telas (Expo Router, rotas por arquivo)
│   ├── _layout.tsx           # Stack de navegação, tema e proteção de rotas
│   ├── login.tsx             # Entrar
│   ├── register.tsx          # Criar conta
│   ├── (tabs)/               # Início, Minhas rotas, Alertas, Ajustes
│   ├── route/new.tsx         # Cadastro de rota
│   ├── route/[id].tsx        # Verificação, alerta e simulação
│   └── tracking/[id].tsx     # Rastreio
├── auth/                     # AuthContext: estado de login (useAuth)
├── core/                     # Lógica pura: analysis, geo, format
├── data/                     # Acesso a dados (padrão Repository)
│   ├── repository.ts         # Interface única
│   ├── firestoreRepository.ts
│   ├── localRepository.ts    # Fallback sem Firebase
│   ├── firebase.ts           # Inicialização do Firebase
│   ├── auth.ts               # Firebase Auth (login, cadastro, sair, erros em português)
│   └── identity.ts           # uid do usuário autenticado
├── services/                 # Chamadas HTTP (OpenRouteService) e cache
├── components/               # UI reutilizável e acessível
└── theme/                    # Alto contraste e texto grande
```

**Decisão de projeto:** as telas só conhecem a interface `Repository`. Trocar o armazenamento (Firestore ou local) ou a identidade do usuário não exige mexer nas telas.

### Modelo do Firestore

```
users/{uid}/routines/{id}   name, originLabel, destinationLabel, origin{latitude,longitude},
                            destination{latitude,longitude}, departureTime, days[], createdAt
users/{uid}/incidents/{id}  type, title, street, latitude, longitude, radiusM,
                            delayMinutes, active, createdAt
users/{uid}/alerts/{id}     routineId, routineName, message, delayMinutes, hadAlternative, createdAt
```

Os dados são separados por usuário: `{uid}` é o **uid do Firebase Authentication**. Cada usuário só enxerga e altera o que está sob o próprio `uid`, e isso é garantido pelas **regras de segurança** do Firestore

Não tem necessidade de incluir credênciais para o projeto, pois elas já estão no código PROPOSITALMENTE para evitar a necessidade de criar conta em sites externos para usar a API de gps

### Autenticação

- **Firebase Authentication** com e-mail e senha. A sessão é persistida com `AsyncStorage`, então o usuário continua logado ao reabrir o app.
- **Proteção de rotas** com `Stack.Protected` (Expo Router): quem não está logado só acessa *Login* e *Criar conta*. Ao entrar ou sair, a navegação muda automaticamente.
- `src/data/identity.ts` devolve o `uid` do usuário logado, e `getRepository()` mantém um repositório por usuário, então dados de contas diferentes nunca se misturam.
- **Modo local:** se o Firebase não estiver configurado, o login é desativado e o app usa armazenamento local (útil só para desenvolvimento).

## 6. Acessibilidade

- Rótulos (`accessibilityLabel`, `accessibilityRole`, `accessibilityState`) em botões, campos e alertas. O alerta principal usa `role="alert"`.
- O mapa tem descrição textual, e **todas as informações das rotas também aparecem em texto**.
- Áreas de toque de pelo menos 48 px.
- Não depende só de cor: o alerta usa ícone + texto.
- Modo **alto contraste** e **texto grande** em Ajustes, além de respeitar o tamanho de fonte do sistema.
- Linguagem simples e mensagens de erro claras.

## 7. Como rodar

**Pré-requisitos:** Node.js LTS e o app **Expo Go** no celular (celular e computador na mesma rede Wi-Fi, ou use `--tunnel`).

> O app foi feito para **Android/iOS via Expo Go**. A versão web não é suportada, pois o `react-native-maps` não funciona no navegador.

```bash
git clone <url-do-repositorio>
cd rotaalerta
npm install
npx expo start -c
```

## 8. Roteiro de uso (demonstração)

1. **Criar conta** (nome, e-mail, senha) e entrar.
2. **Minhas rotas → Nova rota:** nome "Trabalho", origem (minha localização), destino, 06:00, Seg–Sex → salvar.
3. Abrir a rota: aparece *Rota livre*, com mapa e alternativas.
4. **Simular incidente** → Acidente, 30 min → surge o alerta completo (problema, atraso, chegada, alternativa).
5. **Iniciar rastreio → Simular deslocamento:** o tempo restante diminui.
6. Conferir o histórico em **Alertas** e os dados no console do Firestore.
7. **Ajustes → Sair**, criar uma segunda conta e confirmar que ela **não vê** as rotas da primeira.

## 9. Mapeamento com os critérios de avaliação

| Critério | Onde |
|---|---|
| Telas e navegação | 4 abas + 3 telas em pilha (Expo Router) |
| Consumo de dados | OpenRouteService (geocodificação e rotas) |
| Banco de dados | Firestore (rotas, incidentes e alertas), isolado por usuário com regras de segurança |
| Autenticação | Firebase Authentication (e-mail e senha) + rotas protegidas |
| Acessibilidade | Seção 6 |
| Aderência ao problema | Detecção de problemas, alternativa e nova chegada antes da saída |
| Documentação | Este README |

## 10. Tecnologias

Expo (SDK 58), React Native, TypeScript, Expo Router, react-native-maps, expo-location, Firebase Authentication, Firebase Firestore, OpenRouteService e AsyncStorage.
