import mongoose from 'mongoose';
import { ServerInit } from '../../src/startup/serverInit';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import config from 'config';
import { createSuperUser } from '../../src/utils/createSuperUser';
import JwtPayloadDto from '../../src/dtos/JwtPayloadDto';
import UserDto from '../../src/dtos/UserDto';
import { User, generateAuthToken } from '../../src/models/users';
import express, { Express } from 'express';
import { Server } from 'http';

const app: Express = express();

describe('/api/users', () => {
    let superUser: UserDto | null = null;
    let authToken = '';
    let server: Server;
    let MickeyUserID: string | undefined = '';

    beforeAll((done) => {
        done();
    });

    afterAll((done) => {
        // Close the server when all tests are done
        Cleanup();
        server!.close(done);
    });

    it('should run first to initialize server', async () => {
        await ServerInit(app);
        server = app.listen(3001, async () => {});
    });

    describe('Create super user', () => {
        it('should create super user', async () => {
            superUser = await createSuperUser();
            expect(superUser).toBeTruthy();
        });

        it('should create authentication token', async () => {
            authToken = generateAuthToken(superUser!);
            expect(authToken).toBeTruthy();
        });

        it('should decode super user token', async () => {
            const decoded = jwt.verify(
                authToken,
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
    });

    describe('Mickey Mouse user', () => {
        it('create', async () => {
            const userInfo = {
                firstName: 'Mickey',
                lastName: 'Mouse',
                email: 'mickey.mouse@disney.com',
                password: 'abcdefg',
                audit: true,
                operations: ['UserList', 'ProdList'],
            };

            const reqHeader = {
                'Content-Type': 'application/json',
                'User-Agent': 'Jest',
                'x-auth-token': authToken,
            };

            const res = await request(server)
                .post('/api/users')
                .set(reqHeader)
                .send(userInfo);

            expect([200, 400]).toContain(res.status);

            const retUsr = res.body as UserDto;
            expect(retUsr._id).toBeTruthy();
            MickeyUserID = retUsr._id;
        });
    });

    describe('Get users', () => {
        it('should fail authentication', async () => {
            const res = await request(server).get('/api/users');
            expect(res.status).toBe(401);
        });

        it('should return all users', async () => {
            const res = await request(server)
                .get('/api/users')
                .set('x-auth-token', authToken);

            expect(res.status).toBe(200);

            const userList = res.body as UserDto[];

            expect(userList.length).toBe(2);

            userList.forEach((oneUser: UserDto) => {
                expect(oneUser).toHaveProperty('_id');
                expect(oneUser).toHaveProperty('email');
                expect(oneUser).toHaveProperty('operations');
            });
        });

        it('should retreive Mickey Mouse user by email address', async () => {
            const res = await request(server)
                .get('/api/users')
                .set('x-auth-token', authToken)
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

        it('should retreive Mickey Mouse user by user ID', async () => {
            const res = await request(server)
                .get('/api/users')
                .set('x-auth-token', authToken)
                .query({ userId: MickeyUserID });

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

        it('should retreive Super Duper user by self query', async () => {
            const res = await request(server)
                .get('/api/users/me')
                .set('x-auth-token', authToken)
                .query({ userId: superUser?._id! });

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
                expect.arrayContaining([
                    'UserUpsert',
                    'UserDelete',
                    'UserList',
                    'ProdUpsert',
                    'ProdDelete',
                    'ProdList',
                ])
            );
        });

        it('should handle invalid length user ID', async () => {
            const res = await request(server)
                .get('/api/users')
                .set('x-auth-token', authToken)
                .query({ userId: '12345' });

            expect(res.status).toBe(500);
        });

        it('should handle non existing user ID', async () => {
            const res = await request(server)
                .get('/api/users')
                .set('x-auth-token', authToken)
                .query({ userId: '6476632f9ebe48c3661ce27f' });

            expect(res.status).toBe(400);
        });
    });
});

async function Cleanup(): Promise<void> {
    console.log('Inside Cleanup()');
    await User.deleteMany({});
    mongoose.connection.close();
}
