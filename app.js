const express = require('express');
const redis = require('redis');
const app = express();

const REDIS_URL = process.env.REDIS_URL;
const PORT = process.env.PORT || 8080;

const client = redis.createClient(REDIS_URL);
client.on('error', function (err) {
    console.log("Redis error: " + err);
});

// How long we want to simulate our water lasting (1 hour)
const WATER_DECAY_TIME = 60 * 30 * 1000;
const WATER_LEVEL_CACHE_KEY = 'water-level';

app.get('/hygrometer', function (req, res) {
    client.pttl(WATER_LEVEL_CACHE_KEY, function(error, ttl) {
        if (error) {
            console.log(error);
            res.status(500).send({
                error: 'Server error'
            })
        }

        let level;
        if (ttl === -2) {
            level = 0;
        } else {
            // Use exponential decay for water level simulation so it dries
            // up quickly in the beginning, but approaches 0 slowly
            level = Math.exp(-5 * (WATER_DECAY_TIME - ttl) / WATER_DECAY_TIME) * 100;
        }

        res.send({ level });
    });
});

app.post('/water', function (req, res) {
    client.psetex(WATER_LEVEL_CACHE_KEY, WATER_DECAY_TIME, 1, function(error) {
        if (error) {
            console.log(error);
            res.status(500).send({
                error: 'Server error'
            })
        }

        res.send({
            success: true
        })
    });
});

app.listen(PORT, function () {
    console.log(`Water demo app listening on port ${PORT}!`)
});
