# API Folhagem & Cia

## Sobre o projeto

A Folhagem & Cia é uma loja de plantas que fazia todo o controle numa planilha, e isso deu problema: a loja acabou vendendo uma samambaia que nem tinha mais no estoque. Essa API veio para substituir a planilha.

Com ela dá para cadastrar as plantas, ver, editar e apagar, registrar as vendas sem o estoque ficar negativo e saber quanto vale tudo o que tem na loja.

O projeto usa Node.js, Express, TypeScript, Prisma, PostgreSQL e Docker, que já vieram no repositório base.

## Como o código está organizado

Segui o mesmo jeito do CRUD de usuários que já vinha no projeto. Quando chega um pedido, o `routes.ts` vê qual é o endereço e manda para a função certa do `PlantaController`. O controller confere se os dados estão certos e decide o que responder. Quando precisa mexer no banco, ele chama o `PlantaRepository`, que é o único arquivo que fala com o banco de dados.

## Como rodar

Você vai precisar do Docker Desktop aberto, do Node.js (versão 20 ou mais nova) e do Yarn. Aí é só entrar na pasta do projeto e rodar:

```bash
cp .env.example .env        # no PowerShell do Windows: copy .env.example .env
yarn
docker compose up -d --build
yarn migration
```

Pronto, a API já fica funcionando em `http://localhost:3001`.

Uma coisa que aconteceu comigo: depois da migration da planta, as rotas de planta começaram dando erro 500, porque a API que estava rodando no Docker ainda não sabia que a tabela nova existia. Se acontecer com você, é só rodar `docker compose restart server` que resolve.

## Como é uma planta

| Campo | O que é | Regra | Exemplo |
|---|---|---|---|
| `id` | o número da planta | o banco cria sozinho | `1` |
| `nome` | nome popular | texto, não pode ser vazio | `"Costela-de-adão"` |
| `especie` | nome científico | texto, não pode ser vazio | `"Monstera deliciosa"` |
| `preco` | preço em centavos | inteiro maior que zero | `8990` (R$ 89,90) |
| `estoque` | quantos vasos tem | inteiro, pode ser zero mas não negativo | `12` |
| `luminosidade` | quanta luz a planta precisa | `SOMBRA`, `MEIA_SOMBRA` ou `SOL_PLENO` | `"MEIA_SOMBRA"` |
| `petFriendly` | se pode ficar perto de cachorro e gato | `true` ou `false` | `false` |
| `regaACadaDias` | de quantos em quantos dias regar | inteiro, no mínimo 1 | `7` |
| `createdAt` | quando foi cadastrada | preenchido sozinho | |
| `updatedAt` | quando foi editada pela última vez | preenchido sozinho | |

O preço fica em centavos porque o computador às vezes erra conta com número quebrado. Guardando como número inteiro, a conta com dinheiro sempre fecha certinho.

## As rotas

### Cadastrar uma planta

`POST /plantas`

Para cadastrar, tem que mandar todos os campos. Por exemplo:

```json
{
  "nome": "Costela-de-adão",
  "especie": "Monstera deliciosa",
  "preco": 8990,
  "estoque": 12,
  "luminosidade": "MEIA_SOMBRA",
  "petFriendly": false,
  "regaACadaDias": 7
}
```

Se deu tudo certo, a API devolve 201 e mostra a planta que foi cadastrada:

```json
{
  "id": 1,
  "nome": "Costela-de-adão",
  "especie": "Monstera deliciosa",
  "preco": 8990,
  "estoque": 12,
  "luminosidade": "MEIA_SOMBRA",
  "petFriendly": false,
  "regaACadaDias": 7,
  "createdAt": "2026-10-27T21:28:26.769Z",
  "updatedAt": "2026-10-27T21:28:26.769Z"
}
```

Se esquecer algum campo ou mandar algum valor errado, volta 400 com uma mensagem dizendo o que precisa arrumar.

### Ver as plantas

`GET /plantas`

Mostra todas as plantas, com status 200. Se quiser, dá para filtrar colocando umas informações no final do endereço:

| Para filtrar por | Exemplo |
|---|---|
| luminosidade | `/plantas?luminosidade=SOMBRA` |
| se é pet-friendly | `/plantas?petFriendly=true` |
| nome, tanto faz maiúscula ou minúscula (bônus) | `/plantas?nome=costela` |
| ordem de preço ou de nome (bônus) | `/plantas?ordem=preco` |

Dá para juntar os filtros também, tipo `/plantas?luminosidade=MEIA_SOMBRA&petFriendly=false`. Se nenhuma planta combinar com o filtro, não é erro: volta 200 com a lista vazia (`[]`). Agora, se o filtro tiver um valor que não existe, como `?luminosidade=LUA`, aí volta 400.

### Ver uma planta só

`GET /plantas/:id`, trocando o `:id` pelo número, tipo `/plantas/1`.

Volta 200 com a planta. Se o id não for um número, como em `/plantas/abc`, volta 400. E se não tiver nenhuma planta com aquele número, volta 404.

### Editar uma planta

`PATCH /plantas/:id`

Aqui é só mandar o que você quer mudar, o resto fica do jeito que estava:

```json
{
  "preco": 9990
}
```

Volta 200 com a planta já atualizada. Volta 400 se o id não for válido, se não mandar nenhum campo ou se algum valor estiver errado, e 404 se a planta não existir.

### Apagar uma planta

`DELETE /plantas/:id`

Se apagou, volta 204, que é uma resposta sem nenhum conteúdo. Se o id não for válido volta 400, e se a planta não existir volta 404 (o que também acontece se você tentar apagar a mesma planta duas vezes).

### Registrar uma venda

`POST /plantas/:id/venda`

```json
{
  "quantidade": 2
}
```

Volta 200 com a planta e o estoque já descontado. A quantidade precisa ser um número inteiro maior que zero, senão volta 400. Se não tiver vaso suficiente, também volta 400, e aí o estoque não muda nada:

```json
{
  "message": "Estoque insuficiente: temos só 10 vaso(s)."
}
```

Se a planta não existir, volta 404.

### Quanto vale o estoque

`GET /plantas/estoque/valor-total`

Essa rota multiplica o preço pelo estoque de cada planta, soma tudo e ainda conta quantos vasos a loja tem no total:

```json
{
  "valorTotalEmCentavos": 215760,
  "totalDeVasos": 24
}
```

Nesse exemplo tinha duas Costelas-de-adão de R$ 89,90 com 12 vasos cada e uma Samambaia sem estoque, então a conta foi 8990 × 12 × 2 = 215760. Se a loja estiver vazia, volta 200 com tudo zerado.

### Plantas esgotadas (bônus)

`GET /plantas/esgotadas`

Mostra as plantas que estão com o estoque zerado, com status 200.

## O que cada status quer dizer

| Status | Quando aparece |
|---|---|
| 200 | deu certo |
| 201 | a planta foi cadastrada |
| 204 | a planta foi apagada |
| 400 | tem algum dado errado no pedido |
| 404 | a planta não existe |
| 500 | deu um erro inesperado na API |

Quando dá erro, sempre vem uma mensagem explicando, tipo:

```json
{
  "message": "A luminosidade precisa ser SOMBRA, MEIA_SOMBRA ou SOL_PLENO."
}
```

## Decisões e bônus

Dos bônus, fiz a busca por nome, a ordenação e a rota das plantas esgotadas. O script de seed com plantas de exemplo ficou de fora.

Para validar os dados, usei a mesma função (`validarPlanta`) no cadastro e na edição. No cadastro ela pede todos os campos, e na edição ela só confere os que foram mandados, com as mesmas regras.

Para saber se um campo foi mandado, comparei com `undefined` em vez de usar `!campo`. É que o `!` acha que `0` e `false` são "vazios", e aí uma planta com estoque zero ou que não é pet-friendly ia ser recusada sem motivo.

Também decidi que, se o `PATCH` chegar sem nenhum campo, a API responde 400, porque não faz sentido dizer que a edição deu certo se nada mudou.

Sobre duas pessoas comprarem o último vaso ao mesmo tempo: na venda, o desconto do estoque é feito de uma vez só no banco, e ele só acontece se ainda tiver vaso suficiente naquele momento. Como a conferência e o desconto acontecem juntos, só uma das compras passa e a outra recebe 400.

E as rotas `/plantas/estoque/valor-total` e `/plantas/esgotadas` ficaram antes de `/plantas/:id` no arquivo de rotas. O Express pega a primeira rota que combina com o endereço, então se fosse ao contrário ele ia achar que "esgotadas" era o número de uma planta.
