import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindManyOptions,
  FindOptionsRelations,
  FindOptionsWhere,
  Repository,
} from 'typeorm';
import { UpdateUserDTO, UserDTO } from 'src/common/dtos';
import { UserOrUsers } from 'src/common/utils';
import { SocialAccountDTO } from 'src/common/dtos/social_account.dto';
import { UserSocialAccount } from 'src/social_account/social_account.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(UserSocialAccount)
    private userSocialAccountRepository: Repository<UserSocialAccount>,
  ) {}

  async findAll() {
    return await this.userRepository.find();
  }

  async findById(
    id: number,
    relations?: FindOptionsRelations<User>,
    cache?:
      | number
      | boolean
      | {
          id: any;
          milliseconds: number;
        },
  ) {
    const [user] = await this.userRepository.find({
      relations,
      where: {
        id,
      },
      cache,
    });

    if (!user) throw new NotFoundException('User not found!');
    return user;
  }

  async findBy<T extends boolean>(
    where: FindOptionsWhere<User> | FindOptionsWhere<User>[],
    one?: T,
    relations?: FindOptionsRelations<User>,
    cache?:
      | number
      | boolean
      | {
          id: any;
          milliseconds: number;
        },
  ): Promise<UserOrUsers<T>> {
    const options: FindManyOptions<User> = {
      relations,
      where,
      cache,
    };

    if (one) {
      const [user] = await this.userRepository.find(options);
      return user as UserOrUsers<T>;
    }

    return (await this.userRepository.find(options)) as UserOrUsers<T>;
  }

  create(newUser: UserDTO) {
    const user = new User();

    user.email = newUser.email;
    user.name = newUser.name;
    user.nim = newUser.nim;
    user.picture = newUser.picture;

    return this.userRepository.save(user);
  }

  async update(modifiedUser: UpdateUserDTO, id: number) {
    const { affected } = await this.userRepository.update(id, modifiedUser);
    if (affected === 0) throw new NotFoundException('User not found!');

    return { affected };
  }

  addSocialAccounts(newSocialAccounts: SocialAccountDTO[], id: number) {
    return this.userSocialAccountRepository.save(
      newSocialAccounts.map((social) => {
        const socialAccount = new UserSocialAccount();

        socialAccount.type = social.type;
        socialAccount.url = social.url;
        socialAccount.user = { id } as User;

        return socialAccount;
      }),
    );
  }
}
