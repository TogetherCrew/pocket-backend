import { Injectable } from '@nestjs/common';
import { BaseRetriever } from '../interfaces/common.interface';
import {
  PoktScanOptions,
  PoktScanOutput,
  PoktScanRecord,
  PoktScanResponse,
  PoktScanVariables,
} from '../interfaces/pokt-scan.interface';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { WinstonProvider } from '@common/winston/winston.provider';
import { reduce } from 'lodash';

@Injectable()
export class PoktScanRetriever
  implements BaseRetriever<PoktScanOptions, PoktScanOutput>
{
  constructor(
    private readonly config: ConfigService,
    private readonly axios: HttpService,
    private readonly logger: WinstonProvider,
  ) {}

  private async request(query: string, variables: PoktScanVariables) {
    const response = await firstValueFrom(
      this.axios.post<PoktScanResponse>(
        this.config.get<string>('POKT_SCAN_API_BASE_URL'),
        {
          query,
          variables,
        },
        {
          headers: {
            Authorization: this.config.get<string>('POKT_SCAN_API_TOKEN'),
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    this.logger.debug(
      'request method\n' +
        `input => ${JSON.stringify({ query, variables })}\n` +
        `response => ${JSON.stringify({
          status: response.status,
          body: response.data,
        })}\n`,
      PoktScanRetriever.name,
    );

    return response.data;
  }

  private getGQLQuery(): string {
    return `
    query poktscan(
      $listSummaryInput: SummaryWithBlockInput!
      $supplyInput: GetSupplySummaryFromStartDateInput!
    ) {
      incomes: ListSummaryBetweenDates(input: $listSummaryInput) {
        points {
          point
          amount: total_dao_rewards
        }
      }
      circulating_supply: ListSummaryBetweenDates(input: $listSummaryInput) {
        points {
          point
          amount: m0
        }
      }
      expenses: ListDaoExpensesBetweenDates(input: $listSummaryInput) {
        points {
          point
          amount
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
    }`;
  }

  private reduceRecords(records: Array<PoktScanRecord>): number {
    return reduce(
      records,
      (previous, current) => {
        return previous + current.amount;
      },
      0,
    );
  }

  private serializeResponse(response: PoktScanResponse): PoktScanOutput {
    return {
      token_burn: response.data.supply.token_burn.amount,
      token_issuance: response.data.supply.token_issuance.amount,
      circulating_supply: this.reduceRecords(
        response.data.circulating_supply.records,
      ),
      income: this.reduceRecords(response.data.incomes.records),
      expense: this.reduceRecords(response.data.expenses.records),
    };
  }

  private serializeOptions(options: PoktScanOptions): PoktScanVariables {
    return {
      supplyInput: {
        start_date: options.start_date,
      },
      listSummaryInput: {
        start_date: options.start_date,
        end_date: options.end_date,
        ...(options.interval && { interval: options.interval }),
        ...(options.unit_time && { unit_time: options.unit_time }),
        ...(options.exclusive_date && {
          exclusive_date: options.exclusive_date,
        }),
      },
    };
  }

  async retrieve(options: PoktScanOptions): Promise<PoktScanOutput> {
    const query = this.getGQLQuery();
    const variables = this.serializeOptions(options);

    const response = await this.request(query, variables);

    return this.serializeResponse(response);
  }
}
