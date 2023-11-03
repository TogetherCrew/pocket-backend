import { Injectable } from '@nestjs/common';
import { TimePeriod } from '../types/common.type';
import { BarChartMetricValue } from '../interfaces/common.interface';
import { CompoundMetrics } from '@common/database/schemas/compound-metrics.schema';
import { GoogleSheet } from '@common/database/schemas/google-sheet.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CommonService } from './common.service';
import {
  DemandMetricsResponse,
  ProtocolUpgradeMetricsResponse,
} from '../types/protocol.type';

@Injectable()
export class ProtocolService {
  constructor(
    private readonly commonService: CommonService,

    @InjectModel(GoogleSheet.name)
    private readonly googleModel: Model<GoogleSheet>,
    @InjectModel(CompoundMetrics.name)
    private readonly compoundModel: Model<CompoundMetrics>,
  ) {}

  async getProtocolUpgradeMetrics(): Promise<ProtocolUpgradeMetricsResponse> {
    const latestMetric = await this.googleModel
      .findOne({
        metric_name: 'v1_mainnet_launch_date',
      })
      .sort({ date: -1 });

    const v1MainnetLaunchDate = latestMetric
      ? String(latestMetric.metric_value)
      : undefined;

    return {
      metrics: {
        v1_mainnet_launch_date: {
          value: v1MainnetLaunchDate,
        },
      },
    };
  }

  async getDemandMetrics(
    timePeriod: TimePeriod,
  ): Promise<DemandMetricsResponse> {
    const dateTimeRange =
      this.commonService.dateTimeRangeFromTimePeriod(timePeriod);

    const CompoundMetrics = await this.compoundModel
      .find({
        metric_name: 'protocol_revenue',
        date: {
          $gte: new Date(dateTimeRange.start),
          $lte: new Date(dateTimeRange.end),
        },
      })
      .sort({ date: 1 });

    const datesInRange = this.commonService.enumerateDaysBetweenRange(
      dateTimeRange.start,
      dateTimeRange.end,
    );
    const gatewayOperatorShareOfRelays: Array<BarChartMetricValue> = [];

    for (let index = 0; index < datesInRange.length; index++) {
      const date = datesInRange[index];

      gatewayOperatorShareOfRelays.push({
        date,
        value: 1,
      });
    }

    return {
      metrics: {
        protocol_revenue: {
          values:
            this.commonService.serializeToBarChartMetricValues(CompoundMetrics),
        },
        gateway_operator_share_of_relays: {
          values: gatewayOperatorShareOfRelays,
        },
      },
    };
  }
}
