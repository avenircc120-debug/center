import { Router, type IRouter } from "express";
import accessRouter from "./access";
import confirmationRouter from "./confirmation";
import healthRouter from "./health";

const router: IRouter = Router();

router.use(healthRouter);
router.use(accessRouter);
router.use(confirmationRouter);

export default router;