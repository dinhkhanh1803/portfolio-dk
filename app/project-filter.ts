export const PROJECT_FILTERS = ["all", "web", "mobile", "game"] as const;

export type ProjectFilter = (typeof PROJECT_FILTERS)[number];

export function filterProjects<T extends { filter: ProjectFilter }>(
  projects: readonly T[],
  activeFilter: ProjectFilter,
) {
  return activeFilter === "all"
    ? [...projects]
    : projects.filter((project) => project.filter === activeFilter);
}
