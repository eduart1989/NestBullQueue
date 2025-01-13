# Nest.js REST API Exercise

This repository contains a Nest.js REST API for an exercise

## Getting Started

Follow the instructions below to set up and run the API in your development environment.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.18.0)
- [Yarn](https://yarnpkg.com/) (Package manager)
- [Docker](https://www.docker.com/) (For running the PostgreSQL database)

### Installation

1. Clone this repository to your local machine:

   ```bash
   git clone https://github.com/eduart1989/Nestbase.git
   cd Nestbase
   ```

2. Install the project dependencies:

   ```bash
   yarn
   ```

### Running the API

1. Start the PostgreSQL database in Docker and apply migrations:

   ```bash
   docker-compose build && docker-compose up -d
   yarn db:dev:restart
   ```

   This command will spin up a Docker container running a PostgreSQL database and apply the necessary migrations to set up the database schema.

2. Run Redis container

```bash
 docker run -p 6379:6379 redis
```

3. Start the API in development mode:

   ```bash
   yarn start:dev
   ```

   The API will be accessible at `http://localhost:3333`.

### Testing

You can run the end-to-end tests for the API using the following command:

```bash
yarn pretest:e2e
yarn test:e2e
```

# NestifyMe API

Welcome to the NestifyMe API. Below, you'll find a list of the available endpoint URLs for this API.

## Endpoints

### Authentication

- **POST /auth/signup**
- **POST /auth/signin**

### User Management

- **GET /users/me**
- **PATCH /users**

## Customer Management

- **POST /customers** - Create a new customer
- **GET /customers** - List all customers

## Order Management

- **POST /customers/:customerId/orders** - Create an order for a customer
- **GET /customers/:customerId/orders** - List orders for a customer

## Invoice Management

- **POST /customers/:customerId/orders/:orderId/send-invoice** - Send invoice for a specific order
- **POST /customers/send-invoices** - Send invoices for all uninvoiced orders
