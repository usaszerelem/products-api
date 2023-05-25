import express, { Request, Response } from 'express';
import { Product, validateProduct } from '../models/product';
import _ from 'underscore';
import AppLogger from '../utils/Logger';
import ProductDto from '../dtos/ProductDto';
import userAuth from '../middleware/userAuth';
import prodCanUpsert from '../middleware/prodCanUpsert';
import prodCanList from '../middleware/prodCanList';
import prodCanDelete from '../middleware/prodCanDelete';
import { HttpMethod, auditActivity } from '../utils/audit';
import { RequestDto } from '../dtos/RequestDto';

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
            logger.error(JSON.stringify(ex));
            return res.status(500).send(ex);
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
            logger.error(JSON.stringify(ex));
            return res.status(500).send(ex);
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
            logger.error(JSON.stringify(ex));
            return res.status(500).send(ex);
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
            if (_.isUndefined(req.query.productId) === false) {
                logger.info(
                    `Get Product by product ID: ${req.query.productId}`
                );
                const product = (await Product.findById(
                    req.query.productId as string
                )) as ProductDto;

                if (_.isUndefined(product) === true) {
                    const errMsg = `Product with ID ${req.query.productId} was not found`;
                    console.warn(errMsg);
                    return res.status(400).send(errMsg);
                } else {
                    logger.info('Product found: ' + product.productId);
                    logger.debug(JSON.stringify(product));

                    if (
                        !auditActivity(
                            req as RequestDto,
                            HttpMethod.Get,
                            JSON.stringify(product)
                        )
                    ) {
                        return res
                            .status(424)
                            .send('Audit server not available');
                    }

                    return res.status(200).json(product);
                }
            } else if (_.isUndefined(req.query.sku) === false) {
                logger.info(`Get Product by SKU: ${req.query.sku}`);

                const product = (await Product.findOne({
                    sku: req.query.sku,
                })) as ProductDto;

                if (_.isUndefined(product) === true) {
                    const errMsg = `Product with ID ${req.query.productId} was not found`;
                    console.warn(errMsg);
                    return res.status(400).send(errMsg);
                } else {
                    logger.info('Product found: ' + product.productId);
                    logger.debug(JSON.stringify(product));

                    if (
                        !auditActivity(
                            req as RequestDto,
                            HttpMethod.Get,
                            JSON.stringify(product)
                        )
                    ) {
                        return res
                            .status(424)
                            .send('Audit server not available');
                    }

                    return res.status(200).json(product);
                }
            } else if (_.isUndefined(req.query.category) === false) {
                const products = (await Product.find({
                    category: { $in: req.query.category },
                })) as ProductDto[];
                logger.info(`Returning ${products.length} products`);

                if (
                    !auditActivity(
                        req as RequestDto,
                        HttpMethod.Get,
                        JSON.stringify(products)
                    )
                ) {
                    return res.status(424).send('Audit server not available');
                }

                return res.status(200).json(products);
            } else {
                const products = (await Product.find()) as ProductDto[];
                logger.info(`Returning ${products.length} products`);

                if (
                    !auditActivity(
                        req as RequestDto,
                        HttpMethod.Get,
                        JSON.stringify(products)
                    )
                ) {
                    return res.status(424).send('Audit server not available');
                }

                return res.status(200).json(products);
            }
        } catch (ex) {
            logger.error(JSON.stringify(ex));
            return res.status(500).send(ex);
        }
    }
);

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
            logger.error(JSON.stringify(ex));
            return res.status(500).send(ex);
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
