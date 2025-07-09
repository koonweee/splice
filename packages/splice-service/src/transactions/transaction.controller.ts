import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TransactionResponse, User } from 'splice-api';
import { AuthenticatedUser } from '../common/decorators/authenticated-user.decorator';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionByIdParamsDto } from './dto/transaction-params.dto';
import { TransactionQueryDto } from './dto/transaction-query.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionService } from './transaction.service';

@ApiTags('transactions')
@Controller('transactions')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  @ApiOperation({ summary: 'Get all transactions for a user' })
  @ApiResponse({ status: 200, description: 'List of transactions' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@AuthenticatedUser() user: User, @Query() query: TransactionQueryDto): Promise<TransactionResponse[]> {
    const transactions = await this.transactionService.findByUserId(user.id, query);
    return transactions.map((transaction) => this.transactionService.toResponse(transaction));
  }

  @Get(':transactionId')
  @ApiOperation({ summary: 'Get transaction by ID' })
  @ApiResponse({ status: 200, description: 'Transaction details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async findOne(
    @AuthenticatedUser() user: User,
    @Param() params: TransactionByIdParamsDto,
  ): Promise<TransactionResponse> {
    const transaction = await this.transactionService.findByUserIdAndTransactionIdOrThrow(
      user.id,
      params.transactionId,
    );
    return this.transactionService.toResponse(transaction);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new transaction' })
  @ApiResponse({ status: 201, description: 'Transaction created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @AuthenticatedUser() user: User,
    @Body() createTransactionDto: CreateTransactionDto,
  ): Promise<TransactionResponse> {
    const transaction = await this.transactionService.create(createTransactionDto);
    return this.transactionService.toResponse(transaction);
  }

  @Patch(':transactionId')
  @ApiOperation({ summary: 'Update transaction by ID' })
  @ApiResponse({ status: 200, description: 'Transaction updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async update(
    @AuthenticatedUser() user: User,
    @Param() params: TransactionByIdParamsDto,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ): Promise<TransactionResponse> {
    // First verify the transaction belongs to the user
    await this.transactionService.findByUserIdAndTransactionIdOrThrow(user.id, params.transactionId);

    const transaction = await this.transactionService.update(params.transactionId, updateTransactionDto);
    return this.transactionService.toResponse(transaction);
  }

  @Delete(':transactionId')
  @ApiOperation({ summary: 'Delete transaction by ID' })
  @ApiResponse({ status: 200, description: 'Transaction deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async remove(@AuthenticatedUser() user: User, @Param() params: TransactionByIdParamsDto): Promise<void> {
    // First verify the transaction belongs to the user
    await this.transactionService.findByUserIdAndTransactionIdOrThrow(user.id, params.transactionId);

    await this.transactionService.remove(params.transactionId);
  }
}
