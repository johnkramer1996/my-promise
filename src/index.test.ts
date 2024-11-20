import MyPromise from '.'
import { State } from './types'

const expectString = 'foo'
const testError = new Error('Something went wrong')

test('executor function is called immediately', () => {
  let string = ''
  new MyPromise(() => (string = expectString))

  expect(string).toBe(expectString)
})

test('resolution handler is called when promise is resolved', async () => {
  const promise = new MyPromise((res) => setTimeout(() => res(expectString), 100))

  return expect(promise).resolves.toBe(expectString)
})

test('promise supports many resolution handlers', async () => {
  const promise = new MyPromise((res) => setTimeout(() => res(expectString), 100))

  return Promise.all([promise, promise]).then(([data1, data2]) => {
    expect(data1).toBe(expectString)
    expect(data2).toBe(expectString)
  })
})

test('resolution handlers can be chained', async () => {
  const promise = new MyPromise((resolve) => setTimeout(() => resolve(''), 100))

  return new MyPromise((res) =>
    promise.then(() => new MyPromise((resolve) => setTimeout(() => resolve(expectString), 100))).then(res)
  ).then((data) => expect(data).toBe(expectString))
})

test('chaining works with non-promise return values', async () => {
  const promise = new MyPromise((res) => setTimeout(() => res('expectString'), 100))

  return expect(promise.then(() => expectString)).resolves.toBe(expectString)
})

test('resolution handlers can be attached when promise is resolved', async () => {
  const promise = new MyPromise((res) => setTimeout(() => res(expectString), 100))

  return new MyPromise((res) => {
    promise.then(() => setTimeout(() => promise.then(res), 100))
  }).then((data) => expect(data).toBe(expectString))
})

test('calling resolve second time has no effect', async () => {
  const promise = new MyPromise((resolve) => {
    setTimeout(() => {
      resolve(expectString)
      resolve('bar')
    }, 100)
  })

  return new MyPromise((res) => {
    promise
      .then((string) => {
        expect(string).toBe(expectString)
        setTimeout(() => promise.then(res), 100)
      })
      .then((data) => expect(data).toBe(expectString))
  })
})

test('rejection handler is called when promise is rejected', async () => {
  const promise = new MyPromise((resolve, reject) => setTimeout(() => reject(testError), 100))

  return new MyPromise(promise.catch.bind(promise)).then((data) => expect(data).toBe(testError))
})

test('rejections are passed downstream', async () => {
  const promise = new MyPromise((resolve, reject) => setTimeout(() => reject(testError), 100))

  return new MyPromise((res) => {
    promise.then(() => new MyPromise((resolve) => setTimeout(() => resolve('testError'), 100))).catch(res)
  }).then((data) => expect(data).toBe(testError))
})

test('rejecting promises returned from resolution handlers are caught properly', async () => {
  const promise = new MyPromise((resolve) => setTimeout(() => resolve(''), 100))

  return new MyPromise((res) => {
    promise.then(() => new MyPromise((resolve, reject) => setTimeout(() => reject(testError), 100))).catch(res)
  }).then((data) => expect(data).toBe(testError))
})

test('rejection handlers catch synchronous errors in resolution handlers', async () => {
  const promise = new MyPromise((resolve) => setTimeout(() => resolve(''), 100))

  return new MyPromise((res) => {
    promise
      .then(() => {
        throw testError
      })
      .catch(res)
  }).then((data) => expect(data).toBe(testError))
})

test('rejection handlers catch synchronous errors in the executor function', async () => {
  const promise = new MyPromise(() => {
    throw testError
  })

  return new MyPromise((res) => {
    promise.then(() => new MyPromise((resolve) => setTimeout(() => resolve(testError), 100))).catch(res)
  }).then((data) => expect(data).toBe(testError))
})

test('rejection handlers catch synchronous erros', async () => {
  const promise = new MyPromise((resolve) => setTimeout(() => resolve(''), 100))

  return new MyPromise((res) => {
    promise
      .then(() => {
        throw new Error('some Error')
      })
      .catch(function () {
        throw testError
      })
      .catch(res)
  }).then((data) => expect(data).toBe(testError))
})

test('chaining works after "catch"', async () => {
  const promise = new MyPromise((resolve) => setTimeout(() => resolve(''), 100))

  return new MyPromise((res) => {
    promise
      .then(() => {
        throw new Error('some Error')
      })
      .catch(() => new MyPromise((resolve) => setTimeout(() => resolve(expectString), 100)))
      .then(res)
  }).then((data) => expect(data).toBe(expectString))
})

test('rejecting promises returned from rejection handlers are caught properly', async () => {
  const promise = new MyPromise((resolve) => setTimeout(() => resolve(''), 100))

  return new MyPromise((res) => {
    promise
      .then(() => {
        throw new Error('some Error')
      })
      .catch(() => new MyPromise((resolve, reject) => setTimeout(() => reject(testError), 100)))
      .catch(res)
  }).then((data) => expect(data).toBe(testError))
})

test('second argument in then is treated as a rejection handler', async () => {
  const promise = new MyPromise((resolve, reject) => setTimeout(() => reject(testError), 100))

  return new MyPromise((res) => {
    promise.then(() => {}, res)
  }).then((data) => expect(data).toBe(testError))
})

test('second argument in then is attached to the promise then is called on', async () => {
  var didRun = false
  const promise = new MyPromise((resolve) => setTimeout(() => resolve(''), 100))

  return new MyPromise((res) => {
    promise
      .then(
        () => new MyPromise((resolve, reject) => setTimeout(() => reject(testError), 100)),
        () => (didRun = true)
      )
      .catch(res)
  }).then((data) => {
    expect(data).toBe(testError)
    expect(didRun).toBe(false)
  })
})

const [expectSting1, expectSting2, expectSting3, expectSting4, expectSting5] = [
  'promise1',
  'promise2',
  'promise3',
  'promise4',
  'promise5',
]
const promiseSuccess1 = new MyPromise((res) => setTimeout(() => res(expectSting1), 100))
const promiseSuccess2 = MyPromise.resolve(expectSting2)
const promiseSuccess3 = new MyPromise((res) => res(expectSting3))
const promiseErrro1 = new MyPromise((res, rej) => setTimeout(() => rej(expectSting5), 100))

test('resolution handler is called when promise all is resolved', async () => {
  return new MyPromise((res) =>
    MyPromise.all([promiseSuccess1, promiseSuccess2, promiseSuccess3, expectSting4]).then(res)
  ).then(([data1, data2, data3, data4]) => {
    expect(data1).toBe(expectSting1)
    expect(data2).toBe(expectSting2)
    expect(data3).toBe(expectSting3)
    expect(data4).toBe(expectSting4)
  })
})

test('rejection handler is called when promise all is rejected', async () => {
  return new MyPromise((res) =>
    MyPromise.all([promiseSuccess1, promiseSuccess2, promiseSuccess3, expectSting4, promiseErrro1]).catch(res)
  ).then((data) => {
    expect(data).toBe(expectSting5)
  })
})

test('resolution handler is called when promise allSetled is resolved', async () => {
  return new MyPromise((res) =>
    MyPromise.allSettled([promiseSuccess1, promiseSuccess2, promiseSuccess3, expectSting4]).then(res)
  ).then(([data1, data2, data3, data4]) => {
    expect(data1).toEqual({ status: 'fulfilled', value: expectSting1 })
    expect(data2).toEqual({ status: 'fulfilled', value: expectSting2 })
    expect(data3).toEqual({ status: 'fulfilled', value: expectSting3 })
    expect(data4).toEqual({ status: 'fulfilled', value: expectSting4 })
  })
})

test('resolution handler is called when promise allSetled is rejected', async () => {
  return new MyPromise((res) =>
    MyPromise.allSettled([promiseSuccess1, promiseSuccess2, promiseSuccess3, expectSting4, promiseErrro1]).then(res)
  ).then(([data1, data2, data3, data4, data5]) => {
    expect(data1).toEqual({ status: 'fulfilled', value: expectSting1 })
    expect(data2).toEqual({ status: 'fulfilled', value: expectSting2 })
    expect(data3).toEqual({ status: 'fulfilled', value: expectSting3 })
    expect(data4).toEqual({ status: 'fulfilled', value: expectSting4 })
    expect(data5).toEqual({ status: 'rejected', reason: expectSting5 })
  })
})
