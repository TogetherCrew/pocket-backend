import { Injectable } from '@nestjs/common';
import { TimePeriod } from '../types/common.type';
import { CommonService } from './common.service';
import { InjectModel } from '@nestjs/mongoose';
import { GoogleSheet } from '@common/database/schemas/google-sheet.schema';
import { Model } from 'mongoose';
import {
  CycleRanges,
  NumberTypeMetricResponse,
} from '../interfaces/common.interface';
import { CompoundMetrics } from '@common/database/schemas/compound-metrics.schema';
import moment from 'moment';
import {
  AdaptabilityMetricsResponse,
  AwarenessMetricsResponse,
  CommunityCollaborationMetricsResponse,
  TransparencyMetricsResponse,
} from '../types/community.type';
import { SnapShot } from '@common/database/schemas/snap-shot.schema';

@Injectable()
export class CommunityService {
  constructor(
    private readonly commonService: CommonService,

    @InjectModel(GoogleSheet.name)
    private readonly googleModel: Model<GoogleSheet>,
    @InjectModel(CompoundMetrics.name)
    private readonly compoundModel: Model<CompoundMetrics>,
    @InjectModel(SnapShot.name)
    private readonly snapShotModel: Model<SnapShot>,
  ) {}

  private calculateProjectsDeliveringImpactProps<T>(
    metricValues: Array<T>,
    cycleRanges: CycleRanges,
  ): NumberTypeMetricResponse {
    let currentCycleDeliveringImpactAvg = 0;
    let currentCycleDeliveringImpactCount = 0;
    let previousCycleDeliveringImpactAvg = 0;
    let previousCycleDeliveringImpactCount = 0;

    for (let index = 0; index < metricValues.length; index++) {
      const date = metricValues[index]['date'];
      const value = metricValues[index]['metric_value'];

      if (
        moment(date.toISOString()).isBetween(
          cycleRanges.current.start,
          cycleRanges.current.end,
          'day',
          '[]',
        )
      ) {
        // Recalculating average based on previous members' average and a new member
        currentCycleDeliveringImpactAvg =
          (currentCycleDeliveringImpactCount * currentCycleDeliveringImpactAvg +
            value) /
          (currentCycleDeliveringImpactCount + 1);

        currentCycleDeliveringImpactCount += 1;
      } else {
        // Recalculating average based on previous members' average and a new member
        previousCycleDeliveringImpactAvg =
          (previousCycleDeliveringImpactCount *
            previousCycleDeliveringImpactAvg +
            value) /
          (previousCycleDeliveringImpactCount + 1);

        previousCycleDeliveringImpactCount += 1;
      }
    }

    const changeCycleDeliveringImpactAvg =
      (currentCycleDeliveringImpactAvg - previousCycleDeliveringImpactAvg) /
      currentCycleDeliveringImpactAvg;

    return {
      value: currentCycleDeliveringImpactAvg,
      previous: previousCycleDeliveringImpactAvg || null,
      change: changeCycleDeliveringImpactAvg || 0,
    };
  }

  async getCommunityCollaborationMetrics(
    timePeriod: TimePeriod,
  ): Promise<CommunityCollaborationMetricsResponse> {
    const dateTimeRange =
      this.commonService.dateTimeRangeFromTimePeriod(timePeriod);
    const lastTwoMonthsCycleRanges =
      this.commonService.lastTwoMonthsCycleRanges();

    const [NPSMetrics, deliveringImpactMetricValues] = await Promise.all([
      this.googleModel
        .find({
          metric_name: { $in: ['pocket_network_DNA_NPS', 'community_NPS'] },
          date: {
            $gte: new Date(dateTimeRange.start),
            $lte: new Date(dateTimeRange.end),
          },
        })
        .sort({ date: 1 }),
      this.googleModel
        .find({
          metric_name: 'projects_delivering_impact',
          date: {
            $gte: new Date(lastTwoMonthsCycleRanges.previous.start),
            $lte: new Date(lastTwoMonthsCycleRanges.current.end),
          },
        })
        .sort({ date: 1 }),
    ]);

    const ecosystemProjectsDeliveringImpact =
      this.calculateProjectsDeliveringImpactProps(
        deliveringImpactMetricValues,
        lastTwoMonthsCycleRanges,
      );
    const serializedNPSMetrics =
      this.commonService.serializeToBarChartMetricsValues(NPSMetrics);

    return {
      metrics: {
        ecosystem_projects_delivering_impact: ecosystemProjectsDeliveringImpact,
        pocket_network_DNA_NPS: {
          values: serializedNPSMetrics['pocket_network_DNA_NPS'] || [],
        },
        community_NPS: {
          values: serializedNPSMetrics['community_NPS'] || [],
        },
      },
    };
  }

  async getAwarenessMetrics(
    timePeriod: TimePeriod,
  ): Promise<AwarenessMetricsResponse> {
    const dateTimeRange =
      this.commonService.dateTimeRangeFromTimePeriod(timePeriod);

    const metrics = await this.googleModel
      .find({
        metric_name: 'twitter_followers_count',
        date: {
          $gte: new Date(dateTimeRange.start),
          $lte: new Date(dateTimeRange.end),
        },
      })
      .sort({ date: 1 });

    return {
      metrics: {
        twitter_followers: {
          values: this.commonService.serializeToBarChartMetricValues(metrics),
        },
      },
    };
  }

  async getTransparencyMetrics(
    timePeriod: TimePeriod,
  ): Promise<TransparencyMetricsResponse> {
    const dateTimeRange =
      this.commonService.dateTimeRangeFromTimePeriod(timePeriod);
    const lastMonthRange =
      this.commonService.dateTimeRangeFromTimePeriod('last-month');

    const [googleMetrics, compoundMetrics] = await Promise.all([
      this.googleModel
        .find({
          metric_name: 'projects_working_in_open_count',
          date: {
            $gte: new Date(dateTimeRange.start),
            $lte: new Date(dateTimeRange.end),
          },
        })
        .sort({ date: 1 }),
      this.compoundModel
        .find({
          metric_name: 'percentage_of_projects_self_reporting',
          date: {
            $gte: new Date(lastMonthRange.start),
            $lte: new Date(lastMonthRange.end),
          },
        })
        .sort({ date: 1 }),
    ]);

    return {
      metrics: {
        projects_working_in_the_open: {
          values:
            this.commonService.serializeToBarChartMetricValues(googleMetrics),
        },
        percentage_of_projects_self_reporting: {
          values:
            this.commonService.serializeToBarChartMetricValues(compoundMetrics),
        },
      },
    };
  }

  async getAdaptabilityMetrics(
    timePeriod: TimePeriod,
  ): Promise<AdaptabilityMetricsResponse> {
    const dateTimeRange =
      this.commonService.dateTimeRangeFromTimePeriod(timePeriod);

    const googleMetrics = await this.googleModel
      .find({
        metric_name: {
          $in: ['velocity_of_experiments', 'no_debated_proposals_count'],
        },
        date: {
          $gte: new Date(dateTimeRange.start),
          $lte: new Date(dateTimeRange.end),
        },
      })
      .sort({ date: 1 });

    return {
      metrics: {
        velocity_of_experiments_v_no_debated_proposals: {
          values:
            this.commonService.serializeToStackedChartMetricValues(
              googleMetrics,
            ),
        },
      },
    };
  }
}
