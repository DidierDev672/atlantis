import { RolesHeader } from './molecules/roles-header'
import { RolesPanel } from './organisms/roles-panel'
import { RoleRouterTester } from './molecules/role-router-tester'

export function RolesPage() {
  return (
    <div className="min-h-screen bg-surface/20 px-4 py-12 sm:px-6 lg:px-8 space-y-6">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <RolesHeader />

        <RoleRouterTester />

        <RolesPanel />
      </div>
    </div>
  )
}