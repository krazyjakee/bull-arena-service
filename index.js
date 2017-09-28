const REDIS_HOST = process.env.REDIS_HOST || "127.0.0.1";
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || "";
const REDIS_DB = process.env.REDIS_DB || "";

const redisConfig = {
    host: REDIS_HOST,
    port: REDIS_PORT
}

if (REDIS_PASSWORD) {
    redisConfig.password = REDIS_PASSWORD;
}

if (REDIS_DB) {
    redisConfig.db = REDIS_DB;
}

const Arena = require('bull-arena');

const express = require('express');
const router = express.Router();

var redis = require('redis'),
    client = redis.createClient(redisConfig),
    first = true,
    allBullKeys = [],
    queues = [];

const promiseWhile = (data, condition, action) => {
  var whilst = (data) => {
    return condition(data) ?
      action(data).then(whilst) :
      Promise.resolve(data);
  }
  return whilst(data);
};
    
const GetRedisKeysFromCursor = (cursor) => {
    return new Promise((accept, reject) => {
        if (cursor < 0) cursor = 0;
        
        client.scan([cursor, 'MATCH', 'bull:*', "COUNT", "1000"], function (err, tuple) {
            if (err) return reject(err);
            cursor = tuple[0];
            allBullKeys = allBullKeys.concat(tuple[1]);
            accept(cursor);
        }); 
    });
}

promiseWhile(-1, (cursor) => {
    return cursor !== "0";
}, GetRedisKeysFromCursor).then(() => {
    allBullKeys.forEach(k => {
        const key = k.split(':')[1];
        if (!queues.includes(key)) {
            queues.push(key);
        }
    });
    
    queues = queues.map(name => {
        return {
            name,
            port: REDIS_PORT,
            host: REDIS_HOST,
            hostId: "main"
        }
    });
    
    const arena = Arena({queues});
    router.use('/', arena);
    
}).catch(console.log);
