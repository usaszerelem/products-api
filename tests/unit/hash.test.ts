import encryptPassword from '../../src/utils/hash';

describe('Password encryption', () => {
    it('should create a hash token', async () => {
        let token: string = await encryptPassword('abcdefg');
        expect(token).toHaveLength(60);
    });
});

//test('Another Placeholder', () => {});
