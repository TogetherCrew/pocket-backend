import { Injectable } from '@nestjs/common';
import { GoogleSheetSerializedValues } from './retriever/types/google-sheet.type';
import moment from 'moment';
import { every, isUndefined, reduce } from 'lodash';

@Injectable()
export class AggregationService {
  daoTreasury(DAO_total_balance: number, pokt_price: number) {
    return every([DAO_total_balance, pokt_price], (item) => !isUndefined(item))
      ? DAO_total_balance * pokt_price
      : undefined;
  }

  protocolRevenue(token_burn: number, pokt_price: number) {
    return every([token_burn, pokt_price], (item) => !isUndefined(item))
      ? token_burn * pokt_price
      : undefined;
  }

  annualisedYield(protocol_revenue: number, circulating_supply: number) {
    return every(
      [protocol_revenue, circulating_supply],
      (item) => !isUndefined(item),
    ) && circulating_supply !== 0
      ? (protocol_revenue / circulating_supply) * 52
      : undefined;
  }

  coverageRatio(protocol_revenue: number, token_issuance: number) {
    return every(
      [protocol_revenue, token_issuance],
      (item) => !isUndefined(item),
    ) && token_issuance !== 0
      ? protocol_revenue / token_issuance
      : undefined;
  }

  voterParticipationRatio(votes_count: number, voters_count: number) {
    return every([voters_count, votes_count], (item) => !isUndefined(item)) &&
      voters_count !== 0
      ? votes_count / voters_count
      : undefined;
  }

  daoGovernanceAssetValue(
    voter_participation_ratio: number,
    dao_treasury: number,
    voter_power_concentration_index: number,
  ) {
    return every(
      [
        voter_participation_ratio,
        dao_treasury,
        voter_power_concentration_index,
      ],
      (item) => !isUndefined(item),
    )
      ? dao_treasury *
          voter_participation_ratio *
          (1 - voter_power_concentration_index)
      : undefined;
  }

  percentageOfProjectsSelfReporting(
    date: string,
    projects_gave_update_counts: Array<GoogleSheetSerializedValues>,
    projects_counts: Array<GoogleSheetSerializedValues>,
  ) {
    const currentDate = moment(date);

    const totalUpdates = reduce(
      projects_gave_update_counts,
      (sum, item) => {
        return (
          sum + (currentDate.isSame(moment(item.date), 'day') ? item.value : 0)
        );
      },
      0,
    );

    const totalCount = reduce(
      projects_counts,
      (sum, item) => {
        return (
          sum + (currentDate.isSame(moment(item.date), 'day') ? item.value : 0)
        );
      },
      0,
    );

    if (totalUpdates > 0 && totalCount > 0) {
      return totalUpdates / totalCount;
    } else {
      return undefined;
    }
  }
}
