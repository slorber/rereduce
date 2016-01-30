# Rereduce


Simple reducer library for Redux. It's like Reselect but for reducers. 

Reducers can depend on each others. 

It permits to replace the imperative `waitFor` of original Flux implementation by a purely functional approach.

# API

`createReducer( [reducerDependencies], reducerFunction)`

`[reducerDependencies]` is an optional object that looks like `{key1: reducer1, key2: reducer2}`

If dependencies are provided, `reducerFunction` will be called with a 3rd argument with the state of the dependency reducers.

Note that the API is a first draft and may change in the future. Don't hesitate to discuss what the API should look like here: https://github.com/slorber/rereduce/issues/1

# Simple example

```javascript
// Create a simple reducer without dependencies
const a =  createReducer(function(state = 0, action) {
  switch (action.type) {
    case 'increment': return state + 1
    case 'decrement': return state - 1
    default: return state
  }
})

// Create another reducer that depends on first reducer
const secondReducer = createReducer({ firstReducer }, // declare dependency to firstReducer
  function(state = 0,action,{firstReducer}) {
    return firstReducer + 1
  }
)

// Everytime secondReducer is called, firstReducer will also be called
// firstReducer is memoized so it is not inefficient to call it multiple times
```



# How it works

What it does in reality:

- It memoizes reducers so that they can be reused efficiently
- It permits to create reducers depending on other reducers

The core logic is simple, it's just 10 lines of code :) the rest is FP utility code. 

```javascript
export function createReducer() {
  const { reducerDependencies,reducer,reducerMemoizer } = parseArgs(arguments)
  
  // This variable tracks the state of the reducer dependencies
  // These states are all initialized to undefined
  let reducerStates = mapValues(reducerDependencies,() => undefined)
  
  const liftedReducer = function(state, action) {
    // Compute reducer dependency states
    reducerStates = mapValues(reducerStates,(state,key) => {
      return reducerDependencies[key](state,action)
    })
    // Call reducer function provided by user and injects reducer dependency states
    return reducer(state,action,reducerStates)
  }
  // Memoize the reducer so that it can be used efficiently as a dependency to other reducers
  return reducerMemoizer(liftedReducer)
}
```

# Unit test

```javascript

import {  createReducer  } from 'rereduce'

const a =  createReducer((state = 0, action) => {
  switch (action.type) {
    case 'increment': return state + 1
    case 'decrement': return state - 1
    default: return state
  }
})

const b =  createReducer((state = 5, action) => {
  switch (action.type) {
    case 'increment': return state + 10
    case 'decrement': return state - 10
    default: return state
  }
})

const c = createReducer({ a,b }, (state = 0,action,{ a,b }) => {
  const sum = a + b
  return state + sum
})

const d = createReducer({ c }, (state = 0,action,{ c }) => {
  return c + 1
})

const counters = combineReducers({ a, b , c, d })

let state

state = counters(state, { type: 'init' })
assert.equal(state.a, 0)
assert.equal(state.b, 5)
assert.equal(state.c, 5)
assert.equal(state.d, 6)

state = counters(state, { type: 'increment' })
assert.equal(state.a, 1)
assert.equal(state.b, 15)
assert.equal(state.c, 21)
assert.equal(state.d, 22)
```


