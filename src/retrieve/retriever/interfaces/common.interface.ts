export interface BaseRetriever<Options, Output> {
  retrieve(options: Options): Output;
}
