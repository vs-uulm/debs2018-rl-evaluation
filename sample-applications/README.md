# Shopping Cart Service Sample Applications
This project contains three reference implementations of a simple shopping cart service that vary in the persistence solution:
 * in-memory
 * PostgreSQL
 * retro-λ

## Getting Started
### Using Docker
`API` can be set to either `memory`, `postgres`, or `retro-lambda`.
The RESTful API can be accessed via the exposed port 8080.
For further information refer to the use in the popper pipelines.

```bash
docker build . -t shopping-cart
docker run -e "API=memory" -e "PORT=8080" -w "/tmp" -p 8080 -it shopping-cart
```

### Using a Local Node.js Installation
#### Install dependencies:
```bash
npm install
```

#### Run test sequence:
```bash
npm test
```

#### Run shopping cart service:
`API` can be set to either `memory`, `postgres`, or `retro-lambda`.
The RESTful API can be accessed via port 8080.
```bash
API=memory PORT=8080 node bin/www
```
