import { Controller, Get, ParseEnumPipe, Query } from '@nestjs/common';
import { ProtocolService } from '../services/protocol.service';
import { TimePeriodEnum, TimePeriod } from '../types/common.type';

@Controller('metrics/protocol')
export class ProtocolController {
  constructor(private readonly protocolService: ProtocolService) {}

  @Get('demand')
  getDemandMetrics(
    @Query('time_period', new ParseEnumPipe(TimePeriodEnum))
    timePeriod: TimePeriod,
  ) {
    return this.protocolService.getDemandMetrics(timePeriod);
  }
}
