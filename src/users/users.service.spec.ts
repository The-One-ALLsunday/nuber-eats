import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from 'src/jwt/jwt.service';
import { MailService } from 'src/mail/mail.service';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Verification } from './entities/verification.entity';
import { UsersService } from './users.service';

const mockRepository = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  findOneOrFail: jest.fn(),
  delete: jest.fn(),
});

const mockJwtService = () => ({
  sign: jest.fn(() => 'sgin token baby'),
  verify: jest.fn(),
});

const mockMailService = () => ({
  sendVerificationEmail: jest.fn(),
});

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('User Services', () => {
  let service: UsersService;
  // let usersRespository: Partial<Record<'hello', number>>;
  // usersRespository.hello
  let usersRespository: MockRepository<User>;
  let verificationsRespository: MockRepository<Verification>;
  let mailService: MailService;
  let jwtService: JwtService;
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Verification),
          useValue: mockRepository(),
        },
        {
          provide: JwtService,
          useValue: mockJwtService(),
        },
        {
          provide: MailService,
          useValue: mockMailService(),
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    mailService = module.get<MailService>(MailService);
    usersRespository = module.get(getRepositoryToken(User));
    verificationsRespository = module.get(getRepositoryToken(Verification));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAccount', () => {
    const createAccountArgs = {
      email: 'bo.deng@zstack.io',
      password: '',
      role: 0,
    };

    it('should fail if user exist', async () => {
      usersRespository.findOne.mockResolvedValue({
        id: 1,
        email: 'bo.deng@zstack.io',
      });
      const result = await service.createAccount(createAccountArgs);

      expect(result).toMatchObject({
        ok: false,
        error: 'There is user with that email already',
      });
    });

    it('should create a new user', async () => {
      usersRespository.findOne.mockResolvedValue(undefined);

      usersRespository.create.mockReturnValue(createAccountArgs);
      usersRespository.save.mockResolvedValue(createAccountArgs);

      verificationsRespository.create.mockReturnValue({
        user: createAccountArgs,
      });
      verificationsRespository.save.mockResolvedValue({ code: 'code' });

      const result = await service.createAccount(createAccountArgs);

      expect(usersRespository.create).toHaveBeenCalledTimes(1);
      expect(usersRespository.create).toHaveBeenCalledWith(createAccountArgs);

      expect(usersRespository.save).toHaveBeenCalledTimes(1);
      expect(usersRespository.save).toHaveBeenCalledWith(createAccountArgs);

      expect(verificationsRespository.create).toHaveBeenCalledTimes(1);
      expect(verificationsRespository.create).toHaveBeenCalledWith({
        user: createAccountArgs,
      });

      expect(verificationsRespository.save).toHaveBeenCalledTimes(1);
      expect(verificationsRespository.save).toHaveBeenCalledWith({
        user: createAccountArgs,
      });

      expect(mailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
      );

      expect(result).toEqual({ ok: true });
    });

    it('should fail on exception', async () => {
      usersRespository.findOne.mockRejectedValue(new Error());
      const result = await service.createAccount(createAccountArgs);
      expect(result).toEqual({ ok: false, error: "Couldn't create account" });
    });
  });

  describe('login', () => {
    const loginArgs = {
      email: 'bo.deng@zstack.io',
      password: 'password',
    };
    it('should fail if user does not exist', async () => {
      usersRespository.findOne.mockResolvedValue(null);
      const result = await service.login(loginArgs);
      expect(usersRespository.findOne).toHaveBeenCalledTimes(1);
      expect(usersRespository.findOne).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
      );
      expect(result).toEqual({
        ok: false,
        error: 'User not found',
      });
    });

    it('should fail if the password is wrong', async () => {
      const mockedUser = {
        id: 1,
        checkPassword: jest.fn(() => Promise.resolve(false)),
      };

      usersRespository.findOne.mockResolvedValue(mockedUser);
      const result = await service.login(loginArgs);
      expect(result).toEqual({
        ok: false,
        error: 'Wrong password',
      });
    });

    it('should return token if passwrod correct', async () => {
      const mockedUser = {
        id: 1,
        checkPassword: jest.fn(() => Promise.resolve(true)),
      };
      usersRespository.findOne.mockResolvedValue(mockedUser);
      const result = await service.login(loginArgs);
      expect(jwtService.sign).toHaveBeenCalledTimes(1);
      expect(jwtService.sign).toBeCalledWith(expect.any(Number));
      expect(result).toEqual({ ok: true, token: 'sgin token baby' });
    });
  });

  describe('findById', () => {
    const findByIdArgs = {
      id: 1,
    };
    it('should find an existing user', async () => {
      usersRespository.findOneOrFail.mockResolvedValue(findByIdArgs);
      const result = await service.findById(1);
      expect(result).toEqual({ ok: true, user: findByIdArgs });
    });

    it('should fail if no user found', async () => {
      usersRespository.findOneOrFail.mockRejectedValue(new Error());
      const result = await service.findById(1);
      expect(result).toEqual({ ok: false, error: 'User Not Found' });
    });
  });

  describe('editProfile', () => {
    // it('should change email', async () => {
    //   const oldUser = {
    //     email: 'bo.deng@old.io',
    //     verified: true,
    //   };
    //   const newUser = {
    //     email: 'bo.deng@new.io',
    //     verified: false,
    //   };
    //   const editProfileArgs = {
    //     userId: 1,
    //     input: {
    //       email: 'bo.deng@new.io',
    //       verified: false,
    //     },
    //   };
    //   const newVerification = {
    //     code: 'code',
    //   };
    //   usersRespository.findOne.mockResolvedValue(oldUser);
    //   verificationsRespository.create.mockReturnValue(newVerification);
    //   verificationsRespository.save.mockResolvedValue(newVerification);
    //   await service.editProfile(editProfileArgs.userId, editProfileArgs.input);
    //   expect(usersRespository.findOne).toHaveBeenCalledTimes(1);
    //   expect(usersRespository.findOne).toHaveBeenCalledWith(
    //     editProfileArgs.userId,
    //   );
    //   expect(verificationsRespository.create).toHaveBeenCalledWith({
    //     user: newUser,
    //   });
    //   expect(verificationsRespository.save).toHaveBeenCalledWith(
    //     newVerification,
    //   );
    //   expect(mailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
    //   expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
    //     newUser.email,
    //     newVerification.code,
    //   );
    // });

    it('should change password', async () => {
      const editProfileArgs = {
        userId: 1,
        input: {
          password: 'new.password',
        },
      };
      usersRespository.findOne.mockResolvedValue({ password: 'new' });
      const result = await service.editProfile(
        editProfileArgs.userId,
        editProfileArgs.input,
      );
      expect(usersRespository.save).toHaveBeenCalledTimes(1);
      expect(usersRespository.save).toHaveBeenCalledWith(editProfileArgs.input);
      expect(result).toEqual({ ok: true });
    });

    it('should fail on exception', async () => {
      usersRespository.findOne.mockRejectedValue(new Error());
      const result = await service.editProfile(1, { email: 'bo.deng@new.io' });
      expect(result).toEqual({ ok: false, error: 'Could not update profile' });
    });
  });

  describe('verifyEmail', () => {
    it('should verify email', async () => {
      const mockVerification = {
        id: 1,
        user: {
          verified: false,
        },
      };

      verificationsRespository.findOne.mockResolvedValue(mockVerification);

      const result = await service.verifyEmail('');

      expect(verificationsRespository.findOne).toHaveBeenCalledTimes(1);
      expect(verificationsRespository.findOne).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
      );

      expect(usersRespository.save).toHaveBeenCalledTimes(1);
      expect(usersRespository.save).toHaveBeenCalledWith({ verified: true });

      expect(verificationsRespository.delete).toHaveBeenCalledTimes(1);
      expect(verificationsRespository.delete).toHaveBeenCalledWith(
        mockVerification.id,
      );

      expect(result).toEqual({ ok: true });
    });

    it('should fail on verification not found', async () => {
      verificationsRespository.findOne.mockResolvedValue(undefined);
      const result = await service.verifyEmail('');
      expect(result).toEqual({ ok: false, error: 'Verification not found' });
    });

    it('should fail on exception', async () => {
      verificationsRespository.findOne.mockRejectedValue(new Error());
      const result = await service.verifyEmail('');
      expect(result).toEqual({ ok: false, error: 'Could not verify email' });
    });
  });
});
