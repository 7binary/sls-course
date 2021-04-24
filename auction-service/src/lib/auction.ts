export enum AuctionStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export interface AuctionBid {
  amount: number;
  bidder?: string; // E-mail of buyer
}

export interface Auction {
  id: string;
  title: string;
  status: AuctionStatus;
  highestBid?: AuctionBid;
  createdAt: string;
  endingAt: string;
  seller: string; // E-mail of creator
}
