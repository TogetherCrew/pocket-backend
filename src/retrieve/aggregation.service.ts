import { Injectable } from '@nestjs/common';
import { GoogleSheetSerializedValues } from './retriever/types/google-sheet.type';
import moment from 'moment';
import { every } from 'lodash';

@Injectable()
export class AggregationService {
  daoTreasury(income: number, expense: number, pokt_price: number) {
    return every([income, expense, pokt_price])
      ? (income - expense) * pokt_price
      : undefined;
  }

  protocolRevenue(token_burn: number, pokt_price: number) {
    return every([token_burn, pokt_price])
      ? token_burn * pokt_price
      : undefined;
  }

  annualisedYield(protocol_revenue: number, circulating_supply: number) {
    return every([protocol_revenue, circulating_supply])
      ? protocol_revenue / circulating_supply
      : undefined;
  }

  coverageRatio(protocol_revenue: number, token_issuance: number) {
    return every([protocol_revenue, token_issuance])
      ? protocol_revenue / token_issuance
      : undefined;
  }

  voterParticipationRatio(votes_count: number, voters_count: number) {
    return every([voters_count, votes_count])
      ? votes_count / voters_count
      : undefined;
  }

  daoGovernanceAssetValue(
    voter_participation_ratio: number,
    dao_treasury: number,
    voter_power_concentration_index: number,
  ) {
    return every([
      voter_participation_ratio,
      dao_treasury,
      voter_power_concentration_index,
    ])
      ? dao_treasury *
          voter_participation_ratio *
          (1 - voter_power_concentration_index)
      : undefined;
  }

  percentageOfProjectsSelfReporting(
    date: string,
    projects_gave_update_count: GoogleSheetSerializedValues,
    projects_count: GoogleSheetSerializedValues,
  ) {
    const currentDate = moment(date);

    if (
      every([date, projects_count, projects_gave_update_count]) &&
      currentDate.isSame(moment(projects_gave_update_count.date), 'day') &&
      currentDate.isSame(moment(projects_count.date), 'day')
    ) {
      return projects_gave_update_count.value / projects_count.value;
    } else {
      return undefined;
    }
  }
}
