// Create an interface representing a document in MongoDB.
export interface ProductDto {
    _id?: String;
    name: String;
    description: String;
    unitOfMeasure: String;
    units: Number;
    inStock: Boolean;
}

export interface ProductsGetAllDto {
    pageSize: Number;
    pageNumber: Number;
    _links: Object;
    results: ProductDto[];
}
