const rL = require('retro-lambda');

rL.createUpdateFunction('bootstrap', (context) => {
  context.createAggregate('warehouse', { sales: 0 }, {
    addSales: (state, sales) => {
      state.sales += sales;
      return 'SALES_ADDED';
    }
  });

  context.createAggregate('taxation', { taxRate: 0.19 }, {
    modifyTaxRate: (state, taxRate) => {
      state.taxRate = taxRate;
      return 'TAX_RATE_CHANGED';
    },

    getTaxRate: () => 'TAX_RATE_GOTTEN'
  });
}).then((context) => {
  context.external(true);
});

rL.invokeUpdateFunction('bootstrap');

rL.createRetroactiveFunction('modifyTaxRate', (context) => {
  const [rate] = context.params;
  context.getAggregate('taxation').modifyTaxRate(rate);
}).then((context) => {
  context.external({ ok: true, status: 200, result: context.result[0].state });
});

rL.createRetroactiveFunction('injectUser', (context) => {
  return context.createAggregate('user:injected', {
    name: 'Retro Klaus',
    email: 'retro@klaus.com',
    cart: {}
  }, {
    addToCart: (state, pid, amount) => {
      if (amount < 0 || state.cart.hasOwnProperty(pid)) {
        return 'CART_ADD_FAILED';
      }

      state.cart[pid] = amount;
      return 'PRODUCT_ADDED';
    },

    removeFromCart: (state, pid) => {
      if (state.cart.hasOwnProperty(pid)) {
        delete state.cart[pid];
        return 'REMOVED';
      }

      return 'REMOVE_FAILED';
    }
  });
}).then((context) => {
  const [pid, amount] = context.params;

  context.getAggregate('user:injected').addToCart(pid, amount);
  context.getAggregate(`product:${pid}`).updateProduct(-amount);
}).then((context) => {
  context.external({ ok: true, status: 200, result: context.result[0].state });
});

rL.createViewFunction('getProduct', async (context) => {
  const [pid] = context.params;

  try {
    const product = await context.queryAggregate(`product:${pid}`);
    return { ok: true, status: 200, result: product };
  } catch (error) {
    return { error: true, status: 404, reason: 'Product not found' };
  }
});

rL.createUpdateFunction('createUser', (context) => {
  const [id, name, email] = context.params;

  return context.createAggregate(`user:${id}`, { name, email, cart: {} }, {
    addToCart: (state, pid, amount) => {
      if (amount < 0 || state.cart.hasOwnProperty(pid)) {
        return 'CART_ADD_FAILED';
      }

      state.cart[pid] = amount;
      return 'PRODUCT_ADDED';
    },

    updateCart: (state, pid, amount) => {
      if (!state.cart.hasOwnProperty(pid) || state.cart[pid] + amount < 0) {
        return 'CART_UPDATE_FAILED';
      }

      state.cart[pid] += amount;
      return 'CART_UPDATED';
    },

    getCart: () => 'CART_GOTTEN',

    getProductInCart: (state, pid) => {
      if (state.cart.hasOwnProperty(pid)) {
        return 'GET_PRODUCT_FAILED';
      }

      return 'PRODUCT_GOTTEN';
    },

    removeFromCart: (state, pid) => {
      if (state.cart.hasOwnProperty(pid)) {
        delete state.cart[pid];
        return 'REMOVED';
      }

      return 'REMOVE_FAILED';
    },

    emptyCart: (state) => {
      state.cart = {};
      return 'CART_EMPTIED';
    }
  });
}).then((context) => {
  if (context.result[0].event !== 'AGGREGATE_CREATED') {
    return context.external({ error: true, status: 409, reason: 'User already exists' });
  }

  return context.external({ ok: true, status: 201, result: context.events[0][0].state });
});

rL.createUpdateFunction('createProduct', (context) => {
  const [id, name, amount, price] = context.params;

  if (amount < 0) {
    return context.external({ error: true, status: 400, reason: 'New amount must be positive' });
  }

  return context.createAggregate(`product:${id}`, { name, amount, price }, {
    updateProduct: (state, value) => {
      if (state.amount + value < 0) {
        return 'PRODUCT_UPDATE_FAILED';
      }

      state.amount += value;
      return 'PRODUCT_UPDATED';
    },

    getProduct: () => 'PRODUCT_GOTTEN'
  });
}).then((context) => {
  if (context.result[0].event !== 'AGGREGATE_CREATED') {
    return context.external({ error: true, status: 409, reason: 'Product already exists' });
  }

  return context.external({ ok: true, status: 201, result: context.events[0][0].state });
});

rL.createViewFunction('getCart', async (context) => {
  const [id] = context.params;

  try {
    const { cart } = await context.queryAggregate(`user:${id}`);
    return { ok: true, status: 200, result: cart };
  } catch (error) {
    return { error: true, status: 404, reason: 'User not found' };
  }
});

rL.createUpdateFunction('addProductToCart', (context) => {
  const [id, pid, amount] = context.params;

  if (amount < 0) {
    context.external({ error: true, status: 400, reason: 'New amount must be positive' });
  } else {
    context.getAggregate(`user:${id}`).addToCart(pid, amount);
    context.getAggregate(`product:${pid}`).updateProduct(-amount);
  }
}).then((context) => {
  const [id, pid, amount] = context.params;

  if (context.result[0].event === 'PRODUCT_ADDED') {
    if (context.result[1].event === 'PRODUCT_UPDATED') {
      // both successful
      context.external({
        ok: true,
        status: 200,
        result: { amount: context.result[0].state.cart[pid] }
      });
    } else {
      // cart update was successful, rollback
      context.getAggregate(`user:${id}`).removeFromCart(pid);
    }
  } else if (context.result[1].event === 'PRODUCT_UPDATED') {
    // product update was successful, rollback
    context.getAggregate(`product:${pid}`).updateProduct(amount);
  } else if (context.result[0].event === 'ERROR') {
    context.external({ error: true, status: 404, reason: 'User not found' });
  } else if (context.result[1].event === 'ERROR') {
    context.external({ error: true, status: 404, reason: 'Product not found' });
  } else {
    // both failed, just invoke external with error
    context.external({ error: true, status: 400, reason: 'New amount must be positive' });
  }
}).then((context) => {
  if (context.result[0].event === 'REMOVED') {
    if (context.events[0][1].event === 'ERROR') {
      context.external({ error: true, status: 404, reason: 'Product not found' });
    } else {
      context.external({ error: true, status: 400, reason: 'New amount must be positive' });
    }
  } else if (context.events[0][0].event === 'ERROR') {
    context.external({ error: true, status: 404, reason: 'User not found' });
  } else {
    context.external({ error: true, status: 400, reason: 'Product already in cart' });
  }
});

rL.createUpdateFunction('changeProductInCart', (context) => {
  const [id, pid, amount] = context.params;

  context.getAggregate(`user:${id}`).updateCart(pid, amount);
  context.getAggregate(`product:${pid}`).updateProduct(-amount);
}).then((context) => {
  const [id, pid, amount] = context.params;

  if (context.result[0].event === 'CART_UPDATED') {
    if (context.result[1].event === 'PRODUCT_UPDATED') {
      // both successful
      context.external({
        ok: true,
        status: 200,
        result: { amount: context.result[0].state.cart[pid] }
      });
    } else {
      // cart update was successful, rollback
      context.getAggregate(`user:${id}`).updateCart(pid, -amount);
    }
  } else if (context.result[1].event === 'PRODUCT_UPDATED') {
    // product update was successful, rollback
    context.getAggregate(`product:${pid}`).updateProduct(amount);
  } else if (context.result[0].event === 'ERROR') {
    context.external({ error: true, status: 404, reason: 'User not found' });
  } else if (context.result[1].event === 'ERROR') {
    context.external({ error: true, status: 404, reason: 'Product not found' });
  } else {
    // both failed, just invoke external with error
    context.external({ error: true, status: 400, reason: 'New amount must be positive' });
  }
}).then((context) => {
  if (context.result[0].event === 'CART_UPDATED') {
    if (context.events[0][1].event === 'ERROR') {
      context.external({ error: true, status: 404, reason: 'Product not found' });
    } else {
      context.external({ error: true, status: 400, reason: 'New amount must be positive' });
    }
  } else if (context.events[0][0].event === 'ERROR') {
    context.external({ error: true, status: 404, reason: 'User not found' });
  } else {
    context.external({ error: true, status: 400, reason: 'Product is not in the users cart' });
  }
});

rL.createViewFunction('getProductInCart', async (query) => {
  const [id, pid] = query.params;
  return (await query.queryAggregate(`user:${id}`)).cart[pid];
});

rL.createUpdateFunction('removeProductFromCart', (context) => {
  const [id, pid] = context.params;
  context.getAggregate(`user:${id}`).getProductInCart(pid);
}).then((context) => {
  const [id, pid] = context.params;

  if (context.result[0].event === 'ERROR') {
    context.external({ error: true, status: 404, reason: 'User not found' });
  } else if (context.result[0].event !== 'GET_PRODUCT_FAILED') {
    context.external({ error: true, status: 400, reason: 'Product is not in the users cart' });
  } else {
    const amount = context.result[0].state.cart[pid];
    context.getAggregate(`product:${pid}`).updateProduct(amount);
    context.getAggregate(`user:${id}`).removeFromCart(pid);
  }
}).then((context) => {
  context.external({ ok: true, status: 200, result: { okay: true } });
});

rL.createUpdateFunction('restockProduct', (context) => {
  const [pid, amount] = context.params;

  try {
    context.getAggregate(`product:${pid}`).updateProduct(amount);
  } catch (e) {
    context.external({ error: true, status: 404, reason: 'Product not found' });
  }
}).then((context) => {
  if (context.result[0].event === 'PRODUCT_UPDATE_FAILED') {
    context.external({ error: true, status: 400, reason: 'New amount must be positive' });
  } else {
    context.external({ ok: true, status: 200, result: context.result[0].state });
  }
});

rL.createUpdateFunction('checkoutCart', (context) => {
  const [id] = context.params;
  context.getAggregate(`user:${id}`).getCart();
  context.getAggregate('taxation').getTaxRate();
}).then((context) => {
  if (context.result[0].event === 'ERROR') {
    context.external({ error: true, status: 404, reason: 'User not found' });
  } else if (Object.keys(context.result[0].state.cart).length === 0) {
    context.external({ error: true, status: 400, reason: 'Cart is empty' });
  } else {
    Object.keys(context.result[0].state.cart).forEach((pid) => {
      context.getAggregate(`product:${pid}`).getProduct();
    });
  }
}).then((context) => {
  const [id] = context.params;
  const { cart } = context.events[0][0].state;

  let total = 0;
  Object.keys(cart).forEach((pid, index) => {
    total += cart[pid] * context.events[1][index].state.price;
  });
  total *= context.events[0][1].state.taxRate;

  context.getAggregate(`user:${id}`).emptyCart();
  context.getAggregate('warehouse').addSales(total);
}).then((context) => {
  const { cart } = context.events[0][0].state;

  let total = 0;
  Object.keys(cart).forEach((pid, index) => {
    total += cart[pid] * context.events[1][index].state.price;
  });
  const netTotal = total;
  total *= (1 + context.events[0][1].state.taxRate);

  context.external({ ok: true, status: 200, result: { total: netTotal } });
});

module.exports = {
  getProduct: async id => rL.invokeViewFunction('getProduct', id),
  createProduct: async (id, name, amount, price) => rL.invokeUpdateFunction('createProduct', id, name, amount, price),
  restockProduct: async (id, amount) => rL.invokeUpdateFunction('restockProduct', id, amount),
  createUser: async (id, name, email) => rL.invokeUpdateFunction('createUser', id, name, email),
  getCart: async id => rL.invokeViewFunction('getCart', id),
  getProductInCart: async (id, pid) => {
    const cart = await module.exports.getCart(id);
    if (!cart.ok) {
      return cart;
    }

    return { ok: true, status: 200, result: { amount: cart.result[pid] ? cart.result[pid] : 0 } };
  },
  addProductToCart: async (id, pid, amount) => rL.invokeUpdateFunction('addProductToCart', id, pid, amount),
  changeProductInCart: async (id, pid, amount) => rL.invokeUpdateFunction('changeProductInCart', id, pid, amount),
  removeProductFromCart: async (id, pid) => rL.invokeUpdateFunction('removeProductFromCart', id, pid),
  checkoutCart: async id => rL.invokeUpdateFunction('checkoutCart', id),
  getMetrics: async () => rL.getMetrics(),
  exit: () => 0
};
