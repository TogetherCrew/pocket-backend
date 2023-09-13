import { Test, TestingModule } from '@nestjs/testing';
import { WinstonProvider } from '@common/winston/winston.provider';
import { HttpModule, HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { AxiosResponse } from 'axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SnapShotRetriever } from '../snap-shot.retriever';
import {
  SnapShotOptions,
  SnapShotOutput,
  SnapShotProposalsResponse,
  SnapShotSpaceResponse,
  SnapShotSpaceVariables,
  SnapShotVotesResponse,
} from '../../interfaces/snap-shot.interface';
import { Pagination } from '../../interfaces/common.interface';
import * as lodash from 'lodash';

jest.mock('@common/winston/winston.provider');

describe('SnapShot Retriever', () => {
  let retriever: SnapShotRetriever;
  let axios: HttpService;
  let config: ConfigService;
  let logger: WinstonProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule, ConfigModule],
      providers: [WinstonProvider, SnapShotRetriever],
    }).compile();

    retriever = module.get<SnapShotRetriever>(SnapShotRetriever);
    axios = module.get<HttpService>(HttpService);
    config = module.get<ConfigService>(ConfigService);
    logger = module.get<WinstonProvider>(WinstonProvider);

    jest.clearAllMocks();
  });

  test('Should be defined', () => {
    expect(retriever).toBeDefined();
  });

  describe('When request method called', () => {
    let query: string;
    let variables: Record<string, any>;
    let returnValue: Record<string, any>;
    let axiosResponse: AxiosResponse;

    beforeEach(async () => {
      query = 'query { test { test } }';
      variables = {};
      axiosResponse = {
        data: {},
        status: 200,
        statusText: 'OK',
        headers: undefined,
        config: undefined,
      };

      jest.spyOn(config, 'get').mockReturnValue('');
      jest.spyOn(axios, 'post').mockReturnValue(of(axiosResponse));

      returnValue = await retriever['request'](query, variables);
    });

    test('Should be defined', () => {
      expect(retriever['request']).toBeDefined();
    });

    test('Should call get method from config', () => {
      expect(config.get).toBeCalledWith('SNAP_SHOT_API_BASE_URL');
    });

    test('Should call post method from axios', () => {
      expect(axios.post).toBeCalledWith(
        '',
        {
          query,
          variables,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    });

    test('Should call debug method from logger', () => {
      expect(logger.debug).toBeCalledWith(
        'request method\n' +
          `input => ${JSON.stringify({ query, variables })}\n` +
          `response => ${JSON.stringify({
            status: axiosResponse.status,
            body: axiosResponse.data,
          })}`,
        SnapShotRetriever.name,
      );
    });

    test('Should return body from http response', () => {
      expect(returnValue).toEqual(axiosResponse.data);
    });
  });

  describe('When getSpaceGQLQuery method called', () => {
    let returnValue: string;

    beforeAll(() => {
      returnValue = retriever['getSpaceGQLQuery']();
    });

    test('Should be defined', () => {
      expect(retriever['getSpaceGQLQuery']).toBeDefined();
    });

    test('Should return getSpace graphQL query', () => {
      expect(returnValue).toBe(`
      query Space($spaceID: String!) {
        space(id: $spaceID) {
          members
          votesCount
          proposalsCount
          admins
        }
      }
    `);
    });
  });

  describe('When getVotesGQLQuery method called', () => {
    let returnValue: string;

    beforeAll(() => {
      returnValue = retriever['getVotesGQLQuery']();
    });

    test('Should be defined', () => {
      expect(retriever['getVotesGQLQuery']).toBeDefined();
    });

    test('Should return getVotes graphQL query', () => {
      expect(returnValue).toBe(`
      query Votes($first: Int!, $skip: Int!, $spaceID: String!) {
        votes(first: $first, skip: $skip, where: {space: $spaceID}) {
          voter
        }
      }
    `);
    });
  });

  describe('When getProposalsGQLQuery method called', () => {
    let returnValue: string;

    beforeAll(() => {
      returnValue = retriever['getProposalsGQLQuery']();
    });

    test('Should be defined', () => {
      expect(retriever['getProposalsGQLQuery']).toBeDefined();
    });

    test('Should return getProposals graphQL query', () => {
      expect(returnValue).toBe(`
      query Proposals($first: Int!, $skip: Int!, $spaceID: String!) {
        proposals(first: $first, skip: $skip, where: {space: $spaceID}) {
          author
        }
      }
    `);
    });
  });

  describe('When pagination method called', () => {
    test("Should return pagination when max's value lq that 1000", () => {
      expect(retriever['pagination'](99)).toEqual([{ first: 99, skip: 0 }]);
      expect(retriever['pagination'](1000)).toEqual([{ first: 1000, skip: 0 }]);
    });

    test("Should return pagination when max's value greater that 1000", () => {
      expect(retriever['pagination'](3500)).toEqual([
        { first: 1000, skip: 0 },
        { first: 1000, skip: 1000 },
        { first: 1000, skip: 2000 },
        { first: 500, skip: 3000 },
      ]);

      expect(retriever['pagination'](4000)).toEqual([
        { first: 1000, skip: 0 },
        { first: 1000, skip: 1000 },
        { first: 1000, skip: 2000 },
        { first: 1000, skip: 3000 },
      ]);
    });
  });

  describe('When getSpace method called', () => {
    let snapShotSpaceVariables: SnapShotSpaceVariables;
    let returnValue: SnapShotSpaceResponse;
    let query: string;
    let requestResponse: SnapShotSpaceResponse;

    beforeEach(async () => {
      snapShotSpaceVariables = {
        spaceID: 'test',
      };
      query = 'test query';
      requestResponse = {
        data: {
          space: {
            members: [],
            admins: [],
            votesCount: 0,
            proposalsCount: 0,
          },
        },
      };

      jest
        .spyOn(retriever as any, 'getSpaceGQLQuery')
        .mockReturnValueOnce(query);
      jest
        .spyOn(retriever as any, 'request')
        .mockResolvedValueOnce(requestResponse);

      returnValue = await retriever['getSpace'](snapShotSpaceVariables);
    });

    test('Should be defined', () => {
      expect(retriever['getSpace']).toBeDefined();
    });

    test('Should call getSpaceGQLQuery from retriever', () => {
      expect(retriever['getSpaceGQLQuery']).toBeCalledWith();
    });

    test('Should call request from retriever', () => {
      expect(retriever['request']).toBeCalledWith(
        query,
        snapShotSpaceVariables,
      );
    });

    test('Should return snap-shot space response', () => {
      expect(returnValue).toEqual(requestResponse);
    });
  });

  describe('When getVotes method called', () => {
    let returnValue: SnapShotVotesResponse;
    let query: string;
    let pagination: Array<Pagination>;
    let requestResponse: SnapShotVotesResponse;
    const votesCount = 1;
    const spaceID = 'test';

    beforeEach(async () => {
      query = 'test query';
      requestResponse = {
        data: {
          votes: [{ voter: '' }],
        },
      };
      pagination = [{ first: 1, skip: 0 }];

      jest
        .spyOn(retriever as any, 'getVotesGQLQuery')
        .mockReturnValueOnce(query);
      jest
        .spyOn(retriever as any, 'pagination')
        .mockReturnValueOnce(pagination);
      jest.spyOn(retriever as any, 'request').mockReturnValue(requestResponse);
      jest.spyOn(lodash, 'reduce').mockReturnValue(requestResponse);

      returnValue = await retriever['getVotes'](spaceID, votesCount);
    });

    test('Should be defined', () => {
      expect(retriever['getVotes']).toBeDefined();
    });

    test('Should call getVotesGQLQuery from retriever', () => {
      expect(retriever['getVotesGQLQuery']).toBeCalledWith();
    });

    test('Should call pagination from retriever', () => {
      expect(retriever['pagination']).toBeCalledWith(votesCount);
    });

    test('Should call request from retriever', () => {
      const variables = { ...pagination[0], spaceID };
      expect(retriever['request']).toBeCalledWith(query, variables);
    });

    test('Should call reduce method from lodash', () => {
      expect(lodash.reduce).toBeCalledWith(
        [requestResponse],
        expect.any(Function),
        {
          data: { votes: [] },
        },
      );
    });

    test('Should return snap-shot votes response', () => {
      expect(returnValue).toEqual(requestResponse);
    });
  });

  describe('When getProposals method called', () => {
    let returnValue: SnapShotProposalsResponse;
    let query: string;
    let pagination: Array<Pagination>;
    let requestResponse: SnapShotProposalsResponse;
    const proposalsCount = 1;
    const spaceID = 'test';

    beforeEach(async () => {
      query = 'test query';
      requestResponse = {
        data: {
          proposals: [{ author: '' }],
        },
      };
      pagination = [{ first: 1, skip: 0 }];

      jest
        .spyOn(retriever as any, 'getProposalsGQLQuery')
        .mockReturnValueOnce(query);
      jest
        .spyOn(retriever as any, 'pagination')
        .mockReturnValueOnce(pagination);
      jest.spyOn(retriever as any, 'request').mockReturnValue(requestResponse);
      jest.spyOn(lodash, 'reduce').mockReturnValue(requestResponse);

      returnValue = await retriever['getProposals'](spaceID, proposalsCount);
    });

    test('Should be defined', () => {
      expect(retriever['getProposals']).toBeDefined();
    });

    test('Should call getProposalsGQLQuery from retriever', () => {
      expect(retriever['getProposalsGQLQuery']).toBeCalledWith();
    });

    test('Should call pagination from retriever', () => {
      expect(retriever['pagination']).toBeCalledWith(proposalsCount);
    });

    test('Should call request from retriever', () => {
      const variables = { ...pagination[0], spaceID };
      expect(retriever['request']).toBeCalledWith(query, variables);
    });

    test('Should call reduce method from lodash', () => {
      expect(lodash.reduce).toBeCalledWith(
        [requestResponse],
        expect.any(Function),
        {
          data: { proposals: [] },
        },
      );
    });

    test('Should return snap-shot proposals response', () => {
      expect(returnValue).toEqual(requestResponse);
    });
  });

  describe('When serialize method called', () => {
    let returnValue: SnapShotOutput;
    let spaceResponse: SnapShotSpaceResponse;
    let votesResponse: SnapShotVotesResponse;
    let proposalsResponse: SnapShotProposalsResponse;

    beforeEach(() => {
      spaceResponse = {
        data: {
          space: {
            members: ['member-1'],
            admins: ['admin-1'],
            votesCount: 3,
            proposalsCount: 2,
          },
        },
      };
      votesResponse = {
        data: {
          votes: [
            { voter: 'voter-1' },
            { voter: 'voter-2' },
            { voter: 'voter-1' },
          ],
        },
      };
      proposalsResponse = {
        data: {
          proposals: [{ author: 'admin-1' }, { author: 'community-1' }],
        },
      };

      jest.spyOn(lodash, 'filter').mockReturnValueOnce([{ author: 'admin-1' }]);
      jest
        .spyOn(lodash, 'filter')
        .mockReturnValueOnce([{ author: 'community-1' }]);
      jest
        .spyOn(lodash, 'uniqBy')
        .mockReturnValueOnce([{ voter: 'voter-1' }, { voter: 'voter-2' }]);

      returnValue = retriever['serialize'](
        spaceResponse,
        votesResponse,
        proposalsResponse,
      );
    });

    test('Should be defined', () => {
      expect(retriever['serialize']).toBeDefined();
    });

    test('Should call filter from lodash for community_proposals_count', () => {
      expect(lodash.filter).toBeCalledWith(
        proposalsResponse.data.proposals,
        expect.any(Function),
      );
    });

    test('Should call filter from lodash for core_proposals_count', () => {
      expect(lodash.filter).toBeCalledWith(
        proposalsResponse.data.proposals,
        expect.any(Function),
      );
    });

    test('Should call uniqBy from lodash', () => {
      expect(lodash.uniqBy).toBeCalledWith(votesResponse.data.votes, 'voter');
    });

    test('Should return snap-shot serialized output', () => {
      expect(returnValue).toEqual({
        community_proposals_count: 1,
        core_proposals_count: 1,
        voters_count: 2,
        votes_count: votesResponse.data.votes.length,
      });
    });
  });

  describe('When retrieve method called', () => {
    let returnValue: SnapShotOutput;
    let retrieverOptions: SnapShotOptions;
    let serializeOutput: SnapShotOutput;
    let spaceResponse: SnapShotSpaceResponse;
    let votesResponse: SnapShotVotesResponse;
    let proposalsResponse: SnapShotProposalsResponse;

    beforeEach(async () => {
      retrieverOptions = {
        spaceID: 'test',
      };
      spaceResponse = {
        data: {
          space: {
            members: ['member-1'],
            admins: ['admin-1'],
            votesCount: 3,
            proposalsCount: 2,
          },
        },
      };
      votesResponse = {
        data: {
          votes: [
            { voter: 'voter-1' },
            { voter: 'voter-2' },
            { voter: 'voter-1' },
          ],
        },
      };
      proposalsResponse = {
        data: {
          proposals: [{ author: 'admin-1' }, { author: 'community-1' }],
        },
      };
      serializeOutput = {
        community_proposals_count: 1,
        core_proposals_count: 1,
        voters_count: 2,
        votes_count: 3,
      };

      jest
        .spyOn(retriever as any, 'getSpace')
        .mockResolvedValueOnce(spaceResponse);
      jest
        .spyOn(retriever as any, 'getVotes')
        .mockResolvedValueOnce(votesResponse);
      jest
        .spyOn(retriever as any, 'getProposals')
        .mockResolvedValueOnce(proposalsResponse);
      jest
        .spyOn(retriever as any, 'serialize')
        .mockReturnValueOnce(serializeOutput);

      returnValue = await retriever['retrieve'](retrieverOptions);
    });

    test('Should be defined', () => {
      expect(retriever['retrieve']).toBeDefined();
    });

    test('Should call getSpace method from retriever', () => {
      expect(retriever['getSpace']).toBeCalledWith(retrieverOptions);
    });

    test('Should call getVotes method from retriever', () => {
      expect(retriever['getVotes']).toBeCalledWith(
        retrieverOptions.spaceID,
        spaceResponse.data.space.votesCount,
      );
    });

    test('Should call getProposals method from retriever', () => {
      expect(retriever['getProposals']).toBeCalledWith(
        retrieverOptions.spaceID,
        spaceResponse.data.space.proposalsCount,
      );
    });

    test('Should call serialize method from retriever', () => {
      expect(retriever['serialize']).toBeCalledWith(
        spaceResponse,
        votesResponse,
        proposalsResponse,
      );
    });

    test('Should return snap-shot output', () => {
      expect(returnValue).toEqual(serializeOutput);
    });
  });
});
