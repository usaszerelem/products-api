import UserDto from '../dtos/UserDto';
import { createSuperUser } from '../utils/createSuperUser';

createSuperUserWrapper();

async function createSuperUserWrapper(): Promise<UserDto> {
    const closeDatabase = true;
    return await createSuperUser(closeDatabase);
}
