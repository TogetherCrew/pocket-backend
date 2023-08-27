interface Income {
  point: string;
  amount: number;
}

interface Expense {
  point: string;
  amount: number;
}

interface IncomeAndExpenseInput {
  start_date: string;
  end_date: string;
  unit_time: 'block' | 'hour' | 'day' | 'week' | 'month' | 'year';
  interval: number;
  date_format: string;
  timezone: string;
  exclusive_date: boolean;
}

export interface PoktScanResponse {
  data: {
    incomes: {
      records: Array<Income>;
    };
    expenses: {
      records: Array<Expense>;
    };
  };
}
export interface PoktScanOutput {
  dao_treasury: number;
  protocol_revenue: number;
  control_protocol: number;
  token_burned: number;
  token_issuance: number;
  circulating_supply: number;
}
export interface PoktScanOptions {
  incomeAndExpenseInput: IncomeAndExpenseInput;
}
