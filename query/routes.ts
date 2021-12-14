import { RouteOptions } from 'fastify';
import { ALLOW_TOKENS, generateLogData, postEvent } from '../utils';
import { GetPreNTimes, queryInAroundTime, QueryInRange, queryLastest } from './hander';

interface queryProps {
  from: 'chain' | 'market',
  token: string;
  totalCount?: number;
  intervalUnit?: 'D' | 'H',
  intervalNum?: number;
}

export const queryRoutes: RouteOptions[] = [
  {
    method: 'GET',
    url: '/',
    schema: {
      querystring: {
        from: { type: 'string' },
        token: { type: 'string' }
      }
    },
    handler: async (req, res) => {
      const { token, from, totalCount, intervalUnit, intervalNum } = req.query as queryProps;
      if (!ALLOW_TOKENS.includes(token.toUpperCase())) {
        return {
          code: 0,
          data: {
            price: [0],
            message: 'Unsupported token'
          }
        };
      }
      if (!totalCount || totalCount <= 0 || !intervalUnit) {
        const data = await queryLastest(from, token.toUpperCase());
        const [error, price] = data;
        if (error != null) {
          await postEvent({
            text: JSON.stringify(generateLogData(req, res)),
            title: 'query lastest error',
            alertType: 'warning'
          });
          return {
            code: 0,
            data: {
              price: [0],
              message: error
            }
          }
        } else {
          return {
            code: 1,
            data: {
              price: [price],
              message: '',
            }
          }
        };
      } else {
        const prices = await QueryInRange(from, token, totalCount, intervalUnit, intervalNum);
        return {
          code: 1,
          data: {
            price: prices,
            messgae: '',
          }
        }
      }
    }
  }
];