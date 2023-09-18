import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CoinGecko, CoinGeckoSchema } from './schemas/coin-gecko.schema';
import {
  CompoundMetrics,
  CompoundMetricsSchema,
} from './schemas/compound-metrics.schema';
import { GoogleSheet, GoogleSheetSchema } from './schemas/google-sheet.schema';
import { PoktScan, PoktScanSchema } from './schemas/pokt-scan.schema';
import { SnapShot, SnapShotSchema } from './schemas/snap-shot.schema';

@Module({})
export class DatabaseModule {
  static forRoot(): DynamicModule {
    return {
      ...MongooseModule.forRootAsync({
        useFactory: (config: ConfigService) => ({
          uri: config.get<string>('MONGO_DB_URI'),
        }),
        inject: [ConfigService],
      }),
      ...MongooseModule.forFeature([
        { name: CoinGecko.name, schema: CoinGeckoSchema },
        { name: CompoundMetrics.name, schema: CompoundMetricsSchema },
        { name: GoogleSheet.name, schema: GoogleSheetSchema },
        { name: PoktScan.name, schema: PoktScanSchema },
        { name: SnapShot.name, schema: SnapShotSchema },
      ]),
      module: DatabaseModule,
      global: true,
    };
  }
}
