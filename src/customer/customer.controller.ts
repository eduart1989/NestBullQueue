import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  Query,
  DefaultValuePipe,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { JwtGuard } from '../auth/guard';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@UseGuards(JwtGuard)
@Controller('customers')
export class CustomerController {
  constructor(
    private customerService: CustomerService,
  ) {}

  @Get()
  async getCustomers(
    @Query(
      'page',
      new DefaultValuePipe(1),
      ParseIntPipe,
    )
    page: number,
    @Query(
      'pageSize',
      new DefaultValuePipe(10),
      ParseIntPipe,
    )
    pageSize: number,
    @Query('filters') filters: string,
    @Query(
      'orders',
      new DefaultValuePipe('{"id": "desc"}'),
    )
    orders: string,
  ) {
    const filterParams: Prisma.CustomerWhereInput =
      {};

    if (filters) {
      const parsedFilters = JSON.parse(filters);
      for (const key in parsedFilters) {
        if (parsedFilters.hasOwnProperty(key)) {
          filterParams[key] = parsedFilters[key];
        }
      }
    }

    const orderParam = JSON.parse(orders);
    const paginationParams: Prisma.CustomerFindManyArgs =
      {
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: orderParam,
        include: {
          orders: true,
        },
      };

    return this.customerService.getCustomers(
      filterParams,
      paginationParams,
    );
  }

  @Get(':id')
  getCustomerById(
    @Param('id', ParseIntPipe) customerId: number,
  ) {
    return this.customerService.getCustomerById(
      customerId,
    );
  }

  @Post()
  createCustomer(@Body() dto: CreateCustomerDto) {
    return this.customerService.createCustomer(
      dto,
    );
  }

  @Patch(':id')
  updateCustomerById(
    @Param('id', ParseIntPipe) customerId: number,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customerService.updateCustomerById(
      customerId,
      dto,
    );
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  deleteCustomerById(
    @Param('id', ParseIntPipe) customerId: number,
  ) {
    return this.customerService.deleteCustomerById(
      customerId,
    );
  }

  @Post(
    ':customerId/orders/:orderId/send-invoice',
  )
  sendCustomerOrder(
    @Param('customerId', ParseIntPipe)
    customerId: number,
    @Param('orderId', ParseIntPipe)
    orderId: number,
  ) {
    return this.customerService.sendCustomerOrder(
      customerId,
      orderId,
    );
  }

  @Post('/send-invoices')
  sendInvoices() {
    return this.customerService.sendInvoices();
  }

  // Order-related endpoints
  @Post(':id/orders')
  createCustomerOrder(
    @Param('id', ParseIntPipe) customerId: number,
    @Body() dto: CreateOrderDto,
  ) {
    return this.customerService.createCustomerOrder(
      customerId,
      dto,
    );
  }

  @Get(':id/orders')
  getCustomerOrders(
    @Param('id', ParseIntPipe) customerId: number,
    @Query(
      'page',
      new DefaultValuePipe(1),
      ParseIntPipe,
    )
    page: number,
    @Query(
      'pageSize',
      new DefaultValuePipe(10),
      ParseIntPipe,
    )
    pageSize: number,
  ) {
    return this.customerService.getCustomerOrders(
      customerId,
      page,
      pageSize,
    );
  }

  @Get(':customerId/orders/:orderId')
  getCustomerOrderById(
    @Param('customerId', ParseIntPipe)
    customerId: number,
    @Param('orderId', ParseIntPipe)
    orderId: number,
  ) {
    return this.customerService.getCustomerOrderById(
      customerId,
      orderId,
    );
  }

  @Patch(':customerId/orders/:orderId')
  updateCustomerOrderById(
    @Param('customerId', ParseIntPipe)
    customerId: number,
    @Param('orderId', ParseIntPipe)
    orderId: number,
    @Body() dto: UpdateOrderDto,
  ) {
    return this.customerService.updateCustomerOrderById(
      customerId,
      orderId,
      dto,
    );
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':customerId/orders/:orderId')
  deleteCustomerOrderById(
    @Param('customerId', ParseIntPipe)
    customerId: number,
    @Param('orderId', ParseIntPipe)
    orderId: number,
  ) {
    return this.customerService.deleteCustomerOrderById(
      customerId,
      orderId,
    );
  }
}
