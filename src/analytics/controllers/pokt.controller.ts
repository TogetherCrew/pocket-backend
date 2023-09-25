import { Controller, Get, ParseEnumPipe, Query } from '@nestjs/common';
import { PoktService } from '../services/pokt.service';
import { TimePeriodEnum, TimePeriod } from '../types/common.type';

@Controller('metrics/pokt')
export class PoktController {
  constructor(private readonly poktService: PoktService) {}

  @Get('liquidity')
  getLiquidityMetric(
    @Query('time_period', new ParseEnumPipe(TimePeriodEnum))
    timePeriod: TimePeriod,
  ) {
    return this.poktService.getLiquidityMetric(timePeriod);
  }

  @Get('coverage-ratio')
  getCoverageRatioMetric(
    @Query('time_period', new ParseEnumPipe(TimePeriodEnum))
    timePeriod: TimePeriod,
  ) {
    return this.poktService.getCoverageRatioMetric(timePeriod);
  }

  @Get('annualized-yield')
  getAnnualizedYieldMetric(
    @Query('time_period', new ParseEnumPipe(TimePeriodEnum))
    timePeriod: TimePeriod,
  ) {
    return this.poktService.getAnnualizedYieldMetric(timePeriod);
  }
}
