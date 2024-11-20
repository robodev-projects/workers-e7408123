import { State } from '../enums/state.enum';

export interface ICreateState {
  state: State;
  createdAt?: Date;
}
