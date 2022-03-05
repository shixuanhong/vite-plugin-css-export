import {
  kebabCaseToUpperCamelCase,
  kebabCaseToLowerCamelCase
} from '../src/transformer'

// kebabCaseToLowerCamelCase

test('kebabCaseToLowerCamelCase: background-color to backgroundColor', () => {
  expect(kebabCaseToLowerCamelCase('background-color')).toBe('backgroundColor')
})

test('kebabCaseToLowerCamelCase: BACKGROUND-COLOR to backgroundColor', () => {
  expect(kebabCaseToLowerCamelCase('background-color')).toBe('backgroundColor')
})

test('kebabCaseToLowerCamelCase: bacKgrOund-cOlor to backgroundColor', () => {
  expect(kebabCaseToLowerCamelCase('background-color')).toBe('backgroundColor')
})

test('kebabCaseToLowerCamelCase: backgroundColor to backgroundcolor', () => {
  expect(kebabCaseToLowerCamelCase('backgroundColor')).toBe('backgroundcolor')
})

test('kebabCaseToLowerCamelCase: animation-iteration-count to animationIterationCount', () => {
  expect(kebabCaseToLowerCamelCase('animation-iteration-count')).toBe('animationIterationCount')
})

test('kebabCaseToLowerCamelCase: animation-iteration-count- to animationIterationCount', () => {
  expect(kebabCaseToLowerCamelCase('animation-iteration-count-')).toBe('animationIterationCount')
})

test('kebabCaseToLowerCamelCase: 1-2-3 to 123', () => {
  expect(kebabCaseToLowerCamelCase('1-2-3')).toBe('123')
})

test('kebabCaseToLowerCamelCase: 1RRR-2AAAA-3DDDD to 1rrr2aaaa3dddd', () => {
  expect(kebabCaseToLowerCamelCase('1RRR-2AAAA-3DDDD')).toBe('1rrr2aaaa3dddd')
})

test('kebabCaseToLowerCamelCase: $12D-2AA5DA-dD4dD to $12d2aa5daDd4dd', () => {
  expect(kebabCaseToLowerCamelCase('$12D-2AA5DA-dD4dD')).toBe('$12d2aa5daDd4dd')
})

// kebabCaseToUpperCamelCase

test('kebabCaseToUpperCamelCase: background-color to BackgroundColor', () => {
  expect(kebabCaseToUpperCamelCase('background-color')).toBe('BackgroundColor')
})

test('kebabCaseToUpperCamelCase: BACKGROUND-COLOR to BackgroundColor', () => {
  expect(kebabCaseToUpperCamelCase('background-color')).toBe('BackgroundColor')
})

test('kebabCaseToUpperCamelCase: bacKgrOund-cOlor to BackgroundColor', () => {
  expect(kebabCaseToUpperCamelCase('background-color')).toBe('BackgroundColor')
})

test('kebabCaseToUpperCamelCase: BackgroundColor to Backgroundcolor', () => {
  expect(kebabCaseToUpperCamelCase('BackgroundColor')).toBe('Backgroundcolor')
})

test('kebabCaseToUpperCamelCase: animation-iteration-count to AnimationIterationCount', () => {
  expect(kebabCaseToUpperCamelCase('animation-iteration-count')).toBe('AnimationIterationCount')
})

test('kebabCaseToUpperCamelCase: animation-iteration-count- to AnimationIterationCount', () => {
  expect(kebabCaseToUpperCamelCase('animation-iteration-count-')).toBe('AnimationIterationCount')
})

test('kebabCaseToUpperCamelCase: 1-2-3 to 123', () => {
  expect(kebabCaseToUpperCamelCase('1-2-3')).toBe('123')
})

test('kebabCaseToUpperCamelCase: 1RRR-2AAAA-3DDDD to 1rrr2aaaa3dddd', () => {
  expect(kebabCaseToUpperCamelCase('1RRR-2AAAA-3DDDD')).toBe('1rrr2aaaa3dddd')
})

test('kebabCaseToUpperCamelCase: $12D-2AA5DA-dD4dD to $12d2aa5daDd4dd', () => {
  expect(kebabCaseToUpperCamelCase('$12D-2AA5DA-dD4dD')).toBe('$12d2aa5daDd4dd')
})