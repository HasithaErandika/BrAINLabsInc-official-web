/**
 * requireRole factory middleware
 * Must be chained after requireAuth.
 *
 * Usage:
 *   router.post('/events', requireAuth, requireRole('researcher', 'admin'), handler)
 *   router.patch('/admin/members/:id/approve', requireAuth, requireRole('admin'), handler)
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`,
      });
    }
    next();
  };
}
