export type UserProfile = {
  displayName: string;
  email: string;
  title: string;
  company: string;
  timezone: string;
  bio: string;
  avatarUrl: string;
  /** `{erpUrl}|{email}` when displayName was last confirmed — stored in localStorage */
  nameBoundTo?: string;
};

export type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  notes: string;
};

export type JunelMcpState = {
  serversJson: string;
  enabledKeys: string[];
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
};

export type JunelRule = {
  id: string;
  name: string;
  preview: string;
  scope: string;
  enabled: boolean;
};

export type JunelSkill = {
  id: string;
  name: string;
  description: string;
  category?: string;
  enabled: boolean;
  /** Full SKILL.md body — injected into agent context when enabled */
  content?: string;
  /** Slug from `.cursor/skills/<id>/` */
  templateId?: string;
};

export type ErpnextLink = {
  url: string;
  email: string;
  user: string;
  sid: string;
  linkedAt: number;
  /** Frappe roles — used for school SMS vs Livro branding */
  roles?: string[];
};

export type JunelSettings = {
  personality: string;
  proactiveMode: boolean;
};

export type TaskStatus = "working" | "on_hold";

export type TaskBoardEntry = {
  status?: TaskStatus;
  feedback?: string;
  feedbackAt?: number;
  updatedAt: number;
};

/** Local overlay keyed by ERPNext Sprint Backlog record name. */
export type TaskBoard = Record<string, TaskBoardEntry>;

export type JunelChatState = {
  agentId?: string;
  messages: ChatMessage[];
};

export type JunelStorage = {
  version: 1;
  profile: UserProfile;
  contacts: Contact[];
  settings: JunelSettings;
  rules: JunelRule[];
  skills: JunelSkill[];
  mcp: JunelMcpState;
  erpnext?: ErpnextLink;
  chat: JunelChatState;
  taskBoard: TaskBoard;
};

export type SdkMcpServerConfig =
  | {
      type?: "stdio";
      command: string;
      args?: string[];
      env?: Record<string, string>;
      cwd?: string;
    }
  | {
      type?: "http" | "sse";
      url: string;
      headers?: Record<string, string>;
    };

/** @deprecated legacy shape — migrated on load */
export type StoredMcpServer = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  transport: "stdio" | "http";
  command?: string;
  args?: string;
  env?: Record<string, string>;
  cwd?: string;
  url?: string;
  headers?: Record<string, string>;
};
