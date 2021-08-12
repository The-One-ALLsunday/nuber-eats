import { InternalServerErrorException } from '@nestjs/common';
import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import * as bcrypt from 'bcrypt';
import { IsBoolean, IsEmail, IsEnum, IsString } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { BeforeInsert, BeforeUpdate, Column, Entity } from 'typeorm';

enum UserRole {
  Client,
  Owner,
  Delivery,
}

registerEnumType(UserRole, { name: 'UserRole' });

@InputType({ isAbstract: true })
@ObjectType()
@Entity()
export class User extends CoreEntity {
  @Column({ unique: true })
  @Field((type) => String)
  @IsEmail()
  email: string;

  @Column({ select: false })
  @Field((type) => String)
  @IsString()
  password: string;

  @Column({ type: 'enum', enum: UserRole })
  @Field((type) => UserRole)
  @IsEnum(UserRole)
  role: UserRole;

  @Column({ default: false })
  @Field((type) => Boolean)
  @IsBoolean()
  verified: boolean;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    try {
      if (this.password) {
        this.password = await bcrypt.hash(this.password, 10);
      }
    } catch (e) {
      throw new InternalServerErrorException();
    }
  }

  async checkPassword(aPassword): Promise<boolean> {
    try {
      return await bcrypt.compare(aPassword, this.password);
    } catch (e) {
      throw new InternalServerErrorException();
    }
  }
}
