import { get, priceModal, set, del } from "../db"
import { Redis } from "ioredis"
import { TFrom } from "./config";
import fs from 'fs';
import path from 'path'
import { FastifyReply, FastifyRequest } from "fastify";
import moment from "moment";

export * from './datadog';
export * from './config';

// generate redis key with from and token params
export const generateRedisKey = (from: TFrom, token: string, time: Date | string | 'lastest') => {
  let _date = '';
  if (time === 'lastest') {
    _date = 'lastest';
  } else {
    try {
      _date = moment(time).format('YYYY:MM:DD:HH:mm:00');
    } catch (error) {
      _date = moment().format('YYYY:MM:DD:HH:mm:00');
    }
  }
  return `${from}:${token}:${_date}`
};

export const generateLogData = (req: FastifyRequest, res: FastifyReply) => {
  return {
    method: req.method,
    url: req.url,
    ip: req.ip,
    query: req.query,
    body: req.body,
    headers: req.headers,
    res: res.statusCode
  }
}

// request info write to log file
export const logger = (name: string, request: FastifyRequest, res: FastifyReply) => {
  const fileName = `${name}-${new Date().getMonth() + 1}-${new Date().getDate()}`;
  const logfile = path.resolve(__dirname, '..', 'logs', fileName);
  const logData = generateLogData(request, res);
  console.log(JSON.stringify(logData));
  fs.appendFile(logfile, `${JSON.stringify(logData)}\n`, () => {
    request.log.info(logData);
  })
}

// write lastest price into db and update redis
export const writePrice = async (redisClient: Redis, token: string, from: TFrom, price: number, time: string | Date) => {
  const redisKey = generateRedisKey(from, token, 'lastest');
  await priceModal.create({
    token: token,
    from: from,
    price: price,
    createTime: time
  });
  await set(redisClient, redisKey, price.toString(), 'EX', 60 * 5);

  return price;
}