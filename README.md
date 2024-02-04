# Titser Backend

This application is responsible to handling every necessary task required by Titser APP

## .env

The environment have the following variables with the following requirements:
PORT: The port the system is gonna run (prefered: 3001)

MYDB: the name for the database used (creation scripts in the Extra resources folder. Don't use the test database to implement real data)
MYDBNAME: your user
MYDBPASS: your pass
MYDBPORT: database port

ENVIRONMENT: Homolog | Production

MYDB_TEST: datase for test (this one doesn't have to be created as it is already being created when executing the tests)

JWTPASS: a password for the Auth (you can create anything here, or use some you've patternized)

## ExtraResources

This folder has some usefull files and documentation to make it easier to use the backend APIs and configure all the necessary environment

### Status of the project
The project is still in development

There are somethings to define yet:

1. Will the Auth be part of this system or will it have an independent project (IdentityService)