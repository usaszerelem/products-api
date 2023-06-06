import mongoose from 'mongoose';
import config from 'config';
import request from 'supertest';
import { User, generateAuthToken } from '../../src/models/users';
import jwt from 'jsonwebtoken';
import JwtPayloadDto from '../../src/dtos/JwtPayloadDto';
import UserDto from '../../src/dtos/UserDto';
import { StartupReturn, Startup, Shutdown } from './common';

describe('/api/users', () => {
    let testData: StartupReturn;

    var _startup = async function () {
        testData = await Startup();
    };

    var _shutdown = async function () {
        await Shutdown(testData.server);
    };

    describe('Admin User Validation', () => {
        beforeAll(_startup);
        afterAll(_shutdown);

        it('should decode super user token', async () => {
            expect(testData.adminAuthToken).toBeTruthy();

            const decoded = jwt.verify(
                testData.adminAuthToken,
                config.get('jwt.privateKey') as string
            ) as JwtPayloadDto;

            expect(decoded.operations).toEqual(
                expect.arrayContaining([
                    'UserUpsert',
                    'UserDelete',
                    'UserList',
                    'ProdUpsert',
                    'ProdDelete',
                    'ProdList',
                ])
            );

            expect(decoded.audit).toBe(true);
        });

        describe('Regular User Validation', () => {
            let userId: mongoose.Types.ObjectId;
            let userAuthToken = '';

            var _beforeEach = async function () {
                // Create regular user

                let user = new User({
                    firstName: 'Mickey',
                    lastName: 'Mouse',
                    email: 'mickey.mouse@disney.com',
                    password: 'abcdefg',
                    audit: true,
                    operations: ['UserList', 'ProdList'],
                });

                user = await user.save();
                userId = user._id;
                userAuthToken = generateAuthToken(user!);
            };

            var _afterEach = async function () {
                // Delete regular user
                await User.deleteOne({ _id: userId.toString() });
            };

            beforeEach(_beforeEach);
            afterEach(_afterEach);

            it('should decode regular user token', async () => {
                expect(userAuthToken).toBeTruthy();

                const decoded = jwt.verify(
                    userAuthToken,
                    config.get('jwt.privateKey') as string
                ) as JwtPayloadDto;

                expect(decoded.operations).toEqual(
                    expect.arrayContaining(['UserList', 'ProdList'])
                );

                expect(decoded.audit).toBe(true);
            });

            it('should retrieve reguler user by email address', async () => {
                const res = await request(testData.server)
                    .get('/api/users')
                    .set('x-auth-token', userAuthToken)
                    .query({ email: 'mickey.mouse@disney.com' });

                expect(res.status).toBe(200);
                const user = res.body as UserDto;

                expect(user).toHaveProperty('_id');
                expect(user).toHaveProperty('firstName');
                expect(user).toHaveProperty('lastName');
                expect(user).toHaveProperty('email');
                expect(user).toHaveProperty('operations');
                expect(user).toHaveProperty('audit');
                expect(user).toHaveProperty('createdAt');
                expect(user).toHaveProperty('updatedAt');

                expect(user.operations).toEqual(
                    expect.arrayContaining(['UserList', 'ProdList'])
                );
            });

            it('should retrieve regular user by user ID', async () => {
                const strUserId = userId.toString();

                const res = await request(testData.server)
                    .get('/api/users')
                    .set('x-auth-token', userAuthToken)
                    .query({ userId: strUserId });

                expect(res.status).toBe(200);

                const user = res.body as UserDto;

                expect(user).toHaveProperty('_id');
                expect(user).toHaveProperty('firstName');
                expect(user).toHaveProperty('lastName');
                expect(user).toHaveProperty('email');
                expect(user).toHaveProperty('operations');
                expect(user).toHaveProperty('audit');
                expect(user).toHaveProperty('createdAt');
                expect(user).toHaveProperty('updatedAt');

                expect(user.operations).toEqual(
                    expect.arrayContaining(['UserList', 'ProdList'])
                );
            });

            it('should be forbidden to delete', async () => {
                // Mickey Mouse user does not have UserDelete permissions
                const strUserId = userId.toString();
                const res = await request(testData.server)
                    .delete('/api/users')
                    .set('x-auth-token', userAuthToken)
                    .query({ userId: strUserId });

                expect(res.status).toBe(403);
            });

            it('should delete a user by user ID', async () => {
                const strUserId = userId.toString();
                const res = await request(testData.server)
                    .delete('/api/users')
                    .set('x-auth-token', testData.adminAuthToken)
                    .query({ userId: strUserId });

                expect(res.status).toBe(200);
            });
        });
    });
});
