import { Inject, Injectable } from '@nestjs/common';
import { RedisClientType } from '@redis/client';

@Injectable()
export class RedisService {
  /*
    DI for external library
    See https://docs.nestjs.com/fundamentals/custom-providers
  */
  constructor(@Inject('REDIS_CLIENT') private redisClient: RedisClientType) {
    redisClient.connect();
  }

  async get(key: string) {
    const value = await this.redisClient.get(key);
    return value;
  }

  async set(key: string, value: string) {
    return await this.redisClient.set(key, value);
  }

  async hget(key: string, field: string) {
    return await this.redisClient.hGet(key, field);
  }

  async hset(key: string, field: string, value: string) {
    return await this.redisClient.hSet(key, field, value);
  }

  async hsetJson(key: string, data: object) {
    try {
      for (const [field, value] of Object.entries(data))
        await this.redisClient.hSet(key, field, value.toString());
    } catch (e) {
      console.log(e);
    }
  }
}
