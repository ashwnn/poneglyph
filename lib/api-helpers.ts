import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { Session } from "next-auth";

export type AuthenticatedContext<T = Record<string, string | string[]>> = {
    params: T;
    session: Session & { user: { id: string } };
};

export type AuthenticatedHandler<T = Record<string, string | string[]>> = (
    req: NextRequest,
    ctx: AuthenticatedContext<T>
) => Promise<Response>;

/**
 * Middleware to ensure the user is authenticated before processing the request.
 * Wraps the route handler and injects the session into the context.
 * validNextAuthSession.user.id is guaranteed to be present.
 */
export function withGeminiAuth<T = Record<string, string | string[]>>(
    handler: AuthenticatedHandler<T>
) {
    return async (
        req: NextRequest,
        context: { params: Promise<T> } | { params: T } // Next.js 15 params often need to be awaited or matching signature
    ) => {
        try {
            const session = await auth();

            if (!session?.user?.id) {
                return NextResponse.json(
                    { error: "Unauthorized" },
                    { status: 401 }
                );
            }

            // Await params if it's a promise (Next.js 15 breaking change preparation/handling)
            // Though for now in 15.1.x it might be a promise or object depending on configuration
            // Safe to await if it is a promise.
            const resolvedParams = (context && context.params)
                ? (context.params instanceof Promise ? await context.params : context.params)
                : ({} as T);

            const authenticatedSession = session as Session & {
                user: { id: string };
            };

            return await handler(req, {
                params: resolvedParams,
                session: authenticatedSession,
            });
        } catch (error: any) {
            console.error("API Error:", error);
            return NextResponse.json(
                { error: error.message || "Internal Server Error" },
                { status: 500 }
            );
        }
    };
}
