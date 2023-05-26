// Create an interface representing a document in MongoDB.
export default interface ProductDto {
    _id: string;
    sku: string;
    unitOfMeasure: string;
    materialID: string;
    description: string;
    category: string;
    manufacturer: string;
    consumerUnits: number;
    multiPackDiscount: boolean;
    isMultiCop: boolean;
    isMultiSkoal: boolean;
    isMultiRedSeal: boolean;
    pullPMUSA: boolean;
    pullPMUSAAll: boolean;
    pullUSSTC: boolean;
    multiCanDiscount: boolean;
    isValidUPC: boolean;
}
