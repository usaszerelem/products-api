import request from 'supertest';
import { ProductDto, ProductsGetAllDto } from '../../src/dtos/ProductDto';
import { StartupReturn, Startup, Shutdown } from './common';
import { Product } from '../../src/models/product';
import mongoose from 'mongoose';
import AppLogger from '../../src/utils/Logger';
import { createProducts } from '../../src/utils/createProducts';
const logger = new AppLogger(module);

describe('/api/products', () => {
    let testData: StartupReturn;

    var _startup = async function () {
        logger.warn('Inside _startup()');
        testData = await Startup();
    };

    var _shutdown = async function () {
        logger.warn('Inside _shutdown()');
        await Shutdown(testData.server);
    };

    var _beforeEach = async function () {
        logger.warn('Inside _beforeEach()');
        await createProducts();
    };

    var _afterEach = async function () {
        logger.warn('Inside _afterEach()');
        await Product.deleteMany({});
    };

    describe('Products CRUD Validation', () => {
        beforeAll(_startup);
        afterAll(_shutdown);
        beforeEach(_beforeEach);
        afterEach(_afterEach);

        const lindtChocolate: ProductDto = {
            name: 'Lindt',
            description: 'Silky smooth chocolate balls',
            unitOfMeasure: 'OUNCES',
            units: 12,
            inStock: true,
        };

        it('should create new product', async () => {
            const res = await request(testData.server)
                .post('/api/products')
                .set('x-auth-token', testData.adminAuthToken)
                .send(lindtChocolate);

            expect(res.status).toBe(200);

            let chocolate = res.body as ProductDto;
            expect(chocolate._id).toBeTruthy();
        });

        it('should get one product by ID', async () => {
            let prodId = new mongoose.Types.ObjectId();
            let prod = lindtChocolate;
            prod._id = prodId.toString();

            let savedProd = new Product(prod);
            savedProd = await savedProd.save();

            const res = await request(testData.server)
                .get('/api/products')
                .set('x-auth-token', testData.adminAuthToken)
                .query({ productId: prod._id });

            expect(res.status).toBe(200);

            const returnedProd = res.body as ProductDto;
            expect(returnedProd).toHaveProperty('_id');
            expect(returnedProd).toHaveProperty('name');
            expect(returnedProd).toHaveProperty('description');
            expect(returnedProd).toHaveProperty('unitOfMeasure');
            expect(returnedProd).toHaveProperty('units');
            expect(returnedProd).toHaveProperty('inStock');
        });

        it('should get one product by field', async () => {
            const fieldsToReturn = {
                select: ['_id', 'name'],
            };

            const res = await request(testData.server)
                .get('/api/products')
                .set('x-auth-token', testData.adminAuthToken)
                .send(fieldsToReturn)
                .query({ filterByField: 'inStock' })
                .query({ filterValue: true });

            expect(res.status).toBe(200);

            const response = res.body as ProductsGetAllDto;
            expect(response.results.length).toBe(6);

            expect(response.results[0]).toHaveProperty('_id');
            expect(response.results[0]).toHaveProperty('name');

            expect(response.results[0]).not.toHaveProperty('description');
            expect(response.results[0]).not.toHaveProperty('unitOfMeasure');
            expect(response.results[0]).not.toHaveProperty('units');
            expect(response.results[0]).not.toHaveProperty('inStock');
        });
    });
});
