import {
    RequestDto,
    Request,
    Response,
    NextFunction,
} from '../dtos/RequestDto';
import jwt from 'jsonwebtoken';
import AppLogger from '../utils/Logger';
import { JwtPayload } from '../models/JwtPayload';
import JwtPayloadDto from '../dtos/JwtPayloadDto';
import config from 'config';

const logger = new AppLogger(module);

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------

export default function userAuth(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    let token = req.header('x-auth-token');

    if (!token) {
        const msg = 'Access denied. No token provided.';
        logger.error(msg);
        res.status(401).send(msg);
    } else {
        try {
            const decoded = jwt.verify(
                token,
                config.get('jwt.privateKey') as string
            ) as JwtPayloadDto;

            let request = req as RequestDto;
            request.Jwt = new JwtPayload(
                decoded.userId,
                decoded.operations,
                decoded.audit
            );
            next();
        } catch (ex) {
            const msg = 'Invalid token.';
            logger.error(msg);
            res.status(400).send(msg);
        }
    }
}
