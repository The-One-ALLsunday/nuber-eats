import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAccountInput } from './dtos/create-account.dto';
import { LoginInput } from './dtos/login.dto';
import { User } from './entities/user.entity';

Injectable();
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async createAccount({
    email,
    password,
    role,
  }: CreateAccountInput): Promise<{ ok: boolean; error?: string }> {
    /**
     * check that email does not exist
     * create user & hash the password
     */
    try {
      const exists = await this.users.findOne({ email });
      if (exists) {
        // make error
        return { ok: false, error: 'There is user with that email already' };
      }
      await this.users.save(this.users.create({ email, password, role }));
      return { ok: true };
    } catch (e) {
      // make error
      return { ok: false, error: "Couldn't create account" };
    }
  }

  async login({
    email,
    password,
  }: LoginInput): Promise<{ ok: boolean; error?: string; token?: string }> {
    // find the user with the email
    // check if the password is correct
    // make a JWT and give it to the user
    try {
      const user = await this.users.findOne({ email });
      if (!user) {
        return {
          ok: false,
          error: 'User not found',
        };
      }
      const passwrodCorrect = await user.checkPassword(password);
      if (!passwrodCorrect) {
        return {
          ok: false,
          error: 'Wrong password',
        };
      }
      return { ok: true, token: 'lalala' };
    } catch (error) {
      return { ok: false, error };
    }
  }
}
