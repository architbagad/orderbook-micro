import { createClient, type RedisClientType } from "redis";

class RedisSingleton {
    private static instance: RedisSingleton;
    private client: RedisClientType;

    private constructor(url: string) {
        this.client = createClient({ url });
        this.client.connect();
    }

    static getInstance(url = "redis://localhost:6379"): RedisSingleton {
        if (!RedisSingleton.instance) {
            RedisSingleton.instance = new RedisSingleton(url);
        }
        return RedisSingleton.instance;
    }

    async push(queue: string, value: string) {
        return this.client.lPush(queue, value);
    }

    async pop(queue: string) {
        return this.client.rPop(queue);
    }

    async bpop(queue: string, timeout = 0) {
        return this.client.brPop(queue, timeout);
    }
}

export const redis = RedisSingleton.getInstance();
