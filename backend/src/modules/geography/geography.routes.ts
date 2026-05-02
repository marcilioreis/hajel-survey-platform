import { Router } from 'express';
import { authenticate } from '../../shared/auth/middleware.js';
import * as controller from './geography.controller.js';

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /api/geography/states:
 *   get:
 *     summary: Listar todas as UFs
 *     tags: [Geografia]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista de estados
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 */
router.get('/states', controller.getStates);

/**
 * @openapi
 * /api/geography/municipalities/{uf}:
 *   get:
 *     summary: Listar municípios de uma UF
 *     tags: [Geografia]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: uf
 *         required: true
 *         schema:
 *           type: string
 *         description: Sigla da UF (ex RS)
 *     responses:
 *       200:
 *         description: Lista de municípios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 */
router.get('/municipalities/:uf', controller.getMunicipalities);

/**
 * @openapi
 * /api/geography/neighborhoods/{city}:
 *   get:
 *     summary: Listar bairros de uma cidade (opcionalmente filtrar por UF)
 *     tags: [Geografia]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: city
 *         required: true
 *         schema:
 *           type: string
 *         description: Nome da cidade
 *       - in: query
 *         name: uf
 *         schema:
 *           type: string
 *         description: UF para filtrar (opcional)
 *     responses:
 *       200:
 *         description: Lista de bairros
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   type:
 *                     type: string
 */
router.get('/neighborhoods/:city', controller.getNeighborhoods);

// Nota: a rota '/neighborhoods/:ibgeCode' está duplicada e causaria conflito.
// Se pretendia manter, seria necessário outro path. Vou documentar como existente, mas sugiro remover.
/**
 * @openapi
 * /api/geography/neighborhoods/by-ibge/{ibgeCode}:
 *   get:
 *     summary: Listar bairros por código IBGE (se mantido)
 *     tags: [Geografia]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: ibgeCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de bairros
 */
// Descomente e ajuste a rota se realmente precisar:
// router.get('/neighborhoods/by-ibge/:ibgeCode', controller.getNeighborhoodsByIbge);

/**
 * @openapi
 * /api/geography/cep/{cep}:
 *   get:
 *     summary: Consultar informações de um CEP (ViaCEP)
 *     tags: [Geografia]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: cep
 *         required: true
 *         schema:
 *           type: string
 *         description: CEP (somente números)
 *     responses:
 *       200:
 *         description: Informações do CEP
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 logradouro:
 *                   type: string
 *                 bairro:
 *                   type: string
 *                 cidade:
 *                   type: string
 *                 uf:
 *                   type: string
 *                 cep:
 *                   type: string
 *       404:
 *         description: CEP não encontrado
 */
router.get('/cep/:cep', controller.getCepInfo);

export default router;
