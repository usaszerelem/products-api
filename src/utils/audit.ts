import { RequestDto } from '../dtos/RequestDto';
import axios from 'axios';
import config from 'config';
import AppLogger from '../utils/Logger';
const logger = new AppLogger(module);

export enum HttpMethod {
    Post = 'POST',
    Put = 'PUT',
    Delete = 'DELETE',
    Patch = 'PATCH',
    Get = 'GET',
}

/**
 * If auditing is enabled for the authenticated user, only then will
 * and audit call be attempted to the audit service
 * @param req - Request object containing authenticated user's JWT
 * @param method - RESTful method that was called
 * @param data - audit specific data
 * @returns Boolean indicating whether audit was sent, if auditing is enabled
 */
export async function auditAuthUserActivity(
    req: RequestDto,
    method: HttpMethod,
    data: string
): Promise<boolean> {
    if (req.Jwt.audit == true) {
        const id: string = req.Jwt.userId.toString();
        return await sendAudit(id, method, data);
    } else {
        return true;
    }
}

// ----------------------------------------------------------
// ----------------------------------------------------------

export async function sendAudit(
    userId: string,
    method: HttpMethod,
    data: string
): Promise<boolean> {
    let success: boolean = true;

    try {
        const auditApiKey = config.get('audit.apiKey') as string;
        const auditUrl = config.get('audit.url') as string;

        if (auditUrl?.length > 0) {
            const srvcName = 'product-api';

            const body = {
                timeStamp: new Date().toISOString(),
                userId: userId,
                source: srvcName,
                method: method.toString(),
                data: data,
            };

            let strPayload = JSON.stringify(body);
            logger.debug(strPayload);

            // Specifying headers in the config object
            const reqHeader = {
                'content-type': 'application/json',
                'content-length': strPayload.length,
                'User-Agent': srvcName,
                Connection: 'keep-alive',
                'x-api-key': auditApiKey,
            };

            const response = await axios.post(auditUrl!, strPayload, {
                headers: reqHeader,
            });

            logger.debug(response.data);
        }
    } catch (ex) {
        logger.error('Auditing enabled but connection refused');
        success = false;
    }

    return success;
}
