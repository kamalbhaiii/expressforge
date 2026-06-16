"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, Layers } from "lucide-react";
import { useRouteStore } from "@/lib/routeStore";
import { RouteCard } from "./RouteCard";
import { CRUDScaffoldModal } from "./CRUDScaffoldModal";

export function RouteCanvas() {
  const { routes, selectedRouteId, addRoute, deleteRoute, reorderRoutes, setSelectedRoute } =
    useRouteStore();
  const [showScaffold, setShowScaffold] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderRoutes(String(active.id), String(over.id));
    }
  }

  // Group routes by tag for visual sections
  const groups = routes.reduce<Record<string, typeof routes>>((acc, r) => {
    const tag = r.tag || "default";
    (acc[tag] = acc[tag] ?? []).push(r);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-forge-border">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-forge-accent" />
          <span className="text-sm font-semibold text-forge-text">Routes</span>
          <span className="text-xs text-forge-text-dim bg-forge-muted px-1.5 py-0.5 rounded-full">
            {routes.length}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowScaffold(true)}
            className="text-xs text-forge-accent hover:text-forge-glow border border-forge-accent/30 hover:border-forge-accent/60 px-2.5 py-1 rounded-lg transition-colors"
          >
            CRUD
          </button>
          <button
            onClick={() => addRoute({ path: "/new-route", method: "GET" })}
            className="text-xs flex items-center gap-1 bg-forge-accent/10 hover:bg-forge-accent/20 text-forge-accent px-2.5 py-1 rounded-lg transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
      </div>

      {/* Route list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {routes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
            <div className="w-10 h-10 rounded-xl bg-forge-accent/10 flex items-center justify-center mb-3">
              <Layers className="h-5 w-5 text-forge-accent" />
            </div>
            <p className="text-sm font-medium text-forge-text mb-1">No routes yet</p>
            <p className="text-xs text-forge-text-muted mb-4">
              Add a route or scaffold a CRUD resource
            </p>
            <button
              onClick={() => addRoute({ path: "/example", method: "GET", summary: "Example endpoint" })}
              className="text-xs forge-btn-primary"
            >
              Add first route
            </button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            {Object.entries(groups).map(([tag, tagRoutes]) => (
              <div key={tag}>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-forge-text-dim mb-1.5 px-1">
                  {tag}
                </p>
                <SortableContext
                  items={tagRoutes.map((r) => r.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-1">
                    {tagRoutes.map((route) => (
                      <RouteCard
                        key={route.id}
                        route={route}
                        isSelected={selectedRouteId === route.id}
                        onSelect={() => setSelectedRoute(route.id)}
                        onDelete={() => deleteRoute(route.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </div>
            ))}
          </DndContext>
        )}
      </div>

      <CRUDScaffoldModal open={showScaffold} onClose={() => setShowScaffold(false)} />
    </div>
  );
}
