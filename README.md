# Await dictionary of Promises

## Status

Stage: 1

Champions:

- Ashley Claymore ([@acutmore](https://github.com/acutmore))
- Jordan Harband ([@ljharb](https://github.com/ljharb))
- Chris de Almeida ([@ctcpip](https://github.com/ctcpip))
- TBC: Rick Waldron ([@rwaldron](https://github.com/rwaldron))

Authors:

- Alexander J. Vincent ([@ajvincent](https://github.com/ajvincent))
- Ashley Claymore ([@acutmore](https://github.com/acutmore))

## Motivation

`await` on individual properties creates a waterfall, rather than running requests in parallel:

```javascript
const obj = {
  shape: await getShape(),
  color: await getColor(),
  mass: await getMass(),
};
```

`Promise.all` helps, but is based on order, rather than names, which could lead to mixups:

```javascript
const [
  color,
  shape,
  mass,
] = await Promise.all([
  getShape(),
  getColor(),
  getMass(),
]);
```

Solutions using existing syntax can be verbose and _pollute_ the number of variables in scope:

```javascript
const shapeRequest = getShape();
const colorRequest = getColor();
const massRequest = getMass();

const shape = await shapeRequest;
const color = await colorRequest;
const mass = await massRequest;
```

Additionally the above pattern risks unhandled Promise rejections. If `await shapeRequest` throws, then no handler was attached to the `colorRequest` or `massRequest` promises - if either of these reject it will result in an unhandled Promise rejection error. On some systems this will cause the process to exit.

## Proposed Solution

```javascript
const {
  shape,
  color,
  mass,
} = await Promise.allKeyed({
  shape: getShape(),
  color: getColor(),
  mass: getMass(),
});
```

This [intentionally](https://github.com/tc39/proposal-joint-iteration/issues/27#issue-2367717102) follows the shape of https://github.com/tc39/proposal-joint-iteration.

As `Promise.all` is to `Iterator.zip`

```typescript
Iterator.zip = (Array<Iterator<T>>) => Iterator<Array<T>>
Promise.all  = (Array<Promise<T>>)  => Promise<Array<T>>
```

`Promise.allKeyed` is to `Iterator.zipKeyed`

```typescript
type Dict<V> = { [k: string | symbol]: V };

Iterator.zipKeyed = <D extends Dict<Iterator<any>>>(iterables: D)
  => Iterator<{ [k in keyof D]: Nexted<D[k]> }>

Promise.allKeyed  = <D extends Dict<Promise<any>>>(promises: D)
  => Promise <{ [k in keyof D]: Awaited<D[k]> }>
```

### Additional API

This proposal also extends this feature to [`Promise.allSettled`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled) users.

```javascript
const results = await Promise.allSettledKeyed({
    shape: getShape(),
    color: getColor(),
    mass: getMass(),
});
if (results.shape.status === "fulfilled") {
  console.log(results.shape.value);
} else {
  console.error(results.shape.reason)
}
```

## Existing solutions

| Library                            | Own | Symbols |
| -----------------------------------| --- | ------- |
| [Bluebird.props][bluebird]         | ✅  |  ❌     |
| [combine-promises][combine]        | ✅  |  ❌     |
| [p-props][pprops]                  | ✅  |  ❌     |

[bluebird]: http://bluebirdjs.com/docs/api/promise.props.html
[combine]: https://github.com/slorber/combine-promises
[pprops]: https://github.com/sindresorhus/p-props

## Implementations

### Polyfill/transpiler implementations

None.

### Native implementations

None.

## Q&A

### Why not a deep-copy option?

`JSON.stringify` aside, it is not common for builtin JavaScript APIs to traverse arbitrary objects deeply.

`Array.prototype.flat` is _deep_, but only for the well defined boundaries of arrays.

### Why only own keys?

This follows other builtins such as `Object.keys` and also matches https://github.com/tc39/proposal-joint-iteration.

### What about symbol keys?

All enumerable properties are used, included enumerable symbols.

This matches https://github.com/tc39/proposal-joint-iteration.

This does differ from [existing solutions](#existing-solutions), which follow `Object.keys` semantics (ignoring symbols). This difference is not perceived to be an issue due to the low usage of own enumerable symbols.

## Alternatives considered

### `Promise.ownProperties`

```javascript
const {
  shape,
  color,
  mass,
} = await Promise.ownProperties({
  shape: getShape(),
  color: getColor(),
  mass: getMass(),
});
```

### `Promise.fromEntries`

```javascript
const {
  shape,
  color,
  mass,
} = await Promise.fromEntries(Object.entries({
  shape: getShape(),
  color: getColor(),
  mass: getMass(),
}));
```

### `Promise.all` overload

Dispatch depending if the argument is an iterable or not.

```javascript
const {
  shape,
  color,
  mass,
} = await Promise.all({
  shape: getShape(),
  color: getColor(),
  mass: getMass(),
});
```

"This _would_ avoid introducing a new name to the API surface. However, there is discomfort with the shape of the output depending on the shape of the input, and the risk of accidentally passing multiple arguments instead of an array. For example:

```javascript
Promise.all(p1, p2, p3); // ❌ should have been `Promise.all([p1, p2, p3])`
```

While this currently throws as the `p1` is not iterable, the overload would start to allow this call but not do what the caller intended.

### Dedicated syntax

Inspired from other languages such as Swift - see: https://docs.swift.org/swift-book/documentation/the-swift-programming-language/concurrency#Calling-Asynchronous-Functions-in-Parallel

```javascript
async const shape = getShape();
async const color = getColor();
async const mass = getMass();

const obj = await {
  shape,
  color,
  mass: Math.max(0, mass),
};
```

All references to an `async const` identifier within `await <exp>` are implicitly awaited.

The above code would be (roughly) equivalent to:

```javascript
const $0 = getShape();
const $1 = getColor();
const $2 = getMass();

const obj = await ((shape, color, mass) => ({
  shape,
  color,
  mass: Math.max(0, mass),
}))(await $0, await $1, await $2);
```
