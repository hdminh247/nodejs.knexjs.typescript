## A. Installing

- Step 1: Install all related packages. Navigate to root folder run this command:

```
yarn install
```

- Step 2: Run the following command to copy `.env` from sample `.env` file depends on which environment you are running on

```
 cp env.sample.local .env
```

or

```
 cp env.sample.dev .env
```

- Configure settings in the new .env, point them to local environment if you run this server on local machine.

##### If you intend to run this server in lamda function, you need to setup some environment first

##### a) Prerequisites

- Setting up AWS credentials
  https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-getting-started-set-up-credentials.html
- Update `s3BucketName`, `region`, `cloudFormationStackName` (required) in `package.json`

##### b) Setup

- Run `yarn sam:setup`. This will create s3 bucket with name defined in `s3BucketName` if it does not exist to upload lamda function codes zip file later

## B. Migration and Sender

Run migration

```
yarn knex:migrate:latest
```

Execute seeder

```
yarn knex seed:run
```

To run specific seeder, you can find available seed files in `src/seeds`, then run seed CLI with desired file name

```
knex seed:run --specific=2_5_seed_batch.ts
```

To rollback migration, run

```
knex:migrate:rollback
```

## C. Running server

#### 1. APIs

##### a) Local Nodejs Server

Step 1: At the root of project, run this command:

- For development

```
  yarn dev
```

- For production

```
   yarn build
```

Step 2: Files are built into `build` folder. Run the following command line

```
    node build/server.js
```

You can also run by `pm2`

```
pm2 start yarn --name api -- dev
```

Server is hosted at port which is defined under `PORT` field in .env file

```
  http://localhost:PORT
```

#### 2. Swagger docs

API docs is served at:

```
  http://localhost:<PORT>/api-docs
```
