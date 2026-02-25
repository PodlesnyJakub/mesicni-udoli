import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(({ request, cookies, redirect }, next) => {
  const url = new URL(request.url);

  if (!url.pathname.startsWith('/admin') || url.pathname.startsWith('/admin-login')) {
    return next();
  }

  if (cookies.get('admin-auth')?.value === 'true') {
    return next();
  }

  return redirect(`/admin-login?next=${encodeURIComponent(url.pathname + url.search)}`);
});
