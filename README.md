# PRODUCTS-API

This is a sample and generic service to manage product informations and users that have access to product information.

## Product Information

This generic service is based manages candy bars, but it can be very easily and with minimal changes be updated to manage any other product and any number or properties.
The file to update for this service to manage any other product is the ./src/models/product.ts file

## User Information

Products and users can only be called by authenticated users. Only a user with 'UserUpsert' privileges can add/update users. Once a user is added, the user needs to authenticate and provide the JSON Web Token in the x-auth-token header field.

# Installation Dependecies

This service uses MongoDB and you need either an onpresite of cloud based MongoDB access. Also optionally and audit service can be made as a dependency. If an audit service is configured, all RESTful calls and responses are saved offline to a separate audit service, including information about the user that performed the action.

To start mongodb/brew/mongodb-community now and restart at login:
brew services start mongodb/brew/mongodb-community

Or, if you don't want/need a background service you can just run:
mongod --config /usr/local/etc/mongod.conf

## Configuration

A very flexible configuration option was implemented where there are default, production, development and test configuration settings. All these can be overwritten by environment variables.

### Default Configuration

All default configurations are stored in the './config/default.json' file

### Production Configuration

All default configurations can be optionally overwritten with configuration settings stored in the './config.production.json' file. By default only the 'name' and 'nodeEnv' settings are overwritten.

### Development Configuration

_Important_ - secrets should never be stored in configuration files or in code. All configuration settings can be mapped to environment variables.

-   audit.url - If an audit service is available, the URL to it should be stored here
-   audit.apiKey - Audit service required API key to use
-   jwt.privateKey - Private key that should be used for encryption. In production overwrite this with an environment variable.
-   jwt.exporation - Time To Live (TTL) value for the token. Read: https://www.npmjs.com/package/jsonwebtoken
-   db.url - Full URL to the MongoDB database
-   log.level - Minimum log level to log. Possible values are 'debug', 'info', 'warn' and 'error'.
-   log.consoleLogEnabled - Boolean value that indicates whether to enable logging on the console
-   log.fileLogEnabled - Boolean value that indicates whrether to enable logging to circular file

### Test Configuration

When running JEST tests, a different set of configuration settings can be used. Like a test specific database.

### Environment Variables

All configuration settings can be overwritten using environment variables. This is accomplished using the './config/custom-environment-variables.json' file. Note the example below where each upper case text is an environment variable that maps to a specific configuration setting.

```
{
    "nodeEnv": "NODE_ENV",
    "port": "PORT",
    "jwt": {
        "privateKey": "JWT_PRIVATE_KEY",
        "expiration": "JWT_EXPIRATION"
    },
    "audit": {
        "url": "AUDIT_URL",
        "apiKey": "AUDIT_API_KEY"
    },
    "db": {
        "url": "MONGO_HOST"
    },
    "log": {
        "level": "LOG_LEVEL",
        "consoleLogEnabled": "CONSOLELOG_ENABLED",
        "fileLogEnabled": "FILELOG_ENABLED"
    }
}
```

### Priming the Database

To prime MongoDB with an initial super user and a list of candy bar products for testing, two scripts were provided that can be invoked using the NPM command. From the 'package.json' file:

```
"scripts": {
    "user": "ts-node ./src/scripts/createSuperUser.ts",
    "products": "ts-node ./src/scripts/createProducts.ts",
}
```

-   'npm start user' - Primes a 'Super Duper' user into the database with the encrypted password 'abcdefg'. You should of course change this as you change your private key and regenerate the user's encrypted password field.
-   'npm start products' - Primes a list of candy bars into the product database that you can use to start calling the various RESTful methods.

# Helpful links that were referenced

-   Configure JEST: https://itnext.io/testing-with-jest-in-typescript-cc1cd0095421
-   MongoDB Installation: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-os-x/

# Pending enhancements

If a user's credentials are revoked, the issued token remains valid until the token's TTL value is reached. This is not desirable so I will add a redis cache that will contain revoked user tokens.

## License

This is a simple generic project to manage basic candy bars information. All it contains is common to thousands of services so there isn't any intellectual property rights that can be claimed. Feel free to adopt it to you own needs as you like.

## About Me

Feel free to contact me for any questions, but report feedback or maybe even something positive, which would be much appreciated. All my contact information is within my GitHub account.
