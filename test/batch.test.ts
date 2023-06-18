import { signal, batch, computed } from '..';

test("Setting a new value to signal during batch should reset computed", () => {
  const a = signal(0);
  const b = signal(0);
  const c = computed(() => a() + b());

  expect(c()).toBe(0);

  batch(() => {
    a.set(1);
    b.set(2);
    expect(c()).toBe(3);
  });
});