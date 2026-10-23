/**
 * Centralized Route Paths for TaskMate
 * Organized with /client/* for Client/User routes and /tasker/* for Tasker routes
 */
export const ROUTES = {
  // 1. Public & Auth Routes
  HOME: '/',
  SERVICES: '/services',
  LOGIN: '/login',
  MESSAGES: '/messages',

  // 2. Client (Khách hàng) Routes
  CLIENT_TASKS: '/client/tasks',
  CLIENT_TASK_DETAIL: '/client/task-detail',
  CLIENT_FILTER_TASKER: '/client/filter-tasker',
  CLIENT_PROFILE: '/client/profile',
  CLIENT_MESSAGES: '/messages',

  // 3. Tasker (Đối tác thợ) Routes
  TASKER_DASHBOARD: '/tasker/dashboard',
  TASKER_REQUESTS: '/tasker/requests',
  TASKER_PROFILE: '/tasker/profile',
  TASKER_REGISTER: '/tasker/register',
  TASKER_PUBLIC_PROFILE: '/tasker/:id',
  TASKER_MESSAGES: '/messages',

  // 4. Backwards-compatibility aliases (tránh làm gãy các component đang gọi tên cũ)
  MY_TASKS: '/client/tasks',
  TASK_DETAIL: '/client/task-detail',
  SEARCH: '/client/filter-tasker',
  FILTER_TASKER: '/client/filter-tasker',
  USER_PROFILE: '/client/profile',
  PROFILE: '/tasker/profile',
  BECOME_TASKER: '/tasker/register',
}
