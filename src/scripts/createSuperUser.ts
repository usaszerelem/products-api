import UserDto from '../dtos/UserDto';
import { User } from '../models/users';
import { InitDatabase } from '../startup/database';

export async function createSuperUser(): Promise<UserDto> {
    let usr: UserDto = {
        firstName: 'Martin',
        lastName: 'Fallenstedt',
        email: 'martin.fallenstedt@gmail.com',
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

    let db = await InitDatabase();

    if ((await userExists(usr.email)) == false) {
        let user = new User(usr);
        user = await user.save();
        console.log('User created:');
        console.log(user);
    }

    await db.close();
    return usr;
}

async function userExists(email: string): Promise<boolean> {
    return (await User.findOne({ email: email })) !== null ? true : false;
}
