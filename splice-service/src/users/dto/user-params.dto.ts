import { IsUUID } from 'class-validator';

export class UserParamsDto {
  @IsUUID()
  declare uuid: string;
}
