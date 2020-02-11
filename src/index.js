const persea = require('persea');

const { init } = require('./db');

(async () => {
    await init();

    persea(process.env.PORT);
})();
