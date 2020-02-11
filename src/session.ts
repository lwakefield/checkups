export function assertAuthenticated () {
    if (!req.isAuthenticated) throw new Error('Unauthorized');
}
