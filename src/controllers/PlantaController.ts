import { Request, Response } from "express";
import { Luminosidade } from "@prisma/client";
import * as PlantaRepository from "@repositories/PlantaRepository";
 
// O controller recebe a requisição, valida os dados, chama o repository
// e decide qual status HTTP e qual corpo devolver.
 
// Confere os campos de uma planta.
// No cadastro (ehCadastro = true), todos os campos são obrigatórios.
// Na edição (ehCadastro = false), só os campos enviados são conferidos.
// Devolve a mensagem de erro, ou null se estiver tudo certo.
const validarPlanta = (dados: any, ehCadastro: boolean) => {
  if (ehCadastro) {
    if (
      dados.nome === undefined ||
      dados.especie === undefined ||
      dados.preco === undefined ||
      dados.estoque === undefined ||
      dados.luminosidade === undefined ||
      dados.petFriendly === undefined ||
      dados.regaACadaDias === undefined
    ) {
      return "Preencha nome, especie, preco, estoque, luminosidade, petFriendly e regaACadaDias.";
    }
  }
 
  // Usamos "=== undefined" para saber se o campo foi enviado.
  // Não usamos "!campo", porque 0 e false são valores válidos.
 
  if (dados.nome !== undefined) {
    if (typeof dados.nome !== "string" || dados.nome.trim() === "") {
      return "O nome precisa ser um texto e não pode ficar vazio.";
    }
  }
 
  if (dados.especie !== undefined) {
    if (typeof dados.especie !== "string" || dados.especie.trim() === "") {
      return "A espécie precisa ser um texto e não pode ficar vazia.";
    }
  }
 
  if (dados.preco !== undefined) {
    if (!Number.isInteger(dados.preco) || dados.preco <= 0) {
      return "O preço precisa ser um número inteiro maior que zero, em centavos (ex.: 8990).";
    }
  }
 
  if (dados.estoque !== undefined) {
    if (!Number.isInteger(dados.estoque) || dados.estoque < 0) {
      return "O estoque precisa ser um número inteiro e não pode ser negativo.";
    }
  }
 
  if (dados.luminosidade !== undefined) {
    if (!Object.values(Luminosidade).includes(dados.luminosidade)) {
      return "A luminosidade precisa ser SOMBRA, MEIA_SOMBRA ou SOL_PLENO.";
    }
  }
 
  if (dados.petFriendly !== undefined) {
    if (typeof dados.petFriendly !== "boolean") {
      return "O petFriendly precisa ser true ou false.";
    }
  }
 
  if (dados.regaACadaDias !== undefined) {
    if (!Number.isInteger(dados.regaACadaDias) || dados.regaACadaDias < 1) {
      return "O regaACadaDias precisa ser um número inteiro de pelo menos 1.";
    }
  }
 
  return null;
};
 
export const createPlanta = async (req: Request, res: Response) => {
  try {
    const { nome, especie, preco, estoque, luminosidade, petFriendly, regaACadaDias } = req.body;
 
    // Juntamos só os campos da planta (nunca mandamos o req.body inteiro para o banco)
    const dados = { nome, especie, preco, estoque, luminosidade, petFriendly, regaACadaDias };
 
    const erro = validarPlanta(dados, true);
 
    // 400 Bad Request: o cliente mandou dados inválidos
    if (erro) {
      return res.status(400).json({ message: erro });
    }
 
    const planta = await PlantaRepository.createPlanta(dados);
 
    // 201 Created: uma planta nova foi criada
    return res.status(201).json(planta);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao cadastrar planta." });
  }
};
 
export const readAllPlantas = async (req: Request, res: Response) => {
  try {
    // Os filtros chegam pela URL (ex.: /plantas?petFriendly=true) e sempre como texto
    const { luminosidade, petFriendly, nome, ordem } = req.query;
 
    if (luminosidade !== undefined) {
      if (!Object.values(Luminosidade).includes(luminosidade as Luminosidade)) {
        return res.status(400).json({
          message: "Filtro de luminosidade inválido. Use SOMBRA, MEIA_SOMBRA ou SOL_PLENO.",
        });
      }
    }
 
    if (petFriendly !== undefined) {
      if (petFriendly !== "true" && petFriendly !== "false") {
        return res.status(400).json({ message: "Filtro petFriendly inválido. Use true ou false." });
      }
    }
 
    if (nome !== undefined) {
      if (typeof nome !== "string") {
        return res.status(400).json({ message: "Filtro de nome inválido." });
      }
    }
 
    if (ordem !== undefined) {
      if (ordem !== "preco" && ordem !== "nome") {
        return res.status(400).json({ message: "Ordem inválida. Use preco ou nome." });
      }
    }
 
    // Transforma o texto "true"/"false" em verdadeiro/falso.
    // Se o filtro não foi enviado, continua undefined (e o Prisma ignora).
    let petFriendlyBoolean: boolean | undefined = undefined;
 
    if (petFriendly === "true") {
      petFriendlyBoolean = true;
    }
 
    if (petFriendly === "false") {
      petFriendlyBoolean = false;
    }
 
    const plantas = await PlantaRepository.findAllPlantas(
      luminosidade as Luminosidade | undefined,
      petFriendlyBoolean,
      nome as string | undefined,
      ordem as string | undefined
    );
 
    // Mesmo sem nenhuma planta, a resposta é 200 com uma lista vazia []
    return res.status(200).json(plantas);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao buscar plantas." });
  }
};
 
export const readPlantasEsgotadas = async (req: Request, res: Response) => {
  try {
    const plantas = await PlantaRepository.findPlantasEsgotadas();
 
    return res.status(200).json(plantas);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao buscar plantas esgotadas." });
  }
};
 
export const readPlantaById = async (req: Request, res: Response) => {
  try {
    // O id chega da URL como texto, então convertemos para número
    const id = Number(req.params.id);
 
    // 400: o id precisa ser um número inteiro positivo (ex.: /plantas/abc não vale)
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "O id precisa ser um número inteiro positivo." });
    }
 
    const planta = await PlantaRepository.findPlantaById(id);
 
    // 404 Not Found: o id não existe
    if (!planta) {
      return res.status(404).json({ message: "Planta não encontrada." });
    }
 
    return res.status(200).json(planta);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao buscar planta." });
  }
};
 
export const updatePlanta = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
 
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "O id precisa ser um número inteiro positivo." });
    }
 
    const { nome, especie, preco, estoque, luminosidade, petFriendly, regaACadaDias } = req.body;
    const dados = { nome, especie, preco, estoque, luminosidade, petFriendly, regaACadaDias };
 
    // Na edição, pelo menos um campo precisa ser enviado
    if (
      nome === undefined &&
      especie === undefined &&
      preco === undefined &&
      estoque === undefined &&
      luminosidade === undefined &&
      petFriendly === undefined &&
      regaACadaDias === undefined
    ) {
      return res.status(400).json({ message: "Envie pelo menos um campo para editar." });
    }
 
    const erro = validarPlanta(dados, false);
 
    if (erro) {
      return res.status(400).json({ message: erro });
    }
 
    // Antes de editar, garantimos que a planta existe
    const planta = await PlantaRepository.findPlantaById(id);
 
    if (!planta) {
      return res.status(404).json({ message: "Planta não encontrada." });
    }
 
    // PATCH = edição parcial: campos não enviados (undefined) não são alterados
    const plantaAtualizada = await PlantaRepository.updatePlanta(id, dados);
 
    return res.status(200).json(plantaAtualizada);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao atualizar planta." });
  }
};
 
export const deletePlanta = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
 
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "O id precisa ser um número inteiro positivo." });
    }
 
    const planta = await PlantaRepository.findPlantaById(id);
 
    if (!planta) {
      return res.status(404).json({ message: "Planta não encontrada." });
    }
 
    await PlantaRepository.deletePlanta(id);
 
    // 204 No Content: deu certo e não há nada para devolver
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao deletar planta." });
  }
};
 
export const venderPlanta = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
 
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "O id precisa ser um número inteiro positivo." });
    }
 
    const { quantidade } = req.body;
 
    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      return res.status(400).json({ message: "A quantidade precisa ser um número inteiro maior que zero." });
    }
 
    const planta = await PlantaRepository.findPlantaById(id);
 
    if (!planta) {
      return res.status(404).json({ message: "Planta não encontrada." });
    }
 
    // Sem estoque suficiente: 400 e nada é alterado
    if (planta.estoque < quantidade) {
      return res.status(400).json({ message: `Estoque insuficiente: temos só ${planta.estoque} vaso(s).` });
    }
 
    const vendeu = await PlantaRepository.venderPlanta(id, quantidade);
 
    // Outra venda pode ter levado os últimos vasos entre a conferência e a venda
    if (!vendeu) {
      return res.status(400).json({ message: "Estoque insuficiente: outra venda aconteceu ao mesmo tempo." });
    }
 
    const plantaAtualizada = await PlantaRepository.findPlantaById(id);
 
    return res.status(200).json(plantaAtualizada);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao registrar venda." });
  }
};
 
export const readValorTotalEstoque = async (req: Request, res: Response) => {
  try {
    const plantas = await PlantaRepository.findPrecoEEstoque();
 
    // Começamos do zero e vamos somando planta por planta
    let valorTotalEmCentavos = 0;
    let totalDeVasos = 0;
 
    for (const planta of plantas) {
      valorTotalEmCentavos = valorTotalEmCentavos + planta.preco * planta.estoque;
      totalDeVasos = totalDeVasos + planta.estoque;
    }
 
    return res.status(200).json({ valorTotalEmCentavos, totalDeVasos });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao calcular o valor do estoque." });
  }
};
 