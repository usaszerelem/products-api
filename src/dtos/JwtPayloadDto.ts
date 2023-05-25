export default interface JwtPayloadDto {
    userId: string;
    operations: string[];
    audit: boolean;
}
