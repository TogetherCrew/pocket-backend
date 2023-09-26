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
  PoktScanOptions,
  PoktScanOutput,
  PoktScanRecord,
  PoktScanSupplyResponse,
  PoktScanSupplyVariables,
} from '../../interfaces/pokt-scan.interface';
import lodash from 'lodash';

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
              records: [],
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
    query ($listSummaryInput: SummaryWithBlockInput!) {
      incomes: ListSummaryBetweenDates(input: $listSummaryInput) {
        points {
          point
          amount: total_dao_rewards
        }
      }
      expenses: ListDaoExpensesBetweenDates(input: $listSummaryInput) {
        points {
          point
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
    let reduceReturnValue: number;

    beforeEach(() => {
      records = [
        { amount: 1.2, point: '' },
        { amount: 1.3, point: '' },
      ];
      reduceReturnValue = 2.5;

      jest.spyOn(lodash, 'reduce').mockReturnValueOnce(reduceReturnValue);

      returnValue = retriever['reduceRecords'](records);
    });

    test('Should be defined', () => {
      expect(retriever['reduceRecords']).toBeDefined();
    });

    test('Should call reduce method from lodash', () => {
      expect(lodash.reduce).toBeCalledWith(records, expect.any(Function), 0);
    });

    test("Should return sum of records' amount", () => {
      expect(returnValue).toBe(reduceReturnValue);
    });
  });

  describe('When serializeResponse method called', () => {
    let returnValue: PoktScanOutput;
    const supplyResponse: PoktScanSupplyResponse = {
      data: {
        circulating_supply: {
          records: [{ point: '', amount: 3.0 }],
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
        incomes: {
          records: [{ point: '', amount: 1.0 }],
        },
        expenses: {
          records: [{ point: '', amount: 2.0 }],
        },
      },
    };

    beforeEach(() => {
      jest.spyOn(retriever as any, 'reduceRecords').mockReturnValueOnce(3.0);
      jest.spyOn(retriever as any, 'reduceRecords').mockReturnValueOnce(1.0);
      jest.spyOn(retriever as any, 'reduceRecords').mockReturnValueOnce(2.0);

      returnValue = retriever['serializeResponse'](daoResponse, supplyResponse);
    });

    test('Should be defined', () => {
      expect(retriever['serializeResponse']).toBeDefined();
    });

    test.each`
      property                | source
      ${'circulating_supply'} | ${supplyResponse.data.circulating_supply.records}
      ${'income'}             | ${daoResponse.data.incomes.records}
      ${'expense'}            | ${daoResponse.data.expenses.records}
    `(
      'Should call reduceRecords method from retriever for $property',
      ({ source }) => {
        expect(retriever['reduceRecords']).toBeCalledWith(source);
      },
    );

    test('Should return serialized output', () => {
      expect(returnValue).toEqual({
        token_burn: supplyResponse.data.supply.token_burn.amount,
        token_issuance: supplyResponse.data.supply.token_issuance.amount,
        circulating_supply: 3.0,
        income: 1.0,
        expense: 2.0,
      });
    });
  });

  describe('When serializeDAOTreasuryVariables method called', () => {
    let returnValue: PoktScanDAOTreasuryVariables;
    let options: PoktScanOptions;

    beforeAll(() => {
      options = {
        start_date: '',
        end_date: '',
        unit_time: 'block',
        date_format: '',
        interval: 1,
        exclusive_date: false,
      };

      returnValue = retriever['serializeDAOTreasuryVariables'](options);
    });

    test('Should be defined', () => {
      expect(retriever['serializeDAOTreasuryVariables']).toBeDefined();
    });

    test('Should return serialized variables', () => {
      expect(returnValue).toEqual({
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

  // describe('When retrieve method called', () => {
  //   let returnValue: PoktScanOutput;
  //   let options: PoktScanOptions;
  //   let query: string;
  //   let variables: PoktScanVariables;
  //   let response: PoktScanResponse;
  //   let serializedOutput: PoktScanOutput;

  //   beforeEach(async () => {
  //     options = {
  //       start_date: '',
  //       end_date: '',
  //       unit_time: 'block',
  //       interval: 1,
  //       exclusive_date: false,
  //     };
  //     query = 'test';
  //     variables = {
  //       listSummaryInput: {
  //         start_date: '',
  //         end_date: '',
  //         unit_time: 'block',
  //         interval: 0,
  //         exclusive_date: false,
  //       },
  //       supplyInput: {
  //         start_date: '',
  //       },
  //     };
  //     response = {
  //       data: {
  //         incomes: {
  //           records: [],
  //         },
  //         expenses: {
  //           records: [],
  //         },
  //         circulating_supply: {
  //           records: [],
  //         },
  //         supply: {
  //           token_burn: {
  //             amount: 0,
  //           },
  //           token_issuance: {
  //             amount: 0,
  //           },
  //         },
  //       },
  //     };
  //     serializedOutput = {
  //       token_burn: response.data.supply.token_burn.amount,
  //       token_issuance: response.data.supply.token_issuance.amount,
  //       circulating_supply: 3.0,
  //       income: 1.0,
  //       expense: 2.0,
  //     };

  //     jest.spyOn(retriever as any, 'getGQLQuery').mockReturnValueOnce(query);
  //     jest
  //       .spyOn(retriever as any, 'serializeOptions')
  //       .mockReturnValueOnce(variables);
  //     jest.spyOn(retriever as any, 'request').mockReturnValueOnce(response);
  //     jest
  //       .spyOn(retriever as any, 'serializeResponse')
  //       .mockReturnValueOnce(serializedOutput);

  //     returnValue = await retriever['retrieve'](options);
  //   });

  //   test('Should be defined', () => {
  //     expect(retriever['retrieve']).toBeDefined();
  //   });

  //   test('Should call getGQLQuery from retriever', () => {
  //     expect(retriever['getGQLQuery']).toBeCalledWith();
  //   });

  //   test('Should call serializeOptions from retriever', () => {
  //     expect(retriever['serializeOptions']).toBeCalledWith(options);
  //   });

  //   test('Should call request from retriever', () => {
  //     expect(retriever['request']).toBeCalledWith(query, variables);
  //   });

  //   test('Should call serializeResponse from retriever', () => {
  //     expect(retriever['serializeResponse']).toBeCalledWith(response);
  //   });

  //   test('Should return pokt-scan output', () => {
  //     expect(returnValue).toEqual(serializedOutput);
  //   });
  // });
});
