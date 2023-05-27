import express, { Request, Response } from 'express';
import AppLogger from '../utils/Logger';
import { User, generateAuthToken } from '../models/users';
import bcrypt from 'bcrypt';
import Joi from 'joi';
import _ from 'underscore';
import UserDto from '../dtos/UserDto';

const router = express.Router();
const logger = new AppLogger(module);

const EMAIL_MIN_LENGTH = 5;
const EMAIL_MAX_LENGTH = 255;
const PASSWORD_MIN_LENGTH = 5;
const PASSWORD_MAX_LENGTH = 1024;

// ---------------------------------------------------------------------------
// User Authentiation POST method, requiring the user to provide an email
// address used during user registration and password. If the decrypted
// password matches a JWT is returned containing basic info about the user.
// ---------------------------------------------------------------------------

router.post('/', async (req: Request, res: Response) => {
    try {
        const msgInvalid = 'Invalid email or password';

        const { error } = validateUser(req.body);

        if (error) {
            logger.error(error.details[0].message);
            return res.status(400).send(error.details[0].message);
        }

        let user = await User.findOne({ email: req.body.email });

        if (_.isUndefined(user) === true) {
            logger.error(msgInvalid);
            return res.status(400).send(msgInvalid);
        }

        // compare plain text password with encrypted password

        const validPassword = await bcrypt.compare(
            req.body.password,
            user!.password
        );

        if (!validPassword) {
            logger.error(msgInvalid);
            return res.status(400).send(msgInvalid);
        }

        const token = generateAuthToken(user as unknown as UserDto);
        logger.info(`User authenticated: ${req.body.email}`);
        return res.header('x-auth-token', token).status(200).send(token);
    } catch (ex) {
        logger.error(JSON.stringify(ex));
        return res.status(500).send(ex);
    }
});

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------

function validateUser(user: UserDto): Joi.ValidationResult {
    const schema = Joi.object({
        email: Joi.string()
            .min(EMAIL_MIN_LENGTH)
            .max(EMAIL_MAX_LENGTH)
            .required()
            .email(),
        password: Joi.string()
            .min(PASSWORD_MIN_LENGTH)
            .max(PASSWORD_MAX_LENGTH)
            .required(),
    });

    return schema.validate(user);
}

export default router;
