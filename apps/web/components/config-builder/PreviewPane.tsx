"use client";

import { FolderOpen, File } from "lucide-react";
import { useConfigStore } from "@/lib/store";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";

interface TreeNode {
  name: string;
  type: "dir" | "file";
  children?: TreeNode[];
}

const AUTH_CONFIG_FILE: Record<string, string> = {
  jwt: "jwt",
  session: "session",
  oauth_google: "oauth",
  api_key: "apiKey",
  magic_link: "magicLink",
};

function useFileTree(): TreeNode[] {
  const { config } = useConfigStore();
  const ext = config.language === "typescript" ? "ts" : "js";
  const auth = config.auth as string[];
  const database = config.database as string[];

  const srcFiles: TreeNode[] = [{ name: `app.${ext}`, type: "file" }];

  // Auth config files
  if (auth.length > 0) {
    const configFiles: TreeNode[] = auth
      .filter((a) => AUTH_CONFIG_FILE[a])
      .map((a) => ({ name: `${AUTH_CONFIG_FILE[a]}.${ext}`, type: "file" as const }));

    const authRouteFiles: TreeNode[] = auth.map((a) => {
      const name = a === "jwt" ? `auth.${ext}` : `auth_${a}.${ext}`;
      return { name, type: "file" as const };
    });

    if (configFiles.length > 0) {
      srcFiles.push({ name: "config", type: "dir", children: configFiles });
    }
    srcFiles.push({ name: "routes", type: "dir", children: authRouteFiles });
  }

  // Database config files
  if (database.length > 0) {
    const dbConfigs: TreeNode[] = [];
    if (database.includes("mongodb") || database.some((d) => d.includes("prisma")) || database.includes("postgres_sequelize")) {
      dbConfigs.push({ name: `database.${ext}`, type: "file" });
    }
    if (database.includes("redis")) {
      dbConfigs.push({ name: `redis.${ext}`, type: "file" });
    }

    if (dbConfigs.length > 0) {
      const existing = srcFiles.find((n) => n.name === "config");
      if (existing) {
        existing.children = [...(existing.children || []), ...dbConfigs];
      } else {
        srcFiles.push({ name: "config", type: "dir", children: dbConfigs });
      }
    }

    if (database.some((d) => ["mongodb", "postgres_sequelize"].includes(d))) {
      srcFiles.push({ name: "models", type: "dir", children: [{ name: `user.${ext}`, type: "file" }] });
    }
  }

  const root: TreeNode[] = [
    { name: "src", type: "dir", children: srcFiles },
    { name: "package.json", type: "file" },
    { name: ".env.example", type: "file" },
    { name: ".gitignore", type: "file" },
    { name: "README.md", type: "file" },
  ];

  if (database.some((d) => d.includes("prisma"))) {
    root.push({ name: "prisma", type: "dir", children: [{ name: "schema.prisma", type: "file" }] });
  }

  if (config.include_docker) {
    root.push({ name: "Dockerfile", type: "file" });
    root.push({ name: "docker-compose.yml", type: "file" });
  }

  if (config.include_tests) {
    root.push({
      name: "tests",
      type: "dir",
      children: [
        { name: `setup.${ext}`, type: "file" },
        { name: `health.test.${ext}`, type: "file" },
      ],
    });
  }

  return root;
}

function TreeItem({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  return (
    <div>
      <div
        className="flex items-center gap-1.5 py-0.5 text-xs font-mono"
        style={{ paddingLeft: `${depth * 14}px` }}
      >
        {node.type === "dir" ? (
          <>
            <FolderOpen className="h-3.5 w-3.5 text-forge-accent flex-shrink-0" />
            <span className="text-forge-glow">{node.name}/</span>
          </>
        ) : (
          <>
            <File className="h-3.5 w-3.5 text-forge-text-dim flex-shrink-0" />
            <span className="text-forge-text-muted">{node.name}</span>
          </>
        )}
      </div>
      {node.children?.map((child) => (
        <TreeItem key={child.name} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export function PreviewPane() {
  const tree = useFileTree();
  const { config } = useConfigStore();

  return (
    <Card className="sticky top-6 max-h-[calc(100vh-48px)] overflow-y-auto">
      <CardHeader>
        <FolderOpen className="h-4 w-4 text-forge-accent" />
        <CardTitle>Preview</CardTitle>
      </CardHeader>

      <div className="mb-3">
        <p className="text-xs font-mono text-forge-accent">
          {config.project_name}/
        </p>
      </div>

      <div className="space-y-0.5">
        {tree.map((node) => (
          <TreeItem key={node.name} node={node} depth={1} />
        ))}
      </div>
    </Card>
  );
}
