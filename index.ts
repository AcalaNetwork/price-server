import fastify, { FastifyInstance, FastifyPluginCallback, onRequestAsyncHookHandler, onRequestHookHandler, RouteOptions } from 'fastify';
import cors from 'fastify-cors';
import mongo from 'mongoose';
import ioredis, { Redis } from 'ioredis';
import { MONGO_PORT, REDIS_PORT } from './utils/config';
import { auth } from './utils';

export class Server {
  private port: number;
  private server: FastifyInstance;
  private redisClient: Redis;
  private name: string;

  constructor(port: number, name: string) {
    this.port = port;
    this.name = name;
    this.server = fastify();
    this.connectMongo();
    this.redisClient = this.connectRedis();
    auth()
  };

  public getServer() {
    return this.server;
  }

  public getRedisClient() {
    return this.redisClient;
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
    mongo.connect(`mongodb://mongo:${MONGO_PORT}/price`).then(() => {
    // mongo.connect(`mongodb://localhost:${MONGO_PORT}/price`).then(() => {
      console.log(`Mongo in [${this.name}] Connect Success!`);
    });
  }

  public connectRedis() {
    const redisClient = new ioredis({host: 'redis'});
    // const redisClient = new ioredis(REDIS_PORT);
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