// ----------------------------------------------------------------

export default interface UserDto {
    _id?: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    operations: string[];
    audit: boolean;
}
