API Folhagem & Cia
Sobre o projeto

A Folhagem & Cia é uma loja de plantas que controlava o estoque numa planilha. Isso acabou dando problema, porque a loja chegou a vender uma samambaia que já não existia mais no estoque. A ideia desta API é substituir essa planilha.

Pela API dá para cadastrar, consultar, editar e apagar plantas, registrar vendas sem deixar o estoque ficar negativo e ver quanto vale o estoque inteiro da loja.

O projeto foi feito com Node.js, Express, TypeScript, Prisma, PostgreSQL e Docker, que já vieram no repositório base.

Organização do código

Usei a mesma organização do CRUD de usuários que já estava no projeto. O pedido chega pelo routes.ts, que manda para a função certa do PlantaController. O controller confere os dados e decide qual resposta dar, e quando precisa do banco ele chama o PlantaRepository, que é o único arquivo que acessa o banco de dados.

Como rodar

É preciso ter o Docker Desktop aberto, o Node.js (versão 20 ou mais nova) e o Yarn instalados. Na pasta do projeto, rode:

bash
cp .env.example .env        # no PowerShell do Windows: copy .env.example .env
yarn
docker compose up -d --build
yarn migration

Depois disso a API fica disponível em http://localhost:3001.

Quando rodei a migration da planta pela primeira vez, as rotas de planta começaram dando erro 500, porque a API que estava rodando no Docker ainda não reconhecia a tabela nova. Resolvi reiniciando o container com docker compose restart server.

Campos da planta
Campo	Descrição	Regra	Exemplo
id	número da planta	gerado pelo banco	1
nome	nome popular	texto, não pode ser vazio	"Costela-de-adão"
especie	nome científico	texto, não pode ser vazio	"Monstera deliciosa"
preco	preço em centavos	inteiro maior que zero	8990 (R$ 89,90)
estoque	quantidade de vasos	inteiro, pode ser zero, mas não negativo	12
luminosidade	luz que a planta precisa	SOMBRA, MEIA_SOMBRA ou SOL_PLENO	"MEIA_SOMBRA"
petFriendly	se é segura para cães e gatos	true ou false	false
regaACadaDias	intervalo entre as regas, em dias	inteiro, no mínimo 1	7
createdAt	data do cadastro	preenchida automaticamente	
updatedAt	data da última edição	preenchida automaticamente	

O preço fica em centavos porque número com vírgula pode dar erro de arredondamento no computador. Guardando como inteiro, as contas com dinheiro ficam sempre exatas.

Rotas
Cadastrar planta

POST /plantas

No cadastro todos os campos são obrigatórios. Exemplo do que mandar:

json
{
  "nome": "Costela-de-adão",
  "especie": "Monstera deliciosa",
  "preco": 8990,
  "estoque": 12,
  "luminosidade": "MEIA_SOMBRA",
  "petFriendly": false,
  "regaACadaDias": 7
}

Quando dá certo, a API responde 201 e devolve a planta cadastrada:

json
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

Se faltar algum campo ou algum valor não seguir as regras, a resposta é 400, com uma mensagem dizendo o que está errado.

Listar plantas

GET /plantas

Devolve todas as plantas com status 200. Também dá para filtrar a lista pelo endereço:

Filtro	Exemplo
luminosidade	/plantas?luminosidade=SOMBRA
pet-friendly	/plantas?petFriendly=true
nome, sem diferenciar maiúscula e minúscula (bônus)	/plantas?nome=costela
ordenação por preço ou por nome (bônus)	/plantas?ordem=preco

Os filtros podem ser combinados, como em /plantas?luminosidade=MEIA_SOMBRA&petFriendly=false. Se nenhuma planta se encaixar no filtro, a resposta continua sendo 200, só que com a lista vazia ([]). Já um filtro com valor que não existe, como ?luminosidade=LUA, responde 400.

Buscar uma planta

GET /plantas/:id, por exemplo /plantas/1.

Responde 200 com a planta. Se o id não for um número válido (como /plantas/abc), responde 400. Se não existir planta com aquele id, responde 404.

Editar uma planta

PATCH /plantas/:id

Na edição só é preciso mandar o que vai mudar, e os outros campos ficam como estavam:

json
{
  "preco": 9990
}

Responde 200 com a planta já atualizada. Responde 400 se o id for inválido, se nenhum campo for enviado ou se algum valor estiver fora das regras, e 404 se a planta não existir.

Apagar uma planta

DELETE /plantas/:id

Responde 204, sem nenhum conteúdo, quando a planta é apagada. Responde 400 se o id for inválido e 404 se a planta não existir, o que também acontece se a mesma planta for apagada duas vezes.

Registrar uma venda

POST /plantas/:id/venda

json
{
  "quantidade": 2
}

Responde 200 com a planta e o estoque já descontado. A quantidade tem que ser um número inteiro maior que zero, senão a resposta é 400. Se a loja não tiver vasos suficientes, a resposta também é 400 e o estoque não muda:

json
{
  "message": "Estoque insuficiente: temos só 10 vaso(s)."
}

Se a planta não existir, a resposta é 404.

Valor total do estoque

GET /plantas/estoque/valor-total

Multiplica o preço pelo estoque de cada planta, soma tudo e conta também o total de vasos:

json
{
  "valorTotalEmCentavos": 215760,
  "totalDeVasos": 24
}

Nesse exemplo havia duas Costelas-de-adão de R$ 89,90 com 12 vasos cada e uma Samambaia sem estoque, então 8990 × 12 × 2 = 215760. Com a loja vazia, a resposta é 200 com os dois valores zerados.

Plantas esgotadas (bônus)

GET /plantas/esgotadas

Responde 200 com as plantas que estão com estoque zero.

Status de resposta
Status	Quando acontece
200	consulta, edição, venda ou valor total deram certo
201	planta cadastrada
204	planta apagada
400	algum dado enviado está errado
404	a planta não existe
500	erro inesperado na API

Os erros sempre vêm com uma mensagem, por exemplo:

json
{
  "message": "A luminosidade precisa ser SOMBRA, MEIA_SOMBRA ou SOL_PLENO."
}
Decisões e bônus

Dos bônus, fiz a busca por nome, a ordenação e a rota de plantas esgotadas. O script de seed com plantas de exemplo eu não fiz.

Para validar os dados, usei a mesma função (validarPlanta) no cadastro e na edição. No cadastro ela exige todos os campos, e na edição confere só os que foram enviados, aplicando as mesmas regras.

Para saber se um campo foi enviado, comparei com undefined em vez de usar !campo. Fiz isso porque o ! trata o 0 e o false como se fossem vazios, e aí uma planta com estoque zero ou que não é pet-friendly seria recusada, mesmo sendo válida.

Decidi responder 400 quando o PATCH chega sem nenhum campo, porque não faz sentido responder que a edição deu certo se nada foi alterado.

Sobre duas pessoas comprarem o último vaso ao mesmo tempo: na venda, o desconto do estoque é feito numa única operação no banco, que só acontece se ainda houver vasos suficientes naquele momento. Como a conferência e o desconto acontecem juntos, só uma das compras passa, e a outra recebe 400.

Por último, deixei as rotas /plantas/estoque/valor-total e /plantas/esgotadas antes de /plantas/:id no arquivo de rotas. O Express usa a primeira rota que combinar com o endereço, então, se a ordem fosse outra, ele entenderia "esgotadas" como se fosse o id de uma planta.