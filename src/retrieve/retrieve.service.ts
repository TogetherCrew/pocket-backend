import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CoinGeckoRetriever } from './retriever/retrievers/coin-gecko.retriever';
import { SnapShotRetriever } from './retriever/retrievers/snap-shot.retriever';
import { GoogleSheetRetriever } from './retriever/retrievers/google-sheet.retriever';
import { PoktScanRetriever } from './retriever/retrievers/pokt-scan.retriever';
import { SnapShotOptions } from './retriever/interfaces/snap-shot.interface';
import { GoogleSheetOptions } from './retriever/interfaces/google-sheet.interface';
import { PoktScanOptions } from './retriever/interfaces/pokt-scan.interface';
import { WinstonProvider } from '@common/winston/winston.provider';
import { Retrievers } from './retriever/types/common.type';
import { RETRIEVERS } from './retriever/retriever.constant';
import {
  CompoundMetricsOutput,
  EssentialMetricsOutputs,
  RetrieversConfig,
} from './types/retrieve.type';
import { defaults, map, reduce } from 'lodash';
import moment from 'moment';
import { AggregationService } from './aggregation.service';
import { StoreService } from './store.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RetrieveService {
  constructor(
    @Inject(RETRIEVERS)
    private readonly retrievers: Retrievers,
    private readonly logger: WinstonProvider,
    private readonly aggregationService: AggregationService,
    private readonly storeService: StoreService,
    private readonly config: ConfigService,
  ) {}

  private currentYesterdayDateTime() {
    return moment().utc().add(-1, 'day');
  }

  private startOfYesterday() {
    return this.currentYesterdayDateTime().startOf('day').toISOString();
  }

  private endOfYesterday() {
    return this.currentYesterdayDateTime().endOf('day').toISOString();
  }

  private getSnapShotOptions(): SnapShotOptions {
    return {
      spaceID: 'poktdao.eth',
    };
  }

  private getGoogleSheetOptions(): GoogleSheetOptions {
    return {
      spreadSheetID: this.config.get<string>('GOOGLE_SPREAD_SHEET_ID'),
    };
  }

  private getPoktScanOptions(): PoktScanOptions {
    return {
      start_date: this.startOfYesterday(),
      end_date: this.endOfYesterday(),
      date_format: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
      unit_time: 'day',
      interval: 1,
      pagination: {
        filter: {
          operator: 'AND',
          properties: [
            {
              operator: 'IN',
              property: 'address',
              type: 'STRING',
              value: '["6386713deb27b609daad5e2e32ee6591753e5f4e"]',
            },
            {
              operator: 'GTE',
              property: 'parse_time',
              type: 'DATE',
              value: this.startOfYesterday(),
            },
          ],
        },
        limit: 1,
      },
    };
  }

  private generateRetrieversConfig(): RetrieversConfig {
    const retrieversConfig: RetrieversConfig = [];

    for (let index = 0; index < this.retrievers.length; index++) {
      const retriever = this.retrievers[index];

      if (retriever instanceof CoinGeckoRetriever) {
        retrieversConfig.push({
          promise: retriever.retrieve(),
          retrieverName: CoinGeckoRetriever.name,
          retrieverOutput: 'coinGeckoOutput',
        });
      } else if (retriever instanceof PoktScanRetriever) {
        retrieversConfig.push({
          promise: retriever.retrieve(this.getPoktScanOptions()),
          retrieverName: PoktScanRetriever.name,
          retrieverOutput: 'poktScanOutput',
        });
      } else if (retriever instanceof SnapShotRetriever) {
        retrieversConfig.push({
          promise: retriever.retrieve(this.getSnapShotOptions()),
          retrieverName: SnapShotRetriever.name,
          retrieverOutput: 'snapShotOutput',
        });
      } else if (retriever instanceof GoogleSheetRetriever) {
        retrieversConfig.push({
          promise: retriever.retrieve(this.getGoogleSheetOptions()),
          retrieverName: GoogleSheetRetriever.name,
          retrieverOutput: 'googleSheetOutput',
        });
      } else {
        throw new Error('Unknown retriever exists in retrievers list');
      }
    }

    return retrieversConfig;
  }

  private calculateCompoundMetricsOutput(
    date: string,
    essentialMetricsOutputs: EssentialMetricsOutputs,
  ): CompoundMetricsOutput {
    const aggregationServiceProxy = this.aggregationService;

    return {
      dao_treasury: this.aggregationService.daoTreasury(
        essentialMetricsOutputs?.poktScanOutput?.DAO_total_balance,
        essentialMetricsOutputs?.coinGeckoOutput?.pokt_price,
      ),
      protocol_revenue: this.aggregationService.protocolRevenue(
        essentialMetricsOutputs?.poktScanOutput?.token_burn,
        essentialMetricsOutputs?.coinGeckoOutput?.pokt_price,
      ),
      get annualised_yield() {
        return aggregationServiceProxy.annualisedYield(
          this.protocol_revenue,
          essentialMetricsOutputs?.poktScanOutput?.circulating_supply,
        );
      },
      get coverage_ratio() {
        return aggregationServiceProxy.coverageRatio(
          this.protocol_revenue,
          essentialMetricsOutputs?.poktScanOutput?.token_issuance,
        );
      },
      voter_participation_ratio:
        this.aggregationService.voterParticipationRatio(
          essentialMetricsOutputs?.snapShotOutput?.votes_count,
          essentialMetricsOutputs?.snapShotOutput?.voters_count,
        ),
      percentage_of_projects_self_reporting:
        this.aggregationService.percentageOfProjectsSelfReporting(
          date,
          essentialMetricsOutputs?.googleSheetOutput
            ?.projects_gave_update_count,
          essentialMetricsOutputs?.googleSheetOutput?.projects_count,
        ),
      get dao_governance_asset_value() {
        return aggregationServiceProxy.daoGovernanceAssetValue(
          this.voter_participation_ratio,
          this.dao_treasury,
          essentialMetricsOutputs?.googleSheetOutput
            ?.voter_power_concentration_index.value,
        );
      },
    };
  }

  @Cron(CronExpression.EVERY_HOUR)
  async retrieveAndStoreMetricsValue() {
    try {
      this.logger.log(
        'Retrieve and store metrics value started...',
        RetrieveService.name,
      );

      const checkingDateTime = this.startOfYesterday();
      // Calculate essential metrics
      const retrieversConfig = this.generateRetrieversConfig();
      const essentialMetricsOutputs = reduce(
        await Promise.allSettled(
          map(retrieversConfig, (retrieverConfig) => retrieverConfig.promise),
        ),
        (previous, current, index) => {
          if (current.status === 'rejected') {
            if (current.reason instanceof Error) {
              this.logger.error(
                current.reason.message,
                retrieversConfig[index].retrieverName,
                {
                  stack: current.reason.stack,
                },
              );
            } else {
              this.logger.error(current.reason, retrieversConfig[index]);
            }

            return defaults(
              { [retrieversConfig[index].retrieverOutput]: undefined },
              previous,
            );
          } else {
            return defaults(
              { [retrieversConfig[index].retrieverOutput]: current.value },
              previous,
            );
          }
        },
        {} as EssentialMetricsOutputs,
      );

      this.logger.debug(
        `Essential metrics: ${JSON.stringify(essentialMetricsOutputs)}`,
        RetrieveService.name,
      );

      // Calculate compound metrics output
      const compoundMetricsOutput = this.calculateCompoundMetricsOutput(
        checkingDateTime,
        essentialMetricsOutputs,
      );

      this.logger.debug(
        `Compound metrics: ${JSON.stringify(compoundMetricsOutput)}`,
        RetrieveService.name,
      );

      // Store essential and compound metrics
      await Promise.all([
        this.storeService.storeLatestCoinGeckoMetrics(
          checkingDateTime,
          essentialMetricsOutputs.coinGeckoOutput,
        ),
        this.storeService.storeLatestSnapShotMetrics(
          checkingDateTime,
          essentialMetricsOutputs.snapShotOutput,
        ),
        this.storeService.storeLatestPoktScanMetrics(
          checkingDateTime,
          essentialMetricsOutputs.poktScanOutput,
        ),
        this.storeService.storeLatestGoogleSheetMetrics(
          essentialMetricsOutputs.googleSheetOutput,
        ),
        this.storeService.storeLatestCompoundMetrics(
          checkingDateTime,
          compoundMetricsOutput,
        ),
      ]);

      this.logger.log(
        'Retrieve and store metrics value finished...',
        RetrieveService.name,
      );
    } catch (error) {
      this.logger.error(error.message, RetrieveService.name, {
        stack: error.stack,
      });
    }
  }
}
