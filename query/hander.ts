import { exchangeModal, get, priceModal, set } from "../db";
import moment from "moment";
import { ALLOW_TOKENS, generateRedisKey, TFrom } from "../utils";
import { server } from './index';

export const queryTokensPrice = async (from: TFrom = 'market', tokens: string, currency = 'USD') => {
  const tokenList = tokens.split(',');

  let rate = 1;
  if(currency === 'CNY') {
    const exchange = await queryExchange();
    const result = exchange[1];
    rate = result === null ? 1 : result;
  }

  const prices = await Promise.all(tokenList.map(token => queryLastest(from, token)));

  const result = prices.map(item => item[0] != null || item[1] == null ? 0 : item[1] * rate);
  const errorLength = prices.filter(item => item[0] != null).length;

  return {
    prices: result,
    error: errorLength === prices.length ? 'No price!' : (errorLength > 0 ? 'Existing price is 0' : null)
  }
}

export const queryLastest = async (from: TFrom = 'market', token: string): Promise<[string | null, number | null]> => {
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

export const queryTokensInRange = async (from: TFrom, tokens: string, totalCount: number, unit: string, num = 1, currency = 'USD') => {
  const tokenList = tokens.split(',');

  let rate = 1;
  if(currency === 'CNY') {
    const exchange = await queryExchange();
    const result = exchange[1];
    rate = result === null ? 1 : result;
  }

  const prices = await Promise.all(tokenList.map(item => QueryInRange(from, item, totalCount, unit, num)));

  const _result = prices.map(item => item[0] != null || item[1] == [] ? [0] : item[1]);
  const errorLength = prices.filter(item => item[0] != null).length;

  const result = _result.map(prices => {
    return prices?.map(price => {
      return price * rate;
    });
  })

  return {
    prices: tokenList.length === 1 ? result[0] : result,
    error: errorLength === prices.length ? 'All no price!' : (errorLength > 0 ? 'Existing price is 0' : null)
  }
}

export const QueryInRange = async (from: TFrom, token: string, totalCount: number, unit: string, num = 1): Promise<[string | null, number[] | null]> => {
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

export const queryExchange = async (base = 'USD', convert = 'CNY'): Promise<[string | null, number | null]> => {
  const redisKey = `${base}-${convert}`;
  const redisClient = server.getRedisClient();
  try {
    const redisExchange = await get(redisClient, redisKey);
    if (!redisExchange || redisExchange === '0') {
      const dbExchange = await exchangeModal.find().sort({ createTime: -1 }).limit(1);
      if (!dbExchange || dbExchange.length === 0) {
        return ['no exchange rate', null];
      } else {
        const Exchange = dbExchange[0].rate;
        await set(redisClient, redisKey, Exchange.toString(), 'EX', 60 * 60 * 12);
        return [null, Number(Exchange)];
      }
    } else {
      return [null, Number(redisExchange as string)];
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

export const checkLegalToken = (tokens: string) => {
  const tokenList = tokens.split(',');

  const result = tokenList.filter(token => !ALLOW_TOKENS.includes(token.toUpperCase()));

  return result;
}