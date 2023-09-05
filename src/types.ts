import MyPromise from '.'

export enum State {
  PENDING = 'pending',
  RESOLVED = 'fulfilled',
  REJECTED = 'rejected',
}

export enum MultiplePromise {
  ALL,
  ALLSETLED,
  RACE,
  ANY,
}

export type Handler = (value: any) => any

export type Executor = (res: Handler, rej: Handler) => void

export type QueueItem = {
  handler: Handler
  promise: MyPromise
  state: State
}

export interface IMyPromise {
  then(handler: Handler, handlerReject?: Handler): MyPromise
  catch(handler: Handler): MyPromise
}

export type Result = {
  status: State
  value?: any
  reason?: any
}
