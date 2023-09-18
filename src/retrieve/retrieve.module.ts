import { Module } from '@nestjs/common';
import { RetrieveService } from './retrieve.service';
import { AggregationService } from './aggregation.service';
import { RetrieverModule } from './retriever/retriever.module';
import { ScheduleModule } from '@nestjs/schedule';
import { StoreService } from './store.service';
@Module({
  imports: [RetrieverModule, ScheduleModule.forRoot()],
  providers: [RetrieveService, AggregationService, StoreService],
})
export class RetrieveModule {}
