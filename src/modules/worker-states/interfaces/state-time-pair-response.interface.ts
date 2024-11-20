export interface IStateTimePairResponse {
  totalSeconds: number;
  startTime: Date;
  endTime: Date;
  cutStartTime?: Date;
  cutEndTime?: Date;
}
