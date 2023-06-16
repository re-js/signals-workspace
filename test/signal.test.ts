import { signal, effect } from '..';

test("should work box", () => {
  const spy = jest.fn();
  const a = signal(0);
  effect(() => spy(a()));

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenLastCalledWith(0);
  a.set(1);
  expect(spy).toHaveBeenCalledTimes(2);
  expect(spy).toHaveBeenLastCalledWith(1);
  a.set(1);
  expect(spy).toHaveBeenCalledTimes(2);
});

test("should work custom comparer", () => {
  const spy = jest.fn();
  const a = signal(NaN, (val, next) => val === next);
  effect(() => spy(a()));

  expect(spy).toBeCalledTimes(1);
  a.set(NaN);
  expect(spy).toBeCalledTimes(2);
});