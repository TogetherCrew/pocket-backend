import { Injectable } from '@nestjs/common';
import { BaseRetriever } from '../interfaces/common.interface';
import {
  PoktScanDAOTreasuryResponse,
  PoktScanDAOTreasuryVariables,
  PoktScanLargestNodeRunnersResponse,
  PoktScanOptions,
  PoktScanOutput,
  PoktScanRecord,
  PoktScanSupplyResponse,
  PoktScanSupplyVariables,
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
    query daoTreasury($pagination: ListInput) {
      DAO_total_balance: ListPoktAccount(pagination: $pagination) {
        items {
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

  private getLargestNodeRunnersGQLQuery(): string {
    return `
    query ListLargestNodeRunners {
      ListLargestNodeRunners(input: { sort_by: validators }) {
        items {
          service_domain
          validators
        }
      }
    }`;
  }

  private reduceRecords(records: Array<Partial<PoktScanRecord>>): number {
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

  private async getLargestNodeRunnersProps() {
    const query = this.getLargestNodeRunnersGQLQuery();

    return this.request<PoktScanLargestNodeRunnersResponse>(query);
  }

  private calculateValidatorsCountToControlProtocol(
    items: Array<{ service_domain: string; validators: number }>,
  ): number {
    let node_count = 0;

    for (
      let index = 0, validators = 0;
      index < items.length && validators < 667;
      index++
    ) {
      const node_validators = items[index].validators;

      validators += node_validators;
      node_count += 1;
    }

    return node_count;
  }

  private serializeFloatValue(amount: number): number {
    return amount / 1000000;
  }

  private serializeResponse(
    DAO_treasury_response: PoktScanDAOTreasuryResponse,
    supply_response: PoktScanSupplyResponse,
    stacked_nodes_response: PoktScanLargestNodeRunnersResponse,
  ): PoktScanOutput {
    return {
      DAO_total_balance: this.serializeFloatValue(
        this.reduceRecords(DAO_treasury_response.data.DAO_total_balance.items),
      ),
      token_burn: this.serializeFloatValue(
        supply_response.data.supply.token_burn.amount,
      ),
      token_issuance: this.serializeFloatValue(
        supply_response.data.supply.token_issuance.amount,
      ),
      circulating_supply: this.serializeFloatValue(
        this.reduceRecords(supply_response.data.circulating_supply.points),
      ),
      validators_to_control_protocol_count:
        this.calculateValidatorsCountToControlProtocol(
          stacked_nodes_response.data.ListLargestNodeRunners.items,
        ),
    };
  }

  private serializeDAOTreasuryVariables(
    options: PoktScanOptions,
  ): PoktScanDAOTreasuryVariables {
    return {
      pagination: options.pagination,
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
        this.getLargestNodeRunnersProps(),
      ]);

    return this.serializeResponse(
      DAOTreasuryResponse,
      supplyResponse,
      stackedNodesResponse,
    );
  }
}
