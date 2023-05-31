import { InitDatabase } from '../startup/database';
import { createProducts } from '../utils/createProducts';

createWrapper();

function createWrapper() {
    createAllProducts().then(() => console.log('Products created'));
}

async function createAllProducts(): Promise<void> {
    try {
        const db = await InitDatabase();

        if (db) {
            await createProducts();
        }
    } catch (ex) {
    } finally {
        console.log('Exiting process');
        process.exit();
    }
}
