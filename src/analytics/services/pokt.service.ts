import { Injectable } from '@nestjs/common';
import { TimePeriod } from '../types/common.type';
import { CompoundMetrics } from '@common/database/schemas/compound-metrics.schema';
import { GoogleSheet } from '@common/database/schemas/google-sheet.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CommonService } from './common.service';
import {
  AnnualizedYieldMetricResponse,
  CoverageRatioMetricResponse,
  LiquidityMetricResponse,
} from '../types/pokt.type';

@Injectable()
export class PoktService {
  constructor(
    private readonly commonService: CommonService,

    @InjectModel(GoogleSheet.name)
    private readonly googleModel: Model<GoogleSheet>,
    @InjectModel(CompoundMetrics.name)
    private readonly compoundModel: Model<CompoundMetrics>,
  ) {}

  async getLiquidityMetric(
    timePeriod: TimePeriod,
  ): Promise<LiquidityMetricResponse> {
    const dateTimeRange =
      this.commonService.dateTimeRangeFromTimePeriod(timePeriod);

    const googleMetrics = await this.googleModel.find({
      metric_name: 'pokt_liquidity_amount',
      date: {
        $gte: new Date(dateTimeRange.start),
        $lte: new Date(dateTimeRange.end),
      },
    });

    return {
      metrics: {
        POKT_liquidity: {
          values:
            this.commonService.serializeToBarChartMetricValues(googleMetrics),
        },
      },
    };
  }

  async getCoverageRatioMetric(
    timePeriod: TimePeriod,
  ): Promise<CoverageRatioMetricResponse> {
    const dateTimeRange =
      this.commonService.dateTimeRangeFromTimePeriod(timePeriod);

    const compoundMetrics = await this.compoundModel.find({
      metric_name: 'coverage_ratio',
      date: {
        $gte: new Date(dateTimeRange.start),
        $lte: new Date(dateTimeRange.end),
      },
    });

    return {
      metrics: {
        coverage_ratio: {
          values:
            this.commonService.serializeToBarChartMetricValues(compoundMetrics),
        },
      },
    };
  }

  async getAnnualizedYieldMetric(
    timePeriod: TimePeriod,
  ): Promise<AnnualizedYieldMetricResponse> {
    const dateTimeRange =
      this.commonService.dateTimeRangeFromTimePeriod(timePeriod);

    const compoundMetrics = await this.compoundModel.find({
      metric_name: 'annualised_yield',
      date: {
        $gte: new Date(dateTimeRange.start),
        $lte: new Date(dateTimeRange.end),
      },
    });

    return {
      metrics: {
        annualised_yield: {
          values:
            this.commonService.serializeToBarChartMetricValues(compoundMetrics),
        },
      },
    };
  }
}
