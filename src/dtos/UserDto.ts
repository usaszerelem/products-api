// ----------------------------------------------------------------

export default interface UserDto {
    _id: string;
    firstName: string;
    lastName: string;
    password: string;
    operations: string[];
    audit: boolean;
}
