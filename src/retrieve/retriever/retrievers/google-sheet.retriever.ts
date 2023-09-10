import { Injectable } from '@nestjs/common';
import { BaseRetriever } from '../interfaces/common.interface';
import {
  GoogleSheetOptions,
  GoogleSheetOutput,
} from '../interfaces/google-sheet.interface';
import { google, sheets_v4 } from 'googleapis';
import { ConfigService } from '@nestjs/config';
import { defaults, reduce, zipObject } from 'lodash';
import {
  GoogleSheetSerializedValues,
  GoogleSheetColumnsName,
} from '../types/google-sheet.type';
import { WinstonProvider } from '@common/winston/winston.provider';

@Injectable()
export class GoogleSheetRetriever
  implements BaseRetriever<GoogleSheetOptions, GoogleSheetOutput>
{
  constructor(
    private readonly config: ConfigService,
    private readonly logger: WinstonProvider,
  ) {}

  private request() {
    const service = google.sheets({
      version: 'v4',
      auth: this.config.get<string>('GOOGLE_SHEET_API_KEY'),
    });

    return service.spreadsheets;
  }

  private async getSheets(spreadsheet_id: string) {
    const response = await this.request().get({
      spreadsheetId: spreadsheet_id,
    });

    this.logger.debug(
      'request method\n' +
        `input => ${JSON.stringify({ spreadsheet_id })}\n` +
        `response => ${JSON.stringify({
          status: response.status,
          body: response.data,
        })}\n`,
      GoogleSheetRetriever.name,
    );

    return response.data.sheets;
  }

  private createRangesFromSheetsSchema(
    sheets: Array<sheets_v4.Schema$Sheet>,
  ): Array<string> {
    const ranges: Array<string> = [];

    for (let index = 0; index < sheets.length; index++) {
      const sheetProperties = sheets[index].properties;
      const sheetTitle = sheetProperties.title;
      const rowsCount = sheetProperties.gridProperties.rowCount;

      ranges.push(`'${sheetTitle}'!A1:B${rowsCount}`);
    }

    return ranges;
  }

  private async getSheetsValues(
    spreadsheet_id: string,
    sheets: Array<sheets_v4.Schema$Sheet>,
  ) {
    const ranges = this.createRangesFromSheetsSchema(sheets);
    const response = await this.request().values.batchGet({
      spreadsheetId: spreadsheet_id,
      ranges,
    });

    this.logger.debug(
      'request method\n' +
        `input => ${JSON.stringify({ spreadsheet_id, sheets })}\n` +
        `response => ${JSON.stringify({
          status: response.status,
          body: response.data,
        })}\n`,
      GoogleSheetRetriever.name,
    );

    return response.data.valueRanges;
  }

  private serializeSheetRowValues(
    columns_name: Array<GoogleSheetColumnsName>,
    row_values: Array<any>,
  ): GoogleSheetSerializedValues {
    return zipObject(columns_name, row_values) as GoogleSheetSerializedValues;
  }

  private columnsName(sheet_values: any[][]): Array<GoogleSheetColumnsName> {
    return sheet_values[0];
  }

  private latestRow(sheet_values: any[][]): Array<any> {
    const latestRowIndex = sheet_values.length - 1;

    return sheet_values[latestRowIndex];
  }

  private serialize(
    sheets: Array<sheets_v4.Schema$Sheet>,
    sheets_values: Array<sheets_v4.Schema$ValueRange>,
  ): GoogleSheetOutput {
    return reduce(
      sheets_values,
      (previous, current, index) => {
        const sheetValues = current.values;
        const sheetTitle = sheets[index].properties.title;

        return defaults(
          {
            [sheetTitle]: this.serializeSheetRowValues(
              this.columnsName(sheetValues),
              this.latestRow(sheetValues),
            ),
          },
          previous,
        );
      },
      {} as GoogleSheetOutput,
    );
  }

  async retrieve(options: GoogleSheetOptions): Promise<GoogleSheetOutput> {
    const sheets = await this.getSheets(options.spreadSheetID);
    const response = await this.getSheetsValues(options.spreadSheetID, sheets);

    return this.serialize(sheets, response);
  }
}
