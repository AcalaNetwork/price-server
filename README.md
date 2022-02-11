# start step
1. edit file [config.ts] (if necessary) in __' utils/ '__
```ts
// server port
export const QUERY_PORT = 0000;
export const CHAIN_PORT = 0001;
export const MARKET_PORT = 0002;

// db port
// default: port will not be exposed to the outside docker container
export const MONGO_PORT = 27017;
export const REDIS_PORT = 6379;

// allowed price source (just used in type check)
export type TFrom = 'market' | 'chain';
// allowed token types (just used in type check)
export type TTokens = 'KAR'| 'KSM'| 'BNC';
export const ALLOW_TOKENS: TTokens[] = ['KAR', 'KSM', 'BNC'];
// MAP<token, tokenID>, find it in CMC or any third-party server
export const TOKENS_MAP: {[k in TTokens]: number} = {
  KAR: 5034,
  KSM: 10042,
  BNC: 3222
}
// cmc request url
export const CMC_API_URL = "*******";
export const CMC_API_URL_EXCHANGE = "*******";


```

2. add file [pm2.config.js] in __' / '__
```js
module.exports = {
  apps: [{
    name: 'price-query',
    script: './dist/query/index.js',
    env: {
      DD_SITE: "datadoghq.com",
      DD_API_KEY: "DD_API_KEY",
      DD_APP_KEY: "DD_APP_KEY",
      CMC_API_KEY: "CMC_API_KEY"
   }
  },{
    name: 'price-market',
    script: './dist/market/index.js',
    env: {
      ...
    }
  },{
    name: 'price-chain',
    script: './dist/chain/index.js',
    env: {
      ...
    }
  }]
};
```

3. add file [nodemon.json] (used by development) in __' / '__
```json
{
  "env": {
    "DD_SITE": "datadoghq.com",
    "DD_API_KEY": "DD_API_KEY",
    "DD_APP_KEY": "DD_APP_KEY",
    "CMC_API_KEY": "CMC_API_KEY"
  }
}
```

4. docker-compose up -d 

5. success!