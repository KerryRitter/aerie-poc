import { vitePlugin as remix } from '@remix-run/dev';
import { defineConfig } from 'vite';
import { router } from './app/aerie/core/bootstrap';

declare module '@remix-run/node' {
  interface Future {
    v3_fetcherPersist: true;
    v3_relativeSplatPath: true;
    v3_throwAbortReason: true;
    v3_singleFetch: true;
    v3_lazyRouteDiscovery: true;
  }
}

export default defineConfig({
  plugins: [
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_singleFetch: true,
        v3_lazyRouteDiscovery: true,
      },
      routes(defineRoutes) {
        return defineRoutes((route) => {
          // Core app routes
          route("/", "home/route.tsx", { index: true });

          // Module routes - these will be registered automatically from our modules
          const moduleRoutes = router.getModuleRoutes();
          for (const { path, layout, children } of moduleRoutes) {
            route(path, layout, () => {
              for (const child of children) {
                if (child.routeFile) {
                  route(child.path, child.routeFile, child.options);
                }
              }
            });
          }
        });
      },
    }),
  ],
});
