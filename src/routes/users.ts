import express, { Request, Response } from 'express';
import AppLogger from '../utils/Logger';
import { User, validateUser } from '../models/users';
import encryptPassword from '../utils/hash';
import _ from 'underscore';
import { RequestDto } from '../dtos/RequestDto';
import userAuth from '../middleware/userAuth';
import UserDto from '../dtos/UserDto';
import userCanUpsert from '../middleware/userCanUpsert';
import userCanList from '../middleware/userCanList';
import { HttpMethod, auditActivity } from '../utils/audit';

const router = express.Router();
const logger = new AppLogger(module);

/**
 * Create (register) a new user. This is a functionality exposed only to
 * administrators. Therefore the caller must be authenticated and authorized
 * to make this call.
 */

router.post(
    '/',
    [userAuth, userCanUpsert],
    async (req: Request, res: Response) => {
        try {
            // Ensure password is not exposed
            let userMinData = _.pick(req.body, ['email', 'operations']);
            logger.info(`User Create received:` + JSON.stringify(userMinData));

            const { error } = validateUser(req.body);

            if (error) {
                logger.error('User information failed validation');
                return res.status(400).send(error.details[0].message);
            }

            if ((await User.findOne({ email: req.body.email })) !== null) {
                // Only one user with the same email can exist.
                // Unfortunatelly dynamoose dose note have the
                // 'unique' schema attribute like mongoose so this
                // manual check must be done.
                const msg = `User already registered: ${req.body.email}`;
                logger.error(msg);
                return res.status(400).send(msg);
            }

            let password = await encryptPassword(req.body.password);
            let user = new User(req.body);
            user.password = password;

            user = await user.save();

            // Return minimal information for the created user. Important to note
            // that the call to 'toObject()' is necessary because the way mongoose
            // works with TypeScript.

            user = user.toObject();
            user = _.omit(user, 'password');
            logger.debug(
                'Omit returned. Should not have "password": ' +
                    JSON.stringify(user)
            );

            const dataToSend = JSON.stringify(user);

            const success = await auditActivity(
                req as RequestDto,
                HttpMethod.Post,
                JSON.stringify(dataToSend)
            );

            if (success === false) {
                return res.status(424).send('Audit server not available');
            }

            return res.status(200).json(user);
        } catch (ex) {
            const msg =
                ex instanceof Error
                    ? ex.message
                    : 'Fatal Exception - Users POST';
            logger.error(JSON.stringify(msg));
            return res.status(500).send(msg);
        }
    }
);

/**
 * retrieve information of the currently logged in user and
 * this information comes from the logged in user's JWT.
 */
router.get('/me', userAuth, async (req: Request, res: Response) => {
    try {
        const reqDto = req as RequestDto;
        let user = await User.findById(reqDto.Jwt.userId);

        if (_.isUndefined(user) === true) {
            const errMsg = `User with ID ${reqDto.Jwt.userId} was not found`;
            console.warn(errMsg);
            return res.status(400).send(errMsg);
        }

        const dataToSend = JSON.stringify(_.omit(user.toObject(), 'password'));

        const success = await auditActivity(
            req as RequestDto,
            HttpMethod.Get,
            JSON.stringify(dataToSend)
        );

        if (success === false) {
            return res.status(424).send('Audit server not available');
        }

        return res.status(200).json(_.omit(user.toObject(), 'password'));
    } catch (ex) {
        const msg =
            ex instanceof Error ? ex.message : 'Fatal Exception - Users GET';
        logger.error(JSON.stringify(msg));
        return res.status(500).send(msg);
    }
});

/**
 * Only authenticated users with user list permission are
 * allowed to access this functionality.
 */

router.get(
    '/',
    [userAuth, userCanList],
    async (req: Request, res: Response) => {
        try {
            if (_.isUndefined(req.query.email) === false) {
                let user = await User.findOne({
                    email: req.query.email,
                });

                if (_.isUndefined(user) === true) {
                    const errMsg = `User with email ${req.query.email} was not found`;
                    console.warn(errMsg);
                    return res.status(400).send(errMsg);
                } else {
                    user = user.toObject() as UserDto;
                    user = _.omit(user, 'password');

                    logger.info('User found: ' + user!._id);
                    logger.debug(JSON.stringify(user));

                    const success = await auditActivity(
                        req as RequestDto,
                        HttpMethod.Get,
                        JSON.stringify(user)
                    );

                    if (success === false) {
                        return res
                            .status(424)
                            .send('Audit server not available');
                    }

                    return res.status(200).json(user);
                }
            } else if (_.isUndefined(req.query.userId) === false) {
                let user = await User.findById(req.query.userId as string);

                if (_.isUndefined(user) === true) {
                    const errMsg = `User with ID ${req.query.userId} was not found`;
                    console.warn(errMsg);
                    return res.status(400).send(errMsg);
                } else {
                    user = user.toObject() as UserDto;
                    user = _.omit(user, 'password');

                    logger.info('User found: ' + user!._id);
                    logger.debug(JSON.stringify(user));

                    const success = await auditActivity(
                        req as RequestDto,
                        HttpMethod.Get,
                        JSON.stringify(user)
                    );

                    if (success === false) {
                        return res
                            .status(424)
                            .send('Audit server not available');
                    }

                    return res.status(200).json(user);
                }
            } else {
                // Information for all users was requested. The only info
                // that we return for each user is the user's email and roles
                const users = (await User.find().select({
                    email: 1,
                    operations: 1,
                })) as UserDto[];

                logger.info(`Returning ${users.length} users`);

                const success = await auditActivity(
                    req as RequestDto,
                    HttpMethod.Get,
                    JSON.stringify(users)
                );

                if (success === false) {
                    return res.status(424).send('Audit server not available');
                }

                return res.status(200).json(users);
            }
        } catch (ex) {
            const msg =
                ex instanceof Error
                    ? ex.message
                    : 'Fatal Exception - Users GET';
            logger.error(JSON.stringify(msg));
            return res.status(500).send(msg);
        }
    }
);

export default router;
