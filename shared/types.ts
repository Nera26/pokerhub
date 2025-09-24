import { z, ZodError } from 'zod';
import { MessageResponseSchema as AuthMessageResponseSchema } from '../backend/src/schemas/auth';
import type { MessageResponse as AuthMessageResponse } from '../backend/src/schemas/auth';
import { GameActionSchema } from './schemas/game';
import { SidePotSchema } from './schemas/sidePot';
import { GameTypeSchema } from '../backend/src/schemas/game-types';
import {
  GameHistoryEntrySchema,
  TournamentHistoryEntrySchema,
  TransactionEntrySchema,
} from './schemas/history';
import { CurrencySchema } from './wallet.schema';

export type { GameAction } from './schemas/game';
export { GameActionSchema };

export { ZodError };

export {
  WebVitalMetricSchema,
  MonitoringAcceptedResponseSchema,
  LogTypeClassesSchema,
  LogTypeClassSchema,
  LogTypeClassOverrideSchema,
  LogTypeClassOverrideListSchema,
  CreateLogTypeClassOverrideSchema,
  UpdateLogTypeClassOverrideSchema,
  LogTypeClassParamsSchema,
} from './schemas/analytics';
export type {
  WebVitalMetric,
  MonitoringAcceptedResponse,
  LogTypeClasses,
  LogTypeClass,
  LogTypeClassOverride,
  LogTypeClassOverrideList,
  CreateLogTypeClassOverride,
  UpdateLogTypeClassOverride,
  LogTypeClassParams,
} from './schemas/analytics';

export const ServiceStatusResponseSchema = z.object({
  status: z.string(),
  contractVersion: z.string(),
});
export type ServiceStatusResponse = z.infer<
  typeof ServiceStatusResponseSchema
>;

// Language selector
export const LanguageSchema = z.object({
  code: z.string(),
  label: z.string(),
});
export type Language = z.infer<typeof LanguageSchema>;
export const LanguagesResponseSchema = z.array(LanguageSchema);
export type LanguagesResponse = z.infer<typeof LanguagesResponseSchema>;

const CountryCodeSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z]{2}$/)
  .transform((value) => value.toUpperCase());

export const BlockedCountrySchema = z.object({
  country: CountryCodeSchema,
});
export type BlockedCountry = z.infer<typeof BlockedCountrySchema>;
export const BlockedCountriesResponseSchema = z.array(BlockedCountrySchema);
export type BlockedCountriesResponse = z.infer<
  typeof BlockedCountriesResponseSchema
>;

// Navigation icons
export const NavIconSchema = z.object({
  name: z.string(),
  svg: z.string(),
});
export type NavIcon = z.infer<typeof NavIconSchema>;
export const NavIconsResponseSchema = z.array(NavIconSchema);
export type NavIconsResponse = z.infer<typeof NavIconsResponseSchema>;

const NavItemBaseSchema = z.object({
  flag: z.string(),
  href: z.string(),
  label: z.string(),
  icon: z.string().optional(),
});

export const NavItemSchema = NavItemBaseSchema.extend({
  order: z.number().int(),
});
export type NavItem = z.infer<typeof NavItemSchema>;
export const NavItemsResponseSchema = z.array(NavItemSchema);
export type NavItemsResponse = z.infer<typeof NavItemsResponseSchema>;

export const NavItemRequestSchema = NavItemSchema;
export type NavItemRequest = z.infer<typeof NavItemRequestSchema>;

export {
  SidebarTabSchema,
  SidebarItemSchema,
  SidebarItemsResponseSchema,
  AdminTabSchema,
  AdminTabResponseSchema,
  AdminTabCreateRequestSchema,
  AdminTabUpdateRequestSchema,
  AdminTabConfigSchema,
  AdminTabMetaSchema,
} from '../backend/src/schemas/admin';
export type {
  SidebarTab,
  SidebarItem,
  SidebarItemsResponse,
  AdminTab,
  AdminTabResponse,
  CreateAdminTabRequest,
  UpdateAdminTabRequest,
  AdminTabConfig,
  AdminTabMeta,
} from '../backend/src/schemas/admin';

// Site metadata
export {
  SiteMetadataResponseSchema,
} from '../backend/src/schemas/metadata';
export type {
  SiteMetadataResponse,
} from '../backend/src/schemas/metadata';

// Chart palette
export const ChartPaletteResponseSchema = z.array(z.string());
export type ChartPaletteResponse = z.infer<typeof ChartPaletteResponseSchema>;

// Chip denominations
export const ChipDenominationsResponseSchema = z.object({
  denoms: z.array(z.number().positive()).nonempty(),
});
export type ChipDenominationsResponse = z.infer<
  typeof ChipDenominationsResponseSchema
>;

// Table theme
export const TableThemeResponseSchema = z.object({
  hairline: z.string(),
  positions: z.record(
    z.object({
      color: z.string(),
      glow: z.string(),
      badge: z.string().optional(),
    }),
  ),
});
export type TableThemeResponse = z.infer<typeof TableThemeResponseSchema>;

// Default avatar & performance thresholds
export {
  DefaultAvatarResponseSchema,
  PerformanceThresholdsResponseSchema,
} from '../backend/src/schemas/config';
export type {
  DefaultAvatarResponse,
  PerformanceThresholdsResponse,
} from '../backend/src/schemas/config';

// Withdrawals
export const PendingWithdrawalSchema = z.object({
  id: z.string(),
  userId: z.string(),
  amount: z.number().int(),
  currency: CurrencySchema,
  status: z.enum(['pending', 'completed', 'rejected']),
  createdAt: z.string().datetime(),
  avatar: z.string(),
  bank: z.string(),
  maskedAccount: z.string(),
  bankInfo: z.string().optional(),
});
export type PendingWithdrawal = z.infer<typeof PendingWithdrawalSchema>;
export const PendingWithdrawalsResponseSchema = z.object({
  withdrawals: z.array(PendingWithdrawalSchema),
});
export type PendingWithdrawalsResponse = z.infer<
  typeof PendingWithdrawalsResponseSchema
>;

// Backend re-exports
export {
  LoginResponseSchema,
  MessageResponseSchema,
  AuthProviderSchema,
  AuthProvidersResponseSchema,
} from '../backend/src/schemas/auth';
export type {
  LoginResponse,
  MessageResponse,
  AuthProvider,
  AuthProvidersResponse,
} from '../backend/src/schemas/auth';

export const PromotionClaimResponseSchema = AuthMessageResponseSchema;
export type PromotionClaimResponse = AuthMessageResponse;
export {
  UserProfileSchema,
  MeResponseSchema,
  ProfileStatsResponseSchema,
} from '../backend/src/schemas/users';
export type {
  UserProfile,
  MeResponse,
  ProfileStatsResponse,
} from '../backend/src/schemas/users';

export {
  GameTypeSchema,
  GameTypeListSchema,
} from '../backend/src/schemas/game-types';
export type {
  GameType,
  GameTypeList,
} from '../backend/src/schemas/game-types';

export {
  PlayerSchema,
  ChatMessageSchema,
  SendChatMessageRequestSchema,
  TableSchema,
  TableListSchema,
  TableDataSchema,
  TableStateSchema,
  CreateTableSchema,
  UpdateTableSchema,
  TableListQuerySchema,
  TabKeySchema,
  TableTabsResponseSchema,
} from '../backend/src/schemas/tables';
export type {
  Player,
  ChatMessage,
  SendChatMessageRequest,
  Table,
  TableList,
  TableData,
  TableState,
  CreateTableRequest,
  UpdateTableRequest,
  TableListQuery,
  TabKey,
  TableTabsResponse,
} from '../backend/src/schemas/tables';

export {
  AuditLogEntrySchema,
  AuditLogsResponseSchema,
  AuditLogTypesResponseSchema,
  AuditSummarySchema,
  AuditLogsQuerySchema,
  AlertItemSchema,
  SecurityAlertsResponseSchema,
  AdminOverviewSchema,
  AdminOverviewResponseSchema,
  RevenueStreamSchema,
  RevenueBreakdownSchema,
  ActivityResponseSchema,
  ErrorCategoriesResponseSchema,
} from './schemas/analytics';
export { RevenueTimeFilterSchema } from './schemas/revenue';
export type {
  AuditLogType,
  AuditLogEntry,
  AuditLogsResponse,
  AuditLogTypesResponse,
  AuditSummary,
  AuditLogsQuery,
  AlertItem,
  SecurityAlertsResponse,
  AdminOverview,
  AdminOverviewResponse,
  RevenueStream,
  RevenueBreakdown,
  ActivityResponse,
  ErrorCategoriesResponse,
} from './schemas/analytics';
export type { RevenueTimeFilter } from './schemas/revenue';

export {
  AntiCheatFlagSchema,
  AntiCheatFlagsResponseSchema,
  AntiCheatFlagUpdateRequestSchema,
  AntiCheatHistoryEntrySchema,
  AntiCheatNextActionQuerySchema,
  AntiCheatNextActionResponseSchema,
  AntiCheatReviewActionSchema,
  AntiCheatReviewStatusSchema,
} from '../backend/src/schemas/anti-cheat';
export type {
  AntiCheatFlag,
  AntiCheatFlagsResponse,
  AntiCheatFlagUpdateRequest,
  AntiCheatHistoryEntry,
  AntiCheatNextActionQuery,
  AntiCheatNextActionResponse,
  AntiCheatReviewAction,
  AntiCheatReviewStatus,
} from '../backend/src/schemas/anti-cheat';

// Dashboard metrics (frontend-only)
export const DashboardMetricsSchema = z.object({
  online: z.number(),
  revenue: z.number(),
  activity: z.array(z.number()),
  errors: z.array(z.number()),
});
export type DashboardMetrics = z.infer<typeof DashboardMetricsSchema>;

export {
  NotificationTypeSchema,
  NotificationFilterSchema,
  NotificationsResponseSchema,
  NotificationFiltersResponseSchema,
  UnreadCountResponseSchema,
} from '../backend/src/schemas/notifications';
export type {
  NotificationType,
  NotificationFilter,
  NotificationsResponse,
  NotificationFiltersResponse,
  UnreadCountResponse,
} from '../backend/src/schemas/notifications';

/** ---- Bonuses ---- */
export {
  BonusOptionsResponseSchema,
  BonusDefaultsResponseSchema,
  BonusDefaultsRequestSchema,
  BonusSchema,
  BonusesResponseSchema,
  BonusStatsResponseSchema,
  BonusCreateRequestSchema,
  BonusUpdateRequestSchema,
} from '../backend/src/schemas/bonus';
export type {
  BonusOptionsResponse,
  BonusDefaultsResponse,
  BonusDefaultsRequest,
  Bonus,
  BonusesResponse,
  BonusStatsResponse,
  BonusCreateRequest,
  BonusUpdateRequest,
} from '../backend/src/schemas/bonus';

/** ---- Promotions ---- */
const PromotionProgressSchema = z.object({
  current: z.number(),
  total: z.number(),
  label: z.string(),
  barColorClass: z.string(),
});
const PromotionBreakdownItemSchema = z.object({
  label: z.string(),
  value: z.number(),
});
export const PromotionSchema = z.object({
  id: z.string(),
  category: z.string(),
  title: z.string(),
  description: z.string(),
  reward: z.string(),
  unlockText: z.string().optional(),
  statusText: z.string().optional(),
  progress: PromotionProgressSchema.optional(),
  breakdown: z.array(PromotionBreakdownItemSchema),
  eta: z.string().optional(),
});
export type Promotion = z.infer<typeof PromotionSchema>;
export const PromotionsResponseSchema = z.array(PromotionSchema);

/** ---- Broadcasts ---- */
export {
  BroadcastSchema,
  BroadcastsResponseSchema,
  BroadcastTemplatesResponseSchema,
  BroadcastTypesResponseSchema,
} from '../backend/src/schemas/broadcasts';
export type {
  BroadcastType,
  Broadcast,
  BroadcastsResponse,
  SendBroadcastRequest,
  BroadcastTemplatesResponse,
  BroadcastTypesResponse,
} from '../backend/src/schemas/broadcasts';

/** ---- Tournaments ---- */
export {
  TournamentSchema,
  TournamentDetailsSchema,
  AdminTournamentSchema,
  TournamentFormatSchema,
  TournamentFormatOptionSchema,
  TournamentFormatsResponseSchema,
  TournamentFilterSchema,
  TournamentFilterOptionSchema,
  TournamentFiltersResponseSchema,
  AdminTournamentFilterIdSchema,
  AdminTournamentFilterOptionSchema,
  AdminTournamentFiltersResponseSchema,
  TournamentSimulateRequestSchema,
  TournamentSimulateResponseSchema,
  TournamentStateSchema,
  TournamentStatusSchema,
  TournamentStateMap,
} from '../backend/src/schemas/tournaments';
export type {
  Tournament,
  TournamentDetails,
  AdminTournament,
  TournamentFormat,
  TournamentFormatOption,
  TournamentFormatsResponse,
  TournamentFilter,
  TournamentFilterOption,
  TournamentFiltersResponse,
  AdminTournamentFilterId,
  AdminTournamentFilterOption,
  AdminTournamentFiltersResponse,
  TournamentSimulateRequest,
  TournamentSimulateResponse,
  TournamentState,
  TournamentStatus,
} from '../backend/src/schemas/tournaments';

export {
  BotProfileSchema,
  BotProfilesResponseSchema,
} from '../backend/src/schemas/bot-profiles';
export type {
  BotProfile,
  BotProfilesResponse,
} from '../backend/src/schemas/bot-profiles';

/** ---- Admin Messages ---- */
export {
  AdminMessageSchema,
  AdminMessagesResponseSchema,
} from '../backend/src/schemas/messages';
export type {
  AdminMessage,
  AdminMessagesResponse,
  ReplyMessageRequest,
} from '../backend/src/schemas/messages';

export const FeatureFlagsResponseSchema = z.record(z.boolean());
export type FeatureFlagsResponse = z.infer<typeof FeatureFlagsResponseSchema>;

// Game actions
export { GameActionSchema } from './schemas/game';
export type { GameAction } from './schemas/game';
export { SidePotSchema } from './schemas/sidePot';
export type { SidePot } from './schemas/sidePot';

// Game state
const GameStatePlayerSchema = z.object({
  id: z.string(),
  stack: z.number(),
  folded: z.boolean(),
  bet: z.number(),
  allIn: z.boolean(),
  holeCards: z.array(z.number()).length(2).optional(),
});

export const GameStateSchema = z
  .object({
    version: z.literal('1'),
    tick: z.number(),
    serverTime: z.number(),
    phase: z.enum([
      'WAIT_BLINDS',
      'DEAL',
      'BETTING_ROUND',
      'SHOWDOWN',
      'SETTLE',
      'NEXT_HAND',
    ]),
    street: z.enum(['preflop', 'flop', 'turn', 'river', 'showdown']),
    pot: z.number(),
    sidePots: z.array(SidePotSchema),
    currentBet: z.number(),
    players: z.array(GameStatePlayerSchema),
    communityCards: z.array(z.number()),
  })
  .strict();

export type GameState = z.infer<typeof GameStateSchema>;

/** ---- Leaderboard / Hands (backend shared) ---- */
export {
  LeaderboardRangesResponseSchema,
  LeaderboardModesResponseSchema,
  LeaderboardConfigSchema,
  LeaderboardConfigListResponseSchema,
  LeaderboardConfigUpdateSchema,
} from '../backend/src/schemas/leaderboard';
export type {
  TimeFilter,
  ModeFilter,
  LeaderboardRangesResponse,
  LeaderboardModesResponse,
  LeaderboardConfig,
  LeaderboardConfigListResponse,
  LeaderboardConfigUpdate,
} from '../backend/src/schemas/leaderboard';

export {
  HandProofResponse as HandProofResponseSchema,
  HandProofsResponse as HandProofsResponseSchema,
  HandLogResponse as HandLogResponseSchema,
  HandStateResponse as HandStateResponseSchema,
  HandReplayResponse as HandReplayResponseSchema,
} from '../backend/src/schemas/hands';
export type {
  HandProofResponse,
  HandProofsResponse,
  HandLogResponse,
  HandStateResponse,
  HandReplayResponse,
} from '../backend/src/schemas/hands';

// Users (frontend)
export const UserRoleSchema = z.enum(['Player', 'Admin']);
export const UserStatusSchema = z.enum(['Active', 'Frozen', 'Banned']);

export type UserRole = z.infer<typeof UserRoleSchema>;
export type UserStatus = z.infer<typeof UserStatusSchema>;

export const UserRoleOptionSchema = z.object({
  value: UserRoleSchema,
  label: z.string(),
});

export const UserStatusOptionSchema = z.object({
  value: UserStatusSchema,
  label: z.string(),
});

export const UserMetaResponseSchema = z.object({
  roles: z.array(UserRoleOptionSchema),
  statuses: z.array(UserStatusOptionSchema),
});

export type UserMetaResponse = z.infer<typeof UserMetaResponseSchema>;

export const UserSchema = z.object({
  id: z.string(),
  username: z.string(),
  avatarKey: z.string().optional(),
  banned: z.boolean(),
});
export type User = z.infer<typeof UserSchema>;

export const CreateUserSchema = z.object({
  username: z.string(),
  avatarKey: z.string().optional(),
});
export type CreateUserRequest = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = z.object({
  username: z.string().optional(),
  avatarKey: z.string().optional(),
});
export type UpdateUserRequest = z.infer<typeof UpdateUserSchema>;

export const BanUserSchema = z.object({
  reason: z.string().optional(),
});
export type BanUserRequest = z.infer<typeof BanUserSchema>;

export const DashboardUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  avatarKey: z.string().optional(),
  balance: z.number(),
  currency: z.string(),
  banned: z.boolean(),
});
export const DashboardUserListSchema = z.array(DashboardUserSchema);
export type DashboardUser = z.infer<typeof DashboardUserSchema>;
export type DashboardUserList = z.infer<typeof DashboardUserListSchema>;

export const AdminPlayerSchema = z.object({
  id: z.string(),
  username: z.string(),
});
export const AdminPlayerListSchema = z.array(AdminPlayerSchema);
export type AdminPlayer = z.infer<typeof AdminPlayerSchema>;

export const AdminUsersQuerySchema = z.object({
  limit: z.coerce.number().int().positive().optional(),
});
export type AdminUsersQuery = z.infer<typeof AdminUsersQuerySchema>;

export {
  GameHistoryEntrySchema,
  TournamentHistoryEntrySchema,
  TransactionEntrySchema,
  HistoryTabItemSchema,
  HistoryTabsResponseSchema,
} from './schemas/history';
export type {
  GameHistoryEntry,
  TournamentHistoryEntry,
  TransactionEntry,
  HistoryTabItem,
  HistoryTabsResponse,
} from './schemas/history';
