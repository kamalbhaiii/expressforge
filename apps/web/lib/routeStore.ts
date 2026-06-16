import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { AIConfig, GenerateConfig, Route } from "./types";
import { generateHandler } from "./api";

type HandlerGenStatus = "idle" | "loading" | "success" | "error";

interface RouteBuilderState {
  routes: Route[];
  selectedRouteId: string | null;
  handlerGenStatus: Record<string, HandlerGenStatus>;
  handlerGenError: Record<string, string>;

  addRoute: (route: Partial<Route>) => void;
  updateRoute: (id: string, updates: Partial<Route>) => void;
  deleteRoute: (id: string) => void;
  reorderRoutes: (activeId: string, overId: string) => void;
  moveRouteToTag: (routeId: string, newTag: string) => void;
  setSelectedRoute: (id: string | null) => void;
  scaffoldCRUD: (resource: string) => void;
  generateHandlerAI: (
    routeId: string,
    description: string,
    projectConfig: GenerateConfig & { ai?: AIConfig }
  ) => Promise<void>;
  loadRoutes: (routes: Route[]) => void;
  clearRoutes: () => void;
}

function makeId(): string {
  return crypto.randomUUID();
}

function defaultRoute(partial: Partial<Route>): Route {
  return {
    id: makeId(),
    method: "GET",
    path: "/",
    tag: "default",
    summary: "",
    middleware: [],
    request_body: { type: "none", fields: [] },
    response: { success_code: 200, shape: "json_object" },
    handler_mode: "template",
    auth_required: false,
    rate_limited: false,
    ...partial,
  };
}

const METHOD_STATUS: Record<string, number> = {
  GET: 200,
  POST: 201,
  PUT: 200,
  PATCH: 200,
  DELETE: 204,
};

export const useRouteStore = create<RouteBuilderState>()(
  devtools(
    (set, get) => ({
      routes: [],
      selectedRouteId: null,
      handlerGenStatus: {},
      handlerGenError: {},

      addRoute: (partial) => {
        const route = defaultRoute(partial);
        set((s) => ({ routes: [...s.routes, route] }));
      },

      updateRoute: (id, updates) =>
        set((s) => ({
          routes: s.routes.map((r) => (r.id === id ? { ...r, ...updates } : r)),
        })),

      deleteRoute: (id) =>
        set((s) => ({
          routes: s.routes.filter((r) => r.id !== id),
          selectedRouteId: s.selectedRouteId === id ? null : s.selectedRouteId,
        })),

      reorderRoutes: (activeId, overId) =>
        set((s) => {
          const routes = [...s.routes];
          const oldIdx = routes.findIndex((r) => r.id === activeId);
          const newIdx = routes.findIndex((r) => r.id === overId);
          if (oldIdx === -1 || newIdx === -1) return s;
          const [moved] = routes.splice(oldIdx, 1);
          routes.splice(newIdx, 0, moved);
          return { routes };
        }),

      moveRouteToTag: (routeId, newTag) =>
        set((s) => ({
          routes: s.routes.map((r) => (r.id === routeId ? { ...r, tag: newTag } : r)),
        })),

      setSelectedRoute: (id) => set({ selectedRouteId: id }),

      scaffoldCRUD: (resource) => {
        const base = `/${resource.toLowerCase().replace(/\s+/g, "-")}`;
        const tag = resource.toLowerCase();
        const label = resource.charAt(0).toUpperCase() + resource.slice(1);
        const scaffolds: Partial<Route>[] = [
          { method: "GET", path: base, tag, summary: `List all ${label}s`, response: { success_code: 200, shape: "json_array" } },
          { method: "GET", path: `${base}/:id`, tag, summary: `Get ${label} by ID`, response: { success_code: 200, shape: "json_object" } },
          {
            method: "POST", path: base, tag, summary: `Create ${label}`,
            request_body: { type: "json", fields: [] },
            response: { success_code: 201, shape: "json_object" },
          },
          {
            method: "PUT", path: `${base}/:id`, tag, summary: `Update ${label}`,
            request_body: { type: "json", fields: [] },
            response: { success_code: 200, shape: "json_object" },
          },
          { method: "DELETE", path: `${base}/:id`, tag, summary: `Delete ${label}`, response: { success_code: 204, shape: "empty" } },
        ];
        const newRoutes = scaffolds.map(defaultRoute);
        set((s) => ({ routes: [...s.routes, ...newRoutes] }));
      },

      generateHandlerAI: async (routeId, description, projectConfig) => {
        const route = get().routes.find((r) => r.id === routeId);
        if (!route) return;

        set((s) => ({
          handlerGenStatus: { ...s.handlerGenStatus, [routeId]: "loading" },
          handlerGenError: { ...s.handlerGenError, [routeId]: "" },
        }));

        try {
          const result = await generateHandler(description, route, projectConfig);
          set((s) => ({
            routes: s.routes.map((r) =>
              r.id === routeId
                ? { ...r, handler_code: result.handler_code, handler_mode: "ai" }
                : r
            ),
            handlerGenStatus: { ...s.handlerGenStatus, [routeId]: "success" },
          }));
        } catch (err) {
          const msg = err instanceof Error ? err.message : "AI generation failed";
          set((s) => ({
            handlerGenStatus: { ...s.handlerGenStatus, [routeId]: "error" },
            handlerGenError: { ...s.handlerGenError, [routeId]: msg },
          }));
        }
      },

      loadRoutes: (routes) => set({ routes }),

      clearRoutes: () => set({ routes: [], selectedRouteId: null }),
    }),
    { name: "expressforge-routes" }
  )
);
