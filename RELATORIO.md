Relatório do desafio Folhagem & Cia

O que foi feito
Fiz todas as rotas pedidas no enunciado: cadastrar, listar com os filtros de luminosidade e petFriendly, buscar pelo id, editar, apagar, registrar venda e calcular o valor total do estoque. As regras de negócio também estão no código, como o preço maior que zero, o estoque que pode ser zero mas não negativo, a luminosidade que só aceita os três valores do enum e a venda que nunca deixa o estoque negativo.

Dos bônus, fiz a busca pelo nome sem diferenciar maiúsculas, a ordenação por preço ou por nome e a rota de plantas esgotadas.

Como foi feito
Preparei o computador, pois não tinha quase nada instalado. Depois criei meu repositório pelo template, clonei, subi o projeto com o Docker e rodei a migration inicial.

Para o código fiz na ordem do enunciado, primeiro o model da Planta e a migration, depois o repository, o controller e por último as rotas, fazendo um commit no fim de cada passo. Mantive a mesma organização do CRUD de usuário que veio no projeto, com o controller cuidando das validações e do status da resposta e o repository sendo o único que fala com o banco.

Algumas decisões que tomei foram usar a mesma função de validação no cadastro e na edição, comparar os campos com undefined em vez de usar !campo para não recusar estoque zero e petFriendly false, responder 400 quando a edição chega sem nenhum campo e fazer a venda numa única operação no banco, que só desconta o estoque se ainda tiver vasos suficientes (para que duas pessoas comprando o último vaso ao mesmo tempo não deixem o estoque negativo)

Principais dificuldades
A maior dificuldade foi no começo, na instalação. O Node e o Git não estavam instalados.

Nos testes, o primeiro cadastro deu erro 500 porque a API que estava rodando no Docker ainda não reconhecia a tabela nova da planta, e resolvi reiniciando o container com docker compose restart server. Rodei o teste de apagar antes dos testes de venda, então a planta que eles usavam já não existia e eles deram 404. (o problema era a ordem dos testes e não o código)

Uso Ia
Usei o Claude como apoio no desafio, o que ajudou a organizar as ideias, a entender os raciocínios de cada parte e resolver os erros que apareciam

Para conferir, rodei o yarn typecheck e testei as rotas pelo REST Client, comparando o status de cada resposta com o que o enunciado pedia, e conferi a conta do valor total com as plantas que estavam cadastradas. 
