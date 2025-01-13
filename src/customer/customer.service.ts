import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import {
  Order,
  Customer,
  Prisma,
} from '@prisma/client';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { GENERATE_PDF } from 'src/constants';

@Injectable()
export class CustomerService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue(GENERATE_PDF)
    private readonly generatePdfQueue: Queue,
  ) {}

  async generatePdf(
    order: Order,
    customer: Customer,
  ) {
    await this.generatePdfQueue.add({
      order,
      customer,
    });
  }

  async getCustomers(
    filterParams: Prisma.CustomerWhereInput,
    paginationParams: Prisma.CustomerFindManyArgs,
  ) {
    const pagination = {
      ...paginationParams,
    };

    const data =
      await this.prisma.customer.findMany({
        where: {
          ...filterParams,
        },
        ...pagination,
      });

    const totalRows =
      await this.prisma.customer.count({
        where: filterParams,
      });

    const totalPages = Math.ceil(
      totalRows / pagination.take,
    );

    return {
      data,
      totalRows,
      totalPages,
    };
  }

  async getCustomerById(customerId: number) {
    const customer =
      await this.prisma.customer.findUnique({
        where: { id: customerId },
        include: { orders: true },
      });

    if (!customer) {
      throw new NotFoundException(
        'Customer not found',
      );
    }

    return customer;
  }

  async createCustomer(dto: CreateCustomerDto) {
    try {
      return await this.prisma.customer.create({
        data: dto,
      });
    } catch (error) {
      if (
        error instanceof
        Prisma.PrismaClientKnownRequestError
      ) {
        if (error.code === 'P2002') {
          throw new ForbiddenException(
            'Email already exists',
          );
        }
      }
      throw error;
    }
  }

  async updateCustomerById(
    customerId: number,
    dto: UpdateCustomerDto,
  ) {
    // Verify customer exists
    const existingCustomer =
      await this.prisma.customer.findUnique({
        where: { id: customerId },
      });

    if (!existingCustomer) {
      throw new NotFoundException(
        'Customer not found',
      );
    }

    return this.prisma.customer.update({
      where: { id: customerId },
      data: dto,
    });
  }

  async deleteCustomerById(customerId: number) {
    // Check if customer exists
    const existingCustomer =
      await this.prisma.customer.findUnique({
        where: { id: customerId },
      });

    if (!existingCustomer) {
      throw new NotFoundException(
        'Customer not found',
      );
    }

    // Delete customer (cascading delete for orders will be handled by database)
    await this.prisma.customer.delete({
      where: { id: customerId },
    });
  }

  // Order-related methods
  async createCustomerOrder(
    customerId: number,
    dto: CreateOrderDto,
  ) {
    // Verify customer exists
    const existingCustomer =
      await this.prisma.customer.findUnique({
        where: { id: customerId },
      });

    if (!existingCustomer) {
      throw new NotFoundException(
        'Customer not found',
      );
    }

    // Convert products to a JSON-compatible format
    const productsJson = dto.products.map(
      (product) => ({
        name: product.name,
        price: product.price,
        description: product.description,
        barcode: product.barcode,
      }),
    );

    return this.prisma.order.create({
      data: {
        status: dto.status,
        products:
          productsJson as Prisma.JsonArray,
        customerId,
      },
    });
  }

  async getCustomerOrders(
    customerId: number,
    page = 1,
    pageSize = 10,
  ) {
    // Verify customer exists
    const existingCustomer =
      await this.prisma.customer.findUnique({
        where: { id: customerId },
      });

    if (!existingCustomer) {
      throw new NotFoundException(
        'Customer not found',
      );
    }

    const [orders, totalOrders] =
      await this.prisma.$transaction([
        this.prisma.order.findMany({
          where: { customerId },
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.order.count({
          where: { customerId },
        }),
      ]);

    const totalPages = Math.ceil(
      totalOrders / pageSize,
    );

    return {
      data: orders,
      totalOrders,
      totalPages,
    };
  }

  async getCustomerOrderById(
    customerId: number,
    orderId: number,
  ) {
    const order =
      await this.prisma.order.findFirst({
        where: {
          id: orderId,
          customerId,
        },
      });

    if (!order) {
      throw new NotFoundException(
        'Order not found',
      );
    }

    return order;
  }

  async sendCustomerOrder(
    customerId: number,
    orderId: number,
  ) {
    const order =
      await this.prisma.order.findFirst({
        where: {
          id: orderId,
          customerId,
        },
      });
    const customer =
      await this.prisma.customer.findUnique({
        where: { id: customerId },
      });

    if (!order) {
      throw new NotFoundException(
        'Order not found',
      );
    }
    if (!customer) {
      throw new NotFoundException(
        'Customer not found',
      );
    }

    await this.generatePdf(order, customer);

    return order;
  }

  async sendInvoices() {
    const orders =
      await this.prisma.order.findMany({
        where: {
          status: {
            not: 'invoiced',
          },
        },
        include: {
          customer: true, // Include entire customer object
        },
      });

    if (orders.length === 0) {
      throw new NotFoundException(
        'Orders not found',
      );
    }

    await Promise.all(
      orders.map((order) => {
        const { customer, ...orderProps } = order;
        return this.generatePdf(
          orderProps,
          customer,
        );
      }),
    );

    return { total: orders.length };
  }

  async updateCustomerOrderById(
    customerId: number,
    orderId: number,
    dto: UpdateOrderDto,
  ) {
    // Verify order belongs to customer
    const existingOrder =
      await this.prisma.order.findFirst({
        where: {
          id: orderId,
          customerId,
        },
      });

    if (!existingOrder) {
      throw new NotFoundException(
        'Order not found',
      );
    }

    // Convert products to a JSON-compatible format
    const updateData: Prisma.OrderUncheckedUpdateInput =
      {
        ...(dto.status && { status: dto.status }),
        ...(dto.products && {
          products: dto.products.map(
            (product) => ({
              name: product.name,
              price: product.price,
              description: product.description,
              barcode: product.barcode,
            }),
          ) as Prisma.JsonArray,
        }),
      };

    return this.prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });
  }

  async deleteCustomerOrderById(
    customerId: number,
    orderId: number,
  ) {
    // Verify order belongs to customer
    const existingOrder =
      await this.prisma.order.findFirst({
        where: {
          id: orderId,
          customerId,
        },
      });

    if (!existingOrder) {
      throw new NotFoundException(
        'Order not found',
      );
    }
    // Delete order
    await this.prisma.order.delete({
      where: { id: orderId },
    });
  }
}
