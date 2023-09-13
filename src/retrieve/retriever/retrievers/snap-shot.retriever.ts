import { Injectable } from '@nestjs/common';
import { BaseRetriever, Pagination } from '../interfaces/common.interface';
import {
  SnapShotOptions,
  SnapShotOutput,
  SnapShotProposalsResponse,
  SnapShotProposalsVariables,
  SnapShotSpaceResponse,
  SnapShotSpaceVariables,
  SnapShotVotesResponse,
  SnapShotVotesVariables,
} from '../interfaces/snap-shot.interface';
import { WinstonProvider } from '@common/winston/winston.provider';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { filter, reduce, uniqBy } from 'lodash';

@Injectable()
export class SnapShotRetriever
  implements BaseRetriever<SnapShotOptions, SnapShotOutput>
{
  constructor(
    private readonly config: ConfigService,
    private readonly axios: HttpService,
    private readonly logger: WinstonProvider,
  ) {}

  private async request<T>(query: string, variables: Record<string, any>) {
    const response = await firstValueFrom(
      this.axios.post<T>(
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

    this.logger.debug(
      'request method\n' +
        `input => ${JSON.stringify({ query, variables })}\n` +
        `response => ${JSON.stringify({
          status: response.status,
          body: response.data,
        })}`,
      SnapShotRetriever.name,
    );

    return response.data;
  }

  private getSpaceGQLQuery(): string {
    return `
      query Space($spaceID: String!) {
        space(id: $spaceID) {
          members
          votesCount
          proposalsCount
          admins
        }
      }
    `;
  }

  private getVotesGQLQuery(): string {
    return `
      query Votes($first: Int!, $skip: Int!, $spaceID: String!) {
        votes(first: $first, skip: $skip, where: {space: $spaceID}) {
          voter
        }
      }
    `;
  }

  private getProposalsGQLQuery(): string {
    return `
      query Proposals($first: Int!, $skip: Int!, $spaceID: String!) {
        proposals(first: $first, skip: $skip, where: {space: $spaceID}) {
          author
        }
      }
    `;
  }

  private pagination(max: number): Array<Pagination> {
    const pages: Array<Pagination> = [];

    if (max <= 1000) {
      pages.push({ first: max, skip: 0 });
    } else {
      const pages_count = Math.ceil(max / 1000);
      let first = 1000;
      let skip = 0;

      for (let page = 1; page <= pages_count; page++) {
        const items_diff = max - page * first;

        pages.push({ first, skip });

        skip += first;
        first = items_diff < 1000 ? items_diff : 1000;
      }
    }

    return pages;
  }

  private async getSpace(variables: SnapShotSpaceVariables) {
    const query = this.getSpaceGQLQuery();

    return await this.request<SnapShotSpaceResponse>(query, variables);
  }

  private async getVotes(space_id: string, votes_count: number) {
    const query = this.getVotesGQLQuery();
    const pages = this.pagination(votes_count);
    const responses: Array<Promise<SnapShotVotesResponse>> = [];

    for (let index = 0; index < pages.length; index++) {
      const page = pages[index];
      const variables: SnapShotVotesVariables = { ...page, spaceID: space_id };

      responses.push(this.request<SnapShotVotesResponse>(query, variables));
    }

    return reduce<SnapShotVotesResponse, SnapShotVotesResponse>(
      await Promise.all(responses),
      (final, current) => {
        return {
          data: {
            votes: [...final.data.votes, ...current.data.votes],
          },
        };
      },
      {
        data: { votes: [] },
      },
    );
  }

  private async getProposals(space_id: string, proposals_count: number) {
    const query = this.getProposalsGQLQuery();
    const pages = this.pagination(proposals_count);
    const responses: Array<Promise<SnapShotProposalsResponse>> = [];

    for (let index = 0; index < pages.length; index++) {
      const page = pages[index];
      const variables: SnapShotProposalsVariables = {
        ...page,
        spaceID: space_id,
      };

      responses.push(this.request<SnapShotProposalsResponse>(query, variables));
    }

    return reduce<SnapShotProposalsResponse, SnapShotProposalsResponse>(
      await Promise.all(responses),
      (final, current) => {
        return {
          data: {
            proposals: [...final.data.proposals, ...current.data.proposals],
          },
        };
      },
      {
        data: { proposals: [] },
      },
    );
  }

  private serialize(
    space: SnapShotSpaceResponse,
    votes: SnapShotVotesResponse,
    proposals: SnapShotProposalsResponse,
  ): SnapShotOutput {
    const adminsAddress = [
      ...space.data.space.admins,
      ...space.data.space.members,
    ];

    return {
      community_proposals_count: filter(proposals.data.proposals, (proposal) =>
        adminsAddress.includes(proposal.author),
      ).length,

      core_proposals_count: filter(
        proposals.data.proposals,
        (proposal) => !adminsAddress.includes(proposal.author),
      ).length,

      voters_count: uniqBy(votes.data.votes, 'voter').length,
      votes_count: votes.data.votes.length,
    };
  }

  async retrieve(options: SnapShotOptions): Promise<SnapShotOutput> {
    const spaceResponse = await this.getSpace(options);
    const votesResponse = await this.getVotes(
      options.spaceID,
      spaceResponse.data.space.votesCount,
    );
    const proposalsResponse = await this.getProposals(
      options.spaceID,
      spaceResponse.data.space.proposalsCount,
    );
    //broker
    return this.serialize(spaceResponse, votesResponse, proposalsResponse);
  }
}
