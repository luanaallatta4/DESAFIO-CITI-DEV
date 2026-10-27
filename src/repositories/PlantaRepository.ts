import { Luminosidade, Prisma } from "@prisma/client";
import prisma from "@database";
 
// O repository é a única parte do código que conversa com o banco.
// Cada função faz uma única coisa no banco e devolve o resultado.
 
export const createPlanta = async (data: Prisma.PlantaCreateInput) => {
  return await prisma.planta.create({
    data: data,
  });
};
 
export const findAllPlantas = async (
  luminosidade?: Luminosidade,
  petFriendly?: boolean,
  nome?: string,
  ordem?: string
) => {
  // Filtros que vierem como undefined são ignorados pelo Prisma.
  // Assim, uma única busca funciona com nenhum, um ou vários filtros.
  const filtros: Prisma.PlantaWhereInput = {
    luminosidade: luminosidade,
    petFriendly: petFriendly,
  };
 
  // Busca pelo nome sem diferenciar maiúsculas de minúsculas
  if (nome) {
    filtros.nome = { contains: nome, mode: "insensitive" };
  }
 
  // Ordem padrão: pelo id (ordem de cadastro)
  let ordenacao: Prisma.PlantaOrderByWithRelationInput = { id: "asc" };
 
  if (ordem === "preco") {
    ordenacao = { preco: "asc" };
  }
 
  if (ordem === "nome") {
    ordenacao = { nome: "asc" };
  }
 
  return await prisma.planta.findMany({
    where: filtros,
    orderBy: ordenacao,
  });
};
 
export const findPlantaById = async (id: number) => {
  return await prisma.planta.findUnique({
    where: { id: id },
  });
};
 
export const findPlantasEsgotadas = async () => {
  return await prisma.planta.findMany({
    where: { estoque: 0 },
  });
};
 
export const updatePlanta = async (id: number, data: Prisma.PlantaUpdateInput) => {
  return await prisma.planta.update({
    where: { id: id },
    data: data,
  });
};
 
export const deletePlanta = async (id: number) => {
  return await prisma.planta.delete({
    where: { id: id },
  });
};
 
export const venderPlanta = async (id: number, quantidade: number) => {
  // Só diminui o estoque se ainda tiver vasos suficientes.
  // A conferência e a subtração acontecem juntas, no banco, de uma vez só.
  // Assim, duas pessoas comprando o último vaso ao mesmo tempo não deixam o estoque negativo.
  const resultado = await prisma.planta.updateMany({
    where: {
      id: id,
      estoque: { gte: quantidade },
    },
    data: {
      estoque: { decrement: quantidade },
    },
  });
 
  // count diz quantas plantas foram alteradas: 1 se vendeu, 0 se não tinha estoque
  return resultado.count > 0;
};
 
export const findPrecoEEstoque = async () => {
  // Busca só os dois campos que a conta do valor total precisa
  return await prisma.planta.findMany({
    select: {
      preco: true,
      estoque: true,
    },
  });
};
 