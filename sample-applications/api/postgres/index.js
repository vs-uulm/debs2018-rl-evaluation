const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://db:db@database:5432/db'
});

module.exports = {
  getProduct: async (id) => {
    const res = await pool.query('SELECT * FROM Products WHERE productID = $1', [id]);

    if (res.rows.length < 1) {
      return { error: true, status: 404, reason: 'Product not found' };
    }

    return {
      ok: true,
      status: 200,
      result: {
        name: res.rows[0].name,
        amount: res.rows[0].amount,
        price: parseFloat(res.rows[0].price)
      }
    };
  },

  createProduct: async (id, name, amount, price) => {
    if (amount < 0) {
      return { error: true, status: 400, reason: 'New amount must be positive' };
    }

    try {
      await pool.query(
        'INSERT INTO Products(productID, name, amount, price) VALUES ($1, $2, $3, $4)',
        [id, name, amount, price]
      );

      return { ok: true, status: 201, result: { name, amount, price } };
    } catch (err) {
      return { error: true, status: 409, reason: 'Product already exists' };
    }
  },

  restockProduct: async (id, amount) => {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      const res = await client.query(
        'UPDATE Products SET amount = amount + $1 WHERE productID = $2',
        [amount, id]
      );

      if (res.rowCount === 0) {
        const e = new Error('not found');
        e.detail = 'Product not found';
        throw e;
      }

      await client.query('UPDATE Warehouse SET stock = stock + $1', [amount]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');

      if (err.detail === 'Product not found') {
        return { error: true, status: 404, reason: 'Product not found' };
      }

      return { error: true, status: 400, reason: 'New amount must be positive' };
    } finally {
      client.release();
    }

    return module.exports.getProduct(id);
  },

  createUser: async (id, name, email) => {
    try {
      await pool.query(
        'INSERT INTO Users(userID, name, email) VALUES ($1, $2, $3)',
        [id, name, email]
      );

      return { ok: true, status: 201, result: { name, email, cart: {} } };
    } catch (err) {
      return { error: true, status: 409, reason: 'User already exists' };
    }
  },

  getCart: async (id) => {
    const cart = {};

    const r = await pool.query('SELECT * FROM Users WHERE userID = $1', [id]);
    if (r.rowCount === 0) {
      return { error: true, status: 404, reason: 'User not found' };
    }

    const res = await pool.query('SELECT * FROM Cart_Entry WHERE userID = $1', [id]);
    res.rows.forEach((row) => {
      cart[row.productid] = row.amount;
    });

    return ({ ok: true, status: 200, result: cart });
  },

  getProductInCart: async (id, pid) => {
    const cart = await module.exports.getCart(id);
    if (!cart.ok) {
      return cart;
    }

    return { ok: true, status: 200, result: { amount: cart.result[pid] ? cart.result[pid] : 0 } };
  },

  addProductToCart: async (id, pid, amount) => {
    if (amount < 0) {
      return { error: true, status: 400, reason: 'New amount must be positive' };
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await client.query('UPDATE Warehouse SET stock = stock - $1', [amount]);
      await client.query('UPDATE Products SET amount = amount - $1 WHERE productID = $2', [amount, pid]);
      await client.query('INSERT INTO Cart_Entry (userID, productID, amount) VALUES ($1, $2, $3)', [id, pid, amount]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');

      if (err.detail.endsWith('not present in table "users".')) {
        return { error: true, status: 404, reason: 'User not found' };
      } else if (err.detail.endsWith('not present in table "products".')) {
        return { error: true, status: 404, reason: 'Product not found' };
      }

      return { error: true, status: 400, reason: 'Product already in cart' };
    } finally {
      client.release();
    }

    return { ok: true, status: 200, result: { amount } };
  },

  changeProductInCart: async (id, pid, amount) => {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await client.query('UPDATE Products SET amount = amount - $1 WHERE productID = $2', [amount, pid]);
      const res = await client.query('UPDATE Cart_Entry SET amount = amount + $1 WHERE userID = $2 AND productID = $3', [amount, id, pid]);
      if (res.rowCount === 0) {
        await client.query('ROLLBACK');
        return { error: true, status: 400, reason: 'Product is not in the users cart' };
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      return { error: true, status: 400, reason: 'New amount must be positive' };
    } finally {
      client.release();
    }

    return module.exports.getProductInCart(id, pid);
  },

  removeProductFromCart: async (id, pid) => {
    const entry = await module.exports.getProductInCart(id, pid);
    if (!entry.ok) {
      return entry;
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await client.query('UPDATE Products SET amount = amount + (SELECT amount FROM Cart_Entry WHERE userID = $1 AND productID = $2) WHERE productID = $2', [id, pid]);
      await client.query('DELETE FROM Cart_Entry WHERE userID = $1 AND productID = $2', [id, pid]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      return { error: true, status: 400, reason: 'Product is not in the users cart' };
    } finally {
      client.release();
    }

    return { ok: true, status: 200, result: { okay: true } };
  },

  checkoutCart: async (id) => {
    const cart = await module.exports.getCart(id);
    if (!cart.ok) {
      return cart;
    }

    let total = 0;
    const order = {};

    if (Object.keys(cart.result).length === 0) {
      return { error: true, status: 400, reason: 'Cart is empty' };
    }

    await Promise.all(Object.keys(cart.result).map(async (pid) => {
      const product = await module.exports.getProduct(pid);
      order[pid] = {
        price: parseFloat(product.result.price),
        amount: cart.result[pid]
      };
      total += parseFloat(product.result.price) * cart.result[pid];
    }));

    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      const r = await client.query('INSERT INTO Orders (userID, total) VALUES ($1, $2) RETURNING orderID', [id, total]);
      const orderId = r.rows[0].orderid;
      await Promise.all(Object.keys(order).map(pid => client.query(
        'INSERT INTO Order_Entry (orderID, productID, amount, price) VALUES ($1, $2, $3, $4)',
        [orderId, pid, order[pid].amount, order[pid].price]
      )));

      await client.query('UPDATE Warehouse SET sales = sales + $1', [total]);
      await client.query('DELETE FROM Cart_Entry WHERE userID = $1', [id]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      return { error: true, status: 500, reason: 'Something went wrong' };
    } finally {
      client.release();
    }

    return { ok: true, status: 200, result: { total } };
  },

  getMetrics: async () => {
    const res = await pool.query(`
      SELECT *, pg_size_pretty(total_bytes) AS total
        , pg_size_pretty(index_bytes) AS INDEX
        , pg_size_pretty(toast_bytes) AS toast
        , pg_size_pretty(table_bytes) AS TABLE
      FROM (
        SELECT *, total_bytes-index_bytes-COALESCE(toast_bytes,0) AS table_bytes FROM (
            SELECT c.oid,nspname AS table_schema, relname AS TABLE_NAME
                    , c.reltuples AS row_estimate
                    , pg_total_relation_size(c.oid) AS total_bytes
                    , pg_indexes_size(c.oid) AS index_bytes
                    , pg_total_relation_size(reltoastrelid) AS toast_bytes
                FROM pg_class c
                LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE relkind = 'r'
        ) a
      ) a WHERE table_schema = 'public'
    `);

    let sum = 0;
    res.rows.forEach((row) => {
      sum += parseInt(row.total_bytes, 10);
    });
    return sum;
  },

  exit: async () => {
    await pool.query('TRUNCATE users, orders, cart_entry, order_entry, products, warehouse RESTART IDENTITY CASCADE');
    await pool.query('INSERT INTO warehouse (stock, sales) VALUES (0, 0)');
    await pool.end();
  }
};
