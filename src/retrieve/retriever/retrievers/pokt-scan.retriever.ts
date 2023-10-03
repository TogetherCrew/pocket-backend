import { Injectable } from '@nestjs/common';
import { BaseRetriever } from '../interfaces/common.interface';
import {
  PoktScanDAOTreasuryResponse,
  PoktScanDAOTreasuryVariables,
  PoktScanOptions,
  PoktScanOutput,
  PoktScanRecord,
  PoktScanStackedNodesResponse,
  PoktScanSupplyResponse,
  PoktScanSupplyVariables,
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

  private async request<T>(query: string, variables?: Record<string, any>) {
    const response = await firstValueFrom(
      this.axios.post<T>(
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

  private getDAOTreasuryGQLQuery(): string {
    return `
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
    }`;
  }

  private getSupplyGQLQuery(): string {
    return `
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
    }`;
  }

  private getStackedNodesGQLQuery(): string {
    return `
    query {
      stackedNodes: GetStakedNodesAndAppsByChain(input: {}) {
        chains: staked_by_chains {
          nodes_count: nodes    
        }
      }
    }`;
  }

  private reduceRecords(records: Array<PoktScanRecord>): number {
    let finalValue = 0;

    for (let index = 0; index < records.length; index++) {
      finalValue += records[index].amount;
    }

    return finalValue;
  }

  private async getDAOTreasuryProps(variables: PoktScanDAOTreasuryVariables) {
    const query = this.getDAOTreasuryGQLQuery();

    return this.request<PoktScanDAOTreasuryResponse>(query, variables);
  }

  private async getSupplyProps(variables: PoktScanSupplyVariables) {
    const query = this.getSupplyGQLQuery();

    return this.request<PoktScanSupplyResponse>(query, variables);
  }

  private async getStackedNodesProps() {
    const query = this.getStackedNodesGQLQuery();

    return this.request<PoktScanStackedNodesResponse>(query);
  }

  private calculateValidatorsCountToControlProtocol(
    chains: Array<{ nodes_count: number }>,
  ): number {
    const nodes_count = reduce(
      chains,
      (previous, current) => {
        return previous + current.nodes_count;
      },
      0,
    );

    if (nodes_count >= 1000) {
      return 660;
    } else {
      return Math.ceil(nodes_count * 0.66);
    }
  }

  private serializeResponse(
    DAO_treasury_response: PoktScanDAOTreasuryResponse,
    supply_response: PoktScanSupplyResponse,
    stacked_nodes_response: PoktScanStackedNodesResponse,
  ): PoktScanOutput {
    return {
      token_burn: supply_response.data.supply.token_burn.amount,
      token_issuance: supply_response.data.supply.token_issuance.amount,
      circulating_supply: this.reduceRecords(
        supply_response.data.circulating_supply.points,
      ),
      income: this.reduceRecords(DAO_treasury_response.data.incomes.points),
      expense: this.reduceRecords(DAO_treasury_response.data.expenses.points),
      validators_to_control_protocol_count:
        this.calculateValidatorsCountToControlProtocol(
          stacked_nodes_response.data.stackedNodes.chains,
        ),
    };
  }

  private serializeDAOTreasuryVariables(
    options: PoktScanOptions,
  ): PoktScanDAOTreasuryVariables {
    return {
      listSummaryInput: {
        start_date: options.start_date,
        end_date: options.end_date,
        date_format: options.date_format,
        ...(options.interval && { interval: options.interval }),
        ...(options.unit_time && { unit_time: options.unit_time }),
        ...(options.exclusive_date && {
          exclusive_date: options.exclusive_date,
        }),
      },
    };
  }

  private serializeSupplyVariables(
    options: PoktScanOptions,
  ): PoktScanSupplyVariables {
    return {
      supplyInput: {
        start_date: options.start_date,
        date_format: options.date_format,
      },
      listSummaryInput: {
        start_date: options.start_date,
        end_date: options.end_date,
        date_format: options.date_format,
        ...(options.interval && { interval: options.interval }),
        ...(options.unit_time && { unit_time: options.unit_time }),
        ...(options.exclusive_date && {
          exclusive_date: options.exclusive_date,
        }),
      },
    };
  }

  async retrieve(options: PoktScanOptions): Promise<PoktScanOutput> {
    const DAOTreasuryVariables = this.serializeDAOTreasuryVariables(options);
    const supplyVariables = this.serializeSupplyVariables(options);

    const [DAOTreasuryResponse, supplyResponse, stackedNodesResponse] =
      await Promise.all([
        this.getDAOTreasuryProps(DAOTreasuryVariables),
        this.getSupplyProps(supplyVariables),
        this.getStackedNodesProps(),
      ]);

    return this.serializeResponse(
      DAOTreasuryResponse,
      supplyResponse,
      stackedNodesResponse,
    );
  }
}
