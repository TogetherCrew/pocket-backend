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
      records: Array<PoktScanRecord>;
    };
    expenses: {
      records: Array<PoktScanRecord>;
    };
  };
}
export interface PoktScanSupplyResponse {
  data: {
    circulating_supply: {
      records: Array<PoktScanRecord>;
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
export interface PoktScanOutput {
  income: number;
  expense: number;
  token_burn: number;
  token_issuance: number;
  circulating_supply: number;
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
