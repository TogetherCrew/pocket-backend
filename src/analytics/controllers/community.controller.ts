import { Controller, Get, ParseEnumPipe, Query } from '@nestjs/common';
import { CommunityService } from '../services/community.service';
import { TimePeriod, TimePeriodEnum } from '../types/common.type';

@Controller('metrics/community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('community-collaboration')
  getCommunityCollaborationMetrics(
    @Query('time_period', new ParseEnumPipe(TimePeriodEnum))
    timePeriod: TimePeriod,
  ) {
    return this.communityService.getCommunityCollaborationMetrics(timePeriod);
  }

  @Get('awareness')
  getAwarenessMetrics(
    @Query('time_period', new ParseEnumPipe(TimePeriodEnum))
    timePeriod: TimePeriod,
  ) {
    return this.communityService.getAwarenessMetrics(timePeriod);
  }

  @Get('transparency')
  getTransparencyMetrics(
    @Query('time_period', new ParseEnumPipe(TimePeriodEnum))
    timePeriod: TimePeriod,
  ) {
    return this.communityService.getTransparencyMetrics(timePeriod);
  }

  @Get('adaptability')
  getAdaptabilityMetrics(
    @Query('time_period', new ParseEnumPipe(TimePeriodEnum))
    timePeriod: TimePeriod,
  ) {
    return this.communityService.getAdaptabilityMetrics(timePeriod);
  }
}
