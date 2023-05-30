import UserDto from '../dtos/UserDto';
import { User } from '../models/users';
import { InitDatabase } from '../startup/database';
import AppLogger from './Logger';
const logger = new AppLogger(module);

export async function createSuperUser(
    closeDatabase: boolean = false
): Promise<UserDto> {
    let usr: UserDto = {
        firstName: 'Super',
        lastName: 'Duper',
        email: 'super.duper@gmail.com',
        password:
            '$2b$10$7/HXCoDwlsl6aC3n7R0ez.RLLRSc19YVKyNcxilnmGOPhxyVRZrtC',
        operations: [
            'UserUpsert',
            'UserDelete',
            'UserList',
            'ProdUpsert',
            'ProdDelete',
            'ProdList',
        ],
        audit: true,
    };

    const db = await InitDatabase();
    let user: typeof User;

    if (db) {
        logger.info('Database initialized. Creating super user');

        if ((await userExists(usr.email)) == false) {
            user = new User(usr);
            user = await user.save();
            logger.info('super user created');
            logger.debug(user);
        } else {
            logger.warn('super user exists.');
        }

        if (closeDatabase === true) {
            db.close();
        }
    } else {
        logger.error('Database could not be initiated');
    }
    return user;
}

async function userExists(email: string): Promise<boolean> {
    return (await User.findOne({ email: email })) !== null ? true : false;
}
