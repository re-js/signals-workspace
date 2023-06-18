const { sync, sync_nodes } = require('./sync');

//
// Получается идея худшего алгоритма
// При каждой записи даже в батче нужно находить все селекторы рекурсивно и помечать
// неопределенными. Можно завести WeakMap где будут храниться все неопределенные селекторы
// что бы их быстро определять и не идти глубже если уже был проход.
//
// При чтении. если я неопределенный селектор, то нужно меня определить.
// Для этого нужно проверить изменилась ли хоть одна из моих зависимостей
// от предыдущего закешированного значения.
// Т.е. получается мне нужно хранить версии всех значений.
//
// Т.е. что бы при чтении понять нужно ли пересчитывать значение
// придется иметь не только тех кого использую я, но и кто использует меня.
// либо нужно где-то это хранить времененно.


// ---------
// Обратные ребра (edges) неопределенных селекторов хранятся в отдельной карте.
// потому что неопределенные селекторы должны рекурсивно помечаться при записи сигналов.
//
// либо мы должны хранить обратные ребра всегда для computed и effect.
// получится что эффекты и сигналы будут иметь только один набор ребер
// так как находят по краям сети
// а селекторы находятся внутри сети и потому будут хранить оба набора ребер
// (видимо этого не избежать)

//
// !! Добавляем второй набор ребер для селекторов и эффектов
// !! Так как при чтении селектора не удается придумать способ
// !! удостовериться что в селекторе содержится актуальный кеш
//


let context_node;
let untrack_phase = false;
let batch_phase = false;

class Signal {
  is_signal = true;
  users = new Set();        // who using me

  constructor(value, eq = Object.is) {
    this.value = value;     // value
    this.eq = eq;           // equality function
  }

  set(v) {
    if (this.eq(v, this.value)) return;
    this.value = v;
    sync_nodes.add(this);
    if (!batch_phase) sync();
    else {
      // we should mark selectors for check in any way
      // because we can read selector durig the batch
      // what is it the selector check.
      // if should be recursive function who check all used selectors
      // 
    }
  }

  get() {
    if (context_node && !untrack_phase) {
      this.users.add(context_node);
    }
    return this.value;
  }
}

class Computed {  
  is_computed = true;
  has_value = false;
  value;                    // value
  users = new Set();        // who using me
  valid = false;            // validity status

  constructor(fn, eq = Object.is) {
    this.fn = fn;           // selector body
    this.eq = eq;           // equality function
  }

  get() {
    // Вот тут. если я неопределенный селектор, то нужно меня определить.
    // Для этого нужно проверить изменилась ли хоть одна из моих зависимостей

    if (!this.valid) this.validate();
    if (context_node && !untrack_phase) {
      this.users.add(context_node);
    }
    return this.value;
  }

  refresh() {
    this.valid = false;
    // recalculate computed only if somebody used me
    if (!this.users.size) return;
    return this.validate();
  }

  validate() {
    const stack = context_node;
    context_node = this;
    let v;
    try {
      // у нас может измениться набор зависимостей
      // но мы никак не сотрем те ноды, которые мы больше не используем
      // т.е. мы должны все же хранить ноды в обе стороны, что бы сбросить
      // зависимости перед запуском
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
      return true; // has_change
    }
  }
}

class Effect {
  is_effect = true;

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
    if (!batch_phase) sync();
  }
}


module.exports = {
  Signal,
  Computed,
  Effect,
  untrack,
  batch
}
