# Forward telegram messages from some channels to another

## How build, deploy and start

> tsc

start and get tg hash codes
> ./scripts/start-test

Then make docker thought docker-compose and set all envirioments in .env

deploy docker machine on prod and profit.


```
# example config of .env

PHONE_NUMBER=+phone_number
API_ID=2496
API_HASH=8da85b0d5bfe62527e5b244c209159c3


# listen on channels
# with out space, if u deploy in Docker - then not set  '' for Channels
CHANNELS0=Title Channel 1
CHANNELS1=
CHANNELS2=
# ...
CHANNELS20=


# target channel
CHANNEL_TARGET=Title_Channel_end

```