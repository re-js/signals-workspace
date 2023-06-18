const { Signal, Computed, Effect, untrack, batch } = require('./core');

module.exports = {
  signal,
  computed,
  effect,
  untrack,
  batch
}

/**
 * @param {T} value any value
 * @param {((value1: T, value2: T) => boolean) | void} eq comparer function
 * @return {(() => T) & { set(v: T): void }} Computed value
 */
function signal(value, eq) {
  const node = new Signal(value, eq);
  const handler = node.get.bind(node);
  handler.set = node.set.bind(node);
  return handler;
}

/**
 * @param {() => T} fn computed body
 * @param {((value1: T, value2: T) => boolean) | void} eq comparer function
 * @return {() => T} Computed value
 */
function computed(fn, eq) {
  const node = new Computed(fn, eq);
  return node.get.bind(node);
}

function effect(fn) {
  new Effect(fn).exec();
}
