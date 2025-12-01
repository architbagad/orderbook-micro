import redis

class RedisSingleton:

    _lock = None
    _instance = None

    @staticmethod
    def get_instance():
        if RedisSingleton._instance == None:
            RedisSingleton._instance = RedisSingleton()
        return RedisSingleton._instance

    def __init__(self):
        if RedisSingleton._instance != None:
            raise Exception("This class is a singleton!")
        else:
            RedisSingleton._instance = self
            self._redis = redis.Redis(host="localhost", port=6379, db=0, decode_responses=True)

    def get_redis(self):
        return self._redis
    
    def push(self, queue: str, value: str):
        """Push value to the left of the queue"""
        return self._redis.lpush(queue, value)
    
    def pop(self, queue: str):
        """Pop value from the right of the queue (non-blocking)"""
        return self._redis.rpop(queue)
    
    def blocking_pop(self, queue: str, timeout: int = 0):
        """Blocking pop from the right of the queue. Returns (queue_name, value) tuple or None"""
        result = self._redis.brpop(queue, timeout)
        return result

redis_client = RedisSingleton.get_instance()