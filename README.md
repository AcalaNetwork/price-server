# 1. start with your db and redis
1. docker pull image
```bash
  # docker image pushed in docker hub named: “shenger/price-server:1.0":
  docker pull shenger/price-server:1.0
```

2. create config file;
```js
// example
// "DD_*": for monitoring
// "CMC_API_KEY": for getting lastest price saved to db, maybe you need create a account in "https://pro.coinmarketcap.com/account/"
// MONGO_URL: mongo connection url, example: "mongodb://username:password@host:port/price", DOT USE "localhost or 127.0.0.1 " and please specify db table "price" or other.
// REDIS_URL: redis connection url, example: "redis://username:authpassword@host:port", DOT USE "localhost or 127.0.0.1 ".
module.exports = {
  apps: [{
    name: 'price-query',
    script: './dist/query/index.js',
    env: {
      DD_SITE: "datadoghq.com",
      DD_API_KEY: "----** DD_API_KEY **----",
      DD_APP_KEY: "----** DD_APP_KEY **----",
      CMC_API_KEY: "----** CMC_API_KEY **----",
      MONGO_URL: "----** MONGO_URL **----",
      REDIS_URL: "----** REDIS_URL **----",
    }
  }, {
    name: 'price-market',
    script: './dist/market/index.js',
    env: {
      DD_SITE: "datadoghq.com",
      DD_API_KEY: "----** DD_API_KEY **----",
      DD_APP_KEY: "----** DD_APP_KEY **----",
      CMC_API_KEY: "----** CMC_API_KEY **----",
      MONGO_URL: "----** MONGO_URL **----",
      REDIS_URL: "----** REDIS_URL **----",
    }
  }, {
    name: 'price-chain',
    script: './dist/chain/index.js',
    env: {
      DD_SITE: "datadoghq.com",
      DD_API_KEY: "----** DD_API_KEY **----",
      DD_APP_KEY: "----** DD_APP_KEY **----",
      CMC_API_KEY: "----** CMC_API_KEY **----",
      MONGO_URL: "----** MONGO_URL **----",
      REDIS_URL: "----** REDIS_URL **----",
    }
  }]
};
```

3. run 
```bash
docker run -v PATH/config.js:/usr/src/app/pm2.config.js -p 1000:1000 -p 1001:1001 -p 1002:1002  shenger/price-server:1.0
```

4. server will start in port 1000



# 2. start step directly
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