import { Unlocker } from './unlocker.js';
import { getConfig } from './getConfig.js';

async function start() {
    const config = getConfig();

    console.log('Pool Unlocker:', config);

    const unlocker = new Unlocker(config);

    await unlocker.unlock();

    setInterval(async () => {
        await unlocker.unlock();
    }, unlocker.interval);
}

start();
