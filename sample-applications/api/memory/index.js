const users = {};
const products = {};
const warehouse = {
  stock: 0,
  sales: 0
};

module.exports = {
  getProduct: (id) => {
    if (!products.hasOwnProperty(id)) {
      return { error: true, status: 404, reason: 'Product not found' };
    }

    return { ok: true, status: 200, result: products[id] };
  },

  createProduct: (id, name, amount, price) => {
    if (products.hasOwnProperty(id)) {
      return { error: true, status: 409, reason: 'Product already exists' };
    }

    if (amount < 0) {
      return { error: true, status: 400, reason: 'New amount must be positive' };
    }

    warehouse.stock += amount;
    products[id] = {
      name,
      amount,
      price
    };

    return { ok: true, status: 201, result: products[id] };
  },

  restockProduct: (id, amount) => {
    if (!products.hasOwnProperty(id)) {
      return { error: true, status: 404, reason: 'Product not found' };
    }

    if ((products[id].amount + amount) < 0) {
      return { error: true, status: 400, reason: 'New amount must be positive' };
    }

    warehouse.stock += amount;
    products[id].amount += amount;

    return { ok: true, status: 200, result: products[id] };
  },

  createUser: (id, name, email) => {
    if (users.hasOwnProperty(id)) {
      return { error: true, status: 409, reason: 'User already exists' };
    }

    users[id] = {
      name,
      email,
      cart: {}
    };

    return { ok: true, status: 201, result: users[id] };
  },

  getCart: (id) => {
    if (!users.hasOwnProperty(id)) {
      return { error: true, status: 404, reason: 'User not found' };
    }

    return { ok: true, status: 200, result: users[id].cart };
  },

  getProductInCart: (id, pid) => {
    if (!users.hasOwnProperty(id)) {
      return { error: true, status: 404, reason: 'User not found' };
    }

    return { ok: true, status: 200, result: { amount: users[id].cart[pid] } };
  },

  addProductToCart: (id, pid, amount) => {
    if (!users.hasOwnProperty(id)) {
      return { error: true, status: 404, reason: 'User not found' };
    }

    if (!products.hasOwnProperty(pid)) {
      return { error: true, status: 404, reason: 'Product not found' };
    }

    if (amount < 0) {
      return { error: true, status: 400, reason: 'New amount must be positive' };
    }

    if ((products[pid].amount - amount) < 0) {
      return { error: true, status: 400, reason: 'New amount must be positive' };
    }

    if (users[id].cart.hasOwnProperty(pid)) {
      return { error: true, status: 400, reason: 'Product already in cart' };
    }

    warehouse.stock -= amount;
    users[id].cart[pid] = amount;
    products[pid].amount -= amount;

    return { ok: true, status: 200, result: { amount: users[id].cart[pid] } };
  },

  changeProductInCart: (id, pid, amount) => {
    if (!users.hasOwnProperty(id)) {
      return { error: true, status: 404, reason: 'User not found' };
    }

    if (!products.hasOwnProperty(pid)) {
      return { error: true, status: 404, reason: 'Product not found' };
    }

    if (!users[id].cart.hasOwnProperty(pid)) {
      return { error: true, status: 400, reason: 'Product is not in the users cart' };
    }

    if ((users[id].cart[pid] + amount) < 0) {
      return { error: true, status: 400, reason: 'New amount must be positive' };
    }

    if ((products[pid].amount - amount) < 0) {
      return { error: true, status: 400, reason: 'New amount must be positive' };
    }

    warehouse.stock -= amount;
    users[id].cart[pid] += amount;
    products[pid].amount -= amount;

    return { ok: true, status: 200, result: { amount: users[id].cart[pid] } };
  },

  removeProductFromCart: (id, pid) => {
    if (!users.hasOwnProperty(id)) {
      return { error: true, status: 404, reason: 'User not found' };
    }

    if (!products.hasOwnProperty(pid)) {
      return { error: true, status: 404, reason: 'Product not found' };
    }

    if (!users[id].cart.hasOwnProperty(pid)) {
      return { error: true, status: 400, reason: 'Product is not in the users cart' };
    }

    warehouse.stock += users[id].cart[pid];
    products[pid].amount += users[id].cart[pid];
    delete users[id].cart[pid];

    return { ok: true, status: 200, result: { okay: true } };
  },

  checkoutCart: (id) => {
    if (!users.hasOwnProperty(id)) {
      return { error: true, status: 404, reason: 'User not found' };
    }

    if (Object.keys(users[id].cart).length === 0) {
      return { error: true, status: 400, reason: 'Cart is empty' };
    }

    let total = 0;
    Object.keys(users[id].cart).forEach((pid) => {
      total += products[pid].price * users[id].cart[pid];
    });

    users[id].cart = {};
    warehouse.sales += total;

    return { ok: true, status: 200, result: { total } };
  },

  getMetrics: () => 0,

  exit: () => 0
};
