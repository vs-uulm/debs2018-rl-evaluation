const express = require('express');

module.exports = (server, api) => {
  const router = express.Router();

  const validateBody = params => (req, res, next) => {
    if (params.some(key => !req.body.hasOwnProperty(key))) {
      res.status(400);
      res.json({
        error: true,
        reason: 'invalid arguments'
      });
      res.end();
      return;
    }

    next();
  };

  const callApi = async (res, next, status, func, params) => {
    const result = await func(...params);
    res.status(result.status);
    if (result.error) {
      res.json({
        error: true,
        reason: result.reason
      });
    } else {
      res.json(result.result);
    }

    res.end();
  };

  /**
   * @api {get} /product/:id Get Product information
   * @apiName GetProduct
   * @apiGroup Product
   *
   * @apiSuccess {Object} product The product.
   * @apiSuccessExample {json} Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "name": "Product A",
   *       "amount": 2,
   *       "price": 2.23
   *     }
   *
   * @apiError ProductNotFound No product with <code>id</code> was found.
   * @apiErrorExample {json} Error-Response:
   *     HTTP/1.1 404 Not Found
   *     {
   *       "error": true,
   *       "reason": "Product not found"
   *     }
   */
  router.get(
    '/product/:id',
    (req, res, next) => callApi(res, next, 200, api.getProduct, [
      req.params.id
    ])
  );

  /**
   * @api {post} /product/:id Restock Product
   * @apiName RestockProduct
   * @apiGroup Product
   *
   * @apiParam {Number} amount the amount of products that are added/removed from stock.
   * @apiParamExample {json} Input
   *     {
   *       "amount": 2
   *     }
   *
   * @apiSuccess {Object} product The product.
   * @apiSuccessExample {json} Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "name": "Product A",
   *       "amount": 4,
   *       "price": 2.23
   *     }
   *
   * @apiError ProductNotFound No product with <code>id</code> was found.
   * @apiErrorExample {json} Error-Response:
   *     HTTP/1.1 404 Not Found
   *     {
   *       "error": true,
   *       "reason": "Product not found"
   *     }
   * @apiError InvalidAmount New <code>amount</code> must be positive.
   * @apiErrorExample {json} Error-Response:
   *     HTTP/1.1 400 Bad Request
   *     {
   *       "error": true,
   *       "reason": "New amount must be positive"
   *     }
   */
  router.post(
    '/product/:id',
    validateBody(['amount']),
    (req, res, next) => callApi(res, next, 200, api.restockProduct, [
      req.params.id,
      req.body.amount
    ])
  );

  /**
   * @api {put} /product/:id Create a Product
   * @apiName CreateProduct
   * @apiGroup Product
   *
   * @apiParam {String} name name of the product.
   * @apiParam {Number} amount how many instances of this product are available.
   * @apiParam {Number} price the price of the product.
   * @apiParamExample {json} Input
   *    {
   *       "name": "Product A",
   *       "amount": 2,
   *       "price": 2.23
   *    }
   *
   * @apiSuccess {Object} product The added product.
   * @apiSuccessExample {json} Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "name": "Product A",
   *       "amount": 2,
   *       "price": 2.23
   *     }
   *
   * @apiError ProductAlreadyExists A product with the same <code>id</code> already exists.
   * @apiErrorExample {json} Error-Response:
   *     HTTP/1.1 409 Conflict
   *     {
   *       "error": true,
   *       "reason": "Product already exists"
   *     }
   * @apiError InvalidAmount New <code>amount</code> must be positive.
   * @apiErrorExample {json} Error-Response:
   *     HTTP/1.1 400 Bad Request
   *     {
   *       "error": true,
   *       "reason": "New amount must be positive"
   *     }
   */
  router.put(
    '/product/:id',
    validateBody(['name', 'amount', 'price']),
    (req, res, next) => callApi(res, next, 201, api.createProduct, [
      req.params.id,
      req.body.name,
      req.body.amount,
      req.body.price
    ])
  );

  /**
   * @api {put} /user/:id Create a User
   * @apiName CreateUser
   * @apiGroup User
   *
   * @apiParam {String} name name of the user.
   * @apiParam {String} email email address of the user.
   * @apiParamExample {json} Input
   *    {
   *       "name": "Jane Doe",
   *       "email": "jane.doe@example.tld"
   *    }
   *
   * @apiSuccess {Object} user The added user.
   * @apiSuccessExample {json} Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "name": "Jane Doe",
   *       "email": "jane.doe@example.tld"
   *       "cart": {}
   *     }
   *
   * @apiError UserAlreadyExists A user with the same <code>id</code> already exists.
   * @apiErrorExample {json} Error-Response:
   *     HTTP/1.1 409 Conflict
   *     {
   *       "error": true,
   *       "reason": "User already exists"
   *     }
   */
  router.put(
    '/user/:id',
    validateBody(['name', 'email']),
    (req, res, next) => callApi(res, next, 201, api.createUser, [
      req.params.id,
      req.body.name,
      req.body.email
    ])
  );

  /**
   * @api {get} /user/:id Get a User's cart
   * @apiName GetCart
   * @apiGroup User
   *
   * @apiSuccess {Object} user The added user.
   * @apiSuccessExample {json} Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "5": 2,
   *       "2": 6
   *     }
   *
   * @apiError UserNotFound No user with <code>id</code> was found.
   * @apiErrorExample {json} Error-Response:
   *     HTTP/1.1 404 Not Found
   *     {
   *       "error": true,
   *       "reason": "User not found"
   *     }
   */
  router.get(
    '/user/:id/cart',
    (req, res, next) => callApi(res, next, 200, api.getCart, [
      req.params.id
    ])
  );

  /**
   * @api {get} /user/:id/cart/product/:pid Get a Product in a User's cart
   * @apiName GetProductInCart
   * @apiGroup User
   *
   * @apiSuccess {Number} amount The amount of this product in the user's cart.
   * @apiSuccessExample {json} Success-Response:
   *     HTTP/1.1 200 OK
   *     { amount: 6 }
   *
   * @apiError UserNotFound No user with <code>id</code> was found.
   * @apiErrorExample {json} Error-Response:
   *     HTTP/1.1 404 Not Found
   *     {
   *       "error": true,
   *       "reason": "User not found"
   *     }
   */
  router.get(
    '/user/:id/cart/product/:pid',
    (req, res, next) => callApi(res, next, 200, api.getProductInCart, [
      req.params.id,
      req.params.pid
    ])
  );

  /**
   * @api {put} /user/:id/cart/product/:pid Add a Product to a User's cart
   * @apiName AddProductToCart
   * @apiGroup User
   *
   * @apiParam {Number} amount The amount of this product to add to the user's cart.
   * @apiParamExample {json} Input
   *     {
   *        "amount": 6
   *     }
   *
   * @apiSuccess {Number} amount The amount of this product in the user's cart.
   * @apiSuccessExample {json} Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *        "amount": 12
   *     }
   *
   * @apiError UserNotFound No user with <code>id</code> was found.
   * @apiErrorExample {json} Error-Response:
   *     HTTP/1.1 404 Not Found
   *     {
   *       "error": true,
   *       "reason": "User not found"
   *     }
   * @apiError InvalidAmount New <code>amount</code> must be positive.
   * @apiErrorExample {json} Error-Response:
   *     HTTP/1.1 400 Bad Request
   *     {
   *       "error": true,
   *       "reason": "New amount must be positive"
   *     }
   */
  router.put(
    '/user/:id/cart/product/:pid',
    validateBody(['amount']),
    (req, res, next) => callApi(res, next, 200, api.addProductToCart, [
      req.params.id,
      req.params.pid,
      req.body.amount
    ])
  );

  /**
   * @api {post} /user/:id/cart/product/:pid Add/remove Products to/from the User's cart
   * @apiName ChangeProductInCart
   * @apiGroup User
   *
   * @apiParam {Number} amount The amount of this product to add/remove to/from the user's cart.
   * @apiParamExample {json} Input
   *     {
   *        "amount": -2
   *     }
   *
   * @apiSuccess {Number} amount The amount of this product in the user's cart.
   * @apiSuccessExample {json} Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *        "amount": 10
   *     }
   *
   * @apiError UserNotFound No user with <code>id</code> was found.
   * @apiErrorExample {json} Error-Response:
   *     HTTP/1.1 404 Not Found
   *     {
   *       "error": true,
   *       "reason": "User not found"
   *     }
   * @apiError InvalidProduct No product with <code>pid</code> is in the user's cart.
   * @apiErrorExample {json} Error-Response:
   *     HTTP/1.1 400 Bad Request
   *     {
   *       "error": true,
   *       "reason": "Product is not in the users cart"
   *     }
   * @apiError InvalidAmount New <code>amount</code> must be positive.
   * @apiErrorExample {json} Error-Response:
   *     HTTP/1.1 400 Bad Request
   *     {
   *       "error": true,
   *       "reason": "New amount must be positive"
   *     }
   */
  router.post(
    '/user/:id/cart/product/:pid',
    validateBody(['amount']),
    (req, res, next) => callApi(res, next, 200, api.changeProductInCart, [
      req.params.id,
      req.params.pid,
      req.body.amount
    ])
  );

  /**
   * @api {delete} /user/:id/cart/product/:pid remove Product from a User's cart
   * @apiName RemoveProductFromCart
   * @apiGroup User
   *
   * @apiSuccess {Boolean} okay True, if successful.
   * @apiSuccessExample {json} Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *        "okay": true
   *     }
   *
   * @apiError UserNotFound No user with <code>id</code> was found.
   * @apiErrorExample {json} Error-Response:
   *     HTTP/1.1 404 Not Found
   *     {
   *       "error": true,
   *       "reason": "User not found"
   *     }
   * @apiError InvalidProduct No product with <code>pid</code> is in the user's cart.
   * @apiErrorExample {json} Error-Response:
   *     HTTP/1.1 400 Bad Request
   *     {
   *       "error": true,
   *       "reason": "Product is not in the users cart"
   *     }
   */
  router.delete(
    '/user/:id/cart/product/:pid',
    (req, res, next) => callApi(res, next, 200, api.removeProductFromCart, [
      req.params.id,
      req.params.pid
    ])
  );

  /**
   * @api {post} /user/:id/cart/checkout checkout all products in the User's cart
   * @apiName CheckoutCart
   * @apiGroup User
   *
   * @apiSuccess {Number} total The total costs of all purchased products.
   * @apiSuccessExample {json} Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *        "total": 12.85
   *     }
   *
   * @apiError UserNotFound No user with <code>id</code> was found.
   * @apiErrorExample {json} Error-Response:
   *     HTTP/1.1 404 Not Found
   *     {
   *       "error": true,
   *       "reason": "User not found"
   *     }
   */
  router.post(
    '/user/:id/cart/checkout',
    (req, res, next) => callApi(res, next, 200, api.checkoutCart, [
      req.params.id,
      req.params.pid
    ])
  );

  /**
   * @api {get} /exit exits the platform
   * @apiName Exit
   * @apiGroup Platform
   */
  router.get('/exit', async (req, res) => {
    res.end();
    server.close();
  });

  return router;
};
