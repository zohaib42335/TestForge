/**
 * Admin settings page with role matrix.
 *
 * @returns {import('react').ReactNode}
 */
export default function SettingsPage() {
  const rows = [
    ['Create projects', 'Yes', 'Yes', 'No', 'No'],
    ['Update project details', 'Yes', 'Yes', 'No', 'No'],
    ['Archive projects', 'Yes', 'No', 'No', 'No'],
    ['Invite and manage team members', 'Yes', 'No', 'No', 'No'],
    ['Access billing', 'Yes', 'No', 'No', 'No'],
    ['View reports', 'Yes', 'Yes', 'No', 'Yes'],
    ['Work on assigned test cases and runs', 'Yes', 'Yes', 'Yes', 'No'],
  ]

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      <h1 className="text-2xl font-semibold text-[#1A3263]">Settings</h1>
      <p className="mt-1 text-sm text-[#5A6E9A]">Workspace permission matrix</p>
      <div className="mt-4 overflow-auto rounded-xl border border-[#D7E2F5] bg-white p-4">
        <table className="min-w-full text-left text-sm">
          <thead className="text-[#53698F]">
            <tr>
              <th className="py-2 pr-3">Permission</th>
              <th className="py-2 pr-3">Admin</th>
              <th className="py-2 pr-3">QA Manager</th>
              <th className="py-2 pr-3">Tester</th>
              <th className="py-2 pr-3">Viewer</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row[0]} className="border-t border-[#EEF2FB]">
                <td className="py-2 pr-3 text-[#1A3263]">{row[0]}</td>
                <td className="py-2 pr-3">{row[1]}</td>
                <td className="py-2 pr-3">{row[2]}</td>
                <td className="py-2 pr-3">{row[3]}</td>
                <td className="py-2 pr-3">{row[4]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
