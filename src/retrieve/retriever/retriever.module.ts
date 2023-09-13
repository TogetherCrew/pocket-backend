import { Module } from '@nestjs/common';
import { CoinGeckoRetriever } from './retrievers/coin-gecko.retriever';
import { GOOGLE_SHEET_SERVICE, RETRIEVERS } from './retriever.constant';
import { SnapShotRetriever } from './retrievers/snap-shot.retriever';
import { GoogleSheetRetriever } from './retrievers/google-sheet.retriever';
import { PoktScanRetriever } from './retrievers/pokt-scan.retriever';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';

@Module({
  imports: [HttpModule],
  providers: [
    {
      provide: GOOGLE_SHEET_SERVICE,
      useFactory: (config: ConfigService) => {
        return google.sheets({
          version: 'v4',
          auth: config.get<string>('GOOGLE_SHEET_API_KEY'),
        }).spreadsheets;
      },
      inject: [ConfigService],
    },
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
