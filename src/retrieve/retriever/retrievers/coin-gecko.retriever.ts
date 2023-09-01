import { Injectable } from '@nestjs/common';
import {
  CoinGeckoOutput,
  CoinGeckoPoktPriceOutput,
  CoinGeckoPoktPriceResponse,
} from '../interfaces/coin-gecko.interface';
import { BaseRetriever } from '../interfaces/common.interface';
import { ConfigService } from '@nestjs/config';
import { WinstonProvider } from '@common/winston/winston.provider';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Method } from 'axios';

@Injectable()
export class CoinGeckoRetriever
  implements BaseRetriever<never, CoinGeckoOutput>
{
  constructor(
    private readonly config: ConfigService,
    private readonly axios: HttpService,
    private readonly logger: WinstonProvider,
  ) {}

  private async request<T>(
    url: string,
    method: Method,
    body?: Record<string, any>,
    query?: Record<string, any>,
  ) {
    const response = await firstValueFrom(
      this.axios.request<T>({
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

  private async getPoktPrice() {
    return await this.request<CoinGeckoPoktPriceResponse>(
      'simple/price',
      'GET',
      undefined,
      {
        ids: 'pocket-network',
        vs_currencies: 'usd',
      },
    );
  }

  private serializePoktPriceResponse(
    response: CoinGeckoPoktPriceResponse,
  ): CoinGeckoPoktPriceOutput {
    return {
      price: response['pocket-network'].usd,
    };
  }

  private serializeOutput(
    poktOutput: CoinGeckoPoktPriceOutput,
  ): CoinGeckoOutput {
    return {
      pokt_price: poktOutput.price,
    };
  }

  async retrieve(): Promise<CoinGeckoOutput> {
    const poktPriceResponse = await this.getPoktPrice();
    const poktPriceOutput = this.serializePoktPriceResponse(poktPriceResponse);

    return this.serializeOutput(poktPriceOutput);
  }
}
