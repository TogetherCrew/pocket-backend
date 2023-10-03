interface SummaryWithBlockInput {
  start_date: string;
  end_date: string;
  date_format: string;
  unit_time?: 'block' | 'hour' | 'day' | 'week' | 'month' | 'year';
  interval?: number;
  exclusive_date?: boolean;
}

interface GetSupplySummaryFromStartDateInput {
  start_date: string;
  date_format: string;
}

export interface PoktScanRecord {
  point: string;
  amount: number;
}

export interface PoktScanDAOTreasuryResponse {
  data: {
    incomes: {
      points: Array<PoktScanRecord>;
    };
    expenses: {
      points: Array<PoktScanRecord>;
    };
  };
}
export interface PoktScanSupplyResponse {
  data: {
    circulating_supply: {
      points: Array<PoktScanRecord>;
    };
    supply: {
      token_burn: {
        amount: number;
      };
      token_issuance: {
        amount: number;
      };
    };
  };
}
export interface PoktScanStackedNodesResponse {
  data: {
    stackedNodes: {
      chains: Array<{
        nodes_count: number;
      }>;
    };
  };
}
export interface PoktScanOutput {
  income: number;
  expense: number;
  token_burn: number;
  token_issuance: number;
  circulating_supply: number;
  validators_to_control_protocol_count: number;
}
export interface PoktScanDAOTreasuryVariables {
  listSummaryInput: SummaryWithBlockInput;
}

export interface PoktScanSupplyVariables {
  listSummaryInput: SummaryWithBlockInput;
  supplyInput: GetSupplySummaryFromStartDateInput;
}

export interface PoktScanOptions
  extends SummaryWithBlockInput,
    GetSupplySummaryFromStartDateInput {}
