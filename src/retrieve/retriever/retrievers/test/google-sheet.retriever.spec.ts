import { Test, TestingModule } from '@nestjs/testing';
import { WinstonProvider } from '@common/winston/winston.provider';
import { GoogleSheetRetriever } from '../google-sheet.retriever';
import { sheets_v4 } from 'googleapis';
import { GOOGLE_SHEET_SERVICE } from '../../retriever.constant';
import { GaxiosResponse } from 'gaxios';
import {
  GoogleSheetColumnsName,
  GoogleSheetSerializedValues,
} from '../../types/google-sheet.type';
import lodash from 'lodash';
import {
  GoogleSheetOptions,
  GoogleSheetOutput,
} from '../../interfaces/google-sheet.interface';

jest.mock('@common/winston/winston.provider');

describe('GoogleSheet Retriever', () => {
  let retriever: GoogleSheetRetriever;
  let logger: WinstonProvider;
  let sheetService: sheets_v4.Resource$Spreadsheets;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WinstonProvider,
        {
          provide: GOOGLE_SHEET_SERVICE,
          useValue: {
            get: jest.fn(),
            values: {
              batchGet: jest.fn(),
            },
          },
        },
        GoogleSheetRetriever,
      ],
    }).compile();

    retriever = module.get<GoogleSheetRetriever>(GoogleSheetRetriever);
    logger = module.get<WinstonProvider>(WinstonProvider);
    sheetService =
      module.get<sheets_v4.Resource$Spreadsheets>(GOOGLE_SHEET_SERVICE);

    jest.clearAllMocks();
  });

  test('Should be defined', () => {
    expect(retriever).toBeDefined();
  });

  describe('When getSheets method called', () => {
    let returnValue: Array<sheets_v4.Schema$Sheet>;
    let sheetServiceResponse: GaxiosResponse<sheets_v4.Schema$Spreadsheet>;
    let spreadSheetID: string;

    beforeEach(async () => {
      spreadSheetID = 'test';
      sheetServiceResponse = {
        data: {
          sheets: [],
        },
        status: 200,
        statusText: 'OK',
        headers: undefined,
        config: undefined,
        request: undefined,
      };

      jest
        .spyOn(sheetService, 'get')
        .mockResolvedValueOnce(sheetServiceResponse as never);

      returnValue = await retriever['getSheets'](spreadSheetID);
    });

    test('Should be defined', () => {
      expect(retriever['getSheets']).toBeDefined();
    });

    test('Should call get method from sheet service', () => {
      expect(sheetService.get).toBeCalledWith({
        spreadsheetId: spreadSheetID,
      });
    });

    test('Should call debug method from logger', () => {
      expect(logger.debug).toBeCalledWith(
        'request method\n' +
          `input => ${JSON.stringify({ spreadsheet_id: spreadSheetID })}\n` +
          `response => ${JSON.stringify({
            status: sheetServiceResponse.status,
            body: sheetServiceResponse.data,
          })}\n`,
        GoogleSheetRetriever.name,
      );
    });

    test('Should return spreadsheet values', () => {
      expect(returnValue).toEqual(sheetServiceResponse.data.sheets);
    });
  });

  describe('When createRangesFromSheetsSchema method called', () => {
    let returnValue: Array<string>;
    let sheets: Array<sheets_v4.Schema$Sheet>;

    beforeAll(() => {
      sheets = [
        { properties: { title: 'test', gridProperties: { rowCount: 2 } } },
      ];

      returnValue = retriever['createRangesFromSheetsSchema'](sheets);
    });

    test('Should be defined', () => {
      expect(retriever['createRangesFromSheetsSchema']).toBeDefined();
    });

    test('Should return sheets ranges', () => {
      expect(returnValue).toEqual(["'test'!A1:B2"]);
    });
  });

  describe('When getSheetsValues method called', () => {
    let returnValue: Array<sheets_v4.Schema$ValueRange>;
    let sheetServiceResponse: GaxiosResponse<sheets_v4.Schema$BatchGetValuesResponse>;
    let spreadSheetID: string;
    let sheets: Array<sheets_v4.Schema$Sheet>;
    let ranges: Array<string>;

    beforeEach(async () => {
      ranges = [];
      spreadSheetID = 'test';
      sheetServiceResponse = {
        data: {
          valueRanges: [],
        },
        status: 200,
        statusText: 'OK',
        headers: undefined,
        config: undefined,
        request: undefined,
      };

      jest
        .spyOn(retriever as any, 'createRangesFromSheetsSchema')
        .mockReturnValue(ranges);
      jest
        .spyOn(sheetService.values, 'batchGet')
        .mockResolvedValueOnce(sheetServiceResponse as never);

      returnValue = await retriever['getSheetsValues'](spreadSheetID, sheets);
    });

    test('Should be defined', () => {
      expect(retriever['getSheetsValues']).toBeDefined();
    });

    test('Should call createRangesFromSheetsSchema method from retriever', () => {
      expect(retriever['createRangesFromSheetsSchema']).toBeCalledWith(sheets);
    });

    test('Should call batchGet method from sheetService.values', () => {
      expect(sheetService.values.batchGet).toBeCalledWith({
        spreadsheetId: spreadSheetID,
        ranges,
      });
    });

    test('Should call debug method from logger', () => {
      expect(logger.debug).toBeCalledWith(
        'request method\n' +
          `input => ${JSON.stringify({
            spreadsheet_id: spreadSheetID,
            sheets,
          })}\n` +
          `response => ${JSON.stringify({
            status: sheetServiceResponse.status,
            body: sheetServiceResponse.data,
          })}\n`,
        GoogleSheetRetriever.name,
      );
    });

    test('Should return sheets value', () => {
      expect(returnValue).toEqual(sheetServiceResponse.data.valueRanges);
    });
  });

  describe('When serializeSheetRowValues method called', () => {
    let returnValue: GoogleSheetSerializedValues;
    let columns_name: Array<GoogleSheetColumnsName>;
    let row_values: Array<any>;
    let returnFromZipObject: GoogleSheetSerializedValues;

    beforeEach(() => {
      columns_name = [];
      row_values = [];
      returnFromZipObject = {
        date: '2023-09-01',
        value: 'test',
      };

      jest.spyOn(lodash, 'zipObject').mockReturnValueOnce(returnFromZipObject);

      returnValue = retriever['serializeSheetRowValues'](
        columns_name,
        row_values,
      );
    });

    test('Should be defined', () => {
      expect(retriever['serializeSheetRowValues']).toBeDefined();
    });

    test('Should call zipObject method from lodash', () => {
      expect(lodash.zipObject).toBeCalledWith(columns_name, row_values);
    });

    test('Should return serialized row values', () => {
      expect(returnValue).toEqual(returnFromZipObject);
    });
  });

  describe('When columnsName method called', () => {
    let returnValue: Array<GoogleSheetColumnsName>;
    let sheet_values: any[][];

    beforeAll(() => {
      sheet_values = [[], []];

      returnValue = retriever['columnsName'](sheet_values);
    });

    test('Should be defined', () => {
      expect(retriever['columnsName']).toBeDefined();
    });

    test('Should return columns name', () => {
      expect(returnValue).toEqual(sheet_values[0]);
    });
  });

  describe('When latestRow method called', () => {
    let returnValue: Array<any>;
    let sheet_values: any[][];

    test('Should be defined', () => {
      expect(retriever['latestRow']).toBeDefined();
    });

    describe('If latest row index was gte than 1', () => {
      beforeAll(() => {
        sheet_values = [
          ['date', 'value'],
          ['2023-10-01', '23'],
        ];

        jest
          .spyOn(lodash, 'map')
          .mockReturnValueOnce(['2023-10-01', 23] as any);

        returnValue = retriever['latestRow'](sheet_values);
      });

      test('Should return latest row', () => {
        expect(returnValue).toEqual(['2023-10-01', 23]);
      });
    });

    describe('If latest row index was lt than 1', () => {
      beforeAll(() => {
        sheet_values = [['date', 'value']];

        returnValue = retriever['latestRow'](sheet_values);
      });

      test('Should return empty array', () => {
        expect(returnValue).toEqual([]);
      });
    });
  });

  describe('When serialize method called', () => {
    let returnValue: GoogleSheetOutput;
    let returnFromReduce: GoogleSheetOutput;
    let sheets: Array<sheets_v4.Schema$Sheet>;
    let sheets_values: Array<sheets_v4.Schema$ValueRange>;

    beforeEach(() => {
      sheets = [{}];
      sheets_values = [{}];
      returnFromReduce = {
        projects_working_in_open_count: undefined,
        projects_count: undefined,
        projects_gave_update_count: undefined,
        projects_delivering_impact: undefined,
        velocity_of_experiments: undefined,
        pocket_network_DNA_NPS: undefined,
        budget_spend_amount: undefined,
        total_budget_amount: undefined,
        voters_to_control_DAO_count: undefined,
        pokt_liquidity_amount: undefined,
        twitter_followers_count: undefined,
        community_NPS: undefined,
        voter_power_concentration_index: undefined,
      };

      jest.spyOn(lodash, 'reduce').mockReturnValueOnce(returnFromReduce);

      returnValue = retriever['serialize'](sheets, sheets_values);
    });

    test('Should be defined', () => {
      expect(retriever['serialize']).toBeDefined();
    });

    test('Should call reduce method from lodash', () => {
      expect(lodash.reduce).toBeCalledWith(
        sheets_values,
        expect.any(Function),
        {},
      );
    });

    test('Should return serialized google sheet output', () => {
      expect(returnValue).toEqual(returnFromReduce);
    });
  });

  describe('When retrieve method called', () => {
    let returnValue: GoogleSheetOutput;
    const returnFromSerialize: GoogleSheetOutput = {
      projects_working_in_open_count: undefined,
      projects_count: undefined,
      projects_gave_update_count: undefined,
      projects_delivering_impact: undefined,
      velocity_of_experiments: undefined,
      pocket_network_DNA_NPS: undefined,
      budget_spend_amount: undefined,
      total_budget_amount: undefined,
      voters_to_control_DAO_count: undefined,
      pokt_liquidity_amount: undefined,
      twitter_followers_count: undefined,
      community_NPS: undefined,
      voter_power_concentration_index: undefined,
    };
    const options: GoogleSheetOptions = {
      spreadSheetID: 'test',
    };
    const sheets: Array<sheets_v4.Schema$Sheet> = [{}];
    const sheets_values: Array<sheets_v4.Schema$ValueRange> = [{}];

    beforeEach(async () => {
      jest.spyOn(retriever as any, 'getSheets').mockResolvedValueOnce(sheets);
      jest
        .spyOn(retriever as any, 'getSheetsValues')
        .mockResolvedValueOnce(sheets_values);
      jest
        .spyOn(retriever as any, 'serialize')
        .mockReturnValueOnce(returnFromSerialize);

      returnValue = await retriever['retrieve'](options);
    });

    test('Should be defined', () => {
      expect(retriever['retrieve']).toBeDefined();
    });

    test.each`
      property             | inputs
      ${'getSheets'}       | ${[options.spreadSheetID]}
      ${'getSheetsValues'} | ${[options.spreadSheetID, sheets]}
      ${'serialize'}       | ${[sheets, sheets_values]}
    `('Should call $property method from retriever', ({ property, inputs }) => {
      expect(retriever[property]).toBeCalledWith(...inputs);
    });

    test('Should return google sheet output', () => {
      expect(returnValue).toEqual(returnFromSerialize);
    });
  });
});
