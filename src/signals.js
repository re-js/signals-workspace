module.exports = {
  signal,
  computed,
  effect,
  untrack,
  batch
}

let context_node;
let untrack_phase = false;

function signal(value, eq = Object.is) {
  const node = [
    value, // 0, value
    new Set() // 1, who using me
  ];

  function read() {
    if (context_node && !untrack_phase) {
      node[1].add(context_node);
    }
    return node[0];
  }
  function write(v) {
    if (!eq(v, node[0])) {
      node[0] = v;

      sync(node);
    }
  }
  read.set = write;
  return read;
}

/**
 * @param {() => T} fn computed body
 * @param {(value1: T, value2: T) => boolean} eq comparer function
 * @return {() => T} Computed value
 */
function computed(fn, eq = Object.is) {
  let has_value = false;
  const node = [
    undefined, // 0, value
    new Set(), // 1, who using me
    check, // 2, checker function
    false // 3, validity status
  ];

  function check() {
    node[3] = false;
    // recalculate computed only if somebody used it
    if (!node[1].size) return;
    validate();
  }

  function read() {
    if (!node[3]) validate();
    if (context_node && !untrack_phase) {
      node[1].add(context_node);
    }
    return node[0];
  }

  function validate() {
    const stack = context_node;
    context_node = node;
    let v;
    try {
      v = fn();
    } finally {
      context_node = stack;
    }
    node[3] = true; // valid
    if (!has_value) {
      node[0] = v;
      has_value = true;
    } 
    else if (!eq(v, node[0])) {
      node[0] = v;

      sync(node);
    }
  }

  return read;
}

function effect(fn) {
  const node = [exec];
  exec();
  function exec() {
    const stack = context_node;
    context_node = node;
    try {
      fn();
    } finally {
      context_node = stack;
    }
  }
}

function untrack(fn) {
  const stack = untrack_phase;
  untrack_phase = true;
  try {
    return fn();
  } finally {
    untrack_phase = stack;
  }
}

let batch_phase = false;

function batch(fn) {
  const stack = batch_phase;
  batch_phase = true;
  try {
    return fn();
  } finally {
    batch_phase = stack;
    sync();
  }
}

let sync_nest = 0;
let sync_nodes = new Set();
let computed_check = new Set();
let effect_check = new Set();

function sync(node) {
  if (node) {
    sync_nodes.add(node);
  }
  if (batch_phase) {
    return;
  }

  sync_nodes.forEach((node) => {
    node[1].forEach((n) => {
      if (n.length === 1) {
        effect_check.add(n);
      } else {
        computed_check.add(n);
      }
    });
    node[1].clear();
  });
  sync_nodes.clear();

  if (sync_nest) return;
  sync_nest++;

  try {
    while (true) {
      if (computed_check.size) {
        const node = computed_check.values().next().value;
        computed_check.delete(node);
        node[2]();
      } else if (effect_check.size) {
        const node = effect_check.values().next().value;
        effect_check.delete(node);
        node[0]();
      } else break;
    }
  } finally {
    sync_nest--;
  }
}
