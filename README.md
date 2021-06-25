# Await dictionary of Promises

## Status

* Champion(s): Jordan Harband, Rick Waldron
* Author(s): Alexander J. Vincent
* Stage: 0

## Motivation

Await keywords for properties on an object block execution:

```javascript
const obj = {
  shape: await shape,
  color: await color,
  mass: await mass,
}
```

This is not how promises should be used:  we have to wait for the shape property, _then_ the color property, _then_ the mass property.  It would be better to have a `Promise.all()`-like static function, which we're calling `Promise.ownProperties()` as a parallel to `Object.getOwnPropertyNames()` or `Reflect.ownKeys()`, to construct an object with asynchronous properties.

While a workaround is admittedly somewhat easy to write, this pattern (link requested for BlueBird) appears [often](https://github.com/Agoric/agoric-sdk/blob/c254eb6950d99f28f410745aaaba5cda7f104af1/packages/same-structure/src/sameStructure.js#L104-L108) enough to potentially bring into the main language.  Plus, it is not a feature that developers new to promises would think of.

## Use cases

One use case is above, for defining an object's properties asynchronously.

We've had no discussion on the API yet.

Another is for _asynchronous Map objects_, where either the keys or the values may be promises.  This is the use case for implementing `Promise.fromEntries()`, similar to `Object.fromEntries()`.  In fact, the polyfill below uses this algorithm:

1. Extract keys and values from an iterable using `Object.entries()`
2. Await an array of `Promise.all([key, value])` tuples using `Promise.all()`
3. Reconstruct the desired object using `Object.fromEntries()`

Both methods would return a single Promise which resolves to an object.

Details:
* We are not proposing deep-copy support in these API's.
* We are looking at "own enumerable properties", again similar to Object.entries().

## Description

Here's some example code of how we envision these two methods in use.

```javascript
const objectFixture = {
  one: Promise.resolve(1),
  two: Promise.resolve(2),
  three: Promise.resolve(3)
};

const entriesFixture = [
  [Promise.resolve("four"), Promise.resolve(4)],
  [Promise.resolve("five"), Promise.resolve(5)],
  [Promise.resolve("six"), Promise.resolve(6)],
];

const result = await Promise.ownProperties(objectFixture);
console.log(JSON.stringify(result)); // results in '{ "one": 1, "two": 2, "three": 3 }'

const result2 = await Promise.fromEntries(entriesFixture);
console.log(JSON.stringify(result2)); // results in '{ "four": 4, "five": 5, "six": 6 }'
```

### Promise.ownProperties()

* The dictionary argument is a normal object, with the caveat that its property values are a mix of promises and resolved values.
* The method returns a Promise which resolves to an object with the same order of keys and all promises among the values resolved.

### Promise.fromEntries()

* The iterable argument is an iterable, wherein the values retrieved in a `for...of` loop are themselves a key-value tuple, and either member of the tuple may be a Promise.
* The method returns a Promise which resolves to an object with the same order of keys and all promises among the values resolved.

## Comparison

TBD

## Implementations

### Polyfill/transpiler implementations

None.

### Native implementations

None.

## Q&A

**Q**: Why not WeakMaps, WeakSets or Sets?

**A**: WeakMaps and WeakSets are by design not iterable.  Sets are iterable, but `Promise.all()` covers that case fairly well, we think.

**Q**: Why not a deep-copy option?

**A**: Deep copy traditionally has been left out of JavaScript for a number of reasons.  While a recursive promise walking API might be possible, combining it with this feels overcomplicated and unlikely to pass TC39's smell tests.

**Q**: Why not all keys?

**A**: This implies walking the prototype chain.  Note this proposal would have been `Promise.allProperties()` originally, but that naming confuses what the polyfill does above with that intended use case.  Plus, if a prototype has promises on it, then how would we safely construct the prototype of the resulting object?  Going down the prototype chain opens a can of worms.

**Q**: What about symbol keys?

**A**: We haven't really talked about them yet.  That said, `Object.entries()`, for better or for worse, only considers string keys.

## Maintain your proposal repo

(For the future) 

  1. Make your changes to `spec.emu` (ecmarkup uses HTML syntax, but is not HTML, so I strongly suggest not naming it ".html")
  1. Any commit that makes meaningful changes to the spec, should run `npm run build` and commit the resulting output.
  1. Whenever you update `ecmarkup`, run `npm run build` and commit any changes that come from that dependency.

  [explainer]: https://github.com/tc39/how-we-work/blob/HEAD/explainer.md
