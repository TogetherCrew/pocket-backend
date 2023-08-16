import { Injectable } from '@nestjs/common';
import {
  CoinGeckoOptions,
  CoinGeckoOutput,
} from '../interfaces/coin-gecko.interface';
import { BaseRetriever } from '../interfaces/common.interface';

@Injectable()
export class CoinGeckoRetriever
  implements BaseRetriever<CoinGeckoOptions, CoinGeckoOutput>
{
  retrieve(options: CoinGeckoOptions): CoinGeckoOutput {
    throw new Error('Method not implemented.');
    // TODO: complete the logic
  }
}
