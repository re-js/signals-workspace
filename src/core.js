let context_node;
let untrack_phase = false;
let batch_phase = false;

class Signal {
  users = new Set();        // who using me

  constructor(value, eq = Object.is) {
    this.value = value;     // value
    this.eq = eq;           // equality function
  }

  set(v) {
    if (this.eq(v, this.value)) return;
    this.value = v;
    sync_nodes.add(this);
    sync();
  }

  get() {
    if (context_node && !untrack_phase) {
      this.users.add(context_node);
    }
    return this.value;
  }
}

class Computed {  
  has_value = false;
  value;                    // value
  users = new Set();        // who using me
  valid = false;            // validity status

  constructor(fn, eq = Object.is) {
    this.fn = fn;           // selector body
    this.eq = eq;           // equality function
  }

  get() {
    if (!this.valid) this.validate();
    if (context_node && !untrack_phase) {
      this.users.add(context_node);
    }
    return this.value;
  }

  check() {
    this.valid = false;
    // recalculate computed only if somebody used me
    if (!this.users.size) return;
    this.validate();
  }

  validate() {
    const stack = context_node;
    context_node = this;
    let v;
    try {
      v = this.fn.call();
    } finally {
      context_node = stack;
    }
    this.valid = true;
    if (!this.has_value) {
      this.value = v;
      this.has_value = true;
    } 
    else if (!this.eq(v, this.value)) {
      this.value = v;

      sync_nodes.add(this);
      sync();
    }
  }
}

class Effect {
  constructor(fn) {
    this.fn = fn;           // effect body
  }

  exec() {
    const stack = context_node;
    context_node = this;
    try {
      this.fn.call();
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

function sync() {
  if (batch_phase) return;

  sync_nodes.forEach((node) => {
    node.users.forEach((n) => {
      if (n.exec) {
        effect_check.add(n);
      } else {
        computed_check.add(n);
      }
    });
    node.users.clear();
  });
  sync_nodes.clear();

  if (sync_nest) return;
  sync_nest++;

  try {
    while (true) {
      if (computed_check.size) {
        const node = computed_check.values().next().value;
        computed_check.delete(node);
        node.check();
      } else if (effect_check.size) {
        const node = effect_check.values().next().value;
        effect_check.delete(node);
        node.exec();
      } else break;
    }
  } finally {
    sync_nest--;
  }
}


module.exports = {
  Signal,
  Computed,
  Effect,
  untrack,
  batch
}