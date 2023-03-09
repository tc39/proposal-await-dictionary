# Await dictionary of Promises

## Status

* Champion(s): Ashley Claymore, TBC: Jordan Harband, Rick Waldron
* Author(s): Alexander J. Vincent
* Stage: 0

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

## Potential solutions

### Promise.allProperties

```javascript
const {
  shape,
  color,
  mass,
} = await Promise.allProperties({
  shape: getShape(),
  color: getColor(),
  mass: getMass(),
});
```

### Promise.fromEntries

```javascript
const {
  shape,
  color,
  mass,
} = Object.fromEntries(await Promise.fromEntries({
  ["shape", getShape()],
  ["color", getColor()],
  ["mass", getMass()],
}));
```

## Existing solutions

http://bluebirdjs.com/docs/api/promise.props.html

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

