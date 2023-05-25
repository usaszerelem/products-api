import { Express } from 'express';
import products from '../routes/products';
import users from '../routes/users';
import auth from '../routes/auth';

module.exports = function (app: Express) {
    app.use('/api/products', products);
    app.use('/api/users', users);
    app.use('/api/auth', auth);
};
