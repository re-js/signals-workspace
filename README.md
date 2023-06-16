# Signals workspace

Make the Best Signal

## The ecosystem around Signals.

We can see the different versions of implementations of one algorithm.

- [@preactjs/signals-react](https://github.com/preactjs/signals#guide--api)
- [@angular/signals](https://angular.io/guide/signals)
- MobX, Vue, SolidJS 

And each time it's a different implementation. If you see to source code of each one, everywhere implementation will be different.
Programmer friends, I urge you. Let's write the minimum and most productive code for this algorithm and offer to integrate it into all these libraries. This is how we can maximize the growth of reactive library syntax improvement, as well as the performance increase for all of these frameworks.

Minimal algorithm implementation is currently located in the [re-js/reactive-box](https://github.com/re-js/reactive-box). The repository also contains the tests for algorithm checking.

I will ask for attention, especially from masters of olympiads, and amazing kind guys who have a keen, huge, and clever interest in the complex algorithmic task!


## Signal abstraction

Signal - It's a container with value. Each time when value changes, the container notifies subscribers. It's a basic reactive element that can be used to store any values that can be compared by equality via the comparer function. Using the different comparer functions you can get "shallow" or "deep" equality.

```javascript
const a = signal(0)
const b = signal(1)
```

The second element is the reaction. The primary reason of popularity Signal abstraction is the convenient syntax for collecting reactive dependencies. It happens transparently.

```javascript
effect(() => console.log(a()))
```

The third element is computed.

```javascript
const sum = computed(() => a() + b())
```

For activate reactions we should change any of signals.

```javascript
a.set(2);
```

Necessary to implement these three primary elements. And two additional `untrack`, and `batch`.

Play with demo implementation on Codesandbox https://codesandbox.io/s/unruffled-cerf-ddtt6s?file=/src/signals.js ⭐

Enjoy your signals!