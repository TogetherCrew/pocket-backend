import { CoinGecko } from '@common/database/schemas/coin-gecko.schema';
import { CompoundMetrics } from '@common/database/schemas/compound-metrics.schema';
import { GoogleSheet } from '@common/database/schemas/google-sheet.schema';
import { PoktScan } from '@common/database/schemas/pokt-scan.schema';
import { SnapShot } from '@common/database/schemas/snap-shot.schema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import moment from 'moment';
import { Model } from 'mongoose';
import { AggregationService } from './aggregation.service';
import { CoinGeckoOutput } from './retriever/interfaces/coin-gecko.interface';
import { GoogleSheetOutput } from './retriever/interfaces/google-sheet.interface';
import { PoktScanOutput } from './retriever/interfaces/pokt-scan.interface';
import { SnapShotOutput } from './retriever/interfaces/snap-shot.interface';
import { CompoundMetricsOutput } from './types/retrieve.type';
import { WinstonProvider } from '@common/winston/winston.provider';

@Injectable()
export class StoreService {
  constructor(
    private readonly logger: WinstonProvider,

    @InjectModel(CoinGecko.name)
    private readonly coinGeckoModel: Model<CoinGecko>,
    @InjectModel(SnapShot.name)
    private readonly snapShotModel: Model<SnapShot>,
    @InjectModel(GoogleSheet.name)
    private readonly googleSheetModel: Model<GoogleSheet>,
    @InjectModel(PoktScan.name)
    private readonly poktScanModel: Model<PoktScan>,
    @InjectModel(CompoundMetrics.name)
    private readonly compoundMetricsModel: Model<CompoundMetrics>,
  ) {}

  async storeLatestCoinGeckoMetrics(date: string, output: CoinGeckoOutput) {
    if (output !== undefined) {
      const metricsValue = await this.coinGeckoModel.findOne({ date });

      if (!metricsValue) {
        await (
          await this.coinGeckoModel.create({
            date,
            pokt_price: output.pokt_price,
          })
        ).save();

        this.logger.debug(
          `new values inserted in CoinGecko collection ${JSON.stringify({
            date,
            pokt_price: output.pokt_price,
          })}`,
          StoreService.name,
        );
      } else {
        this.logger.debug(
          `exists values for date(${date}) in CoinGecko collection`,
          StoreService.name,
        );
      }
    }
  }

  async storeLatestSnapShotMetrics(date: string, output: SnapShotOutput) {
    if (output !== undefined) {
      const metricsValue = await this.snapShotModel.findOne({ date });

      if (!metricsValue) {
        await (
          await this.snapShotModel.create({
            date,
            ...output,
          })
        ).save();

        this.logger.debug(
          `new values inserted in SnapShot collection ${JSON.stringify({
            date,
            ...output,
          })}`,
          StoreService.name,
        );
      } else {
        this.logger.debug(
          `exists values for date(${date}) in SnapShot collection`,
          StoreService.name,
        );
      }
    }
  }

  async storeLatestPoktScanMetrics(date: string, output: PoktScanOutput) {
    if (output !== undefined) {
      const metricsValue = await this.poktScanModel.findOne({ date });

      if (!metricsValue) {
        await (
          await this.poktScanModel.create({
            date,
            ...output,
          })
        ).save();

        this.logger.debug(
          `new values inserted in PoktScan collection ${JSON.stringify({
            date,
            ...output,
          })}`,
          StoreService.name,
        );
      } else {
        this.logger.debug(
          `exists values for date(${date}) in PoktScan collection`,
          StoreService.name,
        );
      }
    }
  }

  async storeLatestGoogleSheetMetrics(output: GoogleSheetOutput) {
    if (output !== undefined) {
      const newMetricsValue = [];

      for (const metricName in output) {
        if (Object.prototype.hasOwnProperty.call(output, metricName)) {
          const metricDate = output[metricName].date;
          const metricValue = output[metricName].value;

          if (
            metricValue !== undefined &&
            !(await this.googleSheetModel.findOne({
              date: metricDate,
              metric_name: metricName,
            }))
          ) {
            newMetricsValue.push({
              date: metricDate,
              metric_name: metricName,
              metric_value: metricValue,
            });
          } else {
            this.logger.debug(
              `exists values for date(${metricDate}) and metric(${metricName}) in GoogleSheet collection`,
              StoreService.name,
            );
          }
        }
      }

      if (newMetricsValue.length > 0) {
        await this.googleSheetModel.insertMany(newMetricsValue);

        this.logger.debug(
          `new values inserted in GoogleSheet collection ${JSON.stringify(
            newMetricsValue,
          )}`,
          StoreService.name,
        );
      }
    }
  }

  async replaceAllGoogleSheetMetrics(output: GoogleSheetOutput) {
    await this.googleSheetModel.deleteMany({}); //remove all existing documents

    for (const metricName in output) {
      const metricData = output[metricName];
      for await (const metric of metricData) {
        const metricDate = metric.date;
        const metricValue = metric.value;

        await this.googleSheetModel.create({
          date: metricDate,
          metric_name: metricName,
          metric_value: metricValue,
        });
      }
    }
  }

  async storeLatestCompoundMetrics(
    date: string,
    output: CompoundMetricsOutput,
  ) {
    const newMetricsValue = [];

    for (const metricName in output) {
      if (Object.prototype.hasOwnProperty.call(output, metricName)) {
        const metricValue = output[metricName];

        if (
          metricValue !== undefined &&
          !(await this.compoundMetricsModel.findOne({
            date,
            metric_name: metricName,
          }))
        ) {
          newMetricsValue.push({
            date,
            metric_name: metricName,
            metric_value: metricValue,
          });
        } else {
          this.logger.debug(
            `exists values for date(${date}) and metric(${metricName}) in CompoundMetrics collection`,
            StoreService.name,
          );
        }
      }
    }

    if (newMetricsValue.length > 0) {
      await this.compoundMetricsModel.insertMany(newMetricsValue);

      this.logger.debug(
        `new values inserted in CompoundMetrics collection ${JSON.stringify(
          newMetricsValue,
        )}`,
        AggregationService.name,
      );
    }
  }
}
