const mongoose = require('mongoose');
const Joi = require('joi-oid');
import jwt from 'jsonwebtoken';
import UserDto from '../dtos/UserDto';

require('../utils/constants');

// ----------------------------------------------------------------
// Field min/max length

const FNAME_MIN_LENGTH = 2;
const FNAME_MAX_LENGTH = 20;
const LNAME_MIN_LENGTH = 5;
const LNAME_MAX_LENGTH = 20;
const EMAIL_MIN_LENGTH = 5;
const EMAIL_MAX_LENGTH = 255;
const PASSWORD_MIN_LENGTH = 5;
const PASSWORD_MAX_LENGTH = 1024;

// ----------------------------------------------------------------
// userId - random GUID type of identifier
// firstName - User's first name
// lastName - User's last name
// email - Used as unique field for authentication
// password - Used with email for authentication
// operations - Allowed operations for this user. See utils/constants.js
// audit - whether activities performed by this user are audited

const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: true,
        },
        lastName: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: true,
        },
        operations: {
            type: Array,
            schema: [{ type: String }],
        },
        audit: {
            type: Boolean,
            required: true,
        },
    },
    { timestamps: true, versionKey: false }
);

export const User = mongoose.model('users', userSchema);

// ---------------------------------------------------------------------------
// Store the user's ID and Boolean flag indicating whether the user is an admim
// in the JWT. Based on this simple role based authorization can be made.
// ---------------------------------------------------------------------------

export function generateAuthToken(user: UserDto): string {
    const token = jwt.sign(
        { userId: user._id, operations: user.operations, audit: user.audit },
        process.env.JWT_PRIVATE_KEY!,
        { expiresIn: process.env.JWT_EXPIRATION }
    );

    return token;
}

// ---------------------------------------------------------------------------
// Validation of the user object.
// ---------------------------------------------------------------------------

export function validateUser(user: typeof User) {
    const schema = Joi.object({
        _id: Joi.objectId(),
        firstName: Joi.string()
            .min(FNAME_MIN_LENGTH)
            .max(FNAME_MAX_LENGTH)
            .required(),
        lastName: Joi.string()
            .min(LNAME_MIN_LENGTH)
            .max(LNAME_MAX_LENGTH)
            .required(),
        email: Joi.string()
            .min(EMAIL_MIN_LENGTH)
            .max(EMAIL_MAX_LENGTH)
            .required()
            .email(),
        password: Joi.string()
            .min(PASSWORD_MIN_LENGTH)
            .max(PASSWORD_MAX_LENGTH)
            .required(),
        audit: Joi.boolean().required(),
        operations: Joi.array().items(Joi.string()),
    }).options({ allowUnknown: false });

    return schema.validate(user);
}
