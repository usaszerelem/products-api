import { Product } from '../models/product';
import AppLogger from './Logger';
const logger = new AppLogger(module);

export async function createProducts(): Promise<void> {
    const products: (typeof Product)[] = [
        {
            name: 'M&M',
            description:
                'Snack-sized pieces of chocolate in a colorful candy shell',
            unitOfMeasure: 'OUNCES',
            units: 100,
            inStock: true,
        },
        {
            name: 'Snickers',
            description:
                'Chocolate bar consisting of nougat topped with caramel and peanuts, and all encased in milk chocolate',
            unitOfMeasure: 'OUNCES',
            units: 15,
            inStock: true,
        },
        {
            name: 'Crunch',
            description:
                'Chocolate bar made of milk chocolate and crisped rice',
            unitOfMeasure: 'OUNCES',
            units: 12,
            inStock: false,
        },
        {
            name: 'KitKat',
            description:
                'Made of three layers of wafer separated and covered by an outer layer of chocolate',
            unitOfMeasure: 'LBS',
            units: 2,
            inStock: true,
        },
        {
            name: 'Payday',
            description:
                'Salted peanuts rolled over a nougat-like sweet caramel center',
            unitOfMeasure: 'KG',
            units: 1,
            inStock: true,
        },
        {
            name: 'Twix',
            description:
                'Caramel shortbread chocolate bar consisting of a biscuit applied with other confectionery toppings and coatings',
            unitOfMeasure: 'GRAM',
            units: 75,
            inStock: false,
        },
        {
            name: 'Milky Way',
            description:
                'Rich chocolate, creamy stretchy caramel, and fluffy nougat',
            unitOfMeasure: 'GRAM',
            units: 120,
            inStock: true,
        },
        {
            name: 'Bounty',
            description: 'Coconut filling covered with milk or dark chocolate',
            unitOfMeasure: 'OUNCES',
            units: 12,
            inStock: true,
        },
    ];

    logger.info('Database initialized. Creating products');

    for (let idx = 0; idx < products.length; idx++) {
        if ((await productExists(products[idx].name)) == false) {
            let prod = new Product(products[idx]);
            prod = prod.save();
            logger.info(`"${products[idx].name}" saved.`);
        } else {
            logger.info(`"${products[idx].name}" exists.`);
        }
    }
}

async function productExists(name: string): Promise<boolean> {
    logger.info('Checking if product exists: ' + name);
    return (await Product.findOne({ name: name })) !== null ? true : false;
}
