import { Injectable } from '@nestjs/common';
import { BaseRetriever } from '../interfaces/common.interface';
import {
  SnapShotOptions,
  SnapShotOutput,
  SnapShotResponse,
} from '../interfaces/snap-shot.interface';
import { WinstonProvider } from '@common/winston/winston.provider';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SnapShotRetriever
  implements BaseRetriever<SnapShotOptions, SnapShotOutput>
{
  constructor(
    private readonly config: ConfigService,
    private readonly axios: HttpService,
    private readonly logger: WinstonProvider,
  ) {}

  private async request(query: string, variables: Record<string, any>) {
    this.logger.debug(
      `query: ${query}\nvariables: ${variables}`,
      SnapShotRetriever.name,
    );

    const response = await firstValueFrom(
      this.axios.post<SnapShotResponse>(
        this.config.get<string>('SNAP_SHOT_API_BASE_URL'),
        {
          query,
          variables,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    return response.data;
  }

  private getGQLQuery(): string {
    return ``;
  }

  private serialize(response: SnapShotResponse): SnapShotOutput {
    return {};
  }
  async retrieve(options: SnapShotOptions): Promise<SnapShotOutput> {
    const query = this.getGQLQuery();
    const raw_metrics = await this.request(query, options);

    return this.serialize(raw_metrics);
  }
}
