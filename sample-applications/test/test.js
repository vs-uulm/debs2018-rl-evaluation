const sequence = require('./sequence');

describe('in-memory API', sequence(require('../api/memory')));
// describe('PostgreSQL API', sequence(require('../api/postgres')));
describe('RetroLambda API', sequence(require('../api/retroLambda')));
