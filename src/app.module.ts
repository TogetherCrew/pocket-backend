import { Module } from '@nestjs/common';
import { RetrieveModule } from './retrieve/retrieve.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [RetrieveModule, AnalyticsModule],
})
export class AppModule {}
