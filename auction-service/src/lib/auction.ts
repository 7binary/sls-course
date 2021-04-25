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
  createdAt: string;
  endingAt: string;
  seller: string; // E-mail of creator
  pictureUrl?: string;
  highestBid?: AuctionBid;
}
