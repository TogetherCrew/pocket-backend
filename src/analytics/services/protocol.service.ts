import { Injectable } from '@nestjs/common';
import { TimePeriod } from '../types/common.type';
import { CompoundMetrics } from '@common/database/schemas/compound-metrics.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CommonService } from './common.service';
import { DemandMetricsResponse } from '../types/protocol.type';
import { PoktScan } from '@common/database/schemas/pokt-scan.schema';
import { StackedChartMetricValue } from '../interfaces/common.interface';

@Injectable()
export class ProtocolService {
  constructor(
    private readonly commonService: CommonService,

    @InjectModel(CompoundMetrics.name)
    private readonly compoundModel: Model<CompoundMetrics>,
    @InjectModel(PoktScan.name)
    private readonly poktModel: Model<PoktScan>,
  ) {}

  async getDemandMetrics(
    timePeriod: TimePeriod,
  ): Promise<DemandMetricsResponse> {
    const dateTimeRange =
      this.commonService.dateTimeRangeFromTimePeriod(timePeriod);

    const [CompoundMetrics, PoktMetrics] = await Promise.all([
      this.compoundModel
        .find({
          metric_name: 'protocol_revenue',
          metric_value: { $ne: 0 },
          date: {
            $gte: new Date(dateTimeRange.start),
            $lte: new Date(dateTimeRange.end),
          },
        })
        .sort({ date: 1 }),
      this.poktModel
        .find(
          {
            date: {
              $gte: new Date(dateTimeRange.start),
              $lte: new Date(dateTimeRange.end),
            },
            groves_relays_percentage: { $ne: null },
            nodies_relays_percentage: { $ne: null },
          },
          ['date', 'groves_relays_percentage', 'nodies_relays_percentage'],
        )
        .sort({ date: 1 }),
    ]);

    const gatewayRelayValues: Array<StackedChartMetricValue> = [];

    for (let index = 0; index < PoktMetrics.length; index++) {
      const item = PoktMetrics[index];

      gatewayRelayValues.push({
        date: item.date.toISOString(),
        values: [
          {
            name: 'Groves',
            value: item.groves_relays_percentage,
          },
          {
            name: 'Nodies',
            value: item.nodies_relays_percentage,
          },
        ],
      });
    }

    return {
      metrics: {
        protocol_revenue: {
          values:
            this.commonService.serializeToBarChartMetricValues(CompoundMetrics),
        },
        gateway_operator_share_of_relays: {
          values: gatewayRelayValues,
        },
      },
    };
  }
}
