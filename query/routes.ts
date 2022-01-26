import { RouteOptions } from 'fastify';
import { ALLOW_TOKENS, generateLogData, postEvent } from '../utils';
import { queryExchange, QueryInRange, queryLastest } from './hander';

interface queryProps {
  from: 'chain' | 'market',
  token: string;
  totalCount?: number;
  intervalUnit?: string,
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
      // RMRK && KRMRK PSPECIAL TREATMENT
      let _token = token;
      if('KRMRK' === _token.toUpperCase()) {
        _token = 'RMRK';
      }
      if (!ALLOW_TOKENS.includes(_token.toUpperCase())) {
        return {
          code: 0,
          data: {
            price: [0],
            message: 'Unsupported token'
          }
        };
      }
      if (!totalCount || totalCount <= 0 || !intervalUnit) {
        const data = await queryLastest(from, _token.toUpperCase());
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
        const [error, prices] = await QueryInRange(from, _token, totalCount, intervalUnit.toUpperCase(), intervalNum);
        if (error != null) {
          return {
            code: 1,
            data: {
              price: prices,
              messgae: error,
            }
          }
        } else {
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
  }, {
    method: 'GET',
    url: '/rate',
    handler: async (req, res) => {
      const data = await queryExchange();
      const [error, rate] = data;
      if (error != null) {
        return {
          code: 0,
          data: {
            rate: 0,
            message: error
          }
        }
      } else {
        return {
          code: 1,
          data: {
            rate: rate,
            message: '',
          }
        }
      };
    }
  }
];