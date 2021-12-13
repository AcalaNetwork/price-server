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

const getAroundTimes = (time: string) => {
  const date = moment(time).format('YYYY-MM-DD HH:mm:00');
  const startDate = moment(date).subtract(5, 'minutes');
  const endDate = moment(date).add(5, 'minutes');
  return [startDate.toDate(), endDate.toDate()];
}

export const queryInAroundTime = async (from: TFrom = 'market', token: string, time: string) => {
  const [startTime, endTime] = getAroundTimes(time);
  try {
    const data = await priceModal.findOne({ from: from, token: token, createTime : { "$gte" : startTime, "$lte" : endTime } });
    return data?.price || 0;
  } catch (error) {
    return 0;
  }
}