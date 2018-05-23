const { expect } = require('chai');

module.exports = api => () => {
  it('fails when querying a non existent product', async () => {
    expect(await api.getProduct(2)).to.deep.equal({
      error: true,
      status: 404,
      reason: 'Product not found'
    });
  });

  it('fails when adding a product to a non existent cart', async () => {
    expect(await api.addProductToCart(1, 2, 5)).to.deep.equal({
      error: true,
      status: 404,
      reason: 'User not found'
    });
  });

  it('can create a user', async () => {
    expect(await api.createUser(5, 'foo', 'foo@bar.com')).to.deep.equal({
      ok: true,
      status: 201,
      result: { name: 'foo', email: 'foo@bar.com', cart: {} }
    });
  });

  it('fails when trying to check out an empty cart', async () => {
    expect(await api.checkoutCart(5)).to.deep.equal({
      error: true,
      status: 400,
      reason: 'Cart is empty'
    });
  });

  it('can create a product', async () => {
    expect(await api.createProduct(2, 'handsoap', 10, 5.23)).to.deep.equal({
      ok: true,
      status: 201,
      result: { name: 'handsoap', amount: 10, price: 5.23 }
    });
  });

  it('fails when reducing the amount of a product that is not in the cart', async () => {
    expect(await api.changeProductInCart(5, 2, 3)).to.deep.equal({
      error: true,
      status: 400,
      reason: 'Product is not in the users cart'
    });
  });

  it('can retrieve the user\'s empty cart', async () => {
    expect(await api.getCart(5)).to.deep.equal({
      ok: true,
      status: 200,
      result: {}
    });
  });

  it('can add a product to the user\'s cart', async () => {
    expect(await api.addProductToCart(5, 2, 5)).to.deep.equal({
      ok: true,
      status: 200,
      result: { amount: 5 }
    });
  });

  it('fails when the same product is added again', async () => {
    expect(await api.addProductToCart(5, 2, 5)).to.deep.equal({
      error: true,
      status: 400,
      reason: 'Product already in cart'
    });
  });

  it('can increase the amount of products in the user\'s cart', async () => {
    expect(await api.changeProductInCart(5, 2, 3)).to.deep.equal({
      ok: true,
      status: 200,
      result: { amount: 8 }
    });
  });

  it('can retrieve the user\'s non empty cart', async () => {
    expect(await api.getCart(5)).to.deep.equal({
      ok: true,
      status: 200,
      result: { 2: 8 }
    });
  });

  it('it can remove the product from the user\'s cart', async () => {
    expect(await api.removeProductFromCart(5, 2)).to.deep.equal({
      ok: true,
      status: 200,
      result: { okay: true }
    });
  });

  it('readds the returned product to the stock', async () => {
    expect(await api.getProduct(2)).to.deep.equal({
      ok: true,
      status: 200,
      result: { name: 'handsoap', amount: 10, price: 5.23 }
    });
  });

  it('can retrieve the user\'s again empty cart', async () => {
    expect(await api.getCart(5)).to.deep.equal({
      ok: true,
      status: 200,
      result: {}
    });
  });

  it('can re-add a product to the user\'s cart', async () => {
    expect(await api.addProductToCart(5, 2, 3)).to.deep.equal({
      ok: true,
      status: 200,
      result: { amount: 3 }
    });
  });

  it('can retrieve the user\'s updated cart', async () => {
    expect(await api.getCart(5)).to.deep.equal({
      ok: true,
      status: 200,
      result: { 2: 3 }
    });
  });

  it('can retrieve the added product', async () => {
    expect(await api.getProduct(2)).to.deep.equal({
      ok: true,
      status: 200,
      result: { name: 'handsoap', amount: 7, price: 5.23 }
    });
  });

  it('fails to remove to many instances of a product', async () => {
    expect(await api.restockProduct(2, -9)).to.deep.equal({
      error: true,
      status: 400,
      reason: 'New amount must be positive'
    });
  });

  it('can restock a product', async () => {
    expect(await api.restockProduct(2, 2)).to.deep.equal({
      ok: true,
      status: 200,
      result: { name: 'handsoap', amount: 9, price: 5.23 }
    });
  });

  it('can retrieve the restocked product', async () => {
    expect(await api.getProduct(2)).to.deep.equal({
      ok: true,
      status: 200,
      result: { name: 'handsoap', amount: 9, price: 5.23 }
    });
  });

  it('can check out all products in the user\'s cart', async () => {
    expect(await api.checkoutCart(5)).to.deep.equal({
      ok: true,
      status: 200,
      result: { total: 15.690000000000001 }
    });
  });

  it('can exit', async () => api.exit()).timeout(50000);
};
