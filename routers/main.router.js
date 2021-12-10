const express =  require("express");
const webhookController = require("../controllers/webhook.controller");
let router = express.Router();

//init all web routes
let initWebRoutes = (app) => {
    router.get("/webhook", webhookController.getWebhook);
    router.post("/webhook", webhookController.postWebhook);
    return app.use("/", router);
};

module.exports = initWebRoutes;