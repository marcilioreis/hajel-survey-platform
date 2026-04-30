// src/modules/geography/geography.controller.ts
import { Request, Response } from 'express';
import * as geographyService from './geography.service.js';
import axios from 'axios';

// Helper para extrair string segura do parâmetro
const getStringParam = (param: string | string[]): string =>
  Array.isArray(param) ? param[0] : param;

// GET /api/geography/states
export const getStates = async (req: Request, res: Response) => {
  try {
    const states = await geographyService.getStates();
    res.json(states);
  } catch (error) {
    console.error('Get states error:', error);
    res.status(500).json({ error: 'Falha ao buscar estados' });
  }
};

// GET /api/geography/municipalities/:uf
export const getMunicipalities = async (req: Request, res: Response) => {
  const uf = getStringParam(req.params.uf).toUpperCase();
  if (!uf || uf.length !== 2) {
    return res.status(400).json({ error: 'UF inválida' });
  }
  try {
    const cities = await geographyService.getMunicipalities(uf);
    res.json(cities);
  } catch (error) {
    console.error('Get municipalities error:', error);
    res.status(500).json({ error: 'Falha ao buscar municípios' });
  }
};

// GET /api/geography/neighborhoods/:city
export const getNeighborhoods = async (req: Request, res: Response) => {
  const city = getStringParam(req.params.city);
  const uf = (req.query.uf as string | undefined)?.toUpperCase();

  if (!city) {
    return res.status(400).json({ error: 'Cidade não informada' });
  }
  try {
    const neighborhoods = await geographyService.getNeighborhoods(city, uf);
    res.json(neighborhoods);
  } catch (error) {
    console.error('Get neighborhoods error:', error);
    res.status(500).json({ error: 'Falha ao buscar bairros' });
  }
};

// GET /api/geography/cep/:cep
export const getCepInfo = async (req: Request, res: Response) => {
  const cep = getStringParam(req.params.cep).replace(/\D/g, '');
  if (cep.length !== 8) {
    return res.status(400).json({ error: 'CEP inválido' });
  }
  try {
    const { data } = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
    if (data.erro) return res.status(404).json({ error: 'CEP não encontrado' });
    res.json({
      logradouro: data.logradouro,
      bairro: data.bairro,
      cidade: data.localidade,
      uf: data.uf,
      cep: data.cep,
    });
  } catch (error) {
    console.error('Get CEP error:', error);
    res.status(500).json({ error: 'Falha ao consultar CEP' });
  }
};
