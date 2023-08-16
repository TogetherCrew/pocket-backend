import { Injectable } from '@nestjs/common';
import { BaseRetriever } from '../interfaces/common.interface';
import {
  PoktScanOptions,
  PoktScanOutput,
} from '../interfaces/pokt-scan.interface';

@Injectable()
export class PoktScanRetriever
  implements BaseRetriever<PoktScanOptions, PoktScanOutput>
{
  retrieve(options: PoktScanOptions): PoktScanOutput {
    throw new Error('Method not implemented.');
    // TODO: complete the logic
  }
}
