import fastify, { FastifyInstance, FastifyPluginCallback, onRequestAsyncHookHandler, onRequestHookHandler, RouteOptions } from 'fastify';
import cors from 'fastify-cors';
import mongo from 'mongoose';
import ioredis, { Redis } from 'ioredis';
import { MONGO_PORT, REDIS_PORT } from './utils/config';
import { auth } from './utils';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { options } from '@acala-network/api';
import { Wallet } from '@acala-network/sdk';

export class Server {
  private port: number;
  private server: FastifyInstance;
  private redisClient: Redis;
  private name: string;
  private provider?: WsProvider;
  private api?: ApiPromise;
  private wallet?: Wallet;

  constructor(port: number, name: string, networkEndpoint?: string | Array<string>) {
    this.port = port;
    this.name = name;
    this.server = fastify();
    this.connectMongo();
    this.redisClient = this.connectRedis();
    if (networkEndpoint) {
      this.provider = new WsProvider(networkEndpoint);
    }
    auth()
  };

  public async initiateApi(): Promise<void> {
    if (!this.provider) return
    await this.provider.isReady;
    this.api = await ApiPromise.create(options({ provider: this.provider }));
    await this.api.isReady;
    this.wallet = new Wallet(this.api);
    await this.wallet.isReady;
  }

  public getServer() {
    return this.server;
  }

  public getRedisClient() {
    return this.redisClient;
  }

  public getApi() {
    return this.api;
  }

  public getWallet() {
    return this.wallet;
  }

  public registeRoutes(routes: RouteOptions | RouteOptions[]) {
    if (Object.prototype.toString.call(routes) === '[object Array]' || routes instanceof Array) {
      (routes as unknown as RouteOptions[]).forEach(route => {
        this.server.route(route);
      })
    } else {
      this.server.route(routes);
    }
    return this;
  }

  public registeMiddlies(plug: FastifyPluginCallback) {
    this.server.register(plug);
    return this;
  }

  public registePreHook(hook: onRequestAsyncHookHandler | onRequestHookHandler) {
    this.server.addHook('onRequest', hook);
  }

  public connectMongo() {
    // mongo.connect(`mongodb://mongo:${MONGO_PORT}/price`).then(() => {
      // mongo.connect(process.env.REDIS_URL as string).then(() => {
      mongo.connect(`mongodb://localhost:${MONGO_PORT}/price`).then(() => {
      console.log(`Mongo in [${this.name}] Connect Success!`);
    });
  }

  public connectRedis() {
    // const redisClient = new ioredis({host: 'redis'});
    // const redisClient = new ioredis(process.env.REDIS_URL);
    const redisClient = new ioredis(REDIS_PORT);
    redisClient.on('connect', () => {
      console.log(`Redis in [${this.name}] Connect Success!`);
    })
    return redisClient;
  }

  public start(cb?: Function) {
    this.server.listen(this.port, '0.0.0.0', (err, address) => {
      if (err) {
        console.error('Server [', this.name, '] error: ', err.message.toString());
        return process.exit(1);
      };
      console.log('Server [', this.name, '] start at: ', this.port, address);
      cb && cb()
    })
  }
}