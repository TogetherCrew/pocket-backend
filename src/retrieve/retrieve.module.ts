import { Module } from '@nestjs/common';
import { RetrieveService } from './retrieve.service';
import { AggregationService } from './aggregation.service';
import { RetrieverModule } from './retriever/retriever.module';

@Module({
  imports: [RetrieverModule],
  providers: [RetrieveService, AggregationService],
})
export class RetrieveModule {}
