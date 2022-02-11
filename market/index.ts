import { Server } from "..";
import { MARKET_PORT, ALLOW_TOKENS, CMC_API_URL, TOKENS_MAP, TTokens, writePrice, postEvent, CMC_API_URL_EXCHANGE } from '../utils';
import { marketRoutes } from './routes';
import axios from 'axios-https-proxy-fix';
import { exchangeModal, priceModal } from "../db";
import { upload } from "../utils/uploadQiuniu";
import moment from "moment";

const server = new Server(MARKET_PORT, 'market');
server.registeRoutes(marketRoutes);

server.start(async () => {
  fetchPrice(ALLOW_TOKENS);
  fetchExchange();
  pushPrice();
});

setInterval(() => {
  fetchPrice(ALLOW_TOKENS);
}, 1000 * 60 * 10);

setInterval(() => {
  fetchExchange();
}, 1000 * 60 * 60 * 12)

setInterval(() => {
  pushPrice();
}, 1000 * 60 * 10)

interface CMC {
  status: {
    timestamp: string,
    error_code: number,
    error_message: string | null,
    credit_count: number,
    notice: string | null
  },
  data: {
    [token: string]: {
      id: number,
      name: string,
      symbol: string,
      is_active: boolean,
      quote: {
        'USD': {
          price: number,
          volume_24h: number,
          last_updated: string
        }
      }
    }
  }
}

const fetchPrice = async (tokens: (TTokens | string)[]) => {
  const cmc_api_key = process.env.CMC_API_KEY;
  if (!cmc_api_key) {
    console.log("cmc_api_key is null");
    process.exit(1);
  }
  const res = await axios.get<CMC>(CMC_API_URL, {
    params: {
      id: tokens.map(i => TOKENS_MAP[i].toString().toUpperCase()).join(','),
      convert: "USD",
    },
    headers: {
      "X-CMC_PRO_API_KEY": cmc_api_key,
    }
  })


  if (res.status === 200) {
    const { data, status } = res.data;
    if (status.error_code) {
      return setTimeout(() => {
        fetchPrice(tokens);
      }, 1000);
    }
    Object.keys(data).forEach(async token => {
      const priceData = data[token];
      if (priceData.quote.USD.price === 0) {
        await postEvent({
          title: 'cmc chain',
          text: `%%% \n ### chain price get 0 \n - time: ${new Date().getTime()} \n - query data: ${JSON.stringify(priceData)} \n %%%`
        })
      } else {
        await writePrice(server.getRedisClient(), priceData.symbol, 'market', priceData.quote.USD.price, priceData.quote.USD.last_updated);
      }
    })
  } else {
    return setTimeout(() => {
      fetchPrice(tokens);
    }, 1000);
  }
}

interface EXCHANGE {
  status: {
    timestamp: string,
    error_code: number,
    error_message: string | null,
    credit_count: number,
    notice: string | null
  },
  data: {
    quote: {
      'CNY': {
        price: number,
        last_updated: string
      }
    }
  }
}

const fetchExchange = async () => {
  const cmc_api_key = process.env.CMC_API_KEY;
  if (!cmc_api_key) {
    console.log("cmc_api_key is null");
    process.exit(1);
  }
  const res = await axios.get<EXCHANGE>(CMC_API_URL_EXCHANGE, {
    params: {
      amount: 1,
      symbol: 'USD',
      convert: "CNY",
    },
    headers: {
      "X-CMC_PRO_API_KEY": cmc_api_key,
    }
  })

  if (res.status === 200) {
    const { data, status } = res.data;
    if (status.error_code) {
      return setTimeout(() => {
        fetchExchange();
      }, 1000);
    }
    const { price, last_updated } = data.quote.CNY;

    await exchangeModal.create({
      base: 'USD',
      convert: 'CNY',
      rate: price,
      createTime: last_updated
    });
  } else {
    return setTimeout(() => {
      fetchExchange();
    }, 1000);
  }
}

interface PriceFileProps {
  prices: {
    [token: string]: Number;
  },
  rate: Number;
  time: string;
}

const pushPrice = async () => {
  if(!process.env.QINIU_ACCESS_KEY || !process.env.QINIU_SECRET_KEY) return;

  const json: PriceFileProps = {
    prices: {},
    rate: 0,
    time: moment().format('YYYY-MM-DD HH:mm:ss')
  }

  const pricesData = await Promise.all(ALLOW_TOKENS.map(token => priceModal.find({ token: token }).sort({ createTime: -1 }).limit(1)));
  const prices = pricesData.map(price => price[0].price);
  const exchangeData = await exchangeModal.find().sort({ createTime: -1 }).limit(1);
  const exchange = exchangeData[0].rate;

  ALLOW_TOKENS.map((item, index) => {
    json.prices[item] = prices[index];
  });

  json.rate = exchange;

  try {
    const res = await upload(JSON.stringify(json));
    console.log(res);
  } catch (error) {
    console.log(error);
  };
}