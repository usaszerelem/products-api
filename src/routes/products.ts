import express, { Request, Response } from 'express';
import { Product, validateProduct } from '../models/product';
import AppLogger from '../utils/Logger';
import ProductDto from '../dtos/ProductDto';
import userAuth from '../middleware/userAuth';
import prodCanUpsert from '../middleware/prodCanUpsert';
import prodCanList from '../middleware/prodCanList';
import prodCanDelete from '../middleware/prodCanDelete';
import { HttpMethod, auditActivity } from '../utils/audit';
import { RequestDto } from '../dtos/RequestDto';
import _ from 'underscore';

const logger = new AppLogger(module);
const router = express.Router();

// -------------------------------------------------

const fieldNames = [
    'sku',
    'code',
    'unitOfMeasure',
    'materialID',
    'description',
    'category',
    'manufacturer',
    'consumerUnits',
    'multiPackDiscount',
    'isMultiCop',
    'isMultiSkoal',
    'isMultiRedSeal',
    'pullPMUSA',
    'pullPMUSAAll',
    'pullUSSTC',
    'multiCanDiscount',
    'isValidUPC',
];

/**
 * return object type from a GET call that uses paging.
 */
type ProductsReturn = {
    _links: {
        base: string;
        next?: string;
        prev?: string;
    };
    pageSize: number;
    pageNumber: number;
    results: ProductDto[];
};

/**
 * Create (register) a new product. This is a functionality exposed only to
 * administrators. Therefore the caller must be authenticated and authorized
 * to make this call.
 */
router.post(
    '/',
    [userAuth, prodCanUpsert],
    async (req: Request, res: Response) => {
        try {
            logger.debug('Inside POST, creating new product...');

            const { error } = validateProduct(req.body);

            if (error) {
                logger.error('Product information failed validation');
                return res.status(400).send(error.details[0].message);
            }

            let product = new Product(_.pick(req.body, fieldNames));
            product = await product.save();

            logger.info('Product was added. ProductID: ' + product._id);
            logger.debug(JSON.stringify(product));

            if (
                !auditActivity(
                    req as RequestDto,
                    HttpMethod.Post,
                    JSON.stringify(product)
                )
            ) {
                return res.status(424).send('Audit server not available');
            }

            return res.status(200).json(product);
        } catch (ex) {
            const msg =
                ex instanceof Error
                    ? ex.message
                    : 'Fatal Exception - Product POST';
            logger.error(JSON.stringify(msg));
            return res.status(500).send(msg);
        }
    }
);

/**
 * Update an existing product. This is a functionality exposed only to
 * administrators. Therefore the caller must be authenticated and authorized
 * to make this call.
 */

router.put(
    '/',
    [userAuth, prodCanUpsert],
    async (req: Request, res: Response) => {
        try {
            let productId = getProductIdFromRequest(req);
            logger.info('Updating product with ID: ' + productId);

            // Ensure product to update exists

            if (_.isUndefined(await Product.findById(productId)) === true) {
                const errMsg = `Product with id ${productId} not found`;
                logger.error(errMsg);
                return res.status(404).send(errMsg);
            }

            let updatedProduct: ProductDto = { ...req.body };

            // Prior to saving, validate that the new values conform
            // to our validation rules.
            const { error } = validateProduct(updatedProduct);

            if (error) {
                logger.error('Product information failed validation');
                return res.status(400).send(error.details[0].message);
            }

            // Everything checks out. Save the product and return
            // update product JSON node
            updatedProduct = await Product.findByIdAndUpdate(
                productId,
                updatedProduct,
                { new: true }
            );

            logger.info('Product was updated. ProductID: ' + productId);
            logger.debug(JSON.stringify(updatedProduct));

            if (
                !auditActivity(
                    req as RequestDto,
                    HttpMethod.Put,
                    JSON.stringify(updatedProduct)
                )
            ) {
                return res.status(424).send('Audit server not available');
            }

            return res.status(200).json(updatedProduct);
        } catch (ex) {
            const msg =
                ex instanceof Error
                    ? ex.message
                    : 'Fatal Exception - Product PUT';
            logger.error(JSON.stringify(msg));
            return res.status(500).send(msg);
        }
    }
);

// ---------------------------------------------------------------------------
// Update an existing product. This is a functionality exposed only to
// administrators. Therefore the caller must be authenticated and authorized
// to make this call.
// ---------------------------------------------------------------------------

router.patch(
    '/',
    [userAuth, prodCanUpsert],
    async (req: Request, res: Response) => {
        try {
            let productId = getProductIdFromRequest(req);
            logger.info('Patching product with ID: ' + productId);

            // Ensure product to update exists

            let product = await Product.findById(productId);

            if (_.isUndefined(product) === true) {
                const errMsg = `Product with id ${productId} not found`;
                logger.error(errMsg);
                return res.status(404).send(errMsg);
            }

            let prodUpdateFields = { ...req.body };

            // There is only need to specify keys that require to be updated
            // Enumerate each key to update, ensure that this key is within
            // the list of known keys and only then apply the value.

            Object.keys(prodUpdateFields).forEach((key) => {
                logger.debug(
                    `Updating product Key: ${key}, Value: ${product[key]} with Value: ${prodUpdateFields[key]}`
                );

                if (fieldNames.indexOf(key) == -1) {
                    let errMsg = 'Update key not recognized: ' + key;
                    logger.error(errMsg);
                } else {
                    product[key] = prodUpdateFields[key];
                }
            });

            // Prior to saving, validate that the new values conform
            // to our validation rules.
            const { error } = validateProduct(product.toObject());

            if (error) {
                logger.error('Product information failed validation');
                return res.status(400).send(error.details[0].message);
            }

            // Everything checks out. Save the product and return
            // update product JSON node
            product = await product.save();

            logger.info('Product was patched. ProductID: ' + product.productId);
            logger.debug(JSON.stringify(product));

            if (
                !auditActivity(
                    req as RequestDto,
                    HttpMethod.Patch,
                    JSON.stringify(product)
                )
            ) {
                return res.status(424).send('Audit server not available');
            }

            return res.status(200).json(product);
        } catch (ex) {
            const msg =
                ex instanceof Error
                    ? ex.message
                    : 'Fatal Exception - Product PATCH';
            logger.error(JSON.stringify(msg));
            return res.status(500).send(msg);
        }
    }
);

/**
 * Retrieves a product either by productId, SKU, code, or category
 */
router.get(
    '/',
    [userAuth, prodCanList],
    async (req: Request, res: Response) => {
        try {
            if (req.query.productId || req.query.sku) {
                let result: [number, ProductDto | string];

                if (req.query.productId) {
                    result = await getProductById(req);
                } else {
                    result = await getProductByField(req, 'sku');
                }

                if (typeof result[1] === 'string') {
                    return res.status(result[0]).send(result[1]);
                } else {
                    return res.status(result[0]).json(result[1]);
                }
            } else {
                let result: [number, ProductsReturn | string];

                if (_.isUndefined(req.query.category) === false) {
                    result = await getProductsByField(req, 'category');
                } else {
                    result = await getProductsByField(req);
                }

                if (typeof result[1] === 'string') {
                    return res.status(result[0]).send(result[1]);
                } else {
                    return res.status(result[0]).json(result[1]);
                }
            }
        } catch (ex) {
            const msg =
                ex instanceof Error
                    ? ex.message
                    : 'Fatal Exception - Product GET';
            logger.error(JSON.stringify(msg));
            return res.status(500).send(msg);
        }
    }
);

/**
 *
 * @param {req } - Request object so that we can access query parameters
 * @param field - Product object field that we would like to search on. As an example 'sku'
 * @returns touple with HTTP Status code as key and either an error or product
 * object as value.
 */
async function getProductsByField(
    req: Request,
    field: string = ''
): Promise<[number, ProductsReturn | string]> {
    const pageNumber: number = req.query.pageNumber ? +req.query.pageNumber : 1;
    const pageSize: number = req.query.pageSize ? +req.query.pageSize : 10;

    let filter = {};

    if (field == 'category') {
        filter = { category: req.query.category };

        logger.info(
            `Requesting list of products by category: ${req.query.category}`
        );
    } else {
        logger.info(`Requesting list of all products`);
    }

    let getFields = {};

    if (req.body.select) {
        getFields = selectFields(req.body.select);
    }

    const products = (await Product.find(filter)
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .select(getFields)) as ProductDto[];

    logger.info(`Returning ${products.length} products`);

    if (
        !auditActivity(
            req as RequestDto,
            HttpMethod.Get,
            JSON.stringify(products)
        )
    ) {
        return [424, 'Audit server not available'];
    } else {
        const response = buildResponse(req, pageNumber, pageSize, products);
        return [200, response];
    }
}

function selectFields(fieldRequested: string[]) {
    var obj: any = {};
    fieldRequested.forEach((field) => {
        obj[field] = 1;
    });
    return obj;
}

/**
 * This function builds the return object that is returned from the GET call where
 * several products are returned. Paging help is provided.
 * @param req - HTTP Request object
 * @param pageNumber - Current page number that was requested
 * @param pageSize - Page size that was requested
 * @param products - Array of products that are returned
 * @returns {ProductsReturn} - JSON object of type ProductsReturn
 */
function buildResponse(
    req: Request,
    pageNumber: number,
    pageSize: number,
    products: ProductDto[]
): ProductsReturn {
    let fullUrl: string =
        req.protocol + '://' + req.get('host') + req.originalUrl;

    const idx = fullUrl.lastIndexOf('?');

    if (idx !== -1) {
        fullUrl = fullUrl.substring(0, idx);
    }

    let response: ProductsReturn = {
        pageSize: pageSize,
        pageNumber: pageNumber,
        _links: {
            base: fullUrl,
        },
        results: products,
    };

    if (pageNumber > 1) {
        response._links.prev =
            fullUrl + `?pageSize=${pageSize}&pageNumber=${pageNumber - 1}`;
    }

    if (products.length === pageSize) {
        response._links.next =
            fullUrl + `?pageSize=${pageSize}&pageNumber=${pageNumber + 1}`;
    }

    return response;
}

/**
 *
 * @param {req } - Request object so that we can access query parameters
 * @param field - Product object field that we would like to search on. As an example 'sku'
 * @returns touple with HTTP Status code as key and either an error or product
 * object as value.
 */
async function getProductByField(
    req: Request,
    field: string
): Promise<[number, ProductDto | string]> {
    logger.info(`Get Product by SKU: ${req.query.sku}`);

    let filter = {};

    if (field == 'sku') {
        filter = { sku: req.query.sku };
    }

    const product = (await Product.findOne(filter)) as ProductDto;

    if (_.isUndefined(product) === true) {
        const errMsg = `Product with ID ${req.query.productId} was not found`;
        console.warn(errMsg);
        return [400, errMsg];
    } else {
        logger.info('Product found: ' + product._id);
        logger.debug(JSON.stringify(product));

        if (
            !auditActivity(
                req as RequestDto,
                HttpMethod.Get,
                JSON.stringify(product)
            )
        ) {
            return [424, 'Audit server not available'];
        } else {
            return [200, product];
        }
    }
}

/**
 *
 * @param {req} - Request object so that we can access query parameters
 * @returns - touple with HTTP Status code as key and either an error or product
 * object as value.
 */
async function getProductById(
    req: Request
): Promise<[number, ProductDto | string]> {
    logger.info(`Get Product by product ID: ${req.query.productId}`);

    const product = (await Product.findById(
        req.query.productId as string
    )) as ProductDto;

    if (_.isUndefined(product) === true) {
        const errMsg = `Product with ID ${req.query.productId} was not found`;
        console.warn(errMsg);
        return [400, errMsg];
    } else {
        logger.info('Product found: ' + product._id);
        logger.debug(JSON.stringify(product));

        if (
            !auditActivity(
                req as RequestDto,
                HttpMethod.Get,
                JSON.stringify(product)
            )
        ) {
            return [424, 'Audit server not available'];
        } else {
            return [200, product];
        }
    }
}

/**
 * Delete an existing product. This is a functionality exposed only to
 * administrators. Therefore the caller must be authenticated and authorized
 * to make this call.
 */
router.delete(
    '/',
    [userAuth, prodCanDelete],
    async (req: Request, res: Response) => {
        try {
            logger.debug('Product Delete...');

            const product = (await Product.findByIdAndDelete(
                req.query.productId as string
            )) as ProductDto;

            if (_.isUndefined(product) === true) {
                return res.status(404).send('Not found');
            } else {
                logger.info(`Product deleted ${req.query.productId}`);

                if (
                    !auditActivity(
                        req as RequestDto,
                        HttpMethod.Delete,
                        JSON.stringify(product)
                    )
                ) {
                    return res.status(424).send('Audit server not available');
                }

                return res.status(200).send('Success');
            }
        } catch (ex) {
            const msg =
                ex instanceof Error
                    ? ex.message
                    : 'Fatal Exception - Product DELETE';
            logger.error(JSON.stringify(msg));
            return res.status(500).send(msg);
        }
    }
);
// -------------------------------------------------
// Ensure product ID was provided. First check the HTTP query
// parameter. If not there check the JSON object within the
// message body.
function getProductIdFromRequest(req: Request): string {
    let productId: string = '';

    if (req.query.productId) {
        productId = req.query.productId as string;
    } else if (req.body.productId) {
        productId = req.body.productId;
    } else {
        throw 'productId not specified';
    }

    return productId;
}

export default router;
