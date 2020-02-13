const { request, response } = require('@persea/persea');

module.exports.index = () => {
    const { flakiness } = request.query;

    if (Math.random() < Number(flakiness)) {
        response.send({ status: 500 });
    } else {
        response.send({ status: 200 });
    }
}
