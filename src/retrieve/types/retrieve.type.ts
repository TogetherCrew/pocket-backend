import { CompoundMetricsName } from '@common/database/schemas/compound-metrics.schema';
import { CoinGeckoOutput } from '../retriever/interfaces/coin-gecko.interface';
import { GoogleSheetOutput } from '../retriever/interfaces/google-sheet.interface';
import { PoktScanOutput } from '../retriever/interfaces/pokt-scan.interface';
import { SnapShotOutput } from '../retriever/interfaces/snap-shot.interface';
import { RetrieverOutput } from '../retriever/types/common.type';

export type EssentialMetricsOutputs = {
  [key in
    | 'coinGeckoOutput'
    | 'poktScanOutput'
    | 'snapShotOutput'
    | 'googleSheetOutput']?: key extends 'coinGeckoOutput'
    ? CoinGeckoOutput
    : key extends 'snapShotOutput'
    ? SnapShotOutput
    : key extends 'poktScanOutput'
    ? PoktScanOutput
    : key extends 'googleSheetOutput'
    ? GoogleSheetOutput
    : undefined;
};

export type RetrieversConfig = Array<{
  promise: Promise<RetrieverOutput>;
  retrieverName: string;
  retrieverOutput: string;
}>;

export type CompoundMetricsOutput = Record<CompoundMetricsName, number>;
