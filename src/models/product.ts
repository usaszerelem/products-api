const mongoose = require('mongoose');
const Joi = require('joi-oid');

const NAME_MIN_LENGTH = 3;
const NAME_MAX_LENGTH = 30;
const DESC_MIN_LENGTH = 0;
const DESC_MAX_LENGTH = 200;

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
        },
        description: {
            type: String,
            required: true,
        },
        unitOfMeasure: {
            type: String,
            required: true,
            enum: ['KG', 'LBS', 'OUNCES', 'GRAM'],
            uppercase: true,
        },
        units: {
            type: Number,
            required: true,
        },
        inStock: {
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
        name: Joi.string().min(NAME_MIN_LENGTH).max(NAME_MAX_LENGTH).required(),
        description: Joi.string()
            .min(DESC_MIN_LENGTH)
            .max(DESC_MAX_LENGTH)
            .required(),
        unitOfMeasure: Joi.string().valid('KG', 'LBS', 'OUNCES', 'GRAM'),
        units: Joi.number().positive(),
        inStock: Joi.boolean(),
        createdAt: Joi.date(),
        updatedAt: Joi.date(),
    }).options({ allowUnknown: true });

    return schema.validate(product);
}
