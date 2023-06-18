let sync_nest = 0;
let sync_nodes = new Set();      // nodes queued for sync

// map of syncing right now signals, where
// key - signal instance
// value - counter of changings during the sync phase
// let signals_version = new Map();

// put signal in the list of active signals during one full sync
// function signal_version_up(n) {
  // we can mark nodes that are in sync by incrementing the counter
  // upon completion of the synchronization of the change from the node, the counter returns to zero.
  // So we will understand which nodes are synchronized and which are not yet.
  // if (!signals_version.has(n)) {
    // signals_version.set(n, 1);
  // } else {
    // signals_version.set(n, signals_version.get(n) + 1);
  // }
// }

let computed_check = new Set();
let effect_check = new Set();

// let who_i_use_map = new Map(); // who do i use


// let sync_graph = new Map();
// function sync_graph_vertex_factory(node) {
//   if (node.is_signal) {
//     return {
//       node,
//       version: 0
//     }
//   }
// }
// function sync_graph_vertex(node) {
//   if (!sync_graph.has(node)) {
//     sync_graph.set(node, sync_graph_vertex_factory(node))
//   }
// }


function sync() {

  // sync_nodes.forEach((node) => {
  //   sync_graph_vertex(node);

  //   if (node.users.size) { // если есть те кто используют ноду

  //   }
  // });

/*
  Альтернатива:
  я тут обхожу весь граф целиком и строю таблицу


*/


  sync_nodes.forEach((node) => {
    // if (node.is_signal) signal_version_up(node);


// Я достаю селектор как зависимый от бокса.
// Если все его зависимости боксы, то селектор помечается как определенный и его можно запускать.
// Если среди его зависимостей есть селекторы, которые прямо сейчас не определены, мы должны добавть 
//   такой селектор в карту.

//   Где ключом будет неопределенный селектор, а одним из набора значений определяемый селектор.
//   Далее должно быть множество таких ключей.
//   И должно быть дерево, где ключ это определяемый селектор, а значение это количество неопределенных завимостей, как оно становится равным 0, селектор можно исполнять.
    
    // if (node.is_computed) {
      // Возможно здесь должны быть только сигналы
    // }


    // вот тут в node.users храняться все кто использует записанную ноду.
    // т.е. первые на проверку.
    // можно помечать ноды которые проходят синхронизации увеличивая счетчик
    // по завершению синхранизации изменения от ноды, счетчик возвращается в ноль.
    // Так мы поймем какие ноды синхронизовались, а какие еще нет.
    // Давай сделаю классы.

    node.users.forEach((n) => {
      if (n.is_effect) {
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
        if (node.refresh()) {
          sync_nodes.add(node);
          sync();
        }
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
  sync_nodes,
  sync
}