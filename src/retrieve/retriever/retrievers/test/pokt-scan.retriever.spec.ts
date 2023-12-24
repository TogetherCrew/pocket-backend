import { Test, TestingModule } from '@nestjs/testing';
import { WinstonProvider } from '@common/winston/winston.provider';
import { HttpModule, HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { AxiosResponse } from 'axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PoktScanRetriever } from '../pokt-scan.retriever';
import {
  PoktScanDAOTreasuryResponse,
  PoktScanDAOTreasuryVariables,
  PoktScanLargestNodeRunnersResponse,
  PoktScanOptions,
  PoktScanOutput,
  PoktScanRecord,
  PoktScanSupplyResponse,
  PoktScanSupplyVariables,
} from '../../interfaces/pokt-scan.interface';

jest.mock('@common/winston/winston.provider');

describe('PoktScan Retriever', () => {
  let retriever: PoktScanRetriever;
  let axios: HttpService;
  let config: ConfigService;
  let logger: WinstonProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule, ConfigModule],
      providers: [WinstonProvider, PoktScanRetriever],
    }).compile();

    retriever = module.get<PoktScanRetriever>(PoktScanRetriever);
    axios = module.get<HttpService>(HttpService);
    config = module.get<ConfigService>(ConfigService);
    logger = module.get<WinstonProvider>(WinstonProvider);

    jest.clearAllMocks();
  });

  test('Should be defined', () => {
    expect(retriever).toBeDefined();
  });

  describe('When request method called', () => {
    let query: string;
    let variables: Record<string, any>;
    let returnValue: PoktScanSupplyResponse;
    let axiosResponse: AxiosResponse<PoktScanSupplyResponse>;

    beforeEach(async () => {
      query = 'query { test { test } }';
      variables = {
        listSummaryInput: {
          start_date: '',
          end_date: '',
          unit_time: 'block',
          interval: 0,
          exclusive_date: false,
        },
        supplyInput: {
          start_date: '',
        },
      };
      axiosResponse = {
        data: {
          data: {
            circulating_supply: {
              points: [],
            },
            supply: {
              token_burn: {
                amount: 0,
              },
              token_issuance: {
                amount: 0,
              },
            },
          },
        },
        status: 200,
        statusText: 'OK',
        headers: undefined,
        config: undefined,
      };

      jest.spyOn(config, 'get').mockReturnValue('');
      jest.spyOn(axios, 'post').mockReturnValue(of(axiosResponse));

      returnValue = await retriever['request'](query, variables);
    });

    test('Should be defined', () => {
      expect(retriever['request']).toBeDefined();
    });

    test('Should call get method from config for base-url', () => {
      expect(config.get).toBeCalledWith('POKT_SCAN_API_BASE_URL');
    });

    test('Should call get method from config for api-key', () => {
      expect(config.get).toBeCalledWith('POKT_SCAN_API_TOKEN');
    });

    test('Should call post method from axios', () => {
      expect(axios.post).toBeCalledWith(
        '',
        {
          query,
          variables,
        },
        {
          headers: {
            Authorization: '',
            'Content-Type': 'application/json',
          },
        },
      );
    });

    test('Should call debug method from logger', () => {
      expect(logger.debug).toBeCalledWith(
        'request method\n' +
          `input => ${JSON.stringify({ query, variables })}\n` +
          `response => ${JSON.stringify({
            status: axiosResponse.status,
            body: axiosResponse.data,
          })}\n`,
        PoktScanRetriever.name,
      );
    });

    test('Should return body from http response', () => {
      expect(returnValue).toEqual(axiosResponse.data);
    });
  });

  describe('When getDAOTreasuryGQLQuery method called', () => {
    let returnValue: string;

    beforeAll(() => {
      returnValue = retriever['getDAOTreasuryGQLQuery']();
    });

    test('Should be defined', () => {
      expect(retriever['getDAOTreasuryGQLQuery']).toBeDefined();
    });

    test('Should return pokt-scan graphQL query', () => {
      expect(returnValue).toBe(`
    query daoTreasury($pagination: ListInput) {
      DAO_total_balance: ListPoktAccount(pagination: $pagination) {
        items {
          amount
        }
      }
    }`);
    });
  });

  describe('When getSupplyGQLQuery method called', () => {
    let returnValue: string;

    beforeAll(() => {
      returnValue = retriever['getSupplyGQLQuery']();
    });

    test('Should be defined', () => {
      expect(retriever['getSupplyGQLQuery']).toBeDefined();
    });

    test('Should return pokt-scan graphQL query', () => {
      expect(returnValue).toBe(`
    query(
      $listSummaryInput: SummaryWithBlockInput!
      $supplyInput: GetSupplySummaryFromStartDateInput!
    ) {
      circulating_supply: ListSummaryBetweenDates(input: $listSummaryInput) {
        points {
          point
          amount: m0
        }
      }
      supply: GetSupplySummaryFromStartToCurrentDate(input: $supplyInput) {
        token_burn: total_burned {
          amount: current
        }
        token_issuance: total_minted {
          amount: current
        }
      }
    }`);
    });
  });

  describe('When reduceRecords method called', () => {
    let returnValue: number;
    let records: Array<PoktScanRecord>;
    let expectedReturnValue: number;

    beforeEach(() => {
      records = [
        { amount: 1.2, point: '' },
        { amount: 1.3, point: '' },
      ];
      expectedReturnValue = 2.5;

      returnValue = retriever['reduceRecords'](records);
    });

    test('Should be defined', () => {
      expect(retriever['reduceRecords']).toBeDefined();
    });

    test("Should return sum of records' amount", () => {
      expect(returnValue).toBe(expectedReturnValue);
    });
  });

  describe.skip('When calculateValidatorsCountToControlProtocol method called', () => {
    let returnValue: number;
    let chains: Array<{ nodes_count: number }>;

    test('Should be defined', () => {
      expect(
        retriever['calculateValidatorsCountToControlProtocol'],
      ).toBeDefined();
    });

    describe('If node count is gte 1000', () => {
      beforeAll(() => {
        chains = [{ nodes_count: 1000 }, { nodes_count: 2 }];

        returnValue =
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          retriever['calculateValidatorsCountToControlProtocol'](chains);
      });

      test('Should return 660', () => {
        expect(returnValue).toBe(660);
      });
    });

    describe('If node count is lt 1000', () => {
      beforeAll(() => {
        chains = [{ nodes_count: 1 }, { nodes_count: 2 }];

        returnValue =
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          retriever['calculateValidatorsCountToControlProtocol'](chains);
      });

      test('Should return calculated value', () => {
        expect(returnValue).toBe(Math.ceil((1 + 2) * 0.66));
      });
    });
  });

  describe('When serializeFloatValue method called', () => {
    let amount: number;
    let returnValue: number;

    beforeAll(() => {
      amount = 1200;

      returnValue = retriever['serializeFloatValue'](amount);
    });

    test('Should be defined', () => {
      expect(retriever['serializeFloatValue']).toBeDefined();
    });

    test('Should return calculated value', () => {
      expect(returnValue).toBe(amount / 1000000);
    });
  });

  describe.skip('When serializeResponse method called', () => {
    let returnValue: PoktScanOutput;
    const supplyResponse: PoktScanSupplyResponse = {
      data: {
        circulating_supply: {
          points: [{ point: '', amount: 3.0 }],
        },
        supply: {
          token_burn: {
            amount: 0,
          },
          token_issuance: {
            amount: 0,
          },
        },
      },
    };

    const daoResponse: PoktScanDAOTreasuryResponse = {
      data: {
        DAO_total_balance: {
          items: [{ amount: 1.0 }],
        },
      },
    };

    const nodesResponse: PoktScanLargestNodeRunnersResponse = {
      data: {
        ListLargestNodeRunners: {
          items: [{ service_domain: 'test.com', validators: 10 }],
        },
      },
    };

    beforeEach(() => {
      jest.spyOn(retriever as any, 'reduceRecords').mockReturnValueOnce(1.0);
      jest.spyOn(retriever as any, 'reduceRecords').mockReturnValueOnce(3.0);

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      returnValue = retriever['serializeResponse'](
        daoResponse,
        supplyResponse,
        nodesResponse,
      );
    });

    test('Should be defined', () => {
      expect(retriever['serializeResponse']).toBeDefined();
    });

    test.each`
      property                | source
      ${'dao_treasury'}       | ${daoResponse.data.DAO_total_balance.items}
      ${'circulating_supply'} | ${supplyResponse.data.circulating_supply.points}
    `(
      'Should call reduceRecords method from retriever for $property',
      ({ source }) => {
        expect(retriever['reduceRecords']).toBeCalledWith(source);
      },
    );

    test('Should return serialized output', () => {
      expect(returnValue).toEqual({
        token_burn: 0,
        token_issuance: 0,
        circulating_supply: 3 / 1000000,
        DAO_total_balance: 1 / 1000000,
        validators_to_control_protocol_count: 66,
      });
    });
  });

  describe('When serializeDAOTreasuryVariables method called', () => {
    let returnValue: PoktScanDAOTreasuryVariables;
    let options: PoktScanOptions;
    let pagination;

    beforeAll(() => {
      pagination = {
        filter: {
          operator: 'AND',
          properties: [],
        },
        limit: 0,
      };

      options = {
        start_date: '',
        end_date: '',
        unit_time: 'block',
        date_format: '',
        interval: 1,
        exclusive_date: false,
        pagination: pagination,
      };

      returnValue = retriever['serializeDAOTreasuryVariables'](options);
    });

    test('Should be defined', () => {
      expect(retriever['serializeDAOTreasuryVariables']).toBeDefined();
    });

    test('Should return serialized variables', () => {
      expect(returnValue).toEqual({
        pagination: pagination,
      });
    });
  });

  describe('When serializeSupplyVariables method called', () => {
    let returnValue: PoktScanSupplyVariables;
    let options: PoktScanOptions;

    beforeAll(() => {
      options = {
        start_date: '',
        end_date: '',
        unit_time: 'block',
        date_format: '',
        interval: 1,
        exclusive_date: false,
        pagination: {
          filter: {
            operator: 'AND',
            properties: [],
          },
          limit: 0,
        },
      };

      returnValue = retriever['serializeSupplyVariables'](options);
    });

    test('Should be defined', () => {
      expect(retriever['serializeSupplyVariables']).toBeDefined();
    });

    test('Should return serialized variables', () => {
      expect(returnValue).toEqual({
        supplyInput: {
          start_date: options.start_date,
          date_format: '',
        },
        listSummaryInput: {
          start_date: options.start_date,
          end_date: options.end_date,
          unit_time: options.unit_time,
          interval: options.interval,
          date_format: '',
        },
      });
    });
  });

  describe('When getDAOTreasuryProps method called', () => {
    let variables: PoktScanDAOTreasuryVariables;
    let returnValue: PoktScanDAOTreasuryResponse;

    beforeEach(async () => {
      variables = {
        pagination: {
          filter: {
            operator: 'AND',
            properties: [],
          },
          limit: 0,
        },
      };
      returnValue = {
        data: {
          DAO_total_balance: {
            items: [{ amount: 0 }],
          },
        },
      };

      jest
        .spyOn(retriever as any, 'getDAOTreasuryGQLQuery')
        .mockReturnValueOnce('');
      jest.spyOn(retriever as any, 'request').mockReturnValueOnce(returnValue);

      returnValue = await retriever['getDAOTreasuryProps'](variables);
    });

    test('Should be called getDAOTreasuryGQLQuery method', () => {
      expect(retriever['getDAOTreasuryGQLQuery']).toBeCalledWith();
    });

    test('Should be called request method', () => {
      expect(retriever['request']).toBeCalledWith('', variables);
    });

    test('Should return response', () => {
      expect(returnValue).toEqual({
        data: {
          DAO_total_balance: {
            items: [{ amount: 0 }],
          },
        },
      });
    });
  });

  describe('When getSupplyProps method called', () => {
    let variables: PoktScanSupplyVariables;
    let returnValue: PoktScanSupplyResponse;

    beforeEach(async () => {
      variables = {
        listSummaryInput: {
          start_date: '',
          end_date: '',
          date_format: '',
        },
        supplyInput: {
          start_date: '',
          date_format: '',
        },
      };
      returnValue = {
        data: {
          circulating_supply: {
            points: [{ amount: 0, point: '' }],
          },
          supply: {
            token_burn: { amount: 0 },
            token_issuance: { amount: 0 },
          },
        },
      };

      jest.spyOn(retriever as any, 'getSupplyGQLQuery').mockReturnValueOnce('');
      jest.spyOn(retriever as any, 'request').mockReturnValueOnce(returnValue);

      returnValue = await retriever['getSupplyProps'](variables);
    });

    test('Should be called getSupplyGQLQuery method', () => {
      expect(retriever['getSupplyGQLQuery']).toBeCalledWith();
    });

    test('Should be called request method', () => {
      expect(retriever['request']).toBeCalledWith('', variables);
    });

    test('Should return response', () => {
      expect(returnValue).toEqual({
        data: {
          circulating_supply: {
            points: [{ amount: 0, point: '' }],
          },
          supply: {
            token_burn: { amount: 0 },
            token_issuance: { amount: 0 },
          },
        },
      });
    });
  });

  describe.skip('When retrieve method called', () => {
    let returnValue: PoktScanOutput;
    const options: PoktScanOptions = {
      start_date: '',
      end_date: '',
      unit_time: 'block',
      interval: 1,
      exclusive_date: false,
      date_format: '',
      pagination: {
        filter: {
          operator: 'AND',
          properties: [],
        },
        limit: 0,
      },
    };
    let DAOTreasuryVariables: PoktScanDAOTreasuryVariables;
    let supplyVariables: PoktScanSupplyVariables;
    let serializedOutput: PoktScanOutput;
    let promiseOutput: Array<string>;

    beforeEach(async () => {
      promiseOutput = [];
      serializedOutput = {
        circulating_supply: 0,
        DAO_total_balance: 0,
        token_burn: 0,
        token_issuance: 0,
        validators_to_control_protocol_count: 0,
        groves_relays_percentage: 0,
        nodies_relays_percentage: 0,
      };

      jest
        .spyOn(retriever as any, 'serializeDAOTreasuryVariables')
        .mockReturnValueOnce(DAOTreasuryVariables);
      jest
        .spyOn(retriever as any, 'serializeSupplyVariables')
        .mockReturnValueOnce(supplyVariables);
      jest
        .spyOn(retriever as any, 'getDAOTreasuryProps')
        .mockReturnValueOnce('');
      jest.spyOn(retriever as any, 'getSupplyProps').mockReturnValueOnce('');

      jest.spyOn(Promise, 'all').mockResolvedValueOnce(promiseOutput);
      jest
        .spyOn(retriever as any, 'serializeResponse')
        .mockReturnValueOnce(serializedOutput);

      returnValue = await retriever['retrieve'](options);
    });

    test('Should be defined', () => {
      expect(retriever['retrieve']).toBeDefined();
    });

    test.each`
      fn                                 | input
      ${'serializeDAOTreasuryVariables'} | ${options}
      ${'serializeSupplyVariables'}      | ${options}
    `('Should be called $fn method', ({ fn, input }) => {
      expect(retriever[fn]).toBeCalledWith(input);
    });

    test.each`
      fn                       | input
      ${'getDAOTreasuryProps'} | ${DAOTreasuryVariables}
      ${'getSupplyProps'}      | ${supplyVariables}
    `('Should be called $fn method', ({ fn, input }) => {
      if (input !== undefined) {
        expect(retriever[fn]).toBeCalledWith(input);
      } else {
        expect(retriever[fn]).toBeCalled();
      }
    });

    test('Should return pokt-scan output', () => {
      expect(returnValue).toEqual(serializedOutput);
    });
  });
});
