
function defaultEqualityCheck(a, b) {
  return a === b
}

function defaultMemoize(func, equalityCheck = defaultEqualityCheck) {
  let lastArgs = null
  let lastResult = null
  return (...args) => {
    if (lastArgs !== null &&
      args.every((value, index) => equalityCheck(value, lastArgs[index]))) {
      return lastResult
    }
    lastArgs = args
    lastResult = func(...args)
    return lastResult
  }
}

export function mapValues(obj, fn) {
  return Object.keys(obj).reduce((result, key) => {
    result[key] = fn(obj[key], key)
    return result
  }, {})
}

function parseArgs(args) {
  if ( args.length == 1) {
    return {
      reducerDependencies: {},
      reducer: args[0],
      reducerMemoizer: defaultMemoize // TODO allow customization
    }
  }
  else if ( args.length == 2) {
    return {
      reducerDependencies: args[0],
      reducer: args[1],
      reducerMemoizer: defaultMemoize
    }
  }
  else {
    throw new Error('Bad usage') // TODO better errors
  }
}

export function createReducer() {
  const { reducerDependencies,reducer,reducerMemoizer } = parseArgs(arguments)

  let reducerStates = mapValues(reducerDependencies,() => undefined)

  return reducerMemoizer(function finalReducer(state, action) {
    reducerStates = mapValues(reducerStates,(state,key) => {
      return reducerDependencies[key](state,action)
    })
    return reducer(state,action,reducerStates)
  })

}
