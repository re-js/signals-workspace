import { signal, effect, computed, untrack } from '..';

test("computed run only once on each signal change with one signal", () => {
  const spy = jest.fn();
  const a = signal(1);
  const s = computed(() => (spy(), a()));

  expect(spy).toBeCalledTimes(0);

  expect(s()).toBe(1);
  expect(spy).toBeCalledTimes(1);
  expect(s()).toBe(1);
  expect(spy).toBeCalledTimes(1);

  a.set(2);
  expect(s()).toBe(2);
  expect(spy).toBeCalledTimes(2);
  expect(s()).toBe(2);
  expect(spy).toBeCalledTimes(2);
});

test("computed run only once on leave and comback to graph", () => {
  const spy = jest.fn();
  const a = signal(1);
  const s = computed(() => (spy(a()), a()));
  const b = signal(0);
  effect(() => {
    if (b() === 0) s();
  });

  expect(spy).toBeCalledTimes(1);
  expect(spy).toHaveBeenLastCalledWith(1);
  expect(s()).toBe(1);
  b.set(1);
  b.set(0);
  expect(s()).toBe(1);
  expect(spy).toBeCalledTimes(1);
});

test("should work custom comparer", () => {
  const spy = jest.fn();
  const a = signal(0);
  const s = computed(
    () => (a(), NaN),
    (val, next) => val === next
  );
  effect(() => spy(s()));

  expect(spy).toBeCalledTimes(1);
  a.set(1);
  expect(spy).toBeCalledTimes(2);
});

test("should update cache only if comparer return false", () => {
  const d1 = { a: 0 };
  const d2 = { a: 0 };
  const d3 = { a: 1 };
  const spy = jest.fn();
  const a = signal(d1);
  const s = computed(
    () => a(),
    (val, next) => val.a === next.a
  );
  effect(() => spy(s()));

  expect(spy).toBeCalledTimes(1);
  a.set(d2);
  expect(s()).not.toBe(d2);
  expect(spy).toBeCalledTimes(1);
  a.set(d3);
  expect(spy).toBeCalledTimes(2);
  expect(s()).toBe(d3);
});

test("computed should propogate change only if return value changed", () => {
  const spy = jest.fn();
  const a = signal("a");
  const s = computed(() => a()[0]);
  effect(() => spy(s()));

  expect(spy).toBeCalledTimes(1);
  expect(spy).toBeCalledWith("a");
  a.set(untrack(a) + "b");
  expect(spy).toBeCalledTimes(1);
  a.set("ba");
  expect(spy).toBeCalledTimes(2);
  expect(spy).toHaveBeenLastCalledWith("b");
});

// test("should save consistent data", () => {
//   const spy = jest.fn();
//   const a = signal(0);
//   const n1 = computed(() => a() + 1);
//   const n1_1 = computed(() => n1() + 1);
//   const n1_1_1 = computed(() => n1_1() + 1);
//   const n2 = computed(() => spy(a() + "-" + n1_1_1()));

//   effect(() => n2());

//   expect(spy).toBeCalledTimes(1);
//   expect(spy).toHaveBeenLastCalledWith("0-3");
//   a.set(1);
//   expect(spy).toHaveBeenNthCalledWith(2, "1-4");
//   expect(spy).toBeCalledTimes(2);
// });

// test("should allow modification in selector", () => {
//   const a = signal(0);
//   const c = computed(() => {
//     return (a.set(a() || 10);
//   });

//   expect(c()).toBe(10);
// });

// test("should safe consistent for init modifiable selector", () => {
//   const spy = jest.fn();
//   const a = signal(0);
//   const c = computed(() => {
//     if (a() < 10) {
//       a() += 1;
//     }
//     return a();
//   });
//   effect(() => {
//     const m = c();
//     spy(m);
//   });

//   expect(spy).toHaveBeenNthCalledWith(1, 10);
//   expect(spy).toBeCalledTimes(1);
// });

// test("should safe double consistent for modifiable selector and expr", () => {
//   const spy = jest.fn();
//   const a = signal(0);
//   const b = signal(0);
//   const c = computed(() => {
//     if (a() < 10) a() += 1;

//     if (b() === 1) {
//       if (a() < 20) a() += 1;
//       else b.set(2;
//     }
//     return a();
//   });
//   effect(() => {
//     const m = c();
//     const v = !b() ? ((b.set(1), b()) : b();
//     spy(m, v);
//   });

//   expect(spy).toHaveBeenNthCalledWith(1, 10, 1);
//   expect(spy).toHaveBeenNthCalledWith(2, 20, 2);
//   expect(spy).toBeCalledTimes(2);
// });

// test("should safe correct reactions order for changing depth without modification", () => {
//   const spy = jest.fn();
//   const a = signal(0);
//   const b = signal(0);

//   const m0 = computed(() => {
//     return !b() ? a() : k0();
//   });
//   const k0 = computed(() => {
//     return !b() ? m0() : a();
//   });

//   const m = computed(() => m0());
//   const k = computed(() => k0());

//   let i = 0;
//   effect(() => (k(), spy("k", i++)));
//   effect(() => (m(), spy("m", i++)));

//   expect(spy).toHaveBeenNthCalledWith(1, "k", 0);
//   expect(spy).toHaveBeenNthCalledWith(2, "m", 1);
//   expect(spy).toBeCalledTimes(2);
//   spy.mockReset();

//   a.set(1;
//   expect(spy).toHaveBeenNthCalledWith(1, "m", 2);
//   expect(spy).toHaveBeenNthCalledWith(2, "k", 3);
//   expect(spy).toBeCalledTimes(2);
//   spy.mockReset();

//   // switch
//   b.set(1;
//   expect(spy).toBeCalledTimes(0);

//   // check
//   a.set(2;
//   // TODO: Whats happends with order of execution if will change depth but not a value?
//   // TODO: check failed (m:4, k:5)
//   // expect(spy).toHaveBeenNthCalledWith(1, 'k', 4);
//   // expect(spy).toHaveBeenNthCalledWith(2, 'm', 5);
//   expect(spy).toBeCalledTimes(2);
//   spy.mockReset();
// });

// test("stop should work correctly in self", () => {
//   const spy = jest.fn();
//   const spy_2 = jest.fn();
//   const a = signal(0);

//   const [r1, s1] = sel(() => {
//     if (a()) {
//       s1();
//     }
//     spy(a());
//     return a();
//   });

//   effect(() => spy_2(r1()));

//   expect(spy).toBeCalledTimes(1);
//   a.set(1;
//   expect(spy).toBeCalledTimes(2);
//   expect(spy_2).toHaveBeenNthCalledWith(1, 0);

//   a.set(0;
//   expect(spy).toBeCalledTimes(2);
//   expect(spy_2).toBeCalledTimes(1);
// });

// test("stop and run again should work correctly in self", () => {
//   const spy = jest.fn();
//   const spy_2 = jest.fn();
//   const a = signal(0);

//   const [r1, s1] = sel(() => {
//     spy(a());
//     if (a() === 1) {
//       s1();
//       a.set(0;
//       r1();
//     }
//     return a();
//   });
//   effect(() => spy_2(r1()));

//   expect(spy).toBeCalledTimes(1);
//   a.set(1;
//   expect(spy).toHaveBeenNthCalledWith(2, 1);
//   expect(spy).toHaveBeenNthCalledWith(3, 0);
//   expect(spy).toBeCalledTimes(3);
//   expect(a()).toBe(0);
//   expect(spy_2).toHaveBeenNthCalledWith(1, 0);

//   a.set(2;
//   expect(spy).toBeCalledTimes(4);
//   expect(spy).toHaveBeenNthCalledWith(4, 2);
//   expect(spy_2).toBeCalledTimes(1);
// });

// test("cached value as first argument of body function", () => {
//   const spy = jest.fn();
//   const spy_on = jest.fn();

//   const a = signal(1);
//   const stop = signal(0);
//   const s = computed((cache) => (spy(cache), a(), stop() ? cache : a()));

//   sync(s, spy_on);
//   expect(spy).toBeCalledWith(undefined); spy.mockReset();
//   expect(spy_on).toBeCalledWith(1); spy_on.mockReset();

//   a.set(2;
//   expect(spy).toBeCalledWith(1); spy.mockReset();
//   expect(spy_on).toBeCalledWith(2); spy_on.mockReset();

//   stop.set(1;
//   expect(spy).toBeCalledWith(2); spy.mockReset();
//   expect(spy_on).toBeCalledTimes(0);

//   a.set(3;
//   expect(spy).toBeCalledWith(2); spy.mockReset();
//   expect(spy_on).toBeCalledTimes(0);

//   stop.set(0;
//   expect(spy).toBeCalledWith(2); spy.mockReset();
//   expect(spy_on).toBeCalledWith(3); spy_on.mockReset();
// });

// test("two nested selectors just reading in reaction order", () => {
//   const spy = jest.fn();

//   const a = signal([]);
//   const b = computed(() => a()[0]);
//   const c = computed(() => b());

//   on(() => a(), () => spy(c()));

//   a.set([2];
//   expect(spy).toBeCalledWith(2); spy.mockReset();
//   a.set([2];
//   expect(spy).toBeCalledWith(2); spy.mockReset();
//   a.set([4];
//   // expect(spy).toBeCalledWith(4); spy.mockReset(); // TODO: broken reset of selector cache
// });
