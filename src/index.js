
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

function pick(obj, fn) {
  return Object.keys(obj).reduce((result, key) => {
    if (fn(obj[key])) {
      result[key] = obj[key]
    }
    return result
  }, {})
}
export function combineReducers(reducers) {
  var finalReducers = pick(reducers, (val) => typeof val === 'function')
  return (state = {}, action) => mapValues(finalReducers,
    (reducer, key) => reducer(state[key], action)
  )
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

function wrapState(state,dependencies) {
  if (typeof state === 'object') {
    if ( typeof state.__dependencies !== 'undefined' ) {
      throw new Error('__dependencies is a reserved state attribute name')
    }
    return {
      ...state,
      __dependencies: dependencies
    }
  }
  else {
    return {
      value: state,
      __dependencies: dependencies
    }
  }
}

function unwrapState(state) {
  if ( Object.keys(state).length === 2
    && state.__dependencies
    && typeof state.value !== 'undefined' ) {
    return state.value
  }
  else {
    return state
  }
}

export function createReducer() {

  const { reducerDependencies,reducer,reducerMemoizer } = parseArgs(arguments)

  const hasDependencies = Object.keys(reducerDependencies).length > 0

  if ( !hasDependencies ) {
    return reducerMemoizer(reducer)
  }

  const reducerDependenciesReducer = reducerMemoizer(combineReducers(reducerDependencies))

  const liftedReducer = (state = { value: undefined, __dependencies: undefined }, action) => {
    const { value, __dependencies } = state
    const nextDependenciesState = reducerDependenciesReducer(__dependencies,action)

    const nextDependenciesStatesUnwrapped = mapValues(nextDependenciesState,depState => unwrapState(depState))

    const nextReducerState = reducer(value,action,nextDependenciesStatesUnwrapped)

    if ( typeof nextReducerState === 'object' && typeof nextReducerState.__dependencies !== 'undefined') {
      throw new Error('A reducer that depends on other reducers should not return an object with the __dependencies' +
        ' attribute as it is a reserved attribute name used by the library')
    }

    return wrapState(nextReducerState,nextDependenciesState)
  }

  return reducerMemoizer(liftedReducer)
}
