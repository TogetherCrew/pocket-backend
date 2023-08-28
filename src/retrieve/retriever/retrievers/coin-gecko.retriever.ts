import { Injectable } from '@nestjs/common';
import {
  CoinGeckoOptions,
  CoinGeckoOutput,
  CoinGeckoResponse,
} from '../interfaces/coin-gecko.interface';
import { BaseRetriever } from '../interfaces/common.interface';
import { ConfigService } from '@nestjs/config';
import { WinstonProvider } from '@common/winston/winston.provider';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Method } from 'axios';

@Injectable()
export class CoinGeckoRetriever
  implements BaseRetriever<CoinGeckoOptions, CoinGeckoOutput>
{
  constructor(
    private readonly config: ConfigService,
    private readonly axios: HttpService,
    private readonly logger: WinstonProvider,
  ) {}

  async request(
    url: string,
    method: Method,
    body?: Record<string, any>,
    query?: Record<string, any>,
  ): Promise<CoinGeckoResponse> {
    const response = await firstValueFrom(
      this.axios.request<CoinGeckoResponse>({
        baseURL: this.config.get<string>('COIN_GECKO_API_BASE_URL'),
        url,
        method,
        data: body,
        params: query,
      }),
    );

    this.logger.debug(
      'request method\n' +
        `input => ${JSON.stringify({ url, method, body, query })}\n` +
        `response => ${JSON.stringify({
          status: response.status,
          body: response.data,
        })}`,
      CoinGeckoRetriever.name,
    );

    return response.data;
  }

  async retrieve(options: CoinGeckoOptions): Promise<CoinGeckoOutput> {
    throw new Error('Method not implemented.');
    // TODO: complete the logic
  }
}
