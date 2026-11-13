import { RouteOption } from '../types';

/** Cache em memória para não gastar cota da API ao ir da tela de detalhe para o rastreio. */
export const routeCache = new Map<string, RouteOption[]>();
