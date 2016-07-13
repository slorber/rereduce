// TODO: Add test for React Redux connect function

import chai from 'chai'
import expect from 'expect'

import {  createReducer, combineReducers  } from '../src/index'

const assert = chai.assert

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
    assert.equal(state.c.value, 5)
    assert.equal(state.d.value, 6)

    state = counters(state, { type: 'increment' })
    assert.equal(state.a, 1)
    assert.equal(state.b, 15)
    assert.equal(state.c.value, 21)
    assert.equal(state.d.value, 22)

    state = counters(state, { type: 'increment' })
    assert.equal(state.a, 2)
    assert.equal(state.b, 25)
    assert.equal(state.c.value, 48)
    assert.equal(state.d.value, 49)

    state = counters(state, { type: 'decrement' })
    assert.equal(state.a, 1)
    assert.equal(state.b, 15)
    assert.equal(state.c.value, 64)
    assert.equal(state.d.value, 65)

    state = counters(state, { type: 'decrement' })
    assert.equal(state.a, 0)
    assert.equal(state.b, 5)
    assert.equal(state.c.value, 69)
    assert.equal(state.d.value, 70)

  })

  test('reducers can be time-travelled', () => {

    const firstReducer =  createReducer((state = 0, action) => {
      switch (action.type) {
        case 'increment': return state + 1
        case 'decrement': return state - 1
        default: return state
      }
    })

    const secondReducer = createReducer({ firstReducer },
      (state = 0,action,{ firstReducer }) => firstReducer + 1
    )

    const rootReducer = combineReducers({ firstReducer, secondReducer })

    const initialState = undefined
    const stateInitialized = rootReducer(initialState,{ type: 'init' })
    const stateIncremented = rootReducer(stateInitialized,{ type: 'increment' })
    const stateDecremented = rootReducer(stateInitialized,{ type: 'decrement' })
    const stateIncrementedTwice = rootReducer(stateIncremented,{ type: 'increment' })
    const stateDecrementedTwice = rootReducer(stateDecremented,{ type: 'decrement' })

    assert.equal(stateInitialized.firstReducer, 0)
    assert.equal(stateInitialized.secondReducer.value, 1)

    assert.equal(stateIncremented.firstReducer, 1)
    assert.equal(stateIncremented.secondReducer.value, 2)

    assert.equal(stateDecremented.firstReducer, -1)
    assert.equal(stateDecremented.secondReducer.value, 0)

    assert.equal(stateIncrementedTwice.firstReducer, 2)
    assert.equal(stateIncrementedTwice.secondReducer.value, 3)

    assert.equal(stateDecrementedTwice.firstReducer, -2)
    assert.equal(stateDecrementedTwice.secondReducer.value, -1)

  })


  test('reducers are aggressively memoized', () => {

    const firstReducerCalls = expect.createSpy(() => {  })
    const secondReducerCalls = expect.createSpy(() => {  })
    const thirdReducerCalls = expect.createSpy(() => {  })

    const firstReducer =  createReducer((state = { counter: 0 }, action) => {
      firstReducerCalls()
      switch (action.type) {
        case 'increment': return { counter: state.counter + 1 }
        case 'decrement': return { counter: state.counter - 1 }
        default: return state
      }
    })

    const secondReducer = createReducer({ firstReducer }, // declare dependency to firstReducer
      (state = 0,action,{ firstReducer }) => {
        secondReducerCalls()
        return firstReducer.counter + 1
      }
    )

    const thirdReducer = createReducer({ firstReducer, secondReducer }, // declare dependency to firstReducer
      (state = 0,action,{ firstReducer,secondReducer }) => {
        thirdReducerCalls()
        return { thirdResult: firstReducer.counter + secondReducer }
      }
    )

    const rootReducer = combineReducers({
      firstReducerState1: firstReducer,
      firstReducerState2: firstReducer,
      firstReducerState3: firstReducer,
      secondReducerState1: secondReducer,
      secondReducerState2: secondReducer,
      secondReducerState3: secondReducer,
      thirdReducerState1: thirdReducer,
      thirdReducerState2: thirdReducer,
      thirdReducerState3: thirdReducer
    })

    let state = undefined
    state = rootReducer(state,{ type: 'init' })
    state = rootReducer(state,{ type: 'increment' })
    state = rootReducer(state,{ type: 'increment' })

    // Test that reducers are only called when necessary
    expect(firstReducerCalls.calls.length).toBe(3)
    expect(secondReducerCalls.calls.length).toBe(3)
    expect(thirdReducerCalls.calls.length).toBe(3)

    // Test that reducer results are reused when possible to lower memory usage
    assert.equal(state.firstReducerState1.counter, 2)
    assert.equal(state.firstReducerState1, state.firstReducerState2)
    assert.equal(state.firstReducerState1, state.firstReducerState3)

    assert.equal(state.secondReducerState1.value, 3)
    assert.equal(state.secondReducerState1, state.secondReducerState2)
    assert.equal(state.secondReducerState1, state.secondReducerState3)

    assert.equal(state.thirdReducerState1.value.thirdResult, 5)
    assert.equal(state.thirdReducerState1, state.thirdReducerState2)
    assert.equal(state.thirdReducerState1, state.thirdReducerState3)
  })

  test('reducers support null return values', () => {
    const reducer = createReducer((state = null, action) => {
      return state
    })

    const dependentReducer = createReducer({
      dep: reducer
    }, (state = null, action, deps) => {
      return deps.dep
    })

    let state = dependentReducer(undefined, {type: 'init'});
    assert.equal(state.value, null)
  })
})
