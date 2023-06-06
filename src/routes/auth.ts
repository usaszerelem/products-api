import express, { Request, Response } from 'express';
import AppLogger from '../utils/Logger';
import { User, generateAuthToken } from '../models/users';
import bcrypt from 'bcrypt';
import Joi from 'joi';
import _ from 'underscore';
import UserDto from '../dtos/UserDto';
import { ErrorFormatter } from '../utils/ErrorFormatter';
import { HttpMethod, sendAudit } from '../utils/audit';

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
        const { error } = validateUser(req.body);

        if (error) {
            logger.error(error.details[0].message);
            return res.status(400).send(error.details[0].message);
        }

        let user = (await User.findOne({ email: req.body.email })) as UserDto;

        if (user === null) {
            const msg = 'User not registered';
            logger.error(msg);

            sendAudit(
                'unknown',
                HttpMethod.Post,
                `Authenticated request failed. User ${req.body.email} not registered`
            );

            return res.status(400).send(msg);
        }

        // compare plain text password with encrypted password

        const validPassword = await bcrypt.compare(
            req.body.password,
            user!.password
        );

        if (!validPassword) {
            const msg = 'Invalid email or password';
            logger.error(msg);

            sendAudit(
                user._id as string,
                HttpMethod.Post,
                `Invalid password provided by user ${req.body.email}`
            );

            return res.status(400).send(msg);
        }

        const token = generateAuthToken(user as unknown as UserDto);
        logger.info(`User authenticated: ${req.body.email}`);

        const success = await sendAudit(
            user._id as string,
            HttpMethod.Post,
            `User authenticated: ${req.body.email}`
        );

        if (success === false) {
            return res.status(424).send('Audit server not available');
        }

        return res.header('x-auth-token', token).status(200).send(token);
    } catch (ex) {
        const msg = ErrorFormatter(
            'Fatal authentication request error',
            ex,
            __filename
        );
        logger.error(msg);
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
