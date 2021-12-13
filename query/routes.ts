import { RouteOptions } from 'fastify';
import { ALLOW_TOKENS, generateLogData, postEvent } from '../utils';
import { queryInAroundTime, queryLastest } from './hander';

interface queryProps {
  from: 'chain' | 'market',
  token: string;
  times?: string;
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
      const { token, from, times } = req.query as queryProps;
      const times_array = times && times.length > 0 ? times?.split(',') : [];
      if (!ALLOW_TOKENS.includes(token.toUpperCase())) {
        return {
          code: 0,
          data: {
            price: [0],
            message: 'Unsupported token'
          }
        };
      }
      if (!times_array || times_array.length == 0) {
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
        const pirces = await Promise.all(times_array.map(time => queryInAroundTime(from, token.toUpperCase(), time)));
        return {
          code: 1,
          data: {
            price: pirces,
            messgae: '',
          }
        }
      }
    }
  }
];