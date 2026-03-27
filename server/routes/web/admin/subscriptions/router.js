import {
    getActiveSubscription,
    getSubscriptionHistory
} from "#webController/admin/subscriptions/controller.js";
import express from "express";

const Router = express.Router();

Router.get("/active", getActiveSubscription);
Router.get("/history", getSubscriptionHistory);

export default Router;
