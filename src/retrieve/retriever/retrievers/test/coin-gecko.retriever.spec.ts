import { Test, TestingModule } from '@nestjs/testing';
import { CoinGeckoRetriever } from '../coin-gecko.retriever';
import { WinstonProvider } from '@common/winston/winston.provider';
import { HttpModule, HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { AxiosResponse, Method } from 'axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  CoinGeckoOutput,
  CoinGeckoPoktPriceOutput,
  CoinGeckoPoktPriceResponse,
} from '../../interfaces/coin-gecko.interface';

jest.mock('@common/winston/winston.provider');

describe('CoinGecko Retriever', () => {
  let retriever: CoinGeckoRetriever;
  let axios: HttpService;
  let config: ConfigService;
  let logger: WinstonProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule, ConfigModule],
      providers: [WinstonProvider, CoinGeckoRetriever],
    }).compile();

    retriever = module.get<CoinGeckoRetriever>(CoinGeckoRetriever);
    axios = module.get<HttpService>(HttpService);
    config = module.get<ConfigService>(ConfigService);
    logger = module.get<WinstonProvider>(WinstonProvider);

    jest.clearAllMocks();
  });

  test('Should be defined', () => {
    expect(retriever).toBeDefined();
  });

  describe('When request method called', () => {
    const url = 'url';
    const method: Method = 'POST';
    const body: Record<string, any> = {};
    const query: Record<string, any> = {};
    let returnValue: Record<string, any>;
    let axiosResponse: AxiosResponse;

    beforeEach(async () => {
      axiosResponse = {
        data: {},
        status: 200,
        statusText: 'OK',
        headers: undefined,
        config: undefined,
      };

      jest.spyOn(config, 'get').mockReturnValue('');
      jest.spyOn(axios, 'request').mockReturnValue(of(axiosResponse));

      returnValue = await retriever['request'](url, method, body, query);
    });

    test('Should be defined', () => {
      expect(retriever['request']).toBeDefined();
    });

    test('Should call get method from config', () => {
      expect(config.get).toBeCalledWith('COIN_GECKO_API_BASE_URL');
    });

    test('Should call request method from axios', () => {
      expect(axios.request).toBeCalledWith({
        baseURL: '',
        url,
        method,
        data: body,
        params: query,
      });
    });

    test('Should call debug method from logger', () => {
      expect(logger.debug).toBeCalledWith(
        'request method\n' +
          `input => ${JSON.stringify({ url, method, body, query })}\n` +
          `response => ${JSON.stringify({
            status: axiosResponse.status,
            body: axiosResponse.data,
          })}`,
        CoinGeckoRetriever.name,
      );
    });

    test('Should return body from http response', () => {
      expect(returnValue).toEqual(axiosResponse.data);
    });
  });

  describe('When getPoktPrice method called', () => {
    let coinGeckoPoktPriceResponse: CoinGeckoPoktPriceResponse;
    let returnValue: CoinGeckoPoktPriceResponse;

    beforeEach(async () => {
      coinGeckoPoktPriceResponse = {
        'pocket-network': {
          usd: 0.025,
        },
      };

      jest
        .spyOn(retriever as any, 'request')
        .mockResolvedValueOnce(coinGeckoPoktPriceResponse);

      returnValue = await retriever['getPoktPrice']();
    });

    test('Should be defined', () => {
      expect(retriever['getPoktPrice']).toBeDefined();
    });

    test('Should call request method from retriever', () => {
      expect(retriever['request']).toBeCalledWith(
        'simple/price',
        'GET',
        undefined,
        {
          ids: 'pocket-network',
          vs_currencies: 'usd',
        },
      );
    });

    test('Should return pokt price response', () => {
      expect(returnValue).toEqual(coinGeckoPoktPriceResponse);
    });
  });

  describe('When serializePoktPriceResponse method called', () => {
    let coinGeckoPoktPriceResponse: CoinGeckoPoktPriceResponse;
    let returnValue: CoinGeckoPoktPriceOutput;

    beforeAll(() => {
      coinGeckoPoktPriceResponse = {
        'pocket-network': {
          usd: 0.025,
        },
      };

      returnValue = retriever['serializePoktPriceResponse'](
        coinGeckoPoktPriceResponse,
      );
    });

    test('Should be defined', () => {
      expect(retriever['serializePoktPriceResponse']).toBeDefined();
    });

    test('Should return pokt price output', () => {
      expect(returnValue).toEqual({
        price: coinGeckoPoktPriceResponse['pocket-network'].usd,
      });
    });
  });

  describe('When serializeOutput method called', () => {
    let coinGeckoPoktPriceOutput: CoinGeckoPoktPriceOutput;
    let returnValue: CoinGeckoOutput;

    beforeAll(() => {
      coinGeckoPoktPriceOutput = {
        price: 0.025,
      };

      returnValue = retriever['serializeOutput'](coinGeckoPoktPriceOutput);
    });

    test('Should be defined', () => {
      expect(retriever['serializeOutput']).toBeDefined();
    });

    test('Should return coin gecko output', () => {
      expect(returnValue).toEqual({
        pokt_price: coinGeckoPoktPriceOutput.price,
      });
    });
  });

  describe('When retrieve method called', () => {
    let poktPriceResponse: CoinGeckoPoktPriceResponse;
    let poktPriceOutput: CoinGeckoPoktPriceOutput;
    let serializeOutput: CoinGeckoOutput;
    let returnValue: CoinGeckoOutput;

    beforeEach(async () => {
      poktPriceResponse = {
        'pocket-network': {
          usd: 0.065,
        },
      };

      poktPriceOutput = {
        price: 0.065,
      };

      serializeOutput = {
        pokt_price: 0.065,
      };

      jest
        .spyOn(retriever as any, 'getPoktPrice')
        .mockResolvedValueOnce(poktPriceResponse);
      jest
        .spyOn(retriever as any, 'serializePoktPriceResponse')
        .mockReturnValueOnce(poktPriceOutput);
      jest
        .spyOn(retriever as any, 'serializeOutput')
        .mockReturnValueOnce(serializeOutput);

      returnValue = await retriever['retrieve']();
    });

    test('Should be defined', () => {
      expect(retriever['serializeOutput']).toBeDefined();
    });

    test('Should call getPoktPrice method from retriever', () => {
      expect(retriever['getPoktPrice']).toBeCalledWith();
    });

    test('Should call serializePoktPriceResponse method from retriever', () => {
      expect(retriever['serializePoktPriceResponse']).toBeCalledWith(
        poktPriceResponse,
      );
    });

    test('Should call serializeOutput method from retriever', () => {
      expect(retriever['serializeOutput']).toBeCalledWith(poktPriceOutput);
    });

    test('Should return coin gecko output', () => {
      expect(returnValue).toEqual(serializeOutput);
    });
  });
});
