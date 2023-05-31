import mongoose from 'mongoose';
import { ServerInit } from '../../src/startup/serverInit';
import { Server } from 'http';
import express, { Express } from 'express';
import { User, generateAuthToken } from '../../src/models/users';
import { Product } from '../../src/models/product';

const app: Express = express();

export interface StartupReturn {
    server: Server | null;
    adminId: mongoose.Types.ObjectId;
    adminAuthToken: string;
}

export async function Startup(): Promise<StartupReturn> {
    await ServerInit(app);

    let retObj: StartupReturn = {
        server: null,
        adminId: new mongoose.Types.ObjectId(),
        adminAuthToken: '',
    };

    retObj.server = app.listen(3001, async () => {});

    const superUser = new User({
        _id: retObj.adminId,
        firstName: 'Super',
        lastName: 'Duper',
        email: 'super.duper@gmail.com',
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
    });

    await superUser.save();
    retObj.adminAuthToken = generateAuthToken(superUser!);

    return retObj;
}

export async function Shutdown(server: Server | null): Promise<void> {
    await User.deleteMany({})
        .then(async function () {})
        .catch(function (_error: any) {
            //console.log(error);
        });

    await Product.deleteMany({})
        .then(async function () {
            await mongoose.connection.close();
        })
        .catch(function (_error: any) {
            //console.log(error);
        });

    if (server !== null) {
        server.close();
    }
}
