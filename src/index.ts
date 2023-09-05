import { Executor, Handler, IMyPromise, MultiplePromise, QueueItem, Result, State } from './types'

class MyPromise implements IMyPromise {
  private value = ''
  private queue: QueueItem[] = []
  private state: State = State.PENDING

  constructor(executor?: Executor) {
    try {
      executor?.(this.resolve.bind(this), this.reject.bind(this))
    } catch (e) {
      this.reject(e)
    }
  }

  static all(promises: any[]) {
    return MyPromise._multiple(promises, MultiplePromise.ALL)
  }

  static allSettled(promises: any[]) {
    return MyPromise._multiple(promises, MultiplePromise.ALLSETLED)
  }

  static any(promises: any[]) {
    return MyPromise._multiple(promises, MultiplePromise.ANY)
  }

  static race(promises: any[]) {
    return MyPromise._multiple(promises, MultiplePromise.RACE)
  }

  static _multiple(promises: any[], typeMultiplePromise: MultiplePromise) {
    return new MyPromise((res, rej) => {
      let count = 0
      const results: any[] = Array(promises.length)

      promises.forEach((promise, i) => {
        const addResultAndCheckIfIsCompleted = (data: Result) => {
          const result = data.value || data.reason
          switch (typeMultiplePromise) {
            case MultiplePromise.ALL:
              data.status === State.REJECTED && rej(result)
              results[i] = result
              break
            case MultiplePromise.ALLSETLED:
              results[i] = data
              break
            case MultiplePromise.ANY:
              data.status === State.RESOLVED && res(result)
              return
            case MultiplePromise.RACE:
              data.status === State.RESOLVED ? res(result) : rej(result)
              return
          }
          if (++count === promises.length) res(results)
        }

        if (promise instanceof MyPromise) {
          promise
            .then((data) => addResultAndCheckIfIsCompleted({ status: State.RESOLVED, value: data }))
            .catch((data) => addResultAndCheckIfIsCompleted({ status: State.REJECTED, reason: data }))
          return
        }
        addResultAndCheckIfIsCompleted({ status: State.RESOLVED, value: promise })
      })
    })
  }

  static resolve(value?: any) {
    return new MyPromise((res) => res(value))
  }

  static reject(value?: any) {
    return new MyPromise((_, rej) => rej(value))
  }

  then(handler: Handler, handlerReject?: Handler) {
    const promise = this.handlerChain(handler, State.RESOLVED)
    if (handlerReject)
      this.queue.push({
        handler: handlerReject,
        promise,
        state: State.REJECTED,
      })
    return promise
  }

  catch(handler: Handler) {
    return this.handlerChain(handler, State.REJECTED)
  }

  private handlerChain(handler: Handler, state: State) {
    const isCallImmidiatly = !this.isPending()
    const promise = new MyPromise()

    this.queue.push({ handler, promise, state })
    if (isCallImmidiatly) this.runHandlers()

    return promise
  }

  private isPending() {
    return this.state === State.PENDING
  }

  private resolve(value: any) {
    this.handleResult(State.RESOLVED, value)
  }

  private reject(value: any) {
    this.handleResult(State.REJECTED, value)
  }

  private handleResult(state: State, value: any) {
    if (!this.isPending()) return
    this.state = state
    this.value = value
    this.runHandlers()
  }

  private runHandlers() {
    queueMicrotask(() => {
      if (this.state === State.PENDING) return

      while (this.queue.length) {
        const { promise, handler, state } = this.queue.shift() as QueueItem

        const isTheSameState = this.state === state
        if (isTheSameState && this.isTheSameNextPromise(promise)) this.skipNextHanlder()

        let returnValue: MyPromise | any
        try {
          returnValue = isTheSameState ? handler(this.value) : this.value
        } catch (e) {
          promise.reject(e)
          return
        }
        this.resolveChainPromise(returnValue, promise)
      }
    })
  }

  private isTheSameNextPromise(promise: MyPromise) {
    return promise === this.queue[0]?.promise
  }

  private skipNextHanlder() {
    this.queue.shift()
  }

  private resolveChainPromise(returnValue: MyPromise | any, promise: MyPromise) {
    if (returnValue instanceof MyPromise) {
      returnValue.then(promise.resolve.bind(promise)).catch(promise.reject.bind(promise))
      return
    }
    const isResolved = this.state === State.RESOLVED
    promise[isResolved ? 'resolve' : 'reject'](returnValue)
  }
}

export default MyPromise
