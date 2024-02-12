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

EMAILSENDER: email address
EMAILPASS: Not your email password. You need to generate a password within your gmail account to connect with APIs

MYDB_TEST: datase for test (this one doesn't have to be created as it is already being syncronized when executing the tests)

JWTPASS: a password for the Auth (you can create anything here, or use some you've patternized)

## Functionalities

This project contains APIs responsible for the functionalities of the Mobile App Titser. 

User: Makes connection with table user, retrieve and modify data.
Messages: Makes connection with table messages, the WebSocket is a separated program
Interactions: Makes connection with table interactions, responsible for defining matches between users

*** as this app is not being launched, there are no tests for it. I left the tests in the code only to let you know that I know about them.

## Models

For the models, I prefered an OOP approach, with the more complex queries being written as rawQueries. 

To create new functions add it as public and static

## Authentication

The authentication was made using passport, using JWT Bearer. All routes besides the Auth are private routes, so be aware of using Authorization: Bearer {token} when doing your calls

To confirmation of register, it's necessary to receive a confirmation code. You don't have to access through email though, as it is returned in the /auth/register endpoint.

## Email

The email part of this code was made using Nodemailer, with connection through Gmail. 

