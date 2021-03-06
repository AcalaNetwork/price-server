import { RouteOptions } from 'fastify';

interface queryProps {
  from: 'chain' | 'market',
  token: string;
}

export const chainRoutes: RouteOptions[] = [
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
      res.send('chain get route');
    }
  }
];