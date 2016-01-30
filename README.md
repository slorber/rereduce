# Rereduce


Simple reducer library for Redux. It's like Reselect but for reducers.

What it does:

- It memoizes reducers
- It permits to create reducers depending on other reducers

It means that you can efficiently denormalize state inside Redux store.


```javascript

import {  createReducer  } from 'rereduce'

const a =  createReducer((state = 0, action) => {
  switch (action.type) {
    case 'increment':
      return state + 1
    case 'decrement':
      return state - 1
    default:
      return state
  }
})

const b =  createReducer((state = 5, action) => {
  switch (action.type) {
    case 'increment':
      return state + 10
    case 'decrement':
      return state - 10
    default:
      return state
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


