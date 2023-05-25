import bcrypt from 'bcrypt';

// ----------------------------------------------------------
// ----------------------------------------------------------

export default async function encryptPassword(
    password: string
): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
}
