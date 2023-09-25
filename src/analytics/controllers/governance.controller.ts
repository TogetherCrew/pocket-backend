import { Controller, Get, ParseEnumPipe, Query } from '@nestjs/common';
import { GovernanceService } from '../services/governance.service';
import { TimePeriodEnum, TimePeriod } from '../types/common.type';

@Controller('metrics/governance')
export class GovernanceController {
  constructor(private readonly governanceService: GovernanceService) {}

  @Get('nakamoto-coefficient')
  getNakamotoCoefficientMetrics(
    @Query('time_period', new ParseEnumPipe(TimePeriodEnum))
    timePeriod: TimePeriod,
  ) {
    return this.governanceService.getNakamotoCoefficientMetrics(timePeriod);
  }

  @Get('dao-governance')
  getDaoGovernanceMetrics(
    @Query('time_period', new ParseEnumPipe(TimePeriodEnum))
    timePeriod: TimePeriod,
  ) {
    return this.governanceService.getDaoGovernanceMetrics(timePeriod);
  }

  @Get('collaboration')
  getCollaborationMetrics(
    @Query('time_period', new ParseEnumPipe(TimePeriodEnum))
    timePeriod: TimePeriod,
  ) {
    return this.governanceService.getCollaborationMetrics(timePeriod);
  }
}
