import { Request, Response, NextFunction } from 'express';
interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: string;
    };
}
export declare const authMiddleware: (req: AuthRequest, res: Response, next: NextFunction) => Promise<any>;
export declare const adminMiddleware: (req: AuthRequest, res: Response, next: NextFunction) => any;
export declare const editorMiddleware: (req: AuthRequest, res: Response, next: NextFunction) => any;
export {};
//# sourceMappingURL=auth.d.ts.map