import { CoinGeckoOutput } from '../interfaces/coin-gecko.interface';
import { GoogleSheetOutput } from '../interfaces/google-sheet.interface';
import { PoktScanOutput } from '../interfaces/pokt-scan.interface';
import { SnapShotOutput } from '../interfaces/snap-shot.interface';
import { CoinGeckoRetriever } from '../retrievers/coin-gecko.retriever';
import { GoogleSheetRetriever } from '../retrievers/google-sheet.retriever';
import { PoktScanRetriever } from '../retrievers/pokt-scan.retriever';
import { SnapShotRetriever } from '../retrievers/snap-shot.retriever';

export type RetrieverType =
  | CoinGeckoRetriever
  | SnapShotRetriever
  | PoktScanRetriever
  | GoogleSheetRetriever;

export type RetrieverOutput =
  | CoinGeckoOutput
  | SnapShotOutput
  | PoktScanOutput
  | GoogleSheetOutput;

export type Retrievers = Array<RetrieverType>;
