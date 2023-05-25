const mongoose = require('mongoose');
const Joi = require('joi-oid');

const CODE_MIN_LENGTH = 8;
const CODE_MAX_LENGTH = 12;
const MATERIALID_MIN_LENGTH = 3;
const MATERIALID_MAX_LENGTH = 5;
const DESCRIPTION_MIN_LENGTH = 6;
const DESCRIPTION_MAX_LENGTH = 60;
const CATEGORY_MIN_LENGTH = 3;
const CATEGORY_MAX_LENGTH = 30;
const MANUFACTURER_MIN_LENGTH = 5;
const MANUFACTURER_MAX_LENGTH = 30;

const productSchema = new mongoose.Schema(
    {
        sku: {
            type: String,
            required: true,
            unique: true,
        },
        code: {
            type: String,
            required: true,
        },
        unitOfMeasure: {
            type: String,
            required: true,
            enum: ['PACK', 'CARTON', 'ROLL', 'CAN', 'EACH'],
            uppercase: true,
        },
        materialID: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            required: true,
        },
        manufacturer: {
            type: String,
            required: true,
        },
        consumerUnits: {
            type: Number,
            required: true,
        },
        multiPackDiscount: {
            type: Boolean,
            required: true,
        },
        isMultiCop: {
            type: Boolean,
            required: true,
        },
        isMultiSkoal: {
            type: Boolean,
            required: true,
        },
        isMultiRedSeal: {
            type: Boolean,
            required: true,
        },
        pullPMUSA: {
            type: Boolean,
            required: true,
        },
        pullPMUSAAll: {
            type: Boolean,
            required: true,
        },
        pullUSSTC: {
            type: Boolean,
            required: true,
        },
        multiCanDiscount: {
            type: Boolean,
            required: true,
        },
        isValidUPC: {
            type: Boolean,
            required: true,
        },
    },
    { timestamps: true, versionKey: false }
);

export const Product = mongoose.model('products', productSchema);

// ---------------------------------------------------------------------------

export function validateProduct(product: typeof Product) {
    const schema = Joi.object({
        _id: Joi.objectId(),
        sku: Joi.string().min(CODE_MIN_LENGTH).max(CODE_MAX_LENGTH).required(),
        code: Joi.string().min(CODE_MIN_LENGTH).max(CODE_MAX_LENGTH).required(),
        unitOfMeasure: Joi.string().valid(
            'PACK',
            'CARTON',
            'ROLL',
            'CAN',
            'EACH'
        ),
        materialID: Joi.string()
            .min(MATERIALID_MIN_LENGTH)
            .max(MATERIALID_MAX_LENGTH)
            .required(),
        description: Joi.string()
            .min(DESCRIPTION_MIN_LENGTH)
            .max(DESCRIPTION_MAX_LENGTH)
            .required(),
        category: Joi.string()
            .min(CATEGORY_MIN_LENGTH)
            .max(CATEGORY_MAX_LENGTH)
            .required(),
        manufacturer: Joi.string()
            .min(MANUFACTURER_MIN_LENGTH)
            .max(MANUFACTURER_MAX_LENGTH)
            .required(),
        consumerUnits: Joi.number().positive(),
        multiPackDiscount: Joi.boolean(),
        isMultiCop: Joi.boolean(),
        isMultiSkoal: Joi.boolean(),
        isMultiRedSeal: Joi.boolean(),
        pullPMUSA: Joi.boolean(),
        pullPMUSAAll: Joi.boolean(),
        pullUSSTC: Joi.boolean(),
        multiCanDiscount: Joi.boolean(),
        isValidUPC: Joi.boolean(),
        createdAt: Joi.date(),
        updatedAt: Joi.date(),
    }).options({ allowUnknown: false });

    return schema.validate(product);
}
