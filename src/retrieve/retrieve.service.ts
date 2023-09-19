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
  Outputs,
  RetrieversConfig,
} from './types/retrieve.type';
import { defaults, map, reduce } from 'lodash';
import moment from 'moment';
import { AggregationService } from './aggregation.service';
import { StoreService } from './store.service';

@Injectable()
export class RetrieveService {
  constructor(
    @Inject(RETRIEVERS)
    private readonly retrievers: Retrievers,
    private readonly logger: WinstonProvider,
    private readonly aggregationService: AggregationService,
    private readonly storeService: StoreService,
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
      spreadSheetID: '',
    };
  }

  private getPoktScanOptions(): PoktScanOptions {
    return {
      start_date: this.startOfYesterday(),
      end_date: this.endOfYesterday(),
      unit_time: 'day',
      interval: 1,
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
    outputs: Outputs,
  ): CompoundMetricsOutput {
    const aggregationServiceProxy = this.aggregationService;

    return {
      dao_treasury: this.aggregationService.daoTreasury(
        outputs.poktScanOutput.income,
        outputs.poktScanOutput.expense,
        outputs.coinGeckoOutput.pokt_price,
      ),
      protocol_revenue: this.aggregationService.protocolRevenue(
        outputs.poktScanOutput.token_burn,
        outputs.coinGeckoOutput.pokt_price,
      ),
      get annualised_yield() {
        return aggregationServiceProxy.annualisedYield(
          this.protocol_revenue,
          outputs.poktScanOutput.circulating_supply,
        );
      },
      get coverage_ratio() {
        return aggregationServiceProxy.coverageRatio(
          this.protocol_revenue,
          outputs.poktScanOutput.token_issuance,
        );
      },
      voter_participation_ratio:
        this.aggregationService.voterParticipationRatio(
          outputs.snapShotOutput.votes_count,
          outputs.snapShotOutput.voters_count,
        ),
      percentage_of_projects_self_reporting:
        this.aggregationService.percentageOfProjectsSelfReporting(
          'date',
          outputs.googleSheetOutput.projects_gave_update_count.value,
          outputs.googleSheetOutput.projects_count.value,
        ),
      get dao_governance_asset_value() {
        return aggregationServiceProxy.daoGovernanceAssetValue(
          this.voter_participation_ratio,
          this.dao_treasury,
          outputs.googleSheetOutput.voter_power_concentration_index.value,
        );
      },
    };
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async retrieveAndStoreMetricsValue() {
    try {
      this.logger.log(
        'Retrieve and store metrics value started...',
        RetrieveService.name,
      );

      const checkingDateTime = this.startOfYesterday();
      // Calculate essential metrics
      const retrieversConfig = this.generateRetrieversConfig();
      const outputs = reduce(
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
        {} as Outputs,
      );

      // Calculate compound metrics output
      const compoundMetricsOutput =
        this.calculateCompoundMetricsOutput(outputs);

      // Store essential and compound metrics
      await Promise.all([
        this.storeService.storeLatestCoinGeckoMetrics(
          checkingDateTime,
          outputs.coinGeckoOutput,
        ),
        this.storeService.storeLatestSnapShotMetrics(
          checkingDateTime,
          outputs.snapShotOutput,
        ),
        this.storeService.storeLatestPoktScanMetrics(
          checkingDateTime,
          outputs.poktScanOutput,
        ),
        this.storeService.storeLatestGoogleSheetMetrics(
          outputs.googleSheetOutput,
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
