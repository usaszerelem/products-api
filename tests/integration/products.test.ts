import request from 'supertest';
import { ProductDto, ProductsGetAllDto } from '../../src/dtos/ProductDto';
import { StartupReturn, Startup, Shutdown } from './common';
import { Product } from '../../src/models/product';
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

            let chocolate: ProductDto = { ...res.body };

            expect(chocolate._id).toBeTruthy();
        });

        it('should get one product by ID', async () => {
            let prod = lindtChocolate;

            let savedProd = new Product(prod);
            savedProd = await savedProd.save();

            const res = await request(testData.server)
                .get('/api/products')
                .set('x-auth-token', testData.adminAuthToken)
                .query({ productId: savedProd._id.toString() });

            expect(res.status).toBe(200);
            console.log('Returned: ' + JSON.stringify(res, null, 2));

            const returnedProd: ProductDto = { ...res.body };

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

        it('should patch a product', async () => {
            let prod = lindtChocolate;

            let savedProd = new Product(prod);
            savedProd = await savedProd.save();

            const res = await request(testData.server)
                .patch('/api/products')
                .set('x-auth-token', testData.adminAuthToken)
                .send({ inStock: false })
                .query({ productId: savedProd._id.toString() });

            expect(res.status).toBe(200);

            const response = res.body as ProductDto;
            expect(response.inStock).toBe(false);
        });

        it('should update a product', async () => {
            let prod = lindtChocolate;

            let savedProd = new Product(prod);
            savedProd = await savedProd.save();

            const updatedLindtChocolate: ProductDto = {
                name: 'Lindt Cherry',
                description: 'Cherry flavored delicious chocolate',
                unitOfMeasure: 'GRAM',
                units: 200,
                inStock: false,
            };

            const res = await request(testData.server)
                .put('/api/products')
                .set('x-auth-token', testData.adminAuthToken)
                .send(updatedLindtChocolate)
                .query({ productId: savedProd._id.toString() });

            expect(res.status).toBe(200);

            const response = res.body as ProductDto;
            expect(response.name).toBe('Lindt Cherry');
            expect(response.description).toBe(
                'Cherry flavored delicious chocolate'
            );
            expect(response.unitOfMeasure).toBe('GRAM');
            expect(response.units).toBe(200);
            expect(response.inStock).toBe(false);
        });
    });
});
