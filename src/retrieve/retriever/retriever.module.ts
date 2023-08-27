import { Module } from '@nestjs/common';
import { CoinGeckoRetriever } from './retrievers/coin-gecko.retriever';
import { RETRIEVERS } from './retriever.constant';
import { SnapShotRetriever } from './retrievers/snap-shot.retriever';
import { GoogleSheetRetriever } from './retrievers/google-sheet.retriever';
import { PoktScanRetriever } from './retrievers/pokt-scan.retriever';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [
    CoinGeckoRetriever,
    SnapShotRetriever,
    GoogleSheetRetriever,
    PoktScanRetriever,
    {
      provide: RETRIEVERS,
      useFactory: (...retrievers) => {
        return retrievers;
      },
      inject: [
        CoinGeckoRetriever,
        SnapShotRetriever,
        GoogleSheetRetriever,
        PoktScanRetriever,
      ],
    },
  ],
  exports: [RETRIEVERS],
})
export class RetrieverModule {}
