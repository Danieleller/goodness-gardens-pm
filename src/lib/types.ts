import type {
  Task,
  User,
  TaskAssignee,
  TaskGroupAssignment,
  UserGroup,
  Rock,
  Project,
  ProjectMember,
} from "@/db/schema";

export type TaskWithRelations = Task & {
  assignedTo: User | null;
  createdBy: User;
  additionalAssignees?: (TaskAssignee & { user: User })[];
  groupAssignments?: (TaskGroupAssignment & { group: UserGroup })[];
};

export type RockWithOwner = Rock & { owner: User };

export type ProjectWithMembers = Project & {
  owner: User | null;
  members: (ProjectMember & { user: User })[];
};

export type FilterCriteria = {
  status: string;
  priority: string;
  assignee: string;
  category: string;
  project: string;
  dateFrom: string;
  dateTo: string;
};

export const emptyFilters: FilterCriteria = {
  status: "",
  priority: "",
  assignee: "",
  category: "",
  project: "",
  dateFrom: "",
  dateTo: "",
};

export function hasActiveFilters(filters: FilterCriteria): boolean {
  return Object.values(filters).some((v) => v !== "");
}

export function countActiveFilters(filters: FilterCriteria): number {
  return Object.values(filters).filter((v) => v !== "").length;
}
