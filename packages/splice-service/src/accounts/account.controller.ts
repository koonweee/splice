import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccountResponse, User } from 'splice-api';
import { AuthenticatedUser } from '../common/decorators/authenticated-user.decorator';
import { AccountService } from './account.service';
import { AccountByIdParamsDto } from './dto/account-params.dto';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@ApiTags('accounts')
@Controller('accounts')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get()
  @ApiOperation({ summary: 'Get all accounts for a user' })
  @ApiResponse({ status: 200, description: 'List of accounts' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@AuthenticatedUser() user: User): Promise<AccountResponse[]> {
    const accounts = await this.accountService.findByUserId(user.id);
    return accounts.map((account) => this.accountService.toResponse(account));
  }

  @Get(':accountId')
  @ApiOperation({ summary: 'Get account by ID' })
  @ApiResponse({ status: 200, description: 'Account details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async findOne(@AuthenticatedUser() user: User, @Param() params: AccountByIdParamsDto): Promise<AccountResponse> {
    const account = await this.accountService.findByUserIdAndAccountIdOrThrow(user.id, params.accountId);
    return this.accountService.toResponse(account);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new account' })
  @ApiResponse({ status: 201, description: 'Account created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@AuthenticatedUser() user: User, @Body() createAccountDto: CreateAccountDto): Promise<AccountResponse> {
    const account = await this.accountService.create(createAccountDto);
    return this.accountService.toResponse(account);
  }

  @Patch(':accountId')
  @ApiOperation({ summary: 'Update account by ID' })
  @ApiResponse({ status: 200, description: 'Account updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async update(
    @AuthenticatedUser() user: User,
    @Param() params: AccountByIdParamsDto,
    @Body() updateAccountDto: UpdateAccountDto,
  ): Promise<AccountResponse> {
    // First verify the account belongs to the user
    await this.accountService.findByUserIdAndAccountIdOrThrow(user.id, params.accountId);

    const account = await this.accountService.update(params.accountId, updateAccountDto);
    return this.accountService.toResponse(account);
  }

  @Delete(':accountId')
  @ApiOperation({ summary: 'Delete account by ID' })
  @ApiResponse({ status: 200, description: 'Account deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async remove(@AuthenticatedUser() user: User, @Param() params: AccountByIdParamsDto): Promise<void> {
    // First verify the account belongs to the user
    await this.accountService.findByUserIdAndAccountIdOrThrow(user.id, params.accountId);

    await this.accountService.remove(params.accountId);
  }
}
