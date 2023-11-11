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

interface PaginationInput {
  filter: {
    operator: 'AND' | 'OR';
    properties: Array<{
      operator:
        | 'EQ'
        | 'NE'
        | 'GT'
        | 'GTE'
        | 'LT'
        | 'LTE'
        | 'REGEX'
        | 'IN'
        | 'TEXT'
        | 'EXISTS';
      property: string;
      type: 'STRING' | 'INT' | 'FLOAT' | 'BOOLEAN' | 'DATE' | 'NULL';
      value: string;
    }>;
  };
  limit: number;
}

export interface PoktScanRecord {
  point: string;
  amount: number;
}

export interface PoktScanDAOTreasuryResponse {
  data: {
    DAO_total_balance: {
      items: Array<Omit<PoktScanRecord, 'point'>>;
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
export interface PoktScanLargestNodeRunnersResponse {
  data: {
    ListLargestNodeRunners: {
      items: Array<{
        service_domain: string;
        validators: number;
      }>;
    };
  };
}
export interface PoktScanOutput {
  DAO_total_balance: number;
  token_burn: number;
  token_issuance: number;
  circulating_supply: number;
  validators_to_control_protocol_count: number;
}
export interface PoktScanDAOTreasuryVariables {
  pagination: PaginationInput;
}

export interface PoktScanSupplyVariables {
  listSummaryInput: SummaryWithBlockInput;
  supplyInput: GetSupplySummaryFromStartDateInput;
}

export interface PoktScanOptions
  extends SummaryWithBlockInput,
    GetSupplySummaryFromStartDateInput {
  pagination: PaginationInput;
}
