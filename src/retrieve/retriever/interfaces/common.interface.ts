export interface BaseRetriever<Options, Output> {
  retrieve(options: Options): Promise<Output>;
}

export interface Pagination {
  first: number;
  skip: number;
}
