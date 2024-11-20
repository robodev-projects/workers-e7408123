import { IStateTimePairResponse } from './state-time-pair-response.interface';

export interface IStateTimeListTimePairsResponse {
  timePairs: IStateTimePairResponse[];
  totalSeconds: number;
}
