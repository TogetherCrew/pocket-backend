import { Injectable } from '@nestjs/common';
import { BaseRetriever } from '../interfaces/common.interface';
import {
  SnapShotOptions,
  SnapShotOutput,
} from '../interfaces/snap-shot.interface';

@Injectable()
export class SnapShotRetriever
  implements BaseRetriever<SnapShotOptions, SnapShotOutput>
{
  retrieve(options: SnapShotOptions): SnapShotOutput {
    throw new Error('Method not implemented.');
    // TODO: complete the logic
  }
}
