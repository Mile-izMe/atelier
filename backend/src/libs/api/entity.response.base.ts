import { ApiProperty } from '@nestjs/swagger';

export interface BaseResponseProps {
  id: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export class ResponseBase {
  @ApiProperty({ type: String, format: 'uuid' })
  readonly id: string;

  @ApiProperty({ type: String, format: 'date-time' })
  readonly createdAt: string;

  @ApiProperty({ type: String, format: 'date-time' })
  readonly updatedAt: string;

  constructor(props: BaseResponseProps) {
    this.id = props.id;
    this.createdAt = new Date(props.createdAt).toISOString();
    this.updatedAt = new Date(props.updatedAt).toISOString();
  }
}
