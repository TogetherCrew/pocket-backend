import { Injectable } from '@nestjs/common';
import { BaseRetriever } from '../interfaces/common.interface';
import {
  GoogleSheetOptions,
  GoogleSheetOutput,
} from '../interfaces/google-sheet.interface';

@Injectable()
export class GoogleSheetRetriever
  implements BaseRetriever<GoogleSheetOptions, GoogleSheetOutput>
{
  retrieve(options: GoogleSheetOptions): GoogleSheetOutput {
    throw new Error('Method not implemented.');
    // TODO: complete the logic
  }
}
