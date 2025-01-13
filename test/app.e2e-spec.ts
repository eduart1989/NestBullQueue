import {
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { faker } from '@faker-js/faker';
import * as pactum from 'pactum';
import { AppModule } from '../src/app.module';
import { AuthDto } from '../src/auth/dto';
import { PrismaService } from '../src/prisma/prisma.service';
import { EditUserDto } from '../src/user/dto';
import { CreateCustomerDto } from '../src/customer/dto/create-customer.dto';
import { CreateOrderDto } from '../src/customer/dto/create-order.dto';

describe('App e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef =
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );
    await app.init();
    await app.listen(3333);

    prisma = app.get(PrismaService);
    await prisma.cleanDb();
    pactum.request.setBaseUrl(
      'http://localhost:3333',
    );
  });

  afterAll(() => {
    app.close();
  });

  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'eduart@gmail.com',
      password: '123',
      firstName: 'firstName',
      lastName: 'LastName',
    };
    describe('Signup', () => {
      it('should throw if email empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            password: dto.password,
          })
          .expectStatus(400);
      });
      it('should throw if password empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            email: dto.email,
          })
          .expectStatus(400);
      });
      it('should throw if no body provided', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .expectStatus(400);
      });
      it('should signup', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201);
      });
    });

    describe('Signin', () => {
      it('should throw if email empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            password: dto.password,
          })
          .expectStatus(400);
      });
      it('should throw if password empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            email: dto.email,
          })
          .expectStatus(400);
      });
      it('should throw if no body provided', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .expectStatus(400);
      });
      it('should signin', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody(dto)
          .expectStatus(200)
          .stores('userAt', 'accessToken');
      });
    });
  });

  describe('User', () => {
    describe('Get me', () => {
      it('should get current user', () => {
        return pactum
          .spec()
          .get('/users/me')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200);
      });
    });

    describe('Edit user', () => {
      it('should edit user', () => {
        const dto: EditUserDto = {
          firstName: 'Eduart',
          email: 'eduart@gmail.com',
        };
        return pactum
          .spec()
          .patch('/users')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.firstName)
          .expectBodyContains(dto.email);
      });
    });
  });

  describe('Customers', () => {
    describe('Create Customer', () => {
      const customerDto: CreateCustomerDto = {
        name: faker.name.firstName(),
        surname: faker.name.lastName(),
        email: faker.internet.email(),
        age: faker.datatype.number({
          min: 18,
          max: 80,
        }),
        address: faker.address.streetAddress(),
      };

      it('should create customer', () => {
        return pactum
          .spec()
          .post('/customers')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withBody(customerDto)
          .expectStatus(201)
          .stores('customerId', 'id')
          .expectBodyContains(customerDto.name)
          .expectBodyContains(customerDto.email);
      });
    });

    describe('Create Customer Order', () => {
      const orderDto: CreateOrderDto = {
        status: 'created',
        products: [
          {
            name: faker.commerce.productName(),
            price: parseFloat(
              faker.commerce.price(),
            ),
            description:
              faker.commerce.productDescription(),
            barcode: faker.datatype.uuid(),
          },
        ],
      };

      it('should create order for customer', () => {
        return pactum
          .spec()
          .post('/customers/{id}/orders')
          .withPathParams('id', '$S{customerId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withBody(orderDto)
          .expectStatus(201)
          .stores('orderId', 'id')
          .expectBodyContains(orderDto.status);
      });
    });

    describe('Get Customer Orders', () => {
      it('should get customer orders', () => {
        return pactum
          .spec()
          .get('/customers/{id}/orders')
          .withPathParams('id', '$S{customerId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200)
          .expectJsonLength('data', 1);
      });
    });

    describe('Update Customer Order', () => {
      const updateDto = {
        status: 'in_progress',
      };

      it('should update customer order', () => {
        return pactum
          .spec()
          .patch(
            '/customers/{customerId}/orders/{orderId}',
          )
          .withPathParams(
            'customerId',
            '$S{customerId}',
          )
          .withPathParams(
            'orderId',
            '$S{orderId}',
          )
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withBody(updateDto)
          .expectStatus(200)
          .expectBodyContains(updateDto.status);
      });
    });

    describe('Delete Customer Order', () => {
      it('should delete customer order', () => {
        return pactum
          .spec()
          .delete(
            '/customers/{customerId}/orders/{orderId}',
          )
          .withPathParams(
            'customerId',
            '$S{customerId}',
          )
          .withPathParams(
            'orderId',
            '$S{orderId}',
          )
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(204);
      });
    });
  });
});
