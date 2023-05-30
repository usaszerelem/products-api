import mongoose from 'mongoose';
import { ServerInit } from '../../src/startup/serverInit';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import config from 'config';
import { createSuperUser } from '../../src/scripts/createSuperUser';
import JwtPayloadDto from '../../src/dtos/JwtPayloadDto';
import UserDto from '../../src/dtos/UserDto';
import { generateAuthToken } from '../../src/models/users';
import express, { Express } from 'express';
import { Server } from 'http';

const app: Express = express();

describe('/api/users', () => {
    let superUser: UserDto | null = null;
    let authToken = '';
    let server: Server;
    let ready = false;

    beforeAll((done) => {
        done();
    });

    afterAll((done) => {
        mongoose.connection.close();

        // Close the server when all tests are done
        server!.close(done);
    });

    it('should initialize server', async () => {
        await ServerInit(app);
        server = app.listen(3001, () => {
            ready = true;
        });
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
            console.log(`Ready: ${ready}`);

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

            console.log(res);

            expect(res.status).toBe(200);
        });
    });

    /*
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
    });
    */
});
