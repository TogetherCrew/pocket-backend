import { Injectable } from '@nestjs/common';
import { BaseRetriever } from '../interfaces/common.interface';
import {
  PoktScanOptions,
  PoktScanOutput,
  PoktScanResponse,
} from '../interfaces/pokt-scan.interface';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { WinstonProvider } from '@common/winston/winston.provider';

@Injectable()
export class PoktScanRetriever
  implements BaseRetriever<PoktScanOptions, PoktScanOutput>
{
  constructor(
    private readonly config: ConfigService,
    private readonly axios: HttpService,
    private readonly logger: WinstonProvider,
  ) {}

  private async request(query: string, variables: Record<string, any>) {
    this.logger.debug(
      `query: ${query}\nvariables: ${variables}`,
      PoktScanRetriever.name,
    );

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

    return response.data;
  }

  private getGQLQuery(): string {
    return `
    query poktScan($incomeAndExpenseInput: SummaryWithBlockInput!) {
      incomes: ListSummaryBetweenDates(input: $incomeAndExpenseInput) {
        points {
          point
          amount: total_dao_rewards
        }
      }
      expenses: ListDaoExpensesBetweenDates(input: $incomeAndExpenseInput) {
        points {
          point
          amount
        }
      }
    }
    `;
  }

  private serialize(response: PoktScanResponse): PoktScanOutput {
    return {};
  }

  async retrieve(options: PoktScanOptions): Promise<PoktScanOutput> {
    const query = this.getGQLQuery();
    const raw_metrics = await this.request(query, options);

    return this.serialize(raw_metrics);
  }
}
