import { get, priceModal, set } from "../db";
import moment from "moment";
import { generateRedisKey, TFrom } from "../utils";
import { server } from './index';

export const queryLastest = async (from: TFrom = 'market', token: string) => {
  const redisKey = generateRedisKey(from, token, 'lastest');
  const redisClient = server.getRedisClient();
  try {
    const redisPrice = await get(redisClient, redisKey);
    if (!redisPrice || redisPrice === '0') {
      const dbPrice = await priceModal.find({ token: token, from: from }).sort({ createTime: -1 }).limit(1);
      if (!dbPrice || dbPrice.length === 0) {
        return ['no price', null];
      } else {
        const price = dbPrice[0].price;
        await set(redisClient, redisKey, price.toString(), 'EX', 60);
        return [null, price];
      }
    } else {
      return [null, Number(redisPrice as string)];
    }
  } catch (error: any) {
    return [error.toString(), null];
  }
}

export const QueryInRange = async (from: TFrom, token: string, totalCount: number, unit: string, num = 1) => {
  const redisKey = unit === 'D' ? `${moment(new Date()).format('YYYY-MM-DD')}-${num}-${unit}-${totalCount}-${from}-${token}` : `${moment(new Date()).format('YYYY-MM-DD-HH')}-${num}-${unit}-${totalCount}-${from}-${token}`;
  const redisClient = server.getRedisClient();
  try {
    const redisPrices = await get(redisClient, redisKey);
    if (!redisPrices || redisPrices === '[]') {
      const times = GetPreNTimes(totalCount, unit, num);
      const dbPirces = await Promise.all(times.map(time => queryInAroundTime(from, token.toUpperCase(), time)));
      const hasZero = dbPirces.filter(item => item === 0).length > 0;
      if (hasZero) {
        return ['exist 0 price', dbPirces];
      } else {
        await set(redisClient, redisKey, JSON.stringify(dbPirces), 'EX', 60);
        return [null, dbPirces];
      }
    } else {
      return [null, JSON.parse(redisPrices)];
    }
  } catch (error: any) {
    return [error.toString(), []];
  }
  
}

const getAroundTimes = (time: string) => {
  const date = moment(time).format('YYYY-MM-DD HH:mm:00');
  const startDate = moment(date).subtract(5, 'minutes');
  const endDate = moment(date).add(5, 'minutes');
  return [startDate.toDate(), endDate.toDate()];
}

export const queryInAroundTime = async (from: TFrom = 'market', token: string, time: string) => {
  const [startTime, endTime] = getAroundTimes(time);
  try {
    const data = await priceModal.findOne({ from: from, token: token, createTime: { "$gte": startTime, "$lte": endTime } });
    return data?.price || 0;
  } catch (error) {
    return 0;
  }
}

export const GetPreNTimes = (total: number, unit: string, num = 1) => {
  const now = moment(new Date()).subtract(10, 'minutes');
  const times: string[] = [];
  for (let i = 0; i < total; i++) {
    const date = now.subtract(num * i, unit === 'D' ? 'days' : 'hours').format('YYYY-MM-DD HH:mm:ss');
    times.push(date);
  }

  return times;
}