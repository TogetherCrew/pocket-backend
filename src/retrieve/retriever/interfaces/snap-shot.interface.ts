interface SnapShotVote {
  voter: string;
}

interface SnapShotProposal {
  author: string;
}

export interface SnapShotOptions {
  spaceID: string;
}

export interface SnapShotSpaceResponse {
  data: {
    space: {
      members: Array<string>;
      admins: Array<string>;
      votesCount: number;
      proposalsCount: number;
    };
  };
}

export interface SnapShotSpaceVariables {
  spaceID: string;
}

export interface SnapShotVotesResponse {
  data: {
    votes: Array<SnapShotVote>;
  };
}

export interface SnapShotVotesVariables {
  first: number;
  skip: number;
  spaceID: string;
}

export interface SnapShotProposalsResponse {
  data: {
    proposals: Array<SnapShotProposal>;
  };
}

export interface SnapShotProposalsVariables {
  first: number;
  skip: number;
  spaceID: string;
}

export interface SnapShotOutput {
  community_proposals_count: number;
  core_proposals_count: number;
  votes_count: number;
  voters_count: number;
}
