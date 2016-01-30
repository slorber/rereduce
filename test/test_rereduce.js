// TODO: Add test for React Redux connect function

import chai from 'chai'
import {  createReducer, mapValues  } from '../src/index'

const assert = chai.assert

function pick(obj, fn) {
  return Object.keys(obj).reduce((result, key) => {
    if (fn(obj[key])) {
      result[key] = obj[key]
    }
    return result
  }, {})
}
function combineReducers(reducers) {
  var finalReducers = pick(reducers, (val) => typeof val === 'function')
  return (state = {}, action) => mapValues(finalReducers,
    (reducer, key) => reducer(state[key], action)
  )
}

suite('rereduce', () => {

  test('reducers can depend on each others', () => {

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

    state = counters(state, { type: 'increment' })
    assert.equal(state.a, 2)
    assert.equal(state.b, 25)
    assert.equal(state.c, 48)
    assert.equal(state.d, 49)

    state = counters(state, { type: 'decrement' })
    assert.equal(state.a, 1)
    assert.equal(state.b, 15)
    assert.equal(state.c, 64)
    assert.equal(state.d, 65)

    state = counters(state, { type: 'decrement' })
    assert.equal(state.a, 0)
    assert.equal(state.b, 5)
    assert.equal(state.c, 69)
    assert.equal(state.d, 70)

  })

})
