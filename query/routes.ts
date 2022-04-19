import { RouteOptions } from 'fastify';
import { ALLOW_TOKENS, generateLogData, postEvent } from '../utils';
import { checkLegalToken, queryExchange, QueryInRange, queryLastest, queryTokensInRange, queryTokensPrice } from './hander';

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
      // SPECIAL TREATMENT
      // [RMRK, KRMRK, BTC, KBTC]
      let _token = token.toUpperCase().replace('KRMRK', 'RMRK').replace('KBTC', 'BTC');
      const check = checkLegalToken(token);
      if (check.length > 0) {
        return {
          code: 0,
          data: {
            price: [0],
            message: `Exist unsupported tokens (${check.join(',')})`
          }
        };
      }
      if (!totalCount || totalCount <= 0 || !intervalUnit) {
        const data = await queryTokensPrice(from, _token.toUpperCase());
        const {error, prices} = data;
        if (error != null) {
          await postEvent({
            text: JSON.stringify(generateLogData(req, res)),
            title: 'Query lastest error',
            alertType: 'warning'
          });
          return {
            code: 0,
            data: {
              price: prices,
              message: error
            }
          }
        } else {
          return {
            code: 1,
            data: {
              price: prices,
              message: '',
            }
          }
        };
      } else {
        const {error, prices} = await queryTokensInRange(from, _token, totalCount, intervalUnit.toUpperCase(), intervalNum);
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