export interface CoinGeckoPoktPriceResponse {
  'pocket-network': {
    usd: number;
  };
}
export interface CoinGeckoPoktPriceOutput {
  price: number;
}
export interface CoinGeckoOutput {
  pokt_price?: number;
}
