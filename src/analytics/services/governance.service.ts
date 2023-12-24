import { Injectable } from '@nestjs/common';
import { TimePeriod } from '../types/common.type';
import { CommonService } from './common.service';
import { CompoundMetrics } from '@common/database/schemas/compound-metrics.schema';
import { GoogleSheet } from '@common/database/schemas/google-sheet.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BarChartMetricValue } from '../interfaces/common.interface';

import { map } from 'lodash';
import {
  CollaborationMetricsResponse,
  DaoGovernanceMetricsResponse,
  NakamotoCoefficientMetricsResponse,
} from '../types/governance.type';
import { PoktScan } from '@common/database/schemas/pokt-scan.schema';

@Injectable()
export class GovernanceService {
  constructor(
    private readonly commonService: CommonService,

    @InjectModel(GoogleSheet.name)
    private readonly googleModel: Model<GoogleSheet>,
    @InjectModel(CompoundMetrics.name)
    private readonly compoundModel: Model<CompoundMetrics>,
    @InjectModel(PoktScan.name)
    private readonly poktscanModel: Model<PoktScan>,
  ) {}
  async getNakamotoCoefficientMetrics(
    timePeriod: TimePeriod,
  ): Promise<NakamotoCoefficientMetricsResponse> {
    const dateTimeRange =
      this.commonService.dateTimeRangeFromTimePeriod(timePeriod);

    const [googleMetrics, poktMetrics] = await Promise.all([
      this.googleModel
        .find({
          metric_name: 'voters_to_control_DAO_count',
          date: {
            $gte: new Date(dateTimeRange.start),
            $lte: new Date(dateTimeRange.end),
          },
        })
        .sort({ date: 1 }),
      this.poktscanModel
        .find(
          {
            date: {
              $gte: new Date(dateTimeRange.start),
              $lte: new Date(dateTimeRange.end),
            },
            validators_to_control_protocol_count: { $ne: null },
          },
          ['date', 'validators_to_control_protocol_count'],
        )
        .sort({ date: 1 }),
    ]);

    const validatorsToControlProtocolValues: Array<BarChartMetricValue> = map(
      poktMetrics,
      (metric) => {
        return {
          date: metric.date.toISOString(),
          value: metric.validators_to_control_protocol_count,
        };
      },
    );

    return {
      metrics: {
        validators_to_control_protocol: {
          values: validatorsToControlProtocolValues,
        },
        voters_to_control_DAO: {
          values:
            this.commonService.serializeToBarChartMetricValues(googleMetrics),
        },
      },
    };
  }

  async getDaoGovernanceMetrics(
    timePeriod: TimePeriod,
  ): Promise<DaoGovernanceMetricsResponse> {
    const dateTimeRange =
      this.commonService.dateTimeRangeFromTimePeriod(timePeriod);

    const metrics = await this.compoundModel
      .find({
        metric_name: { $in: ['dao_treasury', 'dao_governance_asset_value'] },
        date: {
          $gte: new Date(dateTimeRange.start),
          $lte: new Date(dateTimeRange.end),
        },
      })
      .sort({ date: 1 });

    const serializedMetrics =
      this.commonService.serializeToBarChartMetricsValues(metrics);

    return {
      metrics: {
        DAO_governance_asset_value: {
          values: serializedMetrics['dao_governance_asset_value'] || [],
        },
        DAO_treasury: {
          values: serializedMetrics['dao_treasury'] || [],
        },
      },
    };
  }

  async getCollaborationMetrics(
    timePeriod: TimePeriod,
  ): Promise<CollaborationMetricsResponse> {
    const dateTimeRange =
      this.commonService.dateTimeRangeFromTimePeriod(timePeriod);

    const googleMetrics = await this.googleModel
      .find({
        metric_name: { $in: ['no_proposals_core', 'no_proposals_community'] },
        date: {
          $gte: new Date(dateTimeRange.start),
          $lte: new Date(dateTimeRange.end),
        },
      })
      .sort({ date: 1 });

    return {
      metrics: {
        proposals_from_community_v_core_contributors: {
          values: this.commonService.serializeToStackedChartMetricValues(
            googleMetrics,
            {
              no_proposals_core: 'Core contributors',
              no_proposals_community: 'Proposals from community',
            },
          ),
        },
      },
    };
  }
}
