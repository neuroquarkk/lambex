import app from './app';
import { config } from './config';
import { checkConn } from './db';

async function start() {
    try {
        await checkConn();
        app.listen(config.PORT, () => {
            console.log(`Server started :${config.PORT}`);
        });
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

start();
